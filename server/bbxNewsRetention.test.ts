import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("scheduled BBX news retention", () => {
  it("cleans expired articles before duplicate scheduled deliveries are skipped", () => {
    const source = readFileSync(join(process.cwd(), "server/_core/index.ts"), "utf8");
    expect(source.indexOf("database.delete(bbxNews)")).toBeLessThan(source.indexOf("skipped: \"duplicate\""));
    expect(source).toContain("blueNewsRetentionCutoff()");
  });
});
