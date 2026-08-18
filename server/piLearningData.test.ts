import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dataRoot = "/home/ubuntu/pi-package-review/blue_blazer_pi_quizlet_complete/seed-data/blue_blazer_pi_mastery_modules";

type SourceModule = {
  vocabulary: unknown[];
  flashcards: unknown[];
  quick_review: { questions: unknown[]; answers: unknown[] };
  quiz: unknown[];
  scenario_challenges: unknown[];
  teach_back: { student_prompt: string };
  ai_coach: { recommended_next_pi: string };
};

describe.skip("complete PI learning-module package", () => {
  it("keeps the required learning activities on a representative source module", async () => {
    const source = await readFile(path.join(dataRoot, "marketing", "marketing-0001-0100.json"), "utf8");
    const [module] = JSON.parse(source) as SourceModule[];

    expect(module.vocabulary).toHaveLength(10);
    expect(module.flashcards).toHaveLength(20);
    expect(module.quick_review.questions).toHaveLength(10);
    expect(module.quick_review.answers).toHaveLength(10);
    expect(module.quiz).toHaveLength(15);
    expect(module.scenario_challenges).toHaveLength(3);
    expect(module.teach_back.student_prompt.length).toBeGreaterThan(20);
    expect(module.ai_coach.recommended_next_pi.length).toBeGreaterThan(0);
  });

  it("reports all seven required cluster counts in the supplied manifest", async () => {
    const manifestText = await readFile(path.join(dataRoot, "manifest.json"), "utf8");
    const manifest = JSON.parse(manifestText) as { total_modules: number; cluster_counts: Record<string, number> };

    expect(manifest.total_modules).toBe(2772);
    expect(manifest.cluster_counts).toEqual({
      "Business Administration Core": 363,
      "Business Management & Administration": 445,
      "Entrepreneurship": 246,
      "Finance": 420,
      "Hospitality & Tourism": 571,
      "Marketing": 521,
      "Personal Financial Literacy": 206,
    });
  });
});
