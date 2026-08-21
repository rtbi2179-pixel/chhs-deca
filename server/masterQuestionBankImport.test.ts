import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("50,000-record master question bank import contract", () => {
  const importer = readFileSync(resolve(process.cwd(), "server/scripts/replaceWithMasterQuestionBank.mjs"), "utf8");

  it("requires unique combined IDs and the declared core plus hard-tier structure", () => {
    expect(importer).toContain("bank.questions.length !== 50_000");
    expect(importer).toContain("coreRows.length !== 39_000 || hardRows.length !== 11_000");
    expect(importer).toContain("Combined question identifiers must be unique");
    expect(importer).toContain("question?.combined_id");
  });

  it("backs up prior questions and remaps historical references before the full replacement", () => {
    expect(importer).toContain("questions_backup_before_master_50000_20260821");
    expect(importer).toContain("master_question_id_map");
    expect(importer).toContain("master_question_id_map m ON m.legacy_id");
    expect(importer).toContain("SET r.");
    expect(importer).toContain("staleOrphanedReferencesToRemove");
    expect(importer).toContain("DELETE r FROM");
    expect(importer).toContain("DELETE FROM questions");
    expect(importer).toContain("orphaned historical references");
  });
});
