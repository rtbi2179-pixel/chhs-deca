import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { decaAiJudgeAcousticAnalyses, decaAiJudgeRecordings, decaAiJudgeRecordingSegments, decaAiJudgeRecordingTranscripts, decaAiJudgeRuleSets, decaAiJudgeSessions, decaAiJudgeWrittenSubmissions } from "../drizzle/schema";
import { getVerifiedDecaAiJudgeRuleSet, VERIFIED_DECA_AI_JUDGE_RULE_SETS } from "../shared/decaAiJudgeRules";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { calculateSafeRubricScore, formatTranscriptForJudge, type ModelRubricItem } from "./aiJudgeEngine";
import { analyzeStoredRecording, audioAnalysisConfidence, extractAudioForTranscription, extractWrittenDocument } from "./mediaAnalysis";
import { protectedProcedure, router } from "./_core/trpc";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storageGet, storagePut } from "./storage";
const COMPETITION_YEAR = "2026-2027";
const PROMPT_VERSION = "blue-blazer-deca-ai-judge-v1";
const MAX_MEDIA_BYTES = 24 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;
const RECORDED_MEDIA_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "video/webm", "video/mp4"] as const;
const WRITTEN_ENTRY_TYPES = ["application/pdf", "text/plain"] as const;

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

function recordedJudgePrompt(ruleSet: NonNullable<ReturnType<typeof getVerifiedDecaAiJudgeRuleSet>>, writtenEntry: string, transcript: string) {
  const observableCriteria = ruleSet.criteria.filter((criterion) => criterion.assessableFromTranscript);
  const combinedEvidence = `WRITTEN ENTRY (primary document evidence)\n${writtenEntry}\n\nPRESENTATION TRANSCRIPT (supporting content evidence)\n${transcript}`;
  return [
    "You are an evidence-bound Blue Blazer Written Event practice evaluator. You are not an official DECA judge and must not claim official authority.",
    `Evaluate the verified ${ruleSet.competitionYear} ${ruleSet.eventName} (${ruleSet.eventCode}) configuration using the uploaded written entry and the transcript derived from the student's preserved presentation recording.`,
    "The written entry and original presentation recording are primary evidence. The transcript is supporting evidence for what was said; separate acoustic delivery data is handled outside official rubric scoring. Never infer eye contact, gestures, appearance, visual design, or vocal traits from text.",
    "For every assessed criterion, cite only the supplied [P##] evidence passages. Score conservatively. Missing or generic evidence must be not_assessable rather than guessed.",
    `Criteria whose content can be evaluated from supplied written/presentation evidence: ${observableCriteria.map((criterion) => `${criterion.id} (max ${criterion.maximumPoints}): ${criterion.evidenceFocus}`).join(" | ")}`,
    "Return all official criteria. Do not fabricate a full score for criteria whose required evidence is unavailable.",
    "Evidence package:\n" + formatTranscriptForJudge(combinedEvidence),
  ].join("\n\n");
}

