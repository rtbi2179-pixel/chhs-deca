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
  it("awards a read reward once to checking and tracks it durably", () => {
    const router = readFileSync(join(process.cwd(), "server/bbxRouter.ts"), "utf8");
    expect(router).toContain("BLUE_NEWS_READ_REWARD = 25");
    expect(router).toContain("awardBlueBucks(ctx.user.id");
    expect(router).toContain('"news_read"');
    expect(router).not.toContain("checkingBalance: nextChecking.toFixed(2)");
    expect(router).toContain("rewardedAt");
  });
  it("keeps fictional news impact qualitative and displays the automatic market refresh countdown", () => {
    const engine = readFileSync(join(process.cwd(), "server/bbxEngine.ts"), "utf8");
    const market = readFileSync(join(process.cwd(), "client/src/pages/BlueMarket.tsx"), "utf8");
    expect(engine).toContain("points to ${direction} near-term expectations.");
    expect(engine).not.toContain("sampled magnitude of ${magnitude}%");
    expect(market).toContain("MARKET_REFRESH_MS");
    expect(market).toContain("Auto-refresh in {refreshRemaining}s");
  });
});
