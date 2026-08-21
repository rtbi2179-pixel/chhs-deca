import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { conciseMainIdeas } from "./piLearningRouter";

describe("simplified PI Library modules", () => {
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/PIQuizlet.tsx"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/piLearningRouter.ts"), "utf8");
  const alternateViewer = readFileSync(resolve(process.cwd(), "client/src/components/PILearning/PIModuleViewer.tsx"), "utf8");

  it("keeps only an introductory statement and Big Idea in theory content", () => {
    const lesson = "This PI explains the core business skill.\n\nBig Idea: Use the skill to make a clear business decision.\n\nBusiness example: This longer example should not appear.\n\nCompetition tip: This should not appear either.";
    expect(conciseMainIdeas(lesson)).toBe("This PI explains the core business skill.\n\nBig Idea: Use the skill to make a clear business decision.");
  });

  it("retains only main ideas, flashcards, quizzes, and scenarios in both PI module views", () => {
    expect(page).toContain('label: "Main ideas"');
    expect(page).toContain('label: "Flashcards"');
    expect(page).toContain('label: "Quiz"');
    expect(page).toContain('label: "Scenarios"');
    expect(page).not.toContain('id: "vocabulary"');
    expect(page).not.toContain('id: "quick-review"');
    expect(page).not.toContain('id: "related"');
    expect(page).not.toContain('id: "teach-back"');
    expect(alternateViewer).toContain("RETAINED_SECTION_TYPES");
    expect(alternateViewer).not.toContain('vocabulary:');
    expect(alternateViewer).not.toContain('ai_coach_feedback:');
  });

  it("bases mastery on retained practice and removes the discontinued teach-back endpoint", () => {
    expect(router).toContain("theory: 15");
    expect(router).toContain("flashcards: 25");
    expect(router).toContain("quiz: 40");
    expect(router).toContain("scenario_challenge: 20");
    expect(router).toContain("conciseMainIdeas(rawContent)");
    expect(router).toContain("RETAINED_SECTION_TYPES");
    expect(router).toContain("This PI activity is no longer available.");
    expect(router).not.toContain("submitTeachBack:");
  });
});
