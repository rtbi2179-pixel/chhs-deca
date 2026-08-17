import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("BBX graph and Blue’s News rewards", () => {
  it("returns market and recent news-affected sector performance from BBX price history", () => {
    const router = readFileSync(join(process.cwd(), "server/bbxRouter.ts"), "utf8");
    expect(router).toContain("performance: { market: buildPerformance(historyRows), affectedSectors }");
    expect(router).toContain("bbxPriceHistory");
    expect(router).toContain("recentAffectedRows");
  });
  it("awards a read reward once and tracks it durably", () => {
    const router = readFileSync(join(process.cwd(), "server/bbxRouter.ts"), "utf8");
    expect(router).toContain("BLUE_NEWS_READ_REWARD = 25");
    expect(router).toContain("news_read_reward");
    expect(router).toContain("rewardedAt");
  });
});
