import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  decaEventRubrics,
  eventPerformanceIndicators,
  piLearningModules,
  roleplayAttempts,
  roleplayEvaluations,
  roleplayJudgeTurns,
  roleplayRecordings,
  roleplayScenarios,
  roleplayTranscripts,
  userPiProgress,
  users,
} from "../drizzle/schema";
import { DECA_ROLEPLAY_EVENTS, getDecaRoleplayEvent, ROLEPLAY_COMPETITION_SEASON } from "../shared/decaRoleplayEvents";
import { invokeLLM } from "./_core/llm";
import { protectedProcedure, router } from "./_core/trpc";
import { transcribeAudio } from "./_core/voiceTranscription";
import { getDb } from "./db";
import { evaluateRoleplayTranscript, type ScenarioPi } from "./roleplayEngine";
import { storageGet, storagePut } from "./storage";

const ACTIVE_STATUSES = ["briefing", "preparing", "judge_intro", "interview", "follow_up", "submitted", "transcribing", "evaluating"] as const;
const MAX_AUDIO_BYTES = 16 * 1024 * 1024;
const AUDIO_CONTENT_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"] as const;

const scenarioOutputFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "blue_blazer_original_roleplay_scenario",
    strict: true,
    schema: {
      type: "object",
      properties: {
        participantRole: { type: "string" },
        judgeRole: { type: "string" },
        companyContext: { type: "string" },
        situation: { type: "string" },
        task: { type: "string" },
        judgeContext: { type: "string" },
        judgeQuestions: { type: "array", items: { type: "string" } },
        expectedBusinessConcepts: { type: "array", items: { type: "string" } },
      },
      required: ["participantRole", "judgeRole", "companyContext", "situation", "task", "judgeContext", "judgeQuestions", "expectedBusinessConcepts"],
      additionalProperties: false,
    },
  },
};

const followUpOutputFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "blue_blazer_roleplay_follow_up",
    strict: true,
    schema: {
      type: "object",
      properties: { question: { type: "string" }, basis: { type: "string" } },
      required: ["question", "basis"],
      additionalProperties: false,
    },
  },
};

type ScenarioSourceType = "official_public_sample" | "blue_blazer_original" | "ai_generated";
type TrainingMode = "competition" | "practice" | "coach";

function requireDatabase(database: Awaited<ReturnType<typeof getDb>>) {
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Roleplay storage is unavailable." });
  return database;
}

function limitText(value: string, limit: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, limit);
}

function sourceLabel(sourceType: ScenarioSourceType) {
  if (sourceType === "official_public_sample") return "Official / public sample";
  if (sourceType === "ai_generated") return "AI-generated practice";
  return "Blue Blazer original";
}

function roleplaySourceUrl(eventCode: string) {
  return `https://www.deca.org/compete`;
}

async function ensureEventRubric(eventCode: string) {
  const database = requireDatabase(await getDb());
  const event = getDecaRoleplayEvent(eventCode);
  if (!event) throw new TRPCError({ code: "BAD_REQUEST", message: "That event is not supported by the roleplay simulator." });
  const rubricJson = {
    eventName: event.eventName,
    eventCategory: event.eventCategory,
    participantCount: event.participantCount,
    prepDurationSeconds: event.prepMinutes * 60,
    interviewDurationSeconds: event.interviewMinutes * 60,
    officialCompetitionStructure: event.officialCompetitionStructure,
    timingSource: "Official DECA High School event pages and current DECA Direct timing comparison",
    practiceScore: event.rubricConfiguration,
  };
  await database.insert(decaEventRubrics).values({
    eventCode: event.eventCode,
    season: event.season,
    version: event.rubricConfiguration.version,
    rubricType: "roleplay_practice",
    rubricJson,
    sourceUrl: roleplaySourceUrl(event.eventCode),
    sourceVersion: event.sourceVersion,
    verificationStatus: event.verificationStatus,
    verifiedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: { sourceUrl: roleplaySourceUrl(event.eventCode), sourceVersion: event.sourceVersion, verifiedAt: new Date() } });
  const [rubric] = await database.select().from(decaEventRubrics)
    .where(and(eq(decaEventRubrics.eventCode, event.eventCode), eq(decaEventRubrics.season, ROLEPLAY_COMPETITION_SEASON), eq(decaEventRubrics.version, event.rubricConfiguration.version)))
    .limit(1);
  if (!rubric) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The roleplay event configuration could not be initialized." });
  return { database, event, rubric };
}

