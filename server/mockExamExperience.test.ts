import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const mockExamPage = () => readFileSync(join(process.cwd(), "client/src/pages/ChapterMockExam.tsx"), "utf8");
const mockExamRouter = () => readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");

describe("Chapter Mock Exam enhanced experience", () => {
  it("renders a direct 100-question navigator with answered and unanswered status", () => {
    const page = mockExamPage();
    expect(page).toContain("Question navigator");
    expect(page).toContain('aria-label="All mock exam questions"');
    expect(page).toContain("questions.map((item, index)");
    expect(page).toContain("answeredQuestionIds.size");
    expect(page).toContain("Question {currentIndex + 1} of {exam.totalQuestions}");
  });

  it("communicates preparation progress while the complete question set is created", () => {
    const page = mockExamPage();
    expect(page).toContain("Preparing your 100-question exam");
    expect(page).toContain("Question set preparation");
    expect(page).toContain("setPreparationProgress");
    expect(page).toContain("The exam opens once the complete, balanced 100-question session is ready.");
  });

  it("shows hierarchical concept and PI results plus the targeted study guide", () => {
    const page = mockExamPage();
    expect(page).toContain("Concept and PI accuracy");
    expect(page).toContain("Performance Indicators");
    expect(page).toContain("Practice your priority PIs");
    expect(page).toContain("PIs below 60% accuracy are prioritized here.");
  });

  it("builds study-guide questions only for underperforming PIs in the completed session cluster", () => {
    const router = mockExamRouter();
    expect(router).toContain("const piNames = analysis.underperformingPIs.map");
    expect(router).toContain("eq(questions.cluster, session.cluster)");
    expect(router).toContain("inArray(questions.performanceIndicatorFocus, piNames)");
    expect(router).toContain("!sessionQuestionIds.has(question.id)");
    expect(router).toContain("return { session, ...analysis, studyGuide }");
  });
});
