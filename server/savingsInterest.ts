export const SAVINGS_MONTHLY_RATE_PERCENT = 7;

export function calculateMonthlySavingsInterest(balance: number, monthlyRatePercent = SAVINGS_MONTHLY_RATE_PERCENT): number {
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Savings balance must be a non-negative number");
  if (!Number.isFinite(monthlyRatePercent) || monthlyRatePercent < 0) throw new Error("Monthly savings rate must be a non-negative number");
  return Number((balance * (monthlyRatePercent / 100)).toFixed(2));
}

export function savingsInterestPeriodKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
