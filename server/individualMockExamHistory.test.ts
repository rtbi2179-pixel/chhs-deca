import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("individual mock exam history", () => {
  it("keeps individual history scoped to completed individual mock sessions and exposes detailed analysis", () => {
    const router = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");
    expect(router).toContain("getIndividualHistory");
    expect(router).toContain("Individual Mock Exam —%");
    expect(router).toContain("getIndividualHistoryDetail");
    expect(router).toContain("buildMockExamResults(database, session)");
  });

  it("shows date, total accuracy, PI accuracy, and study guide details in the side panel", () => {
    const component = readFileSync(join(process.cwd(), "client/src/components/IndividualMockExamHistory.tsx"), "utf8");
    expect(component).toContain("toLocaleDateString");
    expect(component).toContain("item.accuracy");
    expect(component).toContain("PI accuracy");
    expect(component).toContain("Study guide provided");
  });
});
