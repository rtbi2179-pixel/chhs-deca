import { invokeLLM } from "./_core/llm";
import { calculateSafeRubricScore, formatTranscriptForJudge, type ModelRubricItem } from "./aiJudgeEngine";
import { getVerifiedDecaAiJudgeRuleSet } from "../shared/decaAiJudgeRules";

export const PORTFOLIO_EVALUATOR_PROMPT_VERSION = "blue-blazer-portfolio-evaluator-v1";
export const PORTFOLIO_INTEGRITY_PROMPT_VERSION = "blue-blazer-portfolio-integrity-v1";
export const PORTFOLIO_CALIBRATION_PROMPT_VERSION = "blue-blazer-portfolio-calibration-v1";

type IntegrityFinding = {
  findingType: "possible_ai_authorship" | "date_inconsistency" | "unsupported_claim" | "source_verification" | "numerical_inconsistency" | "internal_contradiction" | "potential_fabrication" | "format_compliance" | "possible_penalty";
  priority: "low" | "moderate" | "elevated" | "high";
  confidence: "low" | "medium" | "high";
  evidence: Array<{ reference: string; summary: string }>;
  explanation: string;
  alternativeExplanations: string[];
  advisorAction: string;
};

export type PortfolioAiResult = {
  ruleSet: NonNullable<ReturnType<typeof getVerifiedDecaAiJudgeRuleSet>>;
  rubricScores: unknown[];
  recommendedScore: number | null;
  observableMaximumPoints: number;
  piAnalysis: unknown[];
  complianceFindings: unknown[];
  sourceReview: Record<string, unknown>;
  quantitativeReview: Record<string, unknown>;
  versionComparison: Record<string, unknown>;
  competitiveReadiness: Record<string, unknown>;
  topPriorities: string[];
  pointsLeftOnTable: unknown[];
  integrityFindings: IntegrityFinding[];
  modelMetadata: Record<string, unknown>;
};

const rubricOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "blue_blazer_portfolio_rubric",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["rubricItems", "strengths", "topPriorities", "complianceFindings", "piAlignment", "sourceReview"],
      properties: {
        rubricItems: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["criterionId", "assessability", "awardedPoints", "confidence", "evidence", "judgeComment", "improvement"],
            properties: {
              criterionId: { type: "string" }, assessability: { type: "string", enum: ["assessed", "not_assessable"] }, awardedPoints: { type: "number" }, confidence: { type: "number" },
              evidence: { type: "array", items: { type: "object", additionalProperties: false, required: ["type", "reference", "summary"], properties: { type: { type: "string", enum: ["transcript"] }, reference: { type: "string" }, summary: { type: "string" } } } },
              judgeComment: { type: "string" }, improvement: { type: "string" },
            },
          },
        },
        strengths: { type: "array", items: { type: "string" } }, topPriorities: { type: "array", items: { type: "string" } },
        complianceFindings: { type: "array", items: { type: "string" } },
        piAlignment: { type: "array", items: { type: "object", additionalProperties: false, required: ["piId", "piText", "status", "evidence", "feedback"], properties: { piId: { type: "string" }, piText: { type: "string" }, status: { type: "string", enum: ["strong", "adequate", "developing", "not_demonstrated"] }, evidence: { type: "array", items: { type: "string" } }, feedback: { type: "string" } } } },
        sourceReview: { type: "object", additionalProperties: false, required: ["verified", "unverified", "conflicting"], properties: { verified: { type: "array", items: { type: "string" } }, unverified: { type: "array", items: { type: "string" } }, conflicting: { type: "array", items: { type: "string" } } } },
      },
    },
  },
};

const calibrationOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "blue_blazer_portfolio_calibration",
    strict: true,
    schema: { type: "object", additionalProperties: false, required: ["rubricItems", "calibrationNotes"], properties: { rubricItems: { type: "array", items: { type: "object", additionalProperties: false, required: ["criterionId", "awardedPoints", "rationale"], properties: { criterionId: { type: "string" }, awardedPoints: { type: "number" }, rationale: { type: "string" } } } }, calibrationNotes: { type: "array", items: { type: "string" } } } },
  },
};

const integrityOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "blue_blazer_portfolio_integrity",
    strict: true,
    schema: {
      type: "object", additionalProperties: false, required: ["overallPriority", "findings"],
      properties: {
        overallPriority: { type: "string", enum: ["low", "moderate", "elevated", "high"] },
        findings: { type: "array", items: { type: "object", additionalProperties: false, required: ["findingType", "priority", "confidence", "evidence", "explanation", "alternativeExplanations", "advisorAction"], properties: {
          findingType: { type: "string", enum: ["possible_ai_authorship", "date_inconsistency", "unsupported_claim", "source_verification", "numerical_inconsistency", "internal_contradiction", "potential_fabrication", "format_compliance", "possible_penalty"] },
          priority: { type: "string", enum: ["low", "moderate", "elevated", "high"] }, confidence: { type: "string", enum: ["low", "medium", "high"] },
          evidence: { type: "array", items: { type: "object", additionalProperties: false, required: ["reference", "summary"], properties: { reference: { type: "string" }, summary: { type: "string" } } } }, explanation: { type: "string" }, alternativeExplanations: { type: "array", items: { type: "string" } }, advisorAction: { type: "string" },
        } } },
      },
    },
  },
};

