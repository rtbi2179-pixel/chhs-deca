import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { adminActivityLogs, banks, creditCards, creditScores, economicAuditLog, economicConfig, userBankAccounts, userCreditCards, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("super-admin banking controls", () => {
  const schoolCode = `TEST-BANKING-CONTROLS-${Date.now()}`;
  let adminId = 0;
  let cardId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const createdAdmin = await database.insert(users).values({ openId: `banking-admin-${Date.now()}-${Math.random()}`, name: "Banking Control Admin", schoolCode, selectedSchoolCode: schoolCode, role: "super_admin", loginMethod: "custom" });
    adminId = Number(createdAdmin[0].insertId);
    const createdBank = await database.insert(banks).values({ name: "Test Bank", focus: "Testing", schoolCode });
    const bankId = Number(createdBank[0].insertId);
    const createdCard = await database.insert(creditCards).values({ bankId, tier: "rewards", name: "Test Rewards Card", creditScoreRequired: 650, rewardsPercentage: "1.50", interestRate: "18.00", annualFee: "20.00", schoolCode });
    cardId = Number(createdCard[0].insertId);
    await database.insert(creditScores).values({ userId: adminId, score: 720, schoolCode });
    await database.insert(userBankAccounts).values({ userId: adminId, checkingBalance: "0", savingsBalance: "1200", investmentBalance: "0", totalDebt: "0", schoolCode });
    await database.insert(userCreditCards).values({ userId: adminId, creditCardId: cardId, creditLimit: "1000.00", currentBalance: "240.00", availableCredit: "760.00", utilizationRate: "24.00", schoolCode });
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    await database.delete(adminActivityLogs).where(eq(adminActivityLogs.schoolCode, schoolCode));
    await database.delete(economicAuditLog).where(eq(economicAuditLog.schoolCode, schoolCode));
    await database.delete(userCreditCards).where(eq(userCreditCards.schoolCode, schoolCode));
    await database.delete(userBankAccounts).where(eq(userBankAccounts.schoolCode, schoolCode));
    await database.delete(creditScores).where(eq(creditScores.schoolCode, schoolCode));
    await database.delete(creditCards).where(eq(creditCards.schoolCode, schoolCode));
    await database.delete(banks).where(eq(banks.schoolCode, schoolCode));
    await database.delete(economicConfig).where(eq(economicConfig.schoolCode, schoolCode));
    if (adminId) await database.delete(users).where(eq(users.id, adminId));
  });

  function adminCaller() {
    return appRouter.createCaller(context({ id: adminId, openId: `banking-admin-${adminId}`, name: "Banking Control Admin", schoolCode, selectedSchoolCode: schoolCode, role: "super_admin", loginMethod: "custom", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }));
  }

  it("updates credit rules and card terms, reports analytics, and logs chapter-scoped administrator activity", async () => {
    const caller = adminCaller();
    await expect(caller.superAdmin.updateEconomicCreditRules({ onTimePaymentPoints: 3, missedPaymentPenalty: 18, savingsInterestRate: 1.25, reason: "Season policy update" })).resolves.toMatchObject({ success: true, schoolCode, savingsInterestRate: "1.25" });
    await expect(caller.banking.getSavingsInterest()).resolves.toMatchObject({ savingsBalance: "1200.00", apy: "1.25", interestEarned: "1.25" });
    await expect(caller.superAdmin.getCardCatalog()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: cardId, name: "Test Rewards Card" })]));
    await expect(caller.superAdmin.updateCardProduct({ cardId, creditScoreRequired: 680, rewardsPercentage: 2.25, interestRate: 17.5, annualFee: 25, reason: "Tier calibration" })).resolves.toMatchObject({ success: true, cardId, rewardsPercentage: "2.25", interestRate: "17.50" });
    await expect(caller.superAdmin.getCreditScoreAnalytics()).resolves.toMatchObject({ schoolCode, scoredMembers: 1, averageScore: 720, minScore: 720, maxScore: 720, issuedCards: 1, outstandingBalance: 240 });
    await expect(caller.superAdmin.getActivityLog()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ action: "credit_rules_updated", schoolCode, targetType: "economic_config" }),
      expect.objectContaining({ action: "card_product_updated", schoolCode, targetType: "credit_card", targetId: String(cardId) }),
    ]));
  });

  it("blocks non-super-admin callers from banking controls and analytics", async () => {
    const caller = appRouter.createCaller(context({ id: adminId, openId: `regular-banking-${adminId}`, name: "Member", schoolCode, role: "user", loginMethod: "custom", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }));
    await expect(caller.superAdmin.getCardCatalog()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.superAdmin.getCreditScoreAnalytics()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.superAdmin.updateEconomicCreditRules({ onTimePaymentPoints: 3, missedPaymentPenalty: 18, savingsInterestRate: 1.25 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
