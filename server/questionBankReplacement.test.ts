import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const importerSource = () => readFileSync(path.join(process.cwd(), "server/scripts/replaceQuestionBank.mjs"), "utf8");

describe("master practice question bank replacement", () => {
  it("validates the full source bank and preserves all required question fields", () => {
    const source = importerSource();

    expect(source).toContain("validateBank(bank)");
    expect(source).toContain("metadata?.total_questions !== bank.questions.length");
    expect(source).toContain("Duplicate question id");
    expect(source).toContain('"distractor_rationale_d"');
    expect(source).toContain("source_status");
  });

  it("refuses to remove question IDs referenced by member history and uses a rollback-capable transaction", () => {
    const source = importerSource();

    expect(source).toContain("readReferencedQuestionIds");
    expect(source).toContain("referencedStaleIds.length > 0");
    expect(source).toContain("await connection.beginTransaction()");
    expect(source).toContain("await connection.rollback()");
    expect(source).toContain("ON DUPLICATE KEY UPDATE");
    expect(source).toContain("Post-import count mismatch");
  });
});
