import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { decaAiJudgeRuleSets, decaAiJudgeSessions } from "../drizzle/schema";
import { getVerifiedDecaAiJudgeRuleSet, VERIFIED_DECA_AI_JUDGE_RULE_SETS } from "../shared/decaAiJudgeRules";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { calculateSafeRubricScore, formatTranscriptForJudge, type ModelRubricItem } from "./aiJudgeEngine";
import { protectedProcedure, router } from "./_core/trpc";

const COMPETITION_YEAR = "2026-2027";
const PROMPT_VERSION = "blue-blazer-deca-ai-judge-v1";

const gradingOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "deca_ai_judge_rubric_evaluation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        rubricItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              criterionId: { type: "string" },
              assessability: { type: "string", enum: ["assessed", "not_assessable"] },
              awardedPoints: { type: "integer" },
              confidence: { type: "number" },
              evidence: { type: "array", items: { type: "object", properties: { type: { type: "string", enum: ["transcript"] }, reference: { type: "string" }, summary: { type: "string" } }, required: ["type", "reference", "summary"], additionalProperties: false } },
              judgeComment: { type: "string" },
              improvement: { type: "string" },
            },
            required: ["criterionId", "assessability", "awardedPoints", "confidence", "evidence", "judgeComment", "improvement"],
            additionalProperties: false,
          },
        },
        strengths: { type: "array", items: { type: "string" } },
        priorityImprovements: { type: "array", items: { type: "string" } },
        unsupportedClaims: { type: "array", items: { type: "string" } },
        contradictions: { type: "array", items: { type: "string" } },
        missingEvidence: { type: "array", items: { type: "string" } },
        coachAnalytics: {
          type: "object",
          properties: {
            organization: { type: "integer" },
            businessReasoning: { type: "integer" },
            evidenceSpecificity: { type: "integer" },
          },
          required: ["organization", "businessReasoning", "evidenceSpecificity"],
          additionalProperties: false,
        },
      },
      required: ["rubricItems", "strengths", "priorityImprovements", "unsupportedClaims", "contradictions", "missingEvidence", "coachAnalytics"],
      additionalProperties: false,
    },
  },
};

async function ensureRuleSet() {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI Judge storage is unavailable." });
  const ruleSet = getVerifiedDecaAiJudgeRuleSet(COMPETITION_YEAR, "EIP");
  if (!ruleSet) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No verified rule set is available for this event." });
  await database.insert(decaAiJudgeRuleSets).values({
    competitionYear: ruleSet.competitionYear,
    eventCode: ruleSet.eventCode,
    version: ruleSet.version,
    eventName: ruleSet.eventName,
    sourceUrl: ruleSet.sourceUrl,
    sourceVersion: ruleSet.sourceVersion,
    verified: ruleSet.verified,
    verifiedAt: new Date(),
    rulesJson: {
      eventFamily: ruleSet.eventFamily,
      participantMin: ruleSet.participantMin,
      participantMax: ruleSet.participantMax,
      preparedEntryType: ruleSet.preparedEntryType,
      preparedEntryLimit: ruleSet.preparedEntryLimit,
      presentationTimeSeconds: ruleSet.presentationTimeSeconds,
      judgeInteractionRules: ruleSet.judgeInteractionRules,
      maximumPoints: ruleSet.maximumPoints,
      annualTopic: ruleSet.annualTopic,
    },
    rubricJson: [...ruleSet.criteria],
  }).onDuplicateKeyUpdate({ set: { sourceUrl: ruleSet.sourceUrl, sourceVersion: ruleSet.sourceVersion, verified: true, verifiedAt: new Date(), rulesJson: {
    eventFamily: ruleSet.eventFamily, participantMin: ruleSet.participantMin, participantMax: ruleSet.participantMax, preparedEntryType: ruleSet.preparedEntryType, preparedEntryLimit: ruleSet.preparedEntryLimit, presentationTimeSeconds: ruleSet.presentationTimeSeconds, judgeInteractionRules: ruleSet.judgeInteractionRules, maximumPoints: ruleSet.maximumPoints, annualTopic: ruleSet.annualTopic,
  }, rubricJson: [...ruleSet.criteria] } });
  const [stored] = await database.select().from(decaAiJudgeRuleSets).where(and(eq(decaAiJudgeRuleSets.competitionYear, ruleSet.competitionYear), eq(decaAiJudgeRuleSets.eventCode, ruleSet.eventCode), eq(decaAiJudgeRuleSets.version, ruleSet.version))).limit(1);
  if (!stored) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Verified AI Judge rule set could not be initialized." });
  return { database, ruleSet, stored };
}

