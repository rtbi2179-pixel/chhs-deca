import { describe, expect, it } from "vitest";
import { applyPortfolioPurchase, applyPortfolioSale, calculatePortfolioSnapshot } from "./marketPortfolioMath";

describe("market portfolio accounting", () => {
  it("weights repeat purchases, prevents overselling, and derives a snapshot from actual balances", () => {
    const purchased = applyPortfolioPurchase({ shares: 2, averageBuyPrice: 100, totalInvested: 200 }, 1, 160);
    expect(purchased).toEqual({ shares: 3, totalInvested: 360, averageBuyPrice: 120 });
    expect(applyPortfolioSale(purchased, 1)).toMatchObject({ shares: 2, totalInvested: 240, closed: false });
    expect(() => applyPortfolioSale(purchased, 4)).toThrow("Insufficient shares");
    expect(calculatePortfolioSnapshot({ cashBalance: 10_100, initialAllocation: 10_000, totalInvested: 0 })).toEqual({ totalValue: 10_100, totalProfit: 100, percentageReturn: 1 });
  });
});
