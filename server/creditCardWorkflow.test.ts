import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import {
  banks,
  cashbackRewards,
  cardUsageTracking,
  creditCardPayments,
  creditCards,
  spendingPatterns,
  userBankAccounts,
  userCreditCards,
  users,
} from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const schoolCode = `TEST-CARD-${Date.now()}`;
const openId = `test-card-${Date.now()}`;
let userId = 0;
let bankId = 0;
let productId = 0;
let issuedCardId = 0;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId,
    email: `${openId}@example.test`,
    name: "Card Test User",
    loginMethod: "custom",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    schoolCode,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("credit-card workflow", () => {
  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database connection is required for credit-card workflow tests");

    const createdUser = await database.insert(users).values({
      openId,
      email: `${openId}@example.test`,
      name: "Card Test User",
      loginMethod: "custom",
      role: "user",
      schoolCode,
    });
    userId = Number(createdUser[0].insertId);

    const bank = await database.insert(banks).values({
      name: "Test Card Bank",
      focus: "Testing",
      description: "Isolated workflow test bank",
      schoolCode,
    });
    bankId = Number(bank[0].insertId);

    const product = await database.insert(creditCards).values({
      bankId,
      tier: "rewards",
      name: "Test Rewards Card",
      creditScoreRequired: 500,
      rewardsPercentage: "3.50",
      interestRate: "0.00",
      annualFee: "0.00",
      schoolCode,
    });
    productId = Number(product[0].insertId);

    const account = await database.insert(userBankAccounts).values({
      userId,
      checkingBalance: "1000.00",
      savingsBalance: "0.00",
      investmentBalance: "0.00",
      totalDebt: "0.00",
      schoolCode,
    });
    expect(Number(account[0].insertId)).toBeGreaterThan(0);

    const issuedCard = await database.insert(userCreditCards).values({
      userId,
      creditCardId: productId,
      creditLimit: "1000.00",
      currentBalance: "0.00",
      availableCredit: "1000.00",
      utilizationRate: "0.00",
      schoolCode,
    });
    issuedCardId = Number(issuedCard[0].insertId);
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
    await database.delete(creditCards).where(eq(creditCards.id, productId));
    await database.delete(banks).where(eq(banks.id, bankId));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("records a charge, calculates cashback, and persists real spending analytics", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.banking.chargeCard({
      cardId: issuedCardId,
      amount: 100,
      merchantCategory: "Books",
    })).resolves.toMatchObject({
      success: true,
      chargedAmount: 100,
      cashback: 3.5,
      currentBalance: 100,
      availableCredit: 900,
      utilizationRate: 10,
    });

    const analytics = await caller.banking.getSpendingAnalytics();
    expect(analytics.totalSpending).toBe(100);
    expect(analytics.categories).toContainEqual({
      category: "Books",
      total: 100,
      transactions: 1,
      average: 100,
    });
  });

  it("does not offer a product that the member has already been issued", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const availableCards = await caller.banking.getAvailableCards();
    expect(availableCards.map((card) => card.id)).not.toContain(productId);
  });

  it("generates a statement and applies a validated checking-account payment", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const statement = await caller.banking.getCardStatement({ cardId: issuedCardId });
    expect(statement.summary).toMatchObject({ charges: 100, payments: 0, cashback: 3.5, closingBalance: 100 });
    expect(statement.charges).toHaveLength(1);

    await expect(caller.banking.makePayment({ cardId: issuedCardId, amount: 40 })).resolves.toMatchObject({
      success: true,
      newBalance: 960,
      remainingCardBalance: 60,
      availableCredit: 940,
    });

    const updatedStatement = await caller.banking.getCardStatement({ cardId: issuedCardId });
    expect(updatedStatement.summary).toMatchObject({ charges: 100, payments: 40, cashback: 3.5, closingBalance: 60 });
  });
});
