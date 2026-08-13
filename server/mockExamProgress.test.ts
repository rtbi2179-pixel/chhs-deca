import { describe, expect, it } from "vitest";
import { calculateMockExamProgress } from "./mockExamProgress";

describe("Chapter Mock Exam progress", () => {
  it("counts only questions with a saved answer rather than all session questions", () => {
    expect(calculateMockExamProgress([
      { userAnswer: "A", isCorrect: 1 },
      { userAnswer: "B", isCorrect: 0 },
      { userAnswer: null, isCorrect: null },
      { userAnswer: null, isCorrect: null },
    ])).toEqual({ questionsAnswered: 2, correctAnswers: 1 });
  });
});