function parseTiming(rubric: typeof decaEventRubrics.$inferSelect) {
  const json = rubric.rubricJson as Record<string, unknown>;
  const prepDurationSeconds = Number(json.prepDurationSeconds);
  const interviewDurationSeconds = Number(json.interviewDurationSeconds);
  if (!Number.isInteger(prepDurationSeconds) || prepDurationSeconds < 60 || !Number.isInteger(interviewDurationSeconds) || interviewDurationSeconds < 60) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This event’s saved timing configuration is invalid. Ask an administrator to review it." });
  }
  return { prepDurationSeconds, interviewDurationSeconds };
}

async function selectScenarioPis(database: NonNullable<Awaited<ReturnType<typeof getDb>>>, eventCode: string, cluster: string): Promise<ScenarioPi[]> {
  const mapped = await database.select({
    moduleId: piLearningModules.id,
    piId: piLearningModules.piId,
    performanceIndicator: piLearningModules.performanceIndicator,
    instructionalArea: piLearningModules.instructionalArea,
  }).from(eventPerformanceIndicators)
    .innerJoin(piLearningModules, eq(eventPerformanceIndicators.moduleId, piLearningModules.id))
    .where(eq(eventPerformanceIndicators.eventCode, eventCode));
  const candidates = mapped.length ? mapped : await database.select({
    moduleId: piLearningModules.id,
    piId: piLearningModules.piId,
    performanceIndicator: piLearningModules.performanceIndicator,
    instructionalArea: piLearningModules.instructionalArea,
  }).from(piLearningModules).where(eq(piLearningModules.cluster, cluster));
  const unique = new Map<number, ScenarioPi>();
  candidates.forEach((item) => unique.set(item.moduleId, item));
  const selected = Array.from(unique.values()).sort((a, b) => a.piId.localeCompare(b.piId)).slice(0, 5);
  if (selected.length < 3) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This event does not yet have enough mapped performance indicators for a reliable roleplay round." });
  return selected;
}

function originalScenario(event: NonNullable<ReturnType<typeof getDecaRoleplayEvent>>, pis: ScenarioPi[], difficulty: "foundational" | "competition" | "stretch") {
  const context = event.careerCluster === "Finance"
    ? "Northline Community Credit Union is considering a new student-focused financial service after a recent decline in young-member engagement."
    : event.careerCluster === "Hospitality & Tourism"
      ? "Harborlight Experiences, a locally owned visitor-services company, is preparing for a busy seasonal weekend with inconsistent guest feedback."
      : event.careerCluster === "Business Management"
        ? "Cedar Works, a growing service business, is addressing a workplace decision that affects employee trust and daily operations."
        : event.careerCluster === "Entrepreneurship"
          ? "Juniper & Co., an early-stage local business, must choose a practical next step before allocating its limited launch budget."
          : "Lumen Street Collective, a growing local business, needs a practical recommendation before its next customer-facing campaign.";
  return {
    participantRole: event.eventCategory === "team_decision_making" ? "a member of the business decision team" : "an assistant manager",
    judgeRole: event.eventCategory === "team_decision_making" ? "the organization’s executive director" : "the supervising manager",
    companyContext: context,
    situation: `The organization has asked you to address a ${difficulty === "stretch" ? "high-stakes" : difficulty === "foundational" ? "clearly defined" : "time-sensitive"} challenge that requires a customer-centered and financially responsible recommendation.`,
    task: `Present a recommendation that directly applies the assigned performance indicators, explains the business reasoning, identifies trade-offs, and states how success should be measured.`,
    judgeContext: "The judge wants a concise, specific solution and will ask follow-up questions about feasibility, trade-offs, and measurement.",
    judgeQuestions: [
      "What is the first action you would take, and why is it the right priority?",
      "What trade-off did you consider before making this recommendation?",
      "How would you measure whether your recommendation is working?",
    ],
    expectedBusinessConcepts: pis.map((pi) => pi.performanceIndicator),
  };
}

