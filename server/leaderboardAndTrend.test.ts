import { describe, expect, it } from "vitest";
import { buildNetWorthLeaderboard } from "./netWorthLeaderboard";
import { buildCreditScoreMonthlyTrend } from "./creditScoreTrend";

describe("leaderboard and credit-score trend refinements", () => {
  it("sorts net worth accurately and handles missing or zero balances", () => {
    const records = [
      { userId: 1, name: "Alice", username: null, schoolCode: "CHHS", checkingBalance: "500.00", savingsBalance: "200.00", investmentBalance: "100.00" },
      { userId: 2, name: "Bob", username: null, schoolCode: "CHHS", checkingBalance: "1000.00", savingsBalance: "500.00", investmentBalance: "500.00" },
      { userId: 3, name: "Charlie", username: null, schoolCode: "OTHER", checkingBalance: null, savingsBalance: null, investmentBalance: null },
    ];
    const ranked = buildNetWorthLeaderboard(records, 10);
    expect(ranked).toHaveLength(3);
    expect(ranked[0].userId).toBe(2);
    expect(ranked[0].netWorth).toBe(2000);
    expect(ranked[1].userId).toBe(1);
    expect(ranked[1].netWorth).toBe(800000 / 1000); // 800
    expect(ranked[2].userId).toBe(3);
    expect(ranked[2].netWorth).toBe(0);
  });

  it("groups credit history into weekly buckets for a 30-day monthly trend", () => {
    const baseTime = Date.UTC(2026, 7, 1);
    const history = [
      { calculatedAt: new Date(baseTime + 2 * 24 * 60 * 60 * 1000), newScore: 650, scoreChange: 10, reason: "Practice streak" },
      { calculatedAt: new Date(baseTime + 10 * 24 * 60 * 60 * 1000), newScore: 670, scoreChange: 20, reason: "On-time payment" },
      { calculatedAt: new Date(baseTime + 20 * 24 * 60 * 60 * 1000), newScore: 700, scoreChange: 30, reason: "Savings milestone" },
    ];
    const trend = buildCreditScoreMonthlyTrend(history, new Date(baseTime + 25 * 24 * 60 * 60 * 1000));
    expect(trend.length).toBeGreaterThan(0);
    expect(trend[0].score).toBe(650);
  });
});
