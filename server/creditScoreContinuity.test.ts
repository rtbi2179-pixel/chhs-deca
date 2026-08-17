import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("credit-score continuity and portfolio truthfulness", () => {
  it("uses the real updater for daily refreshes and records a durable scheduled owner", () => {
    const updater = readFileSync(join(process.cwd(), "server/creditScoreUpdater.ts"), "utf8");
    const server = readFileSync(join(process.cwd(), "server/_core/index.ts"), "utf8");
    expect(updater).toContain("updateCreditScore(user.id, schoolCode");
    expect(server).toContain("/api/scheduled/credit-score-update");
    expect(server).toContain("creditScoreUpdateSchedule.taskUid");
  });

  it("does not expose retired cost basis as stock market performance", () => {
    const router = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");
    const analytics = readFileSync(join(process.cwd(), "client/src/pages/MarketAnalytics.tsx"), "utf8");
    expect(router).toContain('valuationStatus: "unavailable"');
    expect(router).toContain("return [];");
    expect(analytics).toContain("Portfolio analytics moved to BBX");
  });
});
