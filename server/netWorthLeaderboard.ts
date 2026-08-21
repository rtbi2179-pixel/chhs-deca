export type NetWorthAccountRecord = {
  userId: number;
  name: string | null;
  username: string | null;
  schoolCode?: string | null;
  checkingBalance: string | number | null;
  savingsBalance: string | number | null;
  investmentBalance: string | number | null;
  updatedAt?: Date | null;
};

export type NetWorthLeaderboardEntry = {
  userId: number;
  name: string;
  schoolCode?: string | null;
  checking: number;
  savings: number;
  investment: number;
  netWorth: number;
  updatedAt?: Date | null;
};

function amount(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildNetWorthLeaderboard(accounts: NetWorthAccountRecord[], limit = 50): NetWorthLeaderboardEntry[] {
  return accounts.map((account) => {
    const checking = amount(account.checkingBalance);
    const savings = amount(account.savingsBalance);
    const investment = amount(account.investmentBalance);
    return {
      userId: account.userId,
      name: account.name || account.username || "Member",
      ...(account.schoolCode === undefined ? {} : { schoolCode: account.schoolCode }),
      checking,
      savings,
      investment,
      netWorth: checking + savings + investment,
      updatedAt: account.updatedAt,
    };
  }).sort((left, right) => right.netWorth - left.netWorth || left.name.localeCompare(right.name)).slice(0, limit);
}
