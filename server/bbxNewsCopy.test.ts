import { describe, expect, it } from "vitest";
import { hideBbxMagnitude } from "../client/src/lib/bbxNewsCopy";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Blue's News magnitude-safe copy", () => {
  it("removes the legacy sampled-magnitude clause while preserving the market learning context", () => {
    expect(hideBbxMagnitude("The structured simulated event points to higher near-term expectations, with a sampled magnitude of 20.52%.")).toBe("The structured simulated event points to higher near-term expectations.");
    expect(hideBbxMagnitude("The structured simulated event points to lower near-term expectations, with a sampled magnitude of 5%.")).toBe("The structured simulated event points to lower near-term expectations.");
  });

  it("leaves ordinary article wording unchanged", () => {
    expect(hideBbxMagnitude("A large contract can improve expected future revenue.")).toBe("A large contract can improve expected future revenue.");
  });

  it("keeps Blue’s News article metadata free of simulated-status badges", () => {
    const blueNews = readFileSync(resolve(process.cwd(), "client/src/pages/BluesNews.tsx"), "utf8");
    const marketViews = readFileSync(resolve(process.cwd(), "client/src/pages/BbxMarketViews.tsx"), "utf8");
    const marketNewsFeed = marketViews.slice(marketViews.indexOf("export function BbxNewsPage()"), marketViews.indexOf("export function BbxLearnPage()"));
    expect(blueNews).not.toContain(">SIMULATED</span>");
    expect(marketNewsFeed).not.toContain(">SIMULATED</span>");
  });
});