function judgePrompt(ruleSet: NonNullable<ReturnType<typeof getVerifiedDecaAiJudgeRuleSet>>, transcript: string) {
  const observableCriteria = ruleSet.criteria.filter((criterion) => criterion.assessableFromTranscript);
  return [
    "You are an evidence-bound practice evaluator for Blue Blazer. You are not an official DECA judge and must never claim official authority.",
    `Evaluate only the submitted transcript for the verified ${ruleSet.competitionYear} ${ruleSet.eventName} (${ruleSet.eventCode}) rubric configuration.`,
    "Score only observable criteria. Do not score delivery, presentation design, overall impression, eye contact, gestures, appearance, slide quality, or any visual behavior from a transcript.",
    "For every assessed criterion, cite only the provided [P##] transcript references. Do not invent evidence, sources, maximum points, penalties, annual topics, or facts absent from the transcript.",
    "Use conservative scoring: content needs a specific claim and support. If evidence is absent or generic, mark the criterion not_assessable rather than guessing.",
    `Observable criteria: ${observableCriteria.map((criterion) => `${criterion.id} (max ${criterion.maximumPoints}): ${criterion.evidenceFocus}`).join(" | ")}`,
    "Return all rubric criteria supplied above in rubricItems; for non-observable criteria use not_assessable, 0 points, and no evidence.",
    "Submitted transcript:\n" + formatTranscriptForJudge(transcript),
  ].join("\n\n");
}

