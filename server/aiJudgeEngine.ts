import type { DecaAiJudgeRuleSet } from "../shared/decaAiJudgeRules";

export type EvidenceReference = {
  type: "transcript";
  reference: string;
  summary: string;
};

export type ModelRubricItem = {
  criterionId: string;
  assessability: "assessed" | "not_assessable";
  awardedPoints: number;
  confidence: number;
  evidence: EvidenceReference[];
  judgeComment: string;
  improvement: string;
};

export type SafeRubricItem = ModelRubricItem & {
  title: string;
  maximumPoints: number;
  assessabilityReason?: string;
};

export type ScoreSummary = {
  items: SafeRubricItem[];
  observablePoints: number;
  observableMaximumPoints: number;
  fullEstimatedScore: number | null;
  confidence: number;
  missingEvidence: string[];
};

export function createTranscriptEvidenceMap(transcript: string) {
  return transcript
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z])/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 80)
    .map((part, index) => ({ reference: `[P${String(index + 1).padStart(2, "0")}]`, text: part }));
}

export function formatTranscriptForJudge(transcript: string) {
  return createTranscriptEvidenceMap(transcript).map(({ reference, text }) => `${reference} ${text}`).join("\n\n");
}

function isKnownEvidenceReference(reference: string, validReferences: Set<string>) {
  return Array.from(validReferences).some((allowed) => reference.includes(allowed));
}

/** Applies rule-set maximums in code and never accepts model-defined point caps. */
export function calculateSafeRubricScore(
  ruleSet: DecaAiJudgeRuleSet,
  modelItems: readonly ModelRubricItem[],
  transcript: string,
): ScoreSummary {
  const evidenceReferences = new Set(createTranscriptEvidenceMap(transcript).map((item) => item.reference));
  const modelByCriterion = new Map(modelItems.map((item) => [item.criterionId, item]));
  const missingEvidence: string[] = [];
  const items = ruleSet.criteria.map((criterion): SafeRubricItem => {
    const modelItem = modelByCriterion.get(criterion.id);
    if (!criterion.assessableFromTranscript) {
      return {
        criterionId: criterion.id,
        title: criterion.title,
        maximumPoints: criterion.maximumPoints,
        assessability: "not_assessable",
        awardedPoints: 0,
        confidence: 0,
        evidence: [],
        judgeComment: "This criterion needs audio, slides, or video and is not scored from a transcript alone.",
        improvement: `Provide the appropriate media evidence to assess ${criterion.title.toLowerCase()}.`,
        assessabilityReason: criterion.evidenceFocus,
      };
    }
    if (!modelItem || modelItem.assessability !== "assessed") {
      missingEvidence.push(criterion.title);
      return {
        criterionId: criterion.id,
        title: criterion.title,
        maximumPoints: criterion.maximumPoints,
        assessability: "not_assessable",
        awardedPoints: 0,
        confidence: 0,
        evidence: [],
        judgeComment: "No specific transcript evidence was identified for this criterion.",
        improvement: `State and support the ${criterion.title.toLowerCase()} with a specific claim, rationale, or example.`,
      };
    }
    const validEvidence = modelItem.evidence.filter((evidence) => isKnownEvidenceReference(evidence.reference, evidenceReferences));
    if (validEvidence.length === 0) {
      missingEvidence.push(criterion.title);
      return {
        criterionId: criterion.id,
        title: criterion.title,
        maximumPoints: criterion.maximumPoints,
        assessability: "not_assessable",
        awardedPoints: 0,
        confidence: 0,
        evidence: [],
        judgeComment: "The proposed evidence could not be traced to a submitted transcript passage.",
        improvement: `Make the support for ${criterion.title.toLowerCase()} explicit in the presentation.`,
      };
    }
    return {
      criterionId: criterion.id,
      title: criterion.title,
      maximumPoints: criterion.maximumPoints,
      assessability: "assessed",
      awardedPoints: Math.min(criterion.maximumPoints, Math.max(0, Math.round(modelItem.awardedPoints))),
      confidence: Math.min(1, Math.max(0, modelItem.confidence)),
      evidence: validEvidence,
      judgeComment: modelItem.judgeComment,
      improvement: modelItem.improvement,
    };
  });
  const observableItems = items.filter((item) => item.assessability === "assessed");
  const observablePoints = observableItems.reduce((total, item) => total + item.awardedPoints, 0);
  const observableMaximumPoints = ruleSet.criteria.filter((criterion) => criterion.assessableFromTranscript).reduce((total, criterion) => total + criterion.maximumPoints, 0);
  return {
    items,
    observablePoints,
    observableMaximumPoints,
    fullEstimatedScore: items.every((item) => item.assessability === "assessed") ? observablePoints : null,
    confidence: observableItems.length ? Number((observableItems.reduce((total, item) => total + item.confidence, 0) / observableItems.length).toFixed(2)) : 0,
    missingEvidence,
  };
}
