export type EconomicMonitoringInput = {
  rewardUnitsIssued: number;
  activeUsers: number;
  marketTurnover: number;
  cardSpending: number;
};

export function calculateMonetaryPressure(input: EconomicMonitoringInput) {
  const activeUsers = Math.max(1, input.activeUsers);
  const rewardUnitsPerActiveUser = Number((Math.max(0, input.rewardUnitsIssued) / activeUsers).toFixed(2));
  const economyTurnover = Math.max(0, input.marketTurnover) + Math.max(0, input.cardSpending);
  const rewardToTurnoverRatio = economyTurnover > 0
    ? Number((Math.max(0, input.rewardUnitsIssued) / economyTurnover).toFixed(4))
    : 0;
  const pressureIndex = Math.min(100, Math.round(rewardUnitsPerActiveUser));
  const status = pressureIndex < 40 ? "stable" : pressureIndex < 70 ? "elevated" : "high";

  return { rewardUnitsPerActiveUser, rewardToTurnoverRatio, pressureIndex, status } as const;
}

export function calculateBlueBucksInflationIndex(input: { issuedBlueBucks: number; sinkBlueBucks: number; activeUsers: number }) {
  const activeUsers = Math.max(1, input.activeUsers);
  const netUnitsPerActiveUser = Number(((Math.max(0, input.issuedBlueBucks) - Math.max(0, input.sinkBlueBucks)) / activeUsers).toFixed(2));
  const inflationIndex = Number((100 + netUnitsPerActiveUser).toFixed(2));
  return { netUnitsPerActiveUser, inflationIndex };
}
