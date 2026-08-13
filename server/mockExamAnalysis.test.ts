import { describe, expect, it } from "vitest";
import { analyzeMockExamResults } from "./mockExamAnalysis";

describe("Chapter Mock Exam analysis", () => {
  it("identifies the lowest-accuracy instructional area and an associated PI to study", () => {
    const report = analyzeMockExamResults([
      { instructionalArea: "Promotion", performanceIndicatorFocus: "Explain promotional mix", isCorrect: false },
      { instructionalArea: "Promotion", performanceIndicatorFocus: "Explain promotional mix", isCorrect: false },
      { instructionalArea: "Selling", performanceIndicatorFocus: "Determine customer needs", isCorrect: true },
      { instructionalArea: "Selling", performanceIndicatorFocus: "Determine customer needs", isCorrect: true },
    ]);
    expect(report.accuracy).toBe(50);
    expect(report.recommendation).toMatchObject({ instructionalArea: "Promotion", accuracy: 0, recommendedPI: "Explain promotional mix" });
  });
});