function parseResponse<T>(response: any, errorMessage: string): T {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error(errorMessage);
  return JSON.parse(content) as T;
}

function clampPoints(value: number, max: number) {
  return Math.min(max, Math.max(0, Math.round(value)));
}

function deterministicQuantitativeReview(content: string) {
  const values = Array.from(content.matchAll(/(?<![A-Za-z0-9])(?:\$\s*)?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:%|percent|units|customers|responses|dollars)?/gi)).slice(0, 80).map((match) => match[0].trim());
  return { extractedClaims: values, issues: [], note: "Numbers were extracted deterministically. Arithmetic or source support concerns are listed separately for advisor review." };
}

function rubricPrompt(ruleSet: NonNullable<ReturnType<typeof getVerifiedDecaAiJudgeRuleSet>>, evidenceText: string, piContext: string, checkpointContext: string) {
  const criteria = ruleSet.criteria.map((criterion) => `- ${criterion.id}: ${criterion.title}; max ${criterion.maximumPoints}; evidence focus: ${criterion.evidenceFocus}`).join("\n");
  return `You are the Blue Blazer DECA Prepared Event Portfolio Evaluator. Evaluate only the actual submission evidence below against the verified official rule set. You are helping an advisor; do not award encouragement points, invent an official requirement, calculate a final total, or treat formatting and length as substantive evidence. Every rubric item must cite submitted evidence references like [P01]. If evidence is absent, use not_assessable. Integrity concerns never affect rubric points.\n\nOfficial rule set: ${ruleSet.version}; event: ${ruleSet.eventName}; source: ${ruleSet.sourceVersion}.\nCriteria:\n${criteria}\n\nCheckpoint context:\n${checkpointContext}\n\nRelevant Performance Indicators (supplemental only; do not add official points):\n${piContext || "No event-specific PI source was supplied."}\n\nSubmitted evidence:\n${evidenceText}`;
}

function calibrationPrompt(ruleSet: NonNullable<ReturnType<typeof getVerifiedDecaAiJudgeRuleSet>>, evidenceText: string, rubricItems: unknown[]) {
  return `You are a second-pass DECA rubric calibration reviewer. Check whether each proposed point value is supported by the submitted evidence and official criterion maximum. Correct over-scoring and under-scoring, especially scores based only on polish or generic terms. Integrity concerns cannot change rubric scores. Return every criterion with a recommended numeric value and concise rationale.\n\nRule set: ${ruleSet.version}\nProposed rubric items:\n${JSON.stringify(rubricItems)}\n\nEvidence:\n${evidenceText}`;
}

function integrityPrompt(evidenceText: string, priorVersionEvidence: string | null, quantitativeReview: Record<string, unknown>) {
  return `You are the Blue Blazer DECA Portfolio Integrity Review assistant. You identify potential concerns for an advisor; you do not determine misconduct. Do not claim AI use with certainty or provide an AI-authorship probability. Use "Potential authorship concern — advisor review recommended" when warranted. Each finding must include evidence references and plausible alternative explanations. Metadata alone is never proof. Never change rubric scores.\n\nCurrent submission evidence:\n${evidenceText}\n\nPrevious-version evidence (may be absent):\n${priorVersionEvidence || "No earlier readable version is available."}\n\nDeterministic numerical extraction:\n${JSON.stringify(quantitativeReview)}`;
}

function createVersionComparison(currentItems: Array<{ criterionId: string; awardedPoints: number }>, previousScores: unknown) {
  const prior = Array.isArray(previousScores) ? previousScores as Array<{ criterionId?: string; awardedPoints?: number }> : [];
  const priorByCriterion = new Map(prior.filter((item) => typeof item.criterionId === "string" && typeof item.awardedPoints === "number").map((item) => [item.criterionId!, item.awardedPoints!]));
  return {
    available: prior.length > 0,
    criteria: currentItems.map((item) => ({ criterionId: item.criterionId, previousPoints: priorByCriterion.get(item.criterionId) ?? null, currentPoints: item.awardedPoints, pointChange: priorByCriterion.has(item.criterionId) ? item.awardedPoints - (priorByCriterion.get(item.criterionId) ?? 0) : null })),
  };
}

