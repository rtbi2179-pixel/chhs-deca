import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/pages/BlueMarket.tsx", import.meta.url), "utf8");

describe("BBX market dashboard layout", () => {
  it("keeps the reference-inspired dashboard regions in the market overview", () => {
    expect(source).toContain('aria-label="BBX market navigation"');
    expect(source).toContain("market-dashboard-topbar");
    expect(source).toContain('aria-label="BBX market summary"');
    expect(source).toContain("market-dashboard-stats");
    expect(source).toContain("<BbxPerformanceGraphs performance={data.performance} />");
    expect(source).toContain("market-dashboard-content");
    expect(source).toContain("Fictional company listings");
    expect(source).toContain("Market movers");
    expect(source).toContain("Sector performance");
    expect(source).toContain("Latest simulated news");
    expect(source).toContain("Before you trade");
  });

  it("preserves existing BBX information sources and user actions", () => {
    for (const contract of [
      "trpc.bbx.getOverview.useQuery",
      "trpc.bbx.placeMarketOrder.useMutation",
      "utils.bbx.getPortfolio.invalidate()",
      "utils.bbx.getTransactions.invalidate()",
      "data.cash",
      "data.state.benchmarkLevel",
      "data.state.marketRegime",
      "data.state.marketOpen",
      "data.state.tickNumber",
      "data.performance",
      "const companies = data?.companies ?? []",
      "data.movers.gainers",
      "data.movers.losers",
      "data.sectors",
      "const news = data?.news ?? []",
      "setTrade({ ticker: company.ticker, side: \"buy\"",
      "setTrade({ ticker: company.ticker, side: \"sell\"",
      "setLocation(\"/market/portfolio\")",
      "setLocation(\"/market/news\")",
      "setLocation(\"/market/learn\")",
    ]) {
      expect(source, `missing preserved BBX contract: ${contract}`).toContain(contract);
    }
  });

  it("keeps the responsive layout hooks used by the reference-inspired composition", () => {
    expect(source).toContain("lg:flex-row");
    expect(source).toContain("sm:grid-cols-2 xl:grid-cols-4");
    expect(source).toContain("xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.85fr)]");
    expect(source).toContain("lg:grid-cols-[1.45fr_0.85fr]");
  });
});

export {};

