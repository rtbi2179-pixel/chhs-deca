import { describe, expect, it } from "vitest";
import { selectBalancedMockExam, selectClusterMockExam } from "./mockExamSelection";

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

  it("never pulls questions outside the selected career cluster", () => {
    const marketing = ["Easy", "Medium", "Hard"].flatMap((difficulty) =>
      Array.from({ length: 120 }, (_, index) => ({ id: `marketing-${difficulty}-${index}`, difficulty, cluster: "Marketing" }))
    );
    const finance = ["Easy", "Medium", "Hard"].flatMap((difficulty) =>
      Array.from({ length: 120 }, (_, index) => ({ id: `finance-${difficulty}-${index}`, difficulty, cluster: "Finance" }))
    );

    const exam = selectClusterMockExam([...marketing, ...finance], "Marketing");
    expect(exam).toHaveLength(100);
    expect(exam.every((question) => question.cluster === "Marketing")).toBe(true);
    expect(exam.filter((question) => question.difficulty === "Easy")).toHaveLength(25);
    expect(exam.filter((question) => question.difficulty === "Medium")).toHaveLength(50);
    expect(exam.filter((question) => question.difficulty === "Hard")).toHaveLength(25);
  });
});