export async function evaluatePortfolioEvidence(input: {
  eventCode: string;
  season: string;
  submissionText: string;
  checkpointContext: string;
  piContext?: string;
  previousVersionText?: string | null;
  previousRubricScores?: unknown;
}) : Promise<PortfolioAiResult> {
  const ruleSet = getVerifiedDecaAiJudgeRuleSet(input.season, input.eventCode);
  if (!ruleSet) throw new Error(`No verified official DECA rubric is registered for ${input.eventCode}. Use advisor review until the current event evaluation form is verified.`);
  const evidenceText = formatTranscriptForJudge(input.submissionText.slice(0, 85_000));
  if (evidenceText.length < 120) throw new Error("The submitted file did not contain enough readable evidence for a reliable rubric evaluation.");
  const quantitativeReview = deterministicQuantitativeReview(input.submissionText);
  const rubricResponse = await invokeLLM({ model: "claude-opus-4-7", maxTokens: 8_000, messages: [{ role: "system", content: rubricPrompt(ruleSet, evidenceText, input.piContext || "", input.checkpointContext) }, { role: "user", content: "Produce the evidence-bound portfolio rubric evaluation now." }], responseFormat: rubricOutputSchema });
  const rubricOutput = parseResponse<{ rubricItems: ModelRubricItem[]; strengths: string[]; topPriorities: string[]; complianceFindings: string[]; piAlignment: unknown[]; sourceReview: Record<string, unknown> }>(rubricResponse, "The portfolio evaluator returned no structured rubric result.");
  const initialSafe = calculateSafeRubricScore(ruleSet, rubricOutput.rubricItems, input.submissionText);
  const calibrationResponse = await invokeLLM({ model: "claude-sonnet-4-6", maxTokens: 4_096, thinking: { type: "enabled", budget_tokens: 2_048 }, messages: [{ role: "system", content: calibrationPrompt(ruleSet, evidenceText, initialSafe.items) }, { role: "user", content: "Run the independent score consistency pass now." }], responseFormat: calibrationOutputSchema });
  const calibration = parseResponse<{ rubricItems: Array<{ criterionId: string; awardedPoints: number; rationale: string }>; calibrationNotes: string[] }>(calibrationResponse, "The score-calibration pass returned no structured result.");
  const calibrationByCriterion = new Map(calibration.rubricItems.map((item) => [item.criterionId, item]));
  const calibratedItems = initialSafe.items.map((item) => ({ ...item, awardedPoints: item.assessability === "assessed" ? clampPoints(calibrationByCriterion.get(item.criterionId)?.awardedPoints ?? item.awardedPoints, item.maximumPoints) : 0, calibrationNote: calibrationByCriterion.get(item.criterionId)?.rationale ?? null }));
  const recommendedScore = calibratedItems.every((item) => item.assessability === "assessed") ? calibratedItems.reduce((total, item) => total + item.awardedPoints, 0) : null;
  const integrityResponse = await invokeLLM({ model: "claude-sonnet-4-6", maxTokens: 4_096, thinking: { type: "enabled", budget_tokens: 2_048 }, messages: [{ role: "system", content: integrityPrompt(evidenceText, input.previousVersionText ? formatTranscriptForJudge(input.previousVersionText.slice(0, 30_000)) : null, quantitativeReview) }, { role: "user", content: "Return potential concerns for an advisor only. Do not alter scoring." }], responseFormat: integrityOutputSchema });
  const integrity = parseResponse<{ overallPriority: string; findings: IntegrityFinding[] }>(integrityResponse, "The integrity review returned no structured result.");
  const pointsLeftOnTable = calibratedItems.filter((item) => item.assessability === "assessed" && item.awardedPoints < item.maximumPoints).sort((a, b) => (b.maximumPoints - b.awardedPoints) - (a.maximumPoints - a.awardedPoints)).slice(0, 5).map((item) => ({ criterionId: item.criterionId, criterionName: item.title, pointsAvailable: item.maximumPoints - item.awardedPoints, improvement: item.improvement }));
  return {
    ruleSet,
    rubricScores: calibratedItems,
    recommendedScore,
    observableMaximumPoints: initialSafe.observableMaximumPoints,
    piAnalysis: rubricOutput.piAlignment.slice(0, 15),
    complianceFindings: rubricOutput.complianceFindings.slice(0, 10),
    sourceReview: rubricOutput.sourceReview,
    quantitativeReview,
    versionComparison: createVersionComparison(calibratedItems, input.previousRubricScores),
    competitiveReadiness: { scope: "planning_support", writtenProject: recommendedScore === null ? "partially_observable" : "observable", note: "Portfolio scoring is one advisor planning signal and is displayed alongside presentation, PI mastery, checkpoint completion, and practice data." },
    topPriorities: Array.from(new Set([...rubricOutput.topPriorities, ...pointsLeftOnTable.map((item) => String(item.improvement))])).filter(Boolean).slice(0, 5),
    pointsLeftOnTable,
    integrityFindings: integrity.findings.slice(0, 12),
    modelMetadata: { evaluatorModel: rubricResponse.model || "claude-opus-4-7", evaluatorPromptVersion: PORTFOLIO_EVALUATOR_PROMPT_VERSION, calibrationModel: calibrationResponse.model || "claude-sonnet-4-6", calibrationPromptVersion: PORTFOLIO_CALIBRATION_PROMPT_VERSION, integrityModel: integrityResponse.model || "claude-sonnet-4-6", integrityPromptVersion: PORTFOLIO_INTEGRITY_PROMPT_VERSION, ruleSetVersion: ruleSet.version, integrityOverallPriority: integrity.overallPriority, calibrationNotes: calibration.calibrationNotes.slice(0, 5), auditedBy: "server-evidence-validator" },
  };
}