async function generateScenarioContent(input: {
  event: NonNullable<ReturnType<typeof getDecaRoleplayEvent>>;
  pis: ScenarioPi[];
  difficulty: "foundational" | "competition" | "stretch";
  sourceType: ScenarioSourceType;
}) {
  if (input.sourceType === "blue_blazer_original") return originalScenario(input.event, input.pis, input.difficulty);
  if (input.sourceType === "official_public_sample") {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No approved public sample has been added for this event yet. Choose Blue Blazer Original or AI-Generated Practice." });
  }
  const prompt = [
    "Create one wholly original Blue Blazer DECA roleplay practice scenario. Do not quote, paraphrase, imitate, or reproduce any DECA competition scenario, business name, prompt, or sample case.",
    `Event: ${input.event.eventName} (${input.event.eventCode}); category: ${input.event.eventCategory}; career cluster: ${input.event.careerCluster}; difficulty: ${input.difficulty}.`,
    "The scenario must be realistic for high-school DECA practice, business-specific, internally coherent, and solvable in a short spoken presentation. Include three concise judge questions that test reasoning without coaching the competitor.",
    "Assigned performance indicators that must be naturally relevant:\n" + input.pis.map((pi) => `${pi.piId}: ${pi.performanceIndicator}`).join("\n"),
  ].join("\n\n");
  try {
    const response = await invokeLLM({
      maxTokens: 2_600,
      messages: [{ role: "system", content: prompt }, { role: "user", content: "Return the structured original practice scenario." }],
      responseFormat: scenarioOutputFormat,
    });
    const content = response.choices[0]?.message?.content;
    if (typeof content !== "string") throw new Error("No scenario content returned");
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      participantRole: limitText(String(parsed.participantRole ?? "assistant manager"), 255),
      judgeRole: limitText(String(parsed.judgeRole ?? "supervising manager"), 255),
      companyContext: limitText(String(parsed.companyContext ?? ""), 1_800),
      situation: limitText(String(parsed.situation ?? ""), 1_800),
      task: limitText(String(parsed.task ?? ""), 1_500),
      judgeContext: limitText(String(parsed.judgeContext ?? ""), 1_000),
      judgeQuestions: Array.isArray(parsed.judgeQuestions) ? parsed.judgeQuestions.filter((item): item is string => typeof item === "string").map((item) => limitText(item, 400)).slice(0, 3) : [],
      expectedBusinessConcepts: Array.isArray(parsed.expectedBusinessConcepts) ? parsed.expectedBusinessConcepts.filter((item): item is string => typeof item === "string").map((item) => limitText(item, 300)).slice(0, 6) : input.pis.map((pi) => pi.performanceIndicator),
    };
  } catch {
    return originalScenario(input.event, input.pis, input.difficulty);
  }
}

async function createScenario(database: NonNullable<Awaited<ReturnType<typeof getDb>>>, input: {
  event: NonNullable<ReturnType<typeof getDecaRoleplayEvent>>;
  sourceType: ScenarioSourceType;
  difficulty: "foundational" | "competition" | "stretch";
}) {
  const pis = await selectScenarioPis(database, input.event.eventCode, input.event.careerCluster);
  const content = await generateScenarioContent({ ...input, pis });
  if (!content.companyContext || !content.situation || !content.task) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "A complete original scenario could not be generated. Please try again." });
  const inserted = await database.insert(roleplayScenarios).values({
    eventCode: input.event.eventCode,
    careerCluster: input.event.careerCluster,
    instructionalArea: pis[0].instructionalArea,
    difficulty: input.difficulty,
    participantRole: content.participantRole,
    judgeRole: content.judgeRole,
    companyContext: content.companyContext,
    situation: content.situation,
    task: content.task,
    performanceIndicators: pis,
    judgeContext: content.judgeContext,
    judgeQuestions: content.judgeQuestions.length ? content.judgeQuestions : originalScenario(input.event, pis, input.difficulty).judgeQuestions,
    expectedBusinessConcepts: content.expectedBusinessConcepts,
    scenarioData: { origin: sourceLabel(input.sourceType), generatedAt: new Date().toISOString() },
    sourceType: input.sourceType,
    sourceYear: ROLEPLAY_COMPETITION_SEASON,
    sourceAttribution: input.sourceType === "blue_blazer_original" ? "Original Blue Blazer-authored practice scenario" : "Original AI-generated Blue Blazer practice scenario; not derived from a DECA competition case",
  });
  const id = Number((inserted as any)[0]?.insertId);
  const [scenario] = await database.select().from(roleplayScenarios).where(eq(roleplayScenarios.id, id)).limit(1);
  if (!scenario) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The scenario could not be saved." });
  return scenario;
}

