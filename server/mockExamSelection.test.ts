import { describe, expect, it } from "vitest";
import { selectBalancedMockExam } from "./mockExamSelection";

describe("Chapter Mock Exam selection", () => {
  it("builds a 100-question DECA-style 25/50/25 difficulty mix without duplicates", () => {
    const bank = ["Easy", "Medium", "Hard"].flatMap((difficulty) =>
      Array.from({ length: 120 }, (_, index) => ({ id: `${difficulty}-${index}`, difficulty }))
    );
    const exam = selectBalancedMockExam(bank);
    expect(exam).toHaveLength(100);
    expect(new Set(exam.map(question => question.id)).size).toBe(100);
    expect(exam.filter(question => question.difficulty === "Easy")).toHaveLength(25);
    expect(exam.filter(question => question.difficulty === "Medium")).toHaveLength(50);
    expect(exam.filter(question => question.difficulty === "Hard")).toHaveLength(25);
  });
});
