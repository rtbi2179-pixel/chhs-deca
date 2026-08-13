import { describe, expect, it } from "vitest";
import { calculateMonetaryPressure } from "./economicMonitoring";

describe("simulation economic monitoring", () => {
  it("returns stable, zero-safe metrics when no activity exists", () => {
    expect(calculateMonetaryPressure({ rewardUnitsIssued: 0, activeUsers: 0, marketTurnover: 0, cardSpending: 0 }))
      .toEqual({ rewardUnitsPerActiveUser: 0, rewardToTurnoverRatio: 0, pressureIndex: 0, status: "stable" });
  });

  it("classifies reward pressure from the active-user adjusted issuance rate", () => {
    expect(calculateMonetaryPressure({ rewardUnitsIssued: 55, activeUsers: 1, marketTurnover: 100, cardSpending: 0 }))
      .toMatchObject({ rewardUnitsPerActiveUser: 55, rewardToTurnoverRatio: 0.55, pressureIndex: 55, status: "elevated" });
    expect(calculateMonetaryPressure({ rewardUnitsIssued: 150, activeUsers: 2, marketTurnover: 100, cardSpending: 100 }))
      .toMatchObject({ rewardUnitsPerActiveUser: 75, pressureIndex: 75, status: "high" });
  });
});
