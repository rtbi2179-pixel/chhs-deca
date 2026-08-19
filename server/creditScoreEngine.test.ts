import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { calculateFinalScore, calculatePaymentReliabilityFromCounts, MAX_SCORE_CHANGE_PER_UPDATE, practiceConsistencyForInactiveDays, updateCreditScore } from "./creditScoreEngine";
import { getDb } from "./db";
import { banks, creditCardPayments, creditCards, creditHistory, creditScores, dailyPracticeStats, economicConfig, userCreditCards, users } from "../drizzle/schema";

describe("credit score engine", () => {
  it("applies configurable payment rules, weights, and final-score bounds deterministically", () => {
    expect(calculatePaymentReliabilityFromCounts({ onTime: 1, late: 0, missed: 0 }, { onTimePaymentPoints: 2, missedPaymentPenalty: 15 })).toBe(100);
    expect(calculatePaymentReliabilityFromCounts({ onTime: 1, late: 0, missed: 0 }, { onTimePaymentPoints: 1, missedPaymentPenalty: 15 })).toBe(75);
    expect(calculatePaymentReliabilityFromCounts({ onTime: 0, late: 0, missed: 1 }, { onTimePaymentPoints: 2, missedPaymentPenalty: 5 })).toBeCloseTo(16.67, 2);
    const balancedWeights = { paymentReliability: 30, accountHistory: 20, practiceConsistency: 25, savingsDiscipline: 15, creditUtilization: 10 };
    expect(calculateFinalScore({ paymentReliability: 100, accountHistory: 100, practiceConsistency: 100, savingsDiscipline: 100, creditUtilization: 100 }, balancedWeights)).toBe(850);
    expect(calculateFinalScore({ paymentReliability: 0, accountHistory: 0, practiceConsistency: 0, savingsDiscipline: 0, creditUtilization: 0 }, balancedWeights)).toBe(300);
  });

  it("reduces the practice-consistency factor only after recorded inactivity thresholds", () => {
    expect(practiceConsistencyForInactiveDays(null)).toBe(50);
    expect(practiceConsistencyForInactiveDays(3)).toBe(100);
    expect(practiceConsistencyForInactiveDays(14)).toBe(75);
    expect(practiceConsistencyForInactiveDays(31)).toBe(30);
    expect(practiceConsistencyForInactiveDays(61)).toBe(10);
  });

  describe("persisted chapter rule effect", () => {
    const schoolCode = `TEST-CREDIT-ENGINE-${Date.now()}`;
    let userId = 0;

    beforeEach(async () => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");
      const userResult = await database.insert(users).values({ openId: `credit-engine-${Date.now()}-${Math.random()}`, name: "Credit Engine Member", schoolCode, role: "user", loginMethod: "custom" });
      userId = Number(userResult[0].insertId);
      const bankResult = await database.insert(banks).values({ name: "Credit Engine Bank", focus: "Testing", schoolCode });
      const bankId = Number(bankResult[0].insertId);
      const cardResult = await database.insert(creditCards).values({ bankId, tier: "starter", name: "Credit Engine Card", creditScoreRequired: 300, rewardsPercentage: "1.00", interestRate: "10.00", annualFee: "0.00", schoolCode });
      const cardId = Number(cardResult[0].insertId);
      const userCardResult = await database.insert(userCreditCards).values({ userId, creditCardId: cardId, creditLimit: "1000.00", currentBalance: "0.00", availableCredit: "1000.00", utilizationRate: "0.00", schoolCode });
      const userCreditCardId = Number(userCardResult[0].insertId);
      await database.insert(creditCardPayments).values({ userId, userCreditCardId, amount: "100.00", status: "completed", dueDate: new Date(), paidDate: new Date(), schoolCode });
      await database.insert(economicConfig).values({ schoolCode, paymentReliabilityWeight: "100.00", accountHistoryWeight: "0.00", practiceConsistencyWeight: "0.00", netWorthWeight: "0.00", spendingBehaviorWeight: "0.00", onTimePaymentPoints: 2, missedPaymentPenalty: 15, savingsInterestRate: "0.50" });
    });

    afterEach(async () => {
      const database = await getDb();
      if (!database) return;
      await database.delete(creditHistory).where(eq(creditHistory.schoolCode, schoolCode));
      await database.delete(creditCardPayments).where(eq(creditCardPayments.schoolCode, schoolCode));
      await database.delete(userCreditCards).where(eq(userCreditCards.schoolCode, schoolCode));
      await database.delete(creditScores).where(eq(creditScores.schoolCode, schoolCode));
      await database.delete(creditCards).where(eq(creditCards.schoolCode, schoolCode));
      await database.delete(banks).where(eq(banks.schoolCode, schoolCode));
      await database.delete(economicConfig).where(eq(economicConfig.schoolCode, schoolCode));
      if (userId) await database.delete(users).where(eq(users.id, userId));
    });

    it("uses persisted payment rules and limits a single update to the configured maximum swing", async () => {
      const firstScore = await updateCreditScore(userId, schoolCode);
      expect(firstScore).toBe(500 + MAX_SCORE_CHANGE_PER_UPDATE);
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");
      await database.update(economicConfig).set({ onTimePaymentPoints: 0 }).where(eq(economicConfig.schoolCode, schoolCode));
      const secondScore = await updateCreditScore(userId, schoolCode);
      expect(secondScore).toBe(575);
      expect(Math.abs(secondScore - firstScore)).toBeLessThanOrEqual(MAX_SCORE_CHANGE_PER_UPDATE);
    });

    it("uses the most recent persisted practice date when inactivity affects the score", async () => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");
      await database.insert(dailyPracticeStats).values({ userId, practiceDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), questionsCompleted: 10, correctAnswers: 8, totalAnswered: 10, accuracy: "80.00", blueBucksEarned: 0, streakQualified: false, schoolCode });
      await database.update(economicConfig).set({ paymentReliabilityWeight: "0.00", accountHistoryWeight: "0.00", practiceConsistencyWeight: "100.00", netWorthWeight: "0.00", spendingBehaviorWeight: "0.00" }).where(eq(economicConfig.schoolCode, schoolCode));
      expect(await updateCreditScore(userId, schoolCode)).toBe(465);
    });
  });
});
