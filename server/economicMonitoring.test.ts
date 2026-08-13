import { describe, expect, it } from "vitest";
import { calculateMonetaryPressure, calculateBlueBucksInflationIndex } from "./economicMonitoring";

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

  it("calculates a transparent baseline-100 inflation index from net units per active member", () => {
    expect(calculateBlueBucksInflationIndex({ issuedBlueBucks: 600, sinkBlueBucks: 200, activeUsers: 20 }))
      .toEqual({ netUnitsPerActiveUser: 20, inflationIndex: 120 });
    expect(calculateBlueBucksInflationIndex({ issuedBlueBucks: 0, sinkBlueBucks: 50, activeUsers: 0 }))
      .toEqual({ netUnitsPerActiveUser: -50, inflationIndex: 50 });
  });
});
