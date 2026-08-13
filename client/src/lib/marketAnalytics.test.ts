import { describe, expect, it } from "vitest";
import { buildPortfolioPolyline, filterPortfolioSnapshots } from "./marketAnalytics";

describe("market analytics presentation", () => {
  const points = [
    { snapshotDate: "2026-08-01T00:00:00.000Z", value: 10_000, gain: 0, percentageReturn: 0 },
    { snapshotDate: "2026-08-10T00:00:00.000Z", value: 10_120, gain: 120, percentageReturn: 1.2 },
  ];

  it("filters real snapshots by timeframe and produces a drawable line only when there are two points", () => {
    expect(filterPortfolioSnapshots(points, "1w", new Date("2026-08-12T00:00:00.000Z"))).toHaveLength(1);
    const month = filterPortfolioSnapshots(points, "1m", new Date("2026-08-12T00:00:00.000Z"));
    expect(month).toHaveLength(2);
    expect(buildPortfolioPolyline(month)).toContain(",");
    expect(buildPortfolioPolyline(month.slice(0, 1))).toBe("");
  });
});
