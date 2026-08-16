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

  it("reports a nested concept-to-PI accuracy breakdown and prioritizes only PIs below 60%", () => {
    const report = analyzeMockExamResults([
      { instructionalArea: "Promotion", performanceIndicatorFocus: "Explain promotional mix", isCorrect: false },
      { instructionalArea: "Promotion", performanceIndicatorFocus: "Explain promotional mix", isCorrect: true },
      { instructionalArea: "Promotion", performanceIndicatorFocus: "Determine promotional channel", isCorrect: false },
      { instructionalArea: "Selling", performanceIndicatorFocus: "Determine customer needs", isCorrect: true },
      { instructionalArea: "Selling", performanceIndicatorFocus: "Determine customer needs", isCorrect: true },
    ]);

    expect(report.instructionalAreas).toMatchObject([
      {
        instructionalArea: "Promotion",
        attempted: 3,
        correct: 1,
        accuracy: 33,
        performanceIndicators: [
          { performanceIndicator: "Determine promotional channel", attempted: 1, correct: 0, accuracy: 0 },
          { performanceIndicator: "Explain promotional mix", attempted: 2, correct: 1, accuracy: 50 },
        ],
      },
      {
        instructionalArea: "Selling",
        attempted: 2,
        correct: 2,
        accuracy: 100,
      },
    ]);
    expect(report.underperformingPIs).toEqual([
      expect.objectContaining({ performanceIndicator: "Determine promotional channel", accuracy: 0 }),
      expect.objectContaining({ performanceIndicator: "Explain promotional mix", accuracy: 50 }),
    ]);
  });

  it("does not create a study priority from questions without a tagged PI", () => {
    const report = analyzeMockExamResults([
      { instructionalArea: "Business Law", performanceIndicatorFocus: null, isCorrect: false },
    ]);

    expect(report.instructionalAreas[0]).toMatchObject({
      instructionalArea: "Business Law",
      performanceIndicators: [{ performanceIndicator: "No PI tagged", accuracy: 0 }],
    });
    expect(report.underperformingPIs).toEqual([]);
  });
});