function scenarioView(scenario: typeof roleplayScenarios.$inferSelect) {
  return {
    id: scenario.id,
    eventCode: scenario.eventCode,
    careerCluster: scenario.careerCluster,
    instructionalArea: scenario.instructionalArea,
    difficulty: scenario.difficulty,
    participantRole: scenario.participantRole,
    judgeRole: scenario.judgeRole,
    companyContext: scenario.companyContext,
    situation: scenario.situation,
    task: scenario.task,
    performanceIndicators: scenario.performanceIndicators as ScenarioPi[],
    judgeContext: scenario.judgeContext,
    judgeQuestions: scenario.judgeQuestions as string[],
    expectedBusinessConcepts: scenario.expectedBusinessConcepts as string[],
    sourceType: scenario.sourceType,
    sourceAttribution: scenario.sourceAttribution,
  };
}

async function ownedAttempt(database: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, attemptId: number) {
  const [attempt] = await database.select().from(roleplayAttempts)
    .where(and(eq(roleplayAttempts.id, attemptId), eq(roleplayAttempts.userId, userId))).limit(1);
  if (!attempt) throw new TRPCError({ code: "NOT_FOUND", message: "That roleplay attempt was not found." });
  return attempt;
}

async function attemptDetail(database: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, attemptId: number) {
  const attempt = await ownedAttempt(database, userId, attemptId);
  const [[scenario], [rubric], turns, [transcript], [evaluation], [recording]] = await Promise.all([
    database.select().from(roleplayScenarios).where(eq(roleplayScenarios.id, attempt.scenarioId)).limit(1),
    database.select().from(decaEventRubrics).where(eq(decaEventRubrics.id, attempt.rubricId)).limit(1),
    database.select().from(roleplayJudgeTurns).where(eq(roleplayJudgeTurns.attemptId, attempt.id)).orderBy(roleplayJudgeTurns.sequence),
    database.select().from(roleplayTranscripts).where(eq(roleplayTranscripts.attemptId, attempt.id)).limit(1),
    database.select().from(roleplayEvaluations).where(eq(roleplayEvaluations.attemptId, attempt.id)).limit(1),
    database.select().from(roleplayRecordings).where(eq(roleplayRecordings.attemptId, attempt.id)).limit(1),
  ]);
  if (!scenario || !rubric) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "This roleplay attempt has incomplete simulator data." });
  return {
    attempt: { ...attempt, hasRecording: Boolean(recording) },
    event: getDecaRoleplayEvent(attempt.eventCode),
    timing: parseTiming(rubric),
    rubric: { version: rubric.version, season: rubric.season, verificationStatus: rubric.verificationStatus, sourceUrl: rubric.sourceUrl, disclosure: (rubric.rubricJson as Record<string, unknown>).practiceScore },
    scenario: scenarioView(scenario),
    judgeTurns: turns,
    transcript: transcript ? { text: transcript.cleanedText, segments: transcript.segments, transcribedAt: transcript.transcribedAt } : null,
    evaluation: evaluation ? { piScores: evaluation.piScores, deliveryAnalysis: evaluation.deliveryAnalysis, overallScore: evaluation.overallScore, performanceLevel: evaluation.performanceLevel, strengths: evaluation.strengths, improvements: evaluation.improvements, trainingRecommendations: evaluation.trainingRecommendations, modelMetadata: evaluation.modelMetadata } : null,
  };
}

async function updatePiMastery(database: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, piScores: Array<{ moduleId: number; score: number }>) {
  const now = new Date();
  for (const pi of piScores) {
    const [current] = await database.select().from(userPiProgress).where(and(eq(userPiProgress.userId, userId), eq(userPiProgress.moduleId, pi.moduleId))).limit(1);
    const masteryScore = current ? Math.round((current.masteryScore * 0.7) + (pi.score * 0.3)) : pi.score;
    const reviewStatus = masteryScore < 60 ? "needs_review" : masteryScore < 80 ? "rusty" : "fresh";
    const daysUntilReview = masteryScore < 60 ? 2 : masteryScore < 80 ? 7 : 21;
    const nextReviewAt = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000);
    await database.insert(userPiProgress).values({ userId, moduleId: pi.moduleId, masteryScore, reviewStatus, lastReviewedAt: now, nextReviewAt })
      .onDuplicateKeyUpdate({ set: { masteryScore, reviewStatus, lastReviewedAt: now, nextReviewAt } });
  }
}

