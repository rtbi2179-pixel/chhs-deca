import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import {
  banks,
  blueBucks,
  blueBucksTransactions,
  cashbackRewards,
  cardUsageTracking,
  creditCardPayments,
  creditCards,
  spendingPatterns,
  userBankAccounts,
  userCreditCards,
  users,
} from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

describe("banking end-to-end workflow", () => {
  const schoolCode = `TEST-BANK-E2E-${Date.now()}`;
  const openId = `bank-e2e-${Date.now()}`;
  let userId = 0;
  let bankId = 0;
  let productId = 0;

  function caller() {
    const user: AuthenticatedUser = {
      id: userId,
      openId,
      name: "Banking E2E Member",
      role: "user",
      schoolCode,
      loginMethod: "custom",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    return appRouter.createCaller({ user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
  }

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const user = await database.insert(users).values({ openId, name: "Banking E2E Member", role: "user", schoolCode, loginMethod: "custom" });
    userId = Number(user[0].insertId);
    const bank = await database.insert(banks).values({ name: "E2E Bank", focus: "Validation", description: "Isolated workflow bank", schoolCode });
    bankId = Number(bank[0].insertId);
    const product = await database.insert(creditCards).values({ bankId, tier: "starter", name: "E2E Starter", creditScoreRequired: 300, rewardsPercentage: "2.00", interestRate: "0.00", annualFee: "0.00", schoolCode });
    productId = Number(product[0].insertId);
    await database.insert(blueBucks).values({ userId, amount: 50 });
    await database.insert(userBankAccounts).values({ userId, checkingBalance: "0.00", savingsBalance: "0.00", investmentBalance: "0.00", totalDebt: "0.00", schoolCode });
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database || !userId) return;
    await database.delete(cardUsageTracking).where(eq(cardUsageTracking.userId, userId));
    await database.delete(cashbackRewards).where(eq(cashbackRewards.userId, userId));
    await database.delete(creditCardPayments).where(eq(creditCardPayments.userId, userId));
    await database.delete(spendingPatterns).where(eq(spendingPatterns.userId, userId));
    await database.delete(userCreditCards).where(eq(userCreditCards.userId, userId));
    await database.delete(userBankAccounts).where(eq(userBankAccounts.userId, userId));
    await database.delete(blueBucksTransactions).where(eq(blueBucksTransactions.userId, userId));
    await database.delete(blueBucks).where(eq(blueBucks.userId, userId));
    await database.delete(creditCards).where(eq(creditCards.id, productId));
    await database.delete(banks).where(eq(banks.id, bankId));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("completes card application, funding, purchase, payment, rewards, statement, and final-balance updates", async () => {
    const api = caller();
    expect((await api.banking.getAvailableCards()).map((card) => card.id)).toContain(productId);

    await expect(api.banking.applyCreditCard({ creditCardId: productId })).resolves.toEqual({ success: true, creditLimit: 1000 });
    const [issuedCard] = await api.banking.getUserCards();
    expect(issuedCard.cardDetails?.id).toBe(productId);

    await expect(api.banking.depositBlueBucksToChecking({ amount: 25 })).resolves.toMatchObject({ success: true, checkingBalance: 25, remainingBlueBucks: 25 });
    await expect(api.banking.chargeCard({ cardId: issuedCard.id, amount: 20, merchantCategory: "Books" })).resolves.toMatchObject({ success: true, cashback: 0.4, currentBalance: 20, availableCredit: 980 });
    await expect(api.banking.makePayment({ cardId: issuedCard.id, amount: 20 })).resolves.toMatchObject({ success: true, newBalance: 5, remainingCardBalance: 0, availableCredit: 1000 });

    await expect(api.banking.getSpendingAnalytics()).resolves.toMatchObject({ totalSpending: 20, categories: [{ category: "Books", total: 20, transactions: 1, average: 20 }] });
    await expect(api.banking.getCardStatement({ cardId: issuedCard.id })).resolves.toMatchObject({ summary: { charges: 20, payments: 20, cashback: 0.4, closingBalance: 0 } });
    await expect(api.banking.getBankAccount()).resolves.toMatchObject({ checkingBalance: "5.00" });
    await expect(api.practice.getBlueBucksBalance()).resolves.toEqual({ balance: 25 });
    const [finalCard] = await api.banking.getUserCards();
    expect(finalCard).toMatchObject({ currentBalance: "0.00", availableCredit: "1000.00" });
  });
});