export const aiJudgeRouter = router({
  ruleSets: protectedProcedure.query(() => VERIFIED_DECA_AI_JUDGE_RULE_SETS.map((ruleSet) => ({
    competitionYear: ruleSet.competitionYear,
    eventCode: ruleSet.eventCode,
    eventName: ruleSet.eventName,
    eventFamily: ruleSet.eventFamily,
    version: ruleSet.version,
    participantMin: ruleSet.participantMin,
    participantMax: ruleSet.participantMax,
    preparedEntryType: ruleSet.preparedEntryType,
    preparedEntryLimit: ruleSet.preparedEntryLimit,
    presentationTimeSeconds: ruleSet.presentationTimeSeconds,
    maximumPoints: ruleSet.maximumPoints,
    sourceUrl: ruleSet.sourceUrl,
    sourceVersion: ruleSet.sourceVersion,
    verified: ruleSet.verified,
    criteria: ruleSet.criteria,
  }))),

  gradeTranscript: protectedProcedure.input(z.object({
    competitionYear: z.literal(COMPETITION_YEAR),
    eventCode: z.literal("EIP"),
    groupSize: z.number().int().min(1).max(3),
    transcript: z.string().trim().min(250, "Paste at least 250 characters of your reviewed presentation transcript.").max(50_000),
  })).mutation(async ({ ctx, input }) => {
    const { database, ruleSet, stored } = await ensureRuleSet();
    if (input.groupSize < ruleSet.participantMin || input.groupSize > ruleSet.participantMax) throw new TRPCError({ code: "BAD_REQUEST", message: `${ruleSet.eventName} accepts ${ruleSet.participantMin}–${ruleSet.participantMax} participants.` });
    const insertResult = await database.insert(decaAiJudgeSessions).values({
      userId: ctx.user.id,
      ruleSetId: stored.id,
      competitionYear: ruleSet.competitionYear,
      eventCode: ruleSet.eventCode,
      ruleSetVersion: ruleSet.version,
      groupSize: input.groupSize,
      rawTranscript: input.transcript,
      correctedTranscript: input.transcript,
      status: "analyzing",
    });
    const sessionId = Number((insertResult as any)[0]?.insertId);
    try {
      const response = await invokeLLM({
        maxTokens: 8_000,
        messages: [{ role: "system", content: judgePrompt(ruleSet, input.transcript) }, { role: "user", content: "Produce the evidence-bound rubric evaluation now." }],
        responseFormat: gradingOutputSchema,
      });
      const rawContent = response.choices[0]?.message?.content;
      if (typeof rawContent !== "string") throw new Error("The AI Judge returned no structured result.");
      const modelResult = JSON.parse(rawContent) as { rubricItems: ModelRubricItem[]; strengths: string[]; priorityImprovements: string[]; unsupportedClaims: string[]; contradictions: string[]; missingEvidence: string[]; coachAnalytics: { organization: number; businessReasoning: number; evidenceSpecificity: number } };
      const score = calculateSafeRubricScore(ruleSet, modelResult.rubricItems, input.transcript);
      const clampAnalytics = (value: number) => Math.min(100, Math.max(0, Math.round(value)));
      const result = {
        rubricItems: score.items,
        observableScore: score.observablePoints,
        observableMaximumPoints: score.observableMaximumPoints,
        fullEstimatedScore: score.fullEstimatedScore,
        confidence: score.confidence,
        strengths: modelResult.strengths.slice(0, 3),
        priorityImprovements: modelResult.priorityImprovements.slice(0, 3),
        unsupportedClaims: modelResult.unsupportedClaims.slice(0, 5),
        contradictions: modelResult.contradictions.slice(0, 5),
        missingEvidence: Array.from(new Set([...modelResult.missingEvidence, ...score.missingEvidence])).slice(0, 8),
        coachAnalytics: {
          organization: clampAnalytics(modelResult.coachAnalytics.organization),
          businessReasoning: clampAnalytics(modelResult.coachAnalytics.businessReasoning),
          evidenceSpecificity: clampAnalytics(modelResult.coachAnalytics.evidenceSpecificity),
        },
        penaltyAssessment: "Not assessed from a transcript-only attempt. Official penalty compliance remains separate from rubric points.",
      };
      await database.update(decaAiJudgeSessions).set({ status: "completed", observableScore: score.observablePoints, observableMaximumPoints: score.observableMaximumPoints, fullEstimatedScore: score.fullEstimatedScore, confidence: String(score.confidence), resultJson: result, modelMetadataJson: { model: response.model, promptVersion: PROMPT_VERSION, auditedBy: "server-evidence-validator" } }).where(eq(decaAiJudgeSessions.id, sessionId));
      return { sessionId, ruleSet: { eventCode: ruleSet.eventCode, eventName: ruleSet.eventName, competitionYear: ruleSet.competitionYear, version: ruleSet.version, sourceUrl: ruleSet.sourceUrl, sourceVersion: ruleSet.sourceVersion }, result };
    } catch (error) {
      await database.update(decaAiJudgeSessions).set({ status: "failed", modelMetadataJson: { promptVersion: PROMPT_VERSION, failure: error instanceof Error ? error.message.slice(0, 400) : "Unknown scoring failure" } }).where(eq(decaAiJudgeSessions.id, sessionId));
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The transcript was saved, but judging did not complete. You can retry without re-recording." });
    }
  }),

  recentSessions: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];
    return database.select({ id: decaAiJudgeSessions.id, eventCode: decaAiJudgeSessions.eventCode, competitionYear: decaAiJudgeSessions.competitionYear, status: decaAiJudgeSessions.status, observableScore: decaAiJudgeSessions.observableScore, observableMaximumPoints: decaAiJudgeSessions.observableMaximumPoints, fullEstimatedScore: decaAiJudgeSessions.fullEstimatedScore, confidence: decaAiJudgeSessions.confidence, createdAt: decaAiJudgeSessions.createdAt }).from(decaAiJudgeSessions).where(eq(decaAiJudgeSessions.userId, ctx.user.id)).orderBy(desc(decaAiJudgeSessions.createdAt)).limit(8);
  }),

  getSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI Judge storage is unavailable." });
    const [session] = await database.select().from(decaAiJudgeSessions).where(and(eq(decaAiJudgeSessions.id, input.sessionId), eq(decaAiJudgeSessions.userId, ctx.user.id))).limit(1);
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "That AI Judge attempt was not found." });
    return {
      id: session.id,
      status: session.status,
      transcript: session.correctedTranscript,
      groupSize: session.groupSize,
      result: session.resultJson,
    };
  }),

  deleteSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI Judge storage is unavailable." });
    await database.delete(decaAiJudgeSessions).where(and(eq(decaAiJudgeSessions.id, input.sessionId), eq(decaAiJudgeSessions.userId, ctx.user.id)));
    return { success: true };
  }),
});
