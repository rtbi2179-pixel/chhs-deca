import { and, eq } from "drizzle-orm";
import { economicConfig, savingsInterestAccruals, userBankAccounts } from "../drizzle/schema";
import { getDb } from "./db";
import { calculateMonthlySavingsInterest, SAVINGS_MONTHLY_RATE_PERCENT, savingsInterestPeriodKey } from "./savingsInterest";

export type SavingsAccrualResult = {
  userId: number;
  schoolCode: string;
  periodKey: string;
  monthlyRate: number;
  interestAmount: number;
  savingsBalance: number;
  alreadyAccrued: boolean;
};

export async function accrueMonthlySavingsInterestForUser(userId: number, schoolCode: string, now = new Date()): Promise<SavingsAccrualResult> {
  const database = await getDb();
  if (!database) throw new Error("Banking data is unavailable");
  const periodKey = savingsInterestPeriodKey(now);
  const [existing] = await database.select().from(savingsInterestAccruals).where(and(
    eq(savingsInterestAccruals.userId, userId),
    eq(savingsInterestAccruals.periodKey, periodKey),
  )).limit(1);
  if (existing) {
    return { userId, schoolCode, periodKey, monthlyRate: Number(existing.apy) * 100, interestAmount: Number(existing.interestAmount), savingsBalance: Number(existing.balanceAfter), alreadyAccrued: true };
  }
  const [account] = await database.select().from(userBankAccounts).where(and(
    eq(userBankAccounts.userId, userId),
    eq(userBankAccounts.schoolCode, schoolCode),
  )).limit(1);
  if (!account) throw new Error("Bank account not found");
  const [config] = await database.select().from(economicConfig).where(eq(economicConfig.schoolCode, schoolCode)).limit(1);
  const monthlyRate = Number(config?.savingsInterestRate ?? SAVINGS_MONTHLY_RATE_PERCENT);
  const balanceBefore = Number(account.savingsBalance);
  const interestAmount = calculateMonthlySavingsInterest(balanceBefore, monthlyRate);
  const savingsBalance = Number((balanceBefore + interestAmount).toFixed(2));
  if (interestAmount <= 0) return { userId, schoolCode, periodKey, monthlyRate, interestAmount, savingsBalance, alreadyAccrued: false };
  await database.insert(savingsInterestAccruals).values({
    userId,
    schoolCode,
    periodKey,
    apy: (monthlyRate / 100).toFixed(4),
    balanceBefore: balanceBefore.toFixed(2),
    interestAmount: interestAmount.toFixed(2),
    balanceAfter: savingsBalance.toFixed(2),
  });
  await database.update(userBankAccounts).set({ savingsBalance: savingsBalance.toFixed(2) }).where(eq(userBankAccounts.id, account.id));
  return { userId, schoolCode, periodKey, monthlyRate, interestAmount, savingsBalance, alreadyAccrued: false };
}

export async function accrueMonthlySavingsInterestForAllAccounts(now = new Date()) {
  const database = await getDb();
  if (!database) throw new Error("Banking data is unavailable");
  const accounts = await database.select({ userId: userBankAccounts.userId, schoolCode: userBankAccounts.schoolCode }).from(userBankAccounts);
  const results: SavingsAccrualResult[] = [];
  for (const account of accounts) {
    results.push(await accrueMonthlySavingsInterestForUser(account.userId, account.schoolCode, now));
  }
  return { periodKey: savingsInterestPeriodKey(now), credited: results.filter((result) => !result.alreadyAccrued && result.interestAmount > 0).length, skipped: results.filter((result) => result.alreadyAccrued).length, results };
}
