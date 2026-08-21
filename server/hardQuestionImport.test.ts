import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mapUploadedQuestion } from "./questionBankImport";

describe("hard-question import contract", () => {
  const importer = readFileSync(resolve(process.cwd(), "server/scripts/importHardQuestionDataset.mjs"), "utf8");

  it("maps the uploaded hard-question shape into the persisted practice-question fields", () => {
    expect(mapUploadedQuestion({ id: "MKT-11000", cluster: "Marketing", instructional_area: "Market Planning", performance_indicator_focus: "Apply situation analysis", cognitive_level: "Analysis", difficulty: "Hard", stem: "A valid DECA-style scenario prompt.", options: { A: "First", B: "Second", C: "Third", D: "Fourth" }, correct: "B", rationale: "Second is correct.", distractor_rationales: { A: "Not first.", C: "Not third.", D: "Not fourth." }, concept_tag: "situation analysis", source_status: "Original practice item" })).toMatchObject({ id: "MKT-11000", difficulty: "Hard", correctAnswer: "B", optionB: "Second" });
  });

  it("requires 11,000 valid hard records, a target-only backup, and idempotent upserts", () => {
    expect(importer).toContain("raw.questions.length !== 11_000");
    expect(importer).toContain("questions_backup_before_hard_20260821");
    expect(importer).toContain("ON DUPLICATE KEY UPDATE");
    expect(importer).toContain("Expected all 11,000 IDs to exist");
    expect(importer).toContain("Post-import verification");
  });
});
