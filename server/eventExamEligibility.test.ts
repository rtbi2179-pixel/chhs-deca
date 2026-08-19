import { describe, expect, it } from "vitest";
import { getEventExamGuidance } from "../client/src/lib/eventExamEligibility";

describe("event exam eligibility guidance", () => {
  it("maps an event with a DECA exam to its matching question-bank cluster", () => {
    expect(getEventExamGuidance("ACT")).toMatchObject({
      eventCode: "ACT",
      isTested: true,
      questionBankCluster: "Finance",
    });
  });

  it("marks written and project events as not tested", () => {
    expect(getEventExamGuidance("PMCA")).toMatchObject({
      eventCode: "PMCA",
      isTested: false,
      eventCluster: "Business Management",
    });
  });

  it("keeps tested Entrepreneurship events distinct when their exam has no core-bank match", () => {
    expect(getEventExamGuidance("ENT")).toMatchObject({
      eventCode: "ENT",
      isTested: true,
      eventCluster: "Entrepreneurship",
      questionBankCluster: undefined,
    });
  });
});