function trainingRecommendations(piScores: Array<ScenarioPi & { score: number; level: string }>) {
  return piScores.filter((pi) => pi.score < 75).sort((a, b) => a.score - b.score).slice(0, 3).map((pi) => ({
    moduleId: pi.moduleId,
    piId: pi.piId,
    performanceIndicator: pi.performanceIndicator,
    currentLevel: pi.level,
    action: `Review this PI in the Blue Blazer PI Library, then complete one scenario challenge before your next roleplay.` ,
    href: `/pi-quizlet?module=${pi.moduleId}`,
  }));
}

function contentTypeExtension(contentType: string) {
  if (contentType === "audio/webm") return "webm";
  if (contentType === "audio/ogg") return "ogg";
  if (contentType === "audio/mp4") return "m4a";
  if (contentType === "audio/wav") return "wav";
  return "mp3";
}

export const roleplayRouter = router({
  getCompatibleEvents: protectedProcedure.query(async ({ ctx }) => ({
    competitionSeason: ROLEPLAY_COMPETITION_SEASON,
    preferredEventCode: ctx.user.primaryEventCode && getDecaRoleplayEvent(ctx.user.primaryEventCode) ? ctx.user.primaryEventCode : null,
    events: DECA_ROLEPLAY_EVENTS,
  })),

  getActiveAttempt: protectedProcedure.query(async ({ ctx }) => {
    const database = requireDatabase(await getDb());
    const [active] = await database.select().from(roleplayAttempts)
      .where(and(eq(roleplayAttempts.userId, ctx.user.id), inArray(roleplayAttempts.status, [...ACTIVE_STATUSES])))
      .orderBy(desc(roleplayAttempts.updatedAt)).limit(1);
    return active ? attemptDetail(database, ctx.user.id, active.id) : null;
  }),

  startAttempt: protectedProcedure.input(z.object({
    eventCode: z.string().trim().toUpperCase().max(20),
    trainingMode: z.enum(["competition", "practice", "coach"]),
    sourceType: z.enum(["official_public_sample", "blue_blazer_original", "ai_generated"]),
    difficulty: z.enum(["foundational", "competition", "stretch"]).default("competition"),
  })).mutation(async ({ ctx, input }) => {
    const { database, event, rubric } = await ensureEventRubric(input.eventCode);
    await database.update(roleplayAttempts).set({ status: "abandoned", failureReason: "A new roleplay attempt was started.", updatedAt: new Date() })
      .where(and(eq(roleplayAttempts.userId, ctx.user.id), inArray(roleplayAttempts.status, [...ACTIVE_STATUSES])));
    const scenario = await createScenario(database, { event, sourceType: input.sourceType, difficulty: input.difficulty });
    const timing = parseTiming(rubric);
    const insert = await database.insert(roleplayAttempts).values({
      userId: ctx.user.id,
      eventCode: event.eventCode,
      scenarioId: scenario.id,
      rubricId: rubric.id,
      trainingMode: input.trainingMode,
      status: "briefing",
      prepDurationSeconds: timing.prepDurationSeconds,
      interviewDurationSeconds: timing.interviewDurationSeconds,
      rubricVersion: rubric.version,
      activeState: { stage: "briefing", sourceType: input.sourceType },
    });
    const attemptId = Number((insert as any)[0]?.insertId);
    return attemptDetail(database, ctx.user.id, attemptId);
  }),

  saveAttemptState: protectedProcedure.input(z.object({
    attemptId: z.number().int().positive(),
    scratchpad: z.string().max(20_000).optional(),
    stage: z.enum(["briefing", "preparing", "judge_intro", "interview", "follow_up"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    const attempt = await ownedAttempt(database, ctx.user.id, input.attemptId);
    if (!ACTIVE_STATUSES.includes(attempt.status as typeof ACTIVE_STATUSES[number])) throw new TRPCError({ code: "CONFLICT", message: "Completed attempts cannot be changed." });
    const values: Partial<typeof roleplayAttempts.$inferInsert> = { updatedAt: new Date() };
    if (input.scratchpad !== undefined) values.scratchpad = input.scratchpad;
    if (input.stage) {
      values.status = input.stage;
      values.activeState = { ...(attempt.activeState as Record<string, unknown> ?? {}), stage: input.stage, savedAt: new Date().toISOString() };
      if (input.stage === "preparing" && !attempt.prepStartedAt) values.prepStartedAt = new Date();
      if (input.stage === "interview" && !attempt.interviewStartedAt) values.interviewStartedAt = new Date();
    }
    await database.update(roleplayAttempts).set(values).where(eq(roleplayAttempts.id, attempt.id));
    return { success: true };
  }),

  beginJudgeIntroduction: protectedProcedure.input(z.object({ attemptId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    const detail = await attemptDetail(database, ctx.user.id, input.attemptId);
    const current = detail.attempt;
    if (!ACTIVE_STATUSES.includes(current.status as typeof ACTIVE_STATUSES[number])) throw new TRPCError({ code: "CONFLICT", message: "This attempt is no longer active." });
    if (!detail.judgeTurns.some((turn) => turn.sequence === 0)) {
      await database.insert(roleplayJudgeTurns).values({
        attemptId: current.id,
        sequence: 0,
        turnType: "introduction",
        question: `Thank you for meeting with me. I am the ${detail.scenario.judgeRole}. Please walk me through your recommendation for ${detail.scenario.companyContext}.`,
        basis: "Scenario-specific judge introduction",
      });
    }
    await database.update(roleplayAttempts).set({ status: "judge_intro", updatedAt: new Date() }).where(eq(roleplayAttempts.id, current.id));
    return attemptDetail(database, ctx.user.id, current.id);
  }),

  nextJudgeQuestion: protectedProcedure.input(z.object({ attemptId: z.number().int().positive(), studentSummary: z.string().max(2_000).optional() })).mutation(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    const detail = await attemptDetail(database, ctx.user.id, input.attemptId);
    if (!ACTIVE_STATUSES.includes(detail.attempt.status as typeof ACTIVE_STATUSES[number])) throw new TRPCError({ code: "CONFLICT", message: "This attempt is no longer active." });
    const previousQuestions = detail.judgeTurns.map((turn) => turn.question);
    const fallback = detail.scenario.judgeQuestions.find((question) => !previousQuestions.includes(question)) ?? "What measurable result would show that your recommendation is working, and how would you respond if it misses that target?";
    let question = fallback;
    let basis = "Scenario-relevant fallback question";
    try {
      const response = await invokeLLM({
        maxTokens: 900,
        messages: [{ role: "system", content: [
          "You are a professional DECA roleplay practice judge. Ask exactly one concise, neutral, scenario-relevant follow-up question. Do not coach, praise, reveal a preferred answer, or claim to be an official DECA judge.",
          `Scenario task: ${detail.scenario.task}`,
          `Assigned PIs: ${detail.scenario.performanceIndicators.map((pi) => `${pi.piId}: ${pi.performanceIndicator}`).join(" | ")}`,
          `Prior questions: ${previousQuestions.join(" | ") || "none"}`,
          input.studentSummary ? `Student-provided summary of what was addressed: ${input.studentSummary}` : "No interim student summary is available; ask a different scenario-relevant question.",
        ].join("\n\n") }, { role: "user", content: "Return the follow-up question and its short basis." }],
        responseFormat: followUpOutputFormat,
      });
      const content = response.choices[0]?.message?.content;
      const parsed = typeof content === "string" ? JSON.parse(content) as { question?: unknown; basis?: unknown } : null;
      if (parsed && typeof parsed.question === "string" && parsed.question.trim().length > 12) {
        question = limitText(parsed.question, 500);
        basis = limitText(typeof parsed.basis === "string" ? parsed.basis : "Scenario-relevant follow-up", 500);
      }
    } catch {
      // The saved fallback preserves the interview without pretending an AI response arrived.
    }
    const sequence = detail.judgeTurns.length;
    await database.insert(roleplayJudgeTurns).values({ attemptId: detail.attempt.id, sequence, turnType: "follow_up", question, basis });
    await database.update(roleplayAttempts).set({ status: "follow_up", updatedAt: new Date() }).where(eq(roleplayAttempts.id, detail.attempt.id));
    return { question, basis, sequence };
  }),

  uploadInterviewAudio: protectedProcedure.input(z.object({
    attemptId: z.number().int().positive(),
    audioBase64: z.string().min(4).max(22_500_000),
    contentType: z.enum(AUDIO_CONTENT_TYPES),
    durationSeconds: z.number().int().min(1).max(1_200),
  })).mutation(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    const attempt = await ownedAttempt(database, ctx.user.id, input.attemptId);
    if (!ACTIVE_STATUSES.includes(attempt.status as typeof ACTIVE_STATUSES[number])) throw new TRPCError({ code: "CONFLICT", message: "This attempt is no longer accepting recordings." });
    const buffer = Buffer.from(input.audioBase64, "base64");
    if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "The recording must be a valid audio file smaller than 16 MB." });
    if (input.durationSeconds > attempt.interviewDurationSeconds + 90) throw new TRPCError({ code: "BAD_REQUEST", message: "The recording exceeds the allowed roleplay interview window." });
    const storageKey = `roleplay-recordings/${ctx.user.id}/${attempt.id}/${randomUUID()}.${contentTypeExtension(input.contentType)}`;
    await storagePut(storageKey, buffer, input.contentType);
    await database.insert(roleplayRecordings).values({ attemptId: attempt.id, phase: "interview", audioStorageKey: storageKey, contentType: input.contentType, durationSeconds: input.durationSeconds, fileSizeBytes: buffer.length })
      .onDuplicateKeyUpdate({ set: { audioStorageKey: storageKey, contentType: input.contentType, durationSeconds: input.durationSeconds, fileSizeBytes: buffer.length, uploadedAt: new Date() } });
    await database.update(roleplayAttempts).set({ status: "submitted", submittedAt: new Date(), failureReason: null, updatedAt: new Date() }).where(eq(roleplayAttempts.id, attempt.id));
    return { success: true, durationSeconds: input.durationSeconds };
  }),

  submitAttempt: protectedProcedure.input(z.object({ attemptId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    const current = await ownedAttempt(database, ctx.user.id, input.attemptId);
    const [existingEvaluation] = await database.select().from(roleplayEvaluations).where(eq(roleplayEvaluations.attemptId, current.id)).limit(1);
    if (existingEvaluation) return attemptDetail(database, ctx.user.id, current.id);
    if (current.status === "transcribing" || current.status === "evaluating") throw new TRPCError({ code: "CONFLICT", message: "This attempt is already being processed. Please wait for the saved result." });
    const [recording] = await database.select().from(roleplayRecordings).where(eq(roleplayRecordings.attemptId, current.id)).limit(1);
    if (!recording) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Record your roleplay before requesting an evaluation." });
    await database.update(roleplayAttempts).set({ status: "transcribing", failureReason: null, updatedAt: new Date() }).where(eq(roleplayAttempts.id, current.id));
    try {
      const { url } = await storageGet(recording.audioStorageKey);
      const transcribed = await transcribeAudio({ audioUrl: url, language: "en", prompt: "Transcribe a student DECA business roleplay interview. Preserve business vocabulary, recommendations, and numerical details where audible." });
      if ("error" in transcribed) throw new Error(`${transcribed.error}${transcribed.details ? `: ${transcribed.details}` : ""}`);
      const text = transcribed.text.trim();
      if (text.length < 40) {
        await database.update(roleplayAttempts).set({ status: "submitted", failureReason: "The transcript was too short to support a reliable evaluation. Record again and retry.", updatedAt: new Date() }).where(eq(roleplayAttempts.id, current.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "The recording was too short or mostly silent. It was saved, but please record a fuller response before evaluation." });
      }
      await database.insert(roleplayTranscripts).values({ attemptId: current.id, phase: "interview", rawText: text, cleanedText: text, segments: transcribed.segments, whisperModel: "whisper-1" })
        .onDuplicateKeyUpdate({ set: { rawText: text, cleanedText: text, segments: transcribed.segments, whisperModel: "whisper-1", transcribedAt: new Date() } });
      await database.update(roleplayAttempts).set({ status: "evaluating", updatedAt: new Date() }).where(eq(roleplayAttempts.id, current.id));
      const detail = await attemptDetail(database, ctx.user.id, current.id);
      const evaluation = await evaluateRoleplayTranscript({
        eventName: detail.event?.eventName ?? current.eventCode,
        eventCode: current.eventCode,
        trainingMode: current.trainingMode,
        scenario: detail.scenario,
        pis: detail.scenario.performanceIndicators,
        transcript: text,
        durationSeconds: recording.durationSeconds,
      });
      const recommendations = trainingRecommendations(evaluation.piScores);
      await database.insert(roleplayEvaluations).values({
        attemptId: current.id,
        piScores: evaluation.piScores,
        deliveryAnalysis: evaluation.deliveryAnalysis,
        overallScore: evaluation.overallScore,
        performanceLevel: evaluation.performanceLevel,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        trainingRecommendations: recommendations,
        modelMetadata: evaluation.modelMetadata,
      }).onDuplicateKeyUpdate({ set: { piScores: evaluation.piScores, deliveryAnalysis: evaluation.deliveryAnalysis, overallScore: evaluation.overallScore, performanceLevel: evaluation.performanceLevel, strengths: evaluation.strengths, improvements: evaluation.improvements, trainingRecommendations: recommendations, modelMetadata: evaluation.modelMetadata, updatedAt: new Date() } });
      await updatePiMastery(database, ctx.user.id, evaluation.piScores);
      await database.update(roleplayAttempts).set({ status: "completed", totalScore: evaluation.overallScore, performanceLevel: evaluation.performanceLevel, completedAt: new Date(), failureReason: null, updatedAt: new Date() }).where(eq(roleplayAttempts.id, current.id));
      return attemptDetail(database, ctx.user.id, current.id);
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      await database.update(roleplayAttempts).set({ status: "submitted", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Evaluation failed", updatedAt: new Date() }).where(eq(roleplayAttempts.id, current.id));
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your recording is saved, but evaluation did not finish. Retry without re-recording." });
    }
  }),

  getAttemptResult: protectedProcedure.input(z.object({ attemptId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    return attemptDetail(database, ctx.user.id, input.attemptId);
  }),

  getRecordingPlayback: protectedProcedure.input(z.object({ attemptId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    const attempt = await ownedAttempt(database, ctx.user.id, input.attemptId);
    const [recording] = await database.select().from(roleplayRecordings).where(eq(roleplayRecordings.attemptId, attempt.id)).limit(1);
    if (!recording) throw new TRPCError({ code: "NOT_FOUND", message: "No recording was saved for this attempt." });
    const { url } = await storageGet(recording.audioStorageKey);
    return { url, contentType: recording.contentType, durationSeconds: recording.durationSeconds };
  }),

  listAttempts: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(30).default(12) })).query(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    const rows = await database.select({
      id: roleplayAttempts.id,
      eventCode: roleplayAttempts.eventCode,
      trainingMode: roleplayAttempts.trainingMode,
      status: roleplayAttempts.status,
      totalScore: roleplayAttempts.totalScore,
      performanceLevel: roleplayAttempts.performanceLevel,
      createdAt: roleplayAttempts.createdAt,
      completedAt: roleplayAttempts.completedAt,
      sourceType: roleplayScenarios.sourceType,
      difficulty: roleplayScenarios.difficulty,
    }).from(roleplayAttempts).innerJoin(roleplayScenarios, eq(roleplayAttempts.scenarioId, roleplayScenarios.id))
      .where(eq(roleplayAttempts.userId, ctx.user.id)).orderBy(desc(roleplayAttempts.createdAt)).limit(input.limit);
    return rows.map((row) => ({ ...row, event: getDecaRoleplayEvent(row.eventCode) }));
  }),

  deleteAttempt: protectedProcedure.input(z.object({ attemptId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const database = requireDatabase(await getDb());
    await ownedAttempt(database, ctx.user.id, input.attemptId);
    await database.delete(roleplayAttempts).where(and(eq(roleplayAttempts.id, input.attemptId), eq(roleplayAttempts.userId, ctx.user.id)));
    return { success: true };
  }),

  getDebugAttempt: protectedProcedure.input(z.object({ attemptId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can inspect simulator diagnostics." });
    const database = requireDatabase(await getDb());
    const [target] = await database.select({ attemptId: roleplayAttempts.id, targetUserId: roleplayAttempts.userId, targetSchoolCode: users.schoolCode })
      .from(roleplayAttempts).innerJoin(users, eq(roleplayAttempts.userId, users.id)).where(eq(roleplayAttempts.id, input.attemptId)).limit(1);
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "That roleplay attempt was not found." });
    const permittedSchool = ctx.user.role === "super_admin" ? (ctx.user.selectedSchoolCode || ctx.user.schoolCode) : ctx.user.schoolCode;
    if (ctx.user.role !== "super_admin" && (!permittedSchool || target.targetSchoolCode !== permittedSchool)) throw new TRPCError({ code: "FORBIDDEN", message: "You can only inspect roleplay diagnostics for your chapter." });
    return attemptDetail(database, target.targetUserId, target.attemptId);
  }),
});
