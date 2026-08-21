import { invokeLLM } from "./_core/llm";
import type { AcousticMetrics } from "./mediaAnalysis";

export const ROLEPLAY_PROMPT_VERSION = "blue-blazer-roleplay-evaluator-v1";

export type PerformanceLevel = "Exceptional" | "Strong" | "Adequate" | "Developing" | "Minimal" | "Not Demonstrated";

export type ScenarioPi = {
  moduleId: number;
  piId: string;
  performanceIndicator: string;
  instructionalArea: string;
};

export type ScoredPi = ScenarioPi & {
  level: PerformanceLevel;
  score: number;
  evidenceQuotes: string[];
  evaluation: string;
  improvement: string;
};

const PERFORMANCE_LEVEL_VALUES: Record<PerformanceLevel, number> = {
  "Exceptional": 100,
  "Strong": 82,
  "Adequate": 65,
  "Developing": 45,
  "Minimal": 25,
  "Not Demonstrated": 0,
};

const VALID_LEVELS = new Set<PerformanceLevel>(Object.keys(PERFORMANCE_LEVEL_VALUES) as PerformanceLevel[]);

export function performanceLevelForScore(score: number): PerformanceLevel {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Adequate";
  if (score >= 40) return "Developing";
  if (score >= 15) return "Minimal";
  return "Not Demonstrated";
}

function normalized(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function transcriptHasQuote(transcript: string, quote: string) {
  const candidate = normalized(quote);
  return candidate.length >= 8 && normalized(transcript).includes(candidate);
}

function clampText(value: unknown, fallback: string, max = 600) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function validEvidence(transcript: string, quotes: unknown) {
  if (!Array.isArray(quotes)) return [];
  return quotes
    .filter((quote): quote is string => typeof quote === "string")
    .map((quote) => quote.trim().slice(0, 320))
    .filter((quote) => transcriptHasQuote(transcript, quote))
    .slice(0, 2);
}

export function calculateSafeRoleplayScore(
  expectedPis: ScenarioPi[],
  transcript: string,
  rawItems: unknown,
) {
  const byPiId = new Map(
    Array.isArray(rawItems)
      ? rawItems.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => [item.piId, item])
        .filter(([piId]) => typeof piId === "string") as Array<[string, Record<string, unknown>]>
      : [],
  );

  const piScores: ScoredPi[] = expectedPis.map((pi) => {
    const raw = byPiId.get(pi.piId);
    const requestedLevel = raw?.level;
    const level = typeof requestedLevel === "string" && VALID_LEVELS.has(requestedLevel as PerformanceLevel)
      ? requestedLevel as PerformanceLevel
      : "Not Demonstrated";
    const evidenceQuotes = validEvidence(transcript, raw?.evidenceQuotes);
    const evidenceRequired = level !== "Not Demonstrated";
    const safeLevel: PerformanceLevel = evidenceRequired && evidenceQuotes.length === 0 ? "Not Demonstrated" : level;
    return {
      ...pi,
      level: safeLevel,
      score: PERFORMANCE_LEVEL_VALUES[safeLevel],
      evidenceQuotes,
      evaluation: clampText(raw?.evaluation, "No verifiable evidence for this performance indicator was found in the submitted transcript."),
      improvement: clampText(raw?.improvement, "State a specific recommendation, explain the business reasoning, and apply it directly to the scenario."),
    };
  });

  const overallScore = piScores.length
    ? Math.round(piScores.reduce((total, item) => total + item.score, 0) / piScores.length)
    : 0;

  return {
    piScores,
    overallScore,
    performanceLevel: performanceLevelForScore(overallScore),
  };
}

