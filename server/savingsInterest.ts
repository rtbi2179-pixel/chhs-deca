export const SAVINGS_APY_PERCENT = 0.5;

export function calculateMonthlySavingsInterest(balance: number, apyPercent = SAVINGS_APY_PERCENT): number {
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Savings balance must be a non-negative number");
  if (!Number.isFinite(apyPercent) || apyPercent < 0) throw new Error("APY must be a non-negative number");
  return Number(((balance * (apyPercent / 100)) / 12).toFixed(2));
}

export function savingsInterestPeriodKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
