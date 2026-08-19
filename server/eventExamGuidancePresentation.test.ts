import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSource = (...segments: string[]) => readFileSync(path.join(projectRoot, ...segments), "utf8");

describe("event-aware assessment guidance presentation", () => {
  it("labels the matching Practice Questions cluster and explains non-exam events", () => {
    const practiceQuestions = readSource("client", "src", "pages", "PracticeQuestions.tsx");

    expect(practiceQuestions).toContain("getEventExamGuidance");
    expect(practiceQuestions).toContain("Tested for ${eventExamGuidance.eventCode}");
    expect(practiceQuestions).toContain("is not tested.");
    expect(practiceQuestions).toContain("data-event-exam-guidance");
  });

  it("labels the matching Mock Exam cluster and shows the non-exam-event notice at setup", () => {
    const mockExams = readSource("client", "src", "pages", "ChapterMockExam.tsx");

    expect(mockExams).toContain("getEventExamGuidance");
    expect(mockExams).toContain("Tested for {eventExamGuidance.eventCode}");
    expect(mockExams).toContain("data-event-exam-notice");
    expect(mockExams).toContain("is not tested.");
  });
});
