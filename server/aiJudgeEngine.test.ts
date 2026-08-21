import { describe, expect, it } from "vitest";
import { calculateSafeRubricScore, formatTranscriptForJudge } from "./aiJudgeEngine";
import { DECA_AI_JUDGE_EVENT_REGISTRY, DECA_AI_JUDGE_LEGACY_EVENT_ALIASES, getVerifiedDecaAiJudgeRuleSet } from "../shared/decaAiJudgeRules";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("AI Judge scoring safeguards", () => {
  const ruleSet = getVerifiedDecaAiJudgeRuleSet("2026-2027", "EIP")!;
  const transcript = "Our reusable bottle targets college commuters who lack durable hydration options.\n\nWe will validate demand with a campus survey and launch a subscription refill partnership.";

  it("keeps only transcript-supported criteria in the observable score and never invents visual points", () => {
    const score = calculateSafeRubricScore(ruleSet, [
      { criterionId: "overview", assessability: "assessed", awardedPoints: 14, confidence: 0.86, evidence: [{ type: "transcript", reference: "[P01]", summary: "Defines the customer and problem." }], judgeComment: "Specific opening.", improvement: "Add market size." },
      { criterionId: "presentation_design", assessability: "assessed", awardedPoints: 5, confidence: 0.9, evidence: [{ type: "transcript", reference: "[P02]", summary: "Claims slides are clear." }], judgeComment: "Strong visuals.", improvement: "None." },
    ], transcript);

    expect(score.observablePoints).toBe(14);
    expect(score.observableMaximumPoints).toBe(85);
    expect(score.fullEstimatedScore).toBeNull();
    expect(score.items.find((item) => item.criterionId === "presentation_design")).toMatchObject({ assessability: "not_assessable", awardedPoints: 0, maximumPoints: 5 });
  });

  it("rejects model evidence that cannot be traced to a submitted transcript passage", () => {
    const score = calculateSafeRubricScore(ruleSet, [
      { criterionId: "overview", assessability: "assessed", awardedPoints: 15, confidence: 1, evidence: [{ type: "transcript", reference: "[P99]", summary: "Not in this transcript." }], judgeComment: "Unsupported.", improvement: "Use evidence." },
    ], transcript);
    expect(score.items.find((item) => item.criterionId === "overview")).toMatchObject({ assessability: "not_assessable", awardedPoints: 0 });
    expect(score.missingEvidence).toContain("Overview");
  });

  it("formats submitted transcript passages with auditable evidence identifiers", () => {
    expect(formatTranscriptForJudge(transcript)).toContain("[P01]");
    expect(formatTranscriptForJudge(transcript)).toContain("[P02]");
  });

  it("replaces the external iframe with a native evidence-bound workspace", () => {
    const page = readFileSync(resolve(process.cwd(), "client/src/pages/WrittenEventAI.tsx"), "utf8");
    expect(page).toContain("trpc.aiJudge.gradeTranscript.useMutation");
    expect(page).toContain("Evidence-bound practice feedback");
    expect(page).toContain("Not assessable from transcript");
    expect(page).toContain("Reuse transcript");
    expect(page).not.toContain("<iframe");
  });

  it("keeps unverified event entries out of scoring and preserves the EIP current-code alias", () => {
    expect(DECA_AI_JUDGE_EVENT_REGISTRY.find((event) => event.eventCode === "EIP")).toMatchObject({ verified: true, participantMin: 1, participantMax: 3 });
    expect(DECA_AI_JUDGE_EVENT_REGISTRY.find((event) => event.eventCode === "IMCP")).toMatchObject({ verified: false, participantMin: null, maximumPoints: null });
    expect(DECA_AI_JUDGE_LEGACY_EVENT_ALIASES.EIN).toBe("EIP");
  });
});