function clampAnalytics(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function contentTypeExtension(contentType: string) {
  if (contentType === "audio/webm" || contentType === "video/webm") return "webm";
  if (contentType === "audio/ogg") return "ogg";
  if (contentType === "audio/mp4" || contentType === "video/mp4") return "mp4";
  if (contentType === "audio/wav") return "wav";
  if (contentType === "application/pdf") return "pdf";
  if (contentType === "text/plain") return "txt";
  return "bin";
}

async function ownedSession(userId: number, sessionId: number) {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI Judge storage is unavailable." });
  const [session] = await database.select().from(decaAiJudgeSessions).where(and(eq(decaAiJudgeSessions.id, sessionId), eq(decaAiJudgeSessions.userId, userId))).limit(1);
  if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "That AI Judge attempt was not found." });
  return { database, session };
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

  createRecordedSession: protectedProcedure.input(z.object({
    competitionYear: z.literal(COMPETITION_YEAR),
    eventCode: z.literal("EIP"),
    groupSize: z.number().int().min(1).max(3),
  })).mutation(async ({ ctx, input }) => {
    const { database, ruleSet, stored } = await ensureRuleSet();
    if (input.groupSize < ruleSet.participantMin || input.groupSize > ruleSet.participantMax) throw new TRPCError({ code: "BAD_REQUEST", message: `${ruleSet.eventName} accepts ${ruleSet.participantMin}–${ruleSet.participantMax} participants.` });
    const inserted = await database.insert(decaAiJudgeSessions).values({
      userId: ctx.user.id,
      ruleSetId: stored.id,
      competitionYear: ruleSet.competitionYear,
      eventCode: ruleSet.eventCode,
      ruleSetVersion: ruleSet.version,
      groupSize: input.groupSize,
      submissionMode: "recorded_presentation",
      rawTranscript: "",
      correctedTranscript: "",
      status: "setup",
      recordingState: "idle",
      sourceAvailability: { writtenEntry: false, originalRecording: false, audioDelivery: false, transcript: false, videoDelivery: false },
    });
    return { sessionId: Number((inserted as any)[0]?.insertId), ruleSet: { eventCode: ruleSet.eventCode, eventName: ruleSet.eventName, competitionYear: ruleSet.competitionYear, version: ruleSet.version, presentationTimeSeconds: ruleSet.presentationTimeSeconds } };
  }),

  uploadWrittenEntry: protectedProcedure.input(z.object({
    sessionId: z.number().int().positive(),
    fileName: z.string().trim().min(1).max(512),
    mimeType: z.enum(WRITTEN_ENTRY_TYPES),
    fileBase64: z.string().min(4).max(16_800_000),
  })).mutation(async ({ ctx, input }) => {
    const { database, session } = await ownedSession(ctx.user.id, input.sessionId);
    if (session.submissionMode !== "recorded_presentation" || session.status === "completed") throw new TRPCError({ code: "CONFLICT", message: "This Written Event attempt is no longer accepting an entry." });
    const file = Buffer.from(input.fileBase64, "base64");
    if (!file.length || file.length > MAX_DOCUMENT_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a readable PDF or text entry smaller than 12 MB." });
    const storageKey = `ai-judge-written/${ctx.user.id}/${session.id}/${randomUUID()}.${contentTypeExtension(input.mimeType)}`;
    await storagePut(storageKey, file, input.mimeType);
    const { url } = await storageGet(storageKey);
    const extracted = await extractWrittenDocument(url, input.mimeType);
    await database.insert(decaAiJudgeWrittenSubmissions).values({ sessionId: session.id, storageKey, fileName: input.fileName, mimeType: input.mimeType, fileSizeBytes: file.length, parsedContent: extracted.parsedContent, pageCount: extracted.pageCount })
      .onDuplicateKeyUpdate({ set: { storageKey, fileName: input.fileName, mimeType: input.mimeType, fileSizeBytes: file.length, parsedContent: extracted.parsedContent, pageCount: extracted.pageCount, updatedAt: new Date() } });
    await database.update(decaAiJudgeSessions).set({ sourceAvailability: { ...(session.sourceAvailability ?? {}), writtenEntry: true }, failureReason: null, updatedAt: new Date() }).where(eq(decaAiJudgeSessions.id, session.id));
    return { success: true, pageCount: extracted.pageCount, extractedCharacters: extracted.parsedContent.length };
  }),

  uploadPresentationRecording: protectedProcedure.input(z.object({
    sessionId: z.number().int().positive(),
    mediaBase64: z.string().min(4).max(33_600_000),
    mimeType: z.enum(RECORDED_MEDIA_TYPES),
    durationMs: z.number().int().min(1_000).max(1_020_000),
    hasVideo: z.boolean().default(false),
    segments: z.array(z.object({ segmentType: z.enum(["presentation", "judge_question", "participant_response"]), startMs: z.number().int().min(0), endMs: z.number().int().min(0), label: z.string().max(255).optional() })).max(50).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { database, session } = await ownedSession(ctx.user.id, input.sessionId);
    if (session.submissionMode !== "recorded_presentation" || session.status === "completed") throw new TRPCError({ code: "CONFLICT", message: "This Written Event attempt is no longer accepting a presentation recording." });
    const media = Buffer.from(input.mediaBase64, "base64");
    if (!media.length || media.length > MAX_MEDIA_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "The original presentation recording must be smaller than 24 MB." });
    const storageKey = `ai-judge-recordings/${ctx.user.id}/${session.id}/${randomUUID()}.${contentTypeExtension(input.mimeType)}`;
    await storagePut(storageKey, media, input.mimeType);
    await database.insert(decaAiJudgeRecordings).values({ sessionId: session.id, recordingType: "presentation", storageKey, mimeType: input.mimeType, durationMs: input.durationMs, hasAudio: true, hasVideo: input.hasVideo, fileSizeBytes: media.length, uploadStatus: "uploaded" })
      .onDuplicateKeyUpdate({ set: { storageKey, mimeType: input.mimeType, durationMs: input.durationMs, hasAudio: true, hasVideo: input.hasVideo, fileSizeBytes: media.length, uploadStatus: "uploaded", updatedAt: new Date() } });
    const [recording] = await database.select().from(decaAiJudgeRecordings).where(and(eq(decaAiJudgeRecordings.sessionId, session.id), eq(decaAiJudgeRecordings.recordingType, "presentation"))).limit(1);
    if (!recording) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The original recording was stored but its metadata could not be recovered." });
    if (input.segments?.length) {
      await database.delete(decaAiJudgeRecordingSegments).where(eq(decaAiJudgeRecordingSegments.recordingId, recording.id));
      await database.insert(decaAiJudgeRecordingSegments).values(input.segments.filter((segment) => segment.endMs >= segment.startMs).map((segment) => ({ recordingId: recording.id, ...segment })));
    }
    await database.update(decaAiJudgeSessions).set({ status: "uploading", recordingState: "uploaded", sourceAvailability: { ...(session.sourceAvailability ?? {}), originalRecording: true, audioDelivery: false, transcript: false, videoDelivery: false }, failureReason: null, durationSeconds: Math.round(input.durationMs / 1_000), updatedAt: new Date() }).where(eq(decaAiJudgeSessions.id, session.id));
    return { success: true, durationSeconds: Math.round(input.durationMs / 1_000), hasVideo: input.hasVideo };
  }),

  evaluateRecordedSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { database, session } = await ownedSession(ctx.user.id, input.sessionId);
    if (session.submissionMode !== "recorded_presentation") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Use the transcript-practice flow for a transcript-only attempt." });
    if (session.status === "completed" && session.resultJson) return { sessionId: session.id, result: session.resultJson };
    const [[recording], [writtenEntry]] = await Promise.all([
      database.select().from(decaAiJudgeRecordings).where(and(eq(decaAiJudgeRecordings.sessionId, session.id), eq(decaAiJudgeRecordings.recordingType, "presentation"))).limit(1),
      database.select().from(decaAiJudgeWrittenSubmissions).where(eq(decaAiJudgeWrittenSubmissions.sessionId, session.id)).limit(1),
    ]);
    if (!recording) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A saved presentation recording is required before a recorded DECA Judge evaluation." });
    if (!writtenEntry?.parsedContent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Upload a readable written entry before requesting a Written Event evaluation." });
    if (recording.durationMs < 15_000) throw new TRPCError({ code: "BAD_REQUEST", message: "This recording is too short for a reliable presentation evaluation. Record a fuller presentation and try again." });
    await database.update(decaAiJudgeSessions).set({ status: "processing", recordingState: "processing", failureReason: null, updatedAt: new Date() }).where(eq(decaAiJudgeSessions.id, session.id));
    await database.update(decaAiJudgeRecordings).set({ uploadStatus: "processing" }).where(eq(decaAiJudgeRecordings.id, recording.id));
    try {
      const { url } = await storageGet(recording.storageKey);
      const acousticMetrics = await analyzeStoredRecording(url);
      const acousticConfidence = audioAnalysisConfidence(acousticMetrics);
      await database.insert(decaAiJudgeAcousticAnalyses).values({ recordingId: recording.id, metrics: acousticMetrics, confidence: String(acousticConfidence), analysisVersion: acousticMetrics.analysisVersion })
        .onDuplicateKeyUpdate({ set: { metrics: acousticMetrics, confidence: String(acousticConfidence), analysisVersion: acousticMetrics.analysisVersion, updatedAt: new Date() } });
      if (!acousticMetrics.available) throw new TRPCError({ code: "BAD_REQUEST", message: acousticMetrics.reason ?? "The saved recording could not support reliable delivery analysis." });
      const extracted = await extractAudioForTranscription(url);
      const derivativeKey = `ai-judge-recordings/${ctx.user.id}/${session.id}/derived-${randomUUID()}.mp3`;
      const { url: audioUrl } = await storagePut(derivativeKey, extracted.audio, extracted.contentType);
      const transcribed = await transcribeAudio({ audioUrl, language: "en", prompt: "Transcribe a student DECA Written Event presentation. Preserve business terms, recommendations, data, and numerical details where audible." });
      if ("error" in transcribed) throw new Error(`${transcribed.error}${transcribed.details ? `: ${transcribed.details}` : ""}`);
      const transcript = transcribed.text.trim();
      if (transcript.length < 40) throw new TRPCError({ code: "BAD_REQUEST", message: "The saved recording contained too little intelligible speech for a reliable presentation evaluation." });
      await database.insert(decaAiJudgeRecordingTranscripts).values({ recordingId: recording.id, rawTranscript: transcript, segments: transcribed.segments, language: transcribed.language ?? "en", provider: "whisper-1", confidence: String(acousticConfidence) })
        .onDuplicateKeyUpdate({ set: { rawTranscript: transcript, segments: transcribed.segments, language: transcribed.language ?? "en", provider: "whisper-1", confidence: String(acousticConfidence), updatedAt: new Date() } });
      const { ruleSet } = await ensureRuleSet();
      const response = await invokeLLM({ maxTokens: 8_000, messages: [{ role: "system", content: recordedJudgePrompt(ruleSet, writtenEntry.parsedContent, transcript) }, { role: "user", content: "Produce the evidence-bound written-event and presentation-content evaluation now." }], responseFormat: gradingOutputSchema });
      const rawContent = response.choices[0]?.message?.content;
      if (typeof rawContent !== "string") throw new Error("The AI Judge returned no structured result.");
      const modelResult = JSON.parse(rawContent) as { rubricItems: ModelRubricItem[]; strengths: string[]; priorityImprovements: string[]; unsupportedClaims: string[]; contradictions: string[]; missingEvidence: string[]; coachAnalytics: { organization: number; businessReasoning: number; evidenceSpecificity: number } };
      const combinedEvidence = `WRITTEN ENTRY\n${writtenEntry.parsedContent}\n\nPRESENTATION TRANSCRIPT\n${transcript}`;
      const score = calculateSafeRubricScore(ruleSet, modelResult.rubricItems, combinedEvidence);
      const sourceAvailability = { writtenEntry: true, originalRecording: true, audioDelivery: true, transcript: true, videoDelivery: false, visualDeliveryReason: recording.hasVideo ? "Video was preserved, but no validated visual-analysis service is enabled for this attempt." : "Camera delivery was not recorded." };
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
        coachAnalytics: { organization: clampAnalytics(modelResult.coachAnalytics.organization), businessReasoning: clampAnalytics(modelResult.coachAnalytics.businessReasoning), evidenceSpecificity: clampAnalytics(modelResult.coachAnalytics.evidenceSpecificity) },
        deliveryAnalysis: acousticMetrics,
        sourceAvailability,
        penaltyAssessment: "Not assessed automatically. Delivery coaching is separate from official-rubric content evidence.",
      };
      await database.update(decaAiJudgeRecordings).set({ uploadStatus: "uploaded" }).where(eq(decaAiJudgeRecordings.id, recording.id));
      await database.update(decaAiJudgeSessions).set({ rawTranscript: transcript, correctedTranscript: transcript, status: "completed", recordingState: "processing", sourceAvailability, observableScore: score.observablePoints, observableMaximumPoints: score.observableMaximumPoints, fullEstimatedScore: score.fullEstimatedScore, confidence: String(score.confidence), resultJson: result, modelMetadataJson: { model: response.model, promptVersion: `${PROMPT_VERSION}-media-v1`, audioAnalysisVersion: acousticMetrics.analysisVersion, auditedBy: "server-media-and-evidence-validator" }, failureReason: null, updatedAt: new Date() }).where(eq(decaAiJudgeSessions.id, session.id));
      return { sessionId: session.id, result };
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Recorded evaluation failed.";
      await database.update(decaAiJudgeSessions).set({ status: "failed", recordingState: error instanceof TRPCError ? "analysis_failed" : "grading_failed", failureReason: message, updatedAt: new Date() }).where(eq(decaAiJudgeSessions.id, session.id));
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your original recording and written entry are saved, but evaluation did not finish. Retry without recording again." });
    }
  }),

  getRecordedPlayback: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const { database, session } = await ownedSession(ctx.user.id, input.sessionId);
    const [recording] = await database.select().from(decaAiJudgeRecordings).where(and(eq(decaAiJudgeRecordings.sessionId, session.id), eq(decaAiJudgeRecordings.recordingType, "presentation"))).limit(1);
    if (!recording) throw new TRPCError({ code: "NOT_FOUND", message: "No saved presentation recording exists for this attempt." });
    const { url } = await storageGet(recording.storageKey);
    return { url, mimeType: recording.mimeType, durationMs: recording.durationMs, hasVideo: recording.hasVideo };
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