export function buildDeliveryAnalysis(transcript: string, durationSeconds: number, acoustic?: AcousticMetrics) {
  const safeAcoustic: AcousticMetrics = acoustic ?? {
    available: false,
    source: "unavailable",
    durationSeconds,
    speakingSeconds: 0,
    silenceSeconds: 0,
    silencePercentage: 0,
    pauseCount: 0,
    averagePauseMs: 0,
    longestPauseMs: 0,
    averageLoudnessDbfs: null,
    loudnessVariationDb: null,
    clippingPercentage: 0,
    analysisVersion: "legacy-transcript-only",
    reason: "This legacy attempt has no saved recording waveform available for delivery analysis.",
  };
  const words = transcript.match(/[A-Za-z0-9’'-]+/g) ?? [];
  const speakingMinutes = Math.max(safeAcoustic.speakingSeconds / 60, 0.1);
  const paceWpm = safeAcoustic.available ? Math.round(words.length / speakingMinutes) : null;
  const fillerMatches = transcript.match(/\b(um|uh|like|you know|basically|actually)\b/gi) ?? [];
  const wordFrequency = new Map<string, number>();
  words.map((word) => word.toLowerCase()).filter((word) => word.length > 5).forEach((word) => {
    wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
  });
  const repeatedTerms = Array.from(wordFrequency.entries())
    .filter(([, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, count]) => ({ word, count }));
  const paceBand = paceWpm === null ? "unavailable" : paceWpm < 105 ? "measured" : paceWpm <= 165 ? "conversational" : "fast";

  return {
    source: acoustic ? (safeAcoustic.available ? "stored_recording_waveform_and_transcript" : "recording_analysis_unavailable") : "transcript_and_recording_duration",
    wordCount: words.length,
    durationSeconds,
    paceWordsPerMinute: paceWpm,
    paceBand,
    fillerWordCount: fillerMatches.length,
    repeatedTerms,
    speakingSeconds: safeAcoustic.speakingSeconds,
    silenceSeconds: safeAcoustic.silenceSeconds,
    silencePercentage: safeAcoustic.silencePercentage,
    pauseCount: safeAcoustic.pauseCount,
    averagePauseMs: safeAcoustic.averagePauseMs,
    longestPauseMs: safeAcoustic.longestPauseMs,
    averageLoudnessDbfs: safeAcoustic.averageLoudnessDbfs,
    loudnessVariationDb: safeAcoustic.loudnessVariationDb,
    clippingPercentage: safeAcoustic.clippingPercentage,
    analysisAvailable: safeAcoustic.available,
    analysisReason: safeAcoustic.reason ?? null,
    timeUse: !safeAcoustic.available ? "Delivery analysis is unavailable because reliable acoustic evidence could not be derived from the saved recording." : durationSeconds < 90 ? "Very short recorded response; the judge may have received limited support and application." : "Time use was measured from the submitted recording.",
    limitations: "This coaching analysis does not affect the DECA practice score. It uses saved-recording waveform metrics for pacing, pauses, silence, and loudness. It does not infer eye contact, gestures, appearance, or internal confidence.",
  };
}

const evaluationResponseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "blue_blazer_roleplay_pi_evaluation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        piEvaluations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              piId: { type: "string" },
              level: { type: "string", enum: ["Exceptional", "Strong", "Adequate", "Developing", "Minimal", "Not Demonstrated"] },
              evidenceQuotes: { type: "array", items: { type: "string" } },
              evaluation: { type: "string" },
              improvement: { type: "string" },
            },
            required: ["piId", "level", "evidenceQuotes", "evaluation", "improvement"],
            additionalProperties: false,
          },
        },
        strengths: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
      },
      required: ["piEvaluations", "strengths", "improvements"],
      additionalProperties: false,
    },
  },
};

function buildEvaluationPrompt(input: {
  eventName: string;
  eventCode: string;
  trainingMode: string;
  scenario: { participantRole: string; judgeRole: string; companyContext: string; situation: string; task: string };
  pis: ScenarioPi[];
  transcript: string;
}) {
  return [
    "You are Blue Blazer's evidence-bound DECA roleplay practice evaluator. You are not an official DECA judge and must not claim official authority.",
    `Evaluate a ${input.trainingMode} practice performance for ${input.eventName} (${input.eventCode}).`,
    "Treat this as a business roleplay evaluation. Award an indicator level only when the transcript contains concrete, scenario-specific evidence. A PI name, jargon, or vague claim without explanation and application is weak evidence.",
    "Be calibrated and conservative. Do not reward presentation polish, encouragement, delivery, eye contact, gestures, appearance, or assumptions. Do not calculate a final score; the server does that deterministically from PI levels.",
    "Every evidence quote must be an exact excerpt from the transcript, at least eight characters long. If no such excerpt exists, use Not Demonstrated and an empty evidence array.",
    `Participant role: ${input.scenario.participantRole}\nJudge role: ${input.scenario.judgeRole}\nCompany: ${input.scenario.companyContext}\nSituation: ${input.scenario.situation}\nTask: ${input.scenario.task}`,
    "Score exactly these performance indicators, one item each:\n" + input.pis.map((pi) => `${pi.piId}: ${pi.performanceIndicator} (${pi.instructionalArea})`).join("\n"),
    "Transcript:\n" + input.transcript,
  ].join("\n\n");
}

export async function evaluateRoleplayTranscript(input: {
  eventName: string;
  eventCode: string;
  trainingMode: string;
  scenario: { participantRole: string; judgeRole: string; companyContext: string; situation: string; task: string };
  pis: ScenarioPi[];
  transcript: string;
  durationSeconds: number;
  acousticMetrics: AcousticMetrics;
}) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await invokeLLM({
        maxTokens: 4_800,
        messages: [
          { role: "system", content: buildEvaluationPrompt(input) },
          { role: "user", content: "Return the strict structured evaluation now." },
        ],
        responseFormat: evaluationResponseFormat,
      });
      const content = response.choices[0]?.message?.content;
      if (typeof content !== "string") throw new Error("Roleplay evaluator returned no structured content.");
      const parsed = JSON.parse(content) as { piEvaluations: unknown; strengths: unknown; improvements: unknown };
      const score = calculateSafeRoleplayScore(input.pis, input.transcript, parsed.piEvaluations);
      return {
        ...score,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 360)).slice(0, 3) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 360)).slice(0, 3) : [],
        deliveryAnalysis: buildDeliveryAnalysis(input.transcript, input.durationSeconds, input.acousticMetrics),
        modelMetadata: { model: response.model, promptVersion: ROLEPLAY_PROMPT_VERSION, evaluationAttempt: attempt + 1, scoring: "server-deterministic-equal-weighted-pi-levels", acousticEvidence: input.acousticMetrics.available ? "stored_recording_waveform" : "unavailable" },
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Roleplay evaluation could not be completed.");
}
