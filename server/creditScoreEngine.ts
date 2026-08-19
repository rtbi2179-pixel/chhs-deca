import { getDb } from './db';
import { creditScores, creditHistory, dailyPracticeStats, userBankAccounts, creditCardPayments, userCreditCards, economicConfig } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

const MIN_CREDIT_SCORE = 300;
const MAX_CREDIT_SCORE = 850;

interface CreditScoreFactors {
  paymentReliability: number; // 0-100
  accountHistory: number; // 0-100
  practiceConsistency: number; // 0-100
  savingsDiscipline: number; // 0-100
  creditUtilization: number; // 0-100
}

interface CreditScoreWeights {
  paymentReliability: number; // 30%
  accountHistory: number; // 20%
  practiceConsistency: number; // 25%
  savingsDiscipline: number; // 15%
  creditUtilization: number; // 10%
}

interface CreditScoreRuleConfig {
  onTimePaymentPoints: number;
  missedPaymentPenalty: number;
}

type CreditScoreConfig = CreditScoreWeights & CreditScoreRuleConfig;
export const MAX_SCORE_CHANGE_PER_UPDATE = 50;
const DEFAULT_CREDIT_SCORE_WEIGHTS: CreditScoreWeights = {
  paymentReliability: 30,
  accountHistory: 20,
  practiceConsistency: 25,
  savingsDiscipline: 15,
  creditUtilization: 10,
};
const CREDIT_SCORE_COMPOSITION_LABELS: Array<{ key: keyof CreditScoreWeights; name: string }> = [
  { key: 'paymentReliability', name: 'Payment Reliability' },
  { key: 'accountHistory', name: 'Account History' },
  { key: 'practiceConsistency', name: 'Practice Consistency' },
  { key: 'savingsDiscipline', name: 'Savings Discipline' },
  { key: 'creditUtilization', name: 'Credit Utilization' },
];

/** Converts configured score weights into chart-ready percentages that total exactly 100. */
export function normalizeCreditScoreComposition(weights: CreditScoreWeights) {
  const configured = CREDIT_SCORE_COMPOSITION_LABELS.map(({ key, name }) => ({ name, rawValue: Math.max(0, Number(weights[key]) || 0) }));
  const configuredTotal = configured.reduce((sum, component) => sum + component.rawValue, 0);
  const source = configuredTotal > 0
    ? configured
    : CREDIT_SCORE_COMPOSITION_LABELS.map(({ key, name }) => ({ name, rawValue: DEFAULT_CREDIT_SCORE_WEIGHTS[key] }));
  const sourceTotal = source.reduce((sum, component) => sum + component.rawValue, 0);
  let allocated = 0;

  return source.map((component, index) => {
    const value = index === source.length - 1
      ? Number((100 - allocated).toFixed(2))
      : Number(((component.rawValue / sourceTotal) * 100).toFixed(2));
    allocated += value;
    return { name: component.name, value };
  });
}

export function practiceConsistencyForInactiveDays(daysSinceActivity: number | null): number {
  if (daysSinceActivity === null) return 50;
  if (daysSinceActivity <= 7) return 100;
  if (daysSinceActivity <= 14) return 75;
  if (daysSinceActivity <= 30) return 50;
  if (daysSinceActivity <= 60) return 30;
  return 10;
}

export function calculatePaymentReliabilityFromCounts(
  counts: { onTime: number; late: number; missed: number },
  rules: CreditScoreRuleConfig = { onTimePaymentPoints: 2, missedPaymentPenalty: 15 },
): number {
  const total = counts.onTime + counts.late + counts.missed;
  if (total === 0) return 50;
  const onTimePercentage = (counts.onTime / total) * 100;
  const latePercentage = (counts.late / total) * 100;
  const missedPercentage = (counts.missed / total) * 100;
  const score = 50 + onTimePercentage * (rules.onTimePaymentPoints / 4) - latePercentage * 0.3 - missedPercentage * (rules.missedPaymentPenalty / 15);
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate payment reliability factor (25% weight)
 * Based on payment history: on-time, late, and missed payments
 */
async function calculatePaymentReliability(userId: number, schoolCode: string, rules: CreditScoreRuleConfig): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 50;

    const payments = await db
      .select()
      .from(creditCardPayments)
      .where(and(eq(creditCardPayments.userId, userId), eq(creditCardPayments.schoolCode, schoolCode)));

    if (payments.length === 0) {
      return 50; // Neutral score if no payment history
    }

    const onTimeCount = payments.filter((p: any) => p.status === 'completed').length;
    const lateCount = payments.filter((p: any) => p.status === 'late').length;
    const missedCount = payments.filter((p: any) => p.status === 'missed').length;

    return calculatePaymentReliabilityFromCounts({ onTime: onTimeCount, late: lateCount, missed: missedCount }, rules);
  } catch (error) {
    console.error('[Credit Score] Error calculating payment reliability:', error);
    return 50;
  }
}

/**
 * Calculate account history factor (25% weight)
 * Based on how long the account has been open
 */
async function calculateAccountHistory(userId: number, schoolCode: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    const account = await db
      .select()
      .from(userBankAccounts)
      .where(and(eq(userBankAccounts.userId, userId), eq(userBankAccounts.schoolCode, schoolCode)))
      .limit(1);

    if (account.length === 0) {
      return 0;
    }

    const accountOpenDate = new Date(account[0].accountOpenDate ?? account[0].createdAt ?? new Date());
    const now = new Date();
    const monthsOld = (now.getTime() - accountOpenDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Score progression:
    // 0-1 month: 10 points
    // 1-6 months: 30 points
    // 6-12 months: 60 points
    // 12+ months: 100 points
    if (monthsOld < 1) return 10;
    if (monthsOld < 6) return 30;
    if (monthsOld < 12) return 60;
    return 100;
  } catch (error) {
    console.error('[Credit Score] Error calculating account history:', error);
    return 0;
  }
}

/**
 * Calculate practice consistency factor (20% weight)
 * Based on practice streaks and consistency
 * This requires integration with the practice system
 */
async function calculatePracticeConsistency(userId: number, schoolCode: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 50;
    const [latestPractice] = await db.select({ date: dailyPracticeStats.practiceDate, questionsAnswered: dailyPracticeStats.questionsCompleted })
      .from(dailyPracticeStats)
      .where(and(eq(dailyPracticeStats.userId, userId), eq(dailyPracticeStats.schoolCode, schoolCode)))
      .orderBy(desc(dailyPracticeStats.practiceDate))
      .limit(1);
    if (!latestPractice || latestPractice.questionsAnswered <= 0) return 50;
    const daysSinceActivity = Math.max(0, Math.floor((Date.now() - new Date(latestPractice.date).getTime()) / (24 * 60 * 60 * 1000)));
    return practiceConsistencyForInactiveDays(daysSinceActivity);
  } catch (error) {
    console.error('[Credit Score] Error calculating practice consistency:', error);
    return 50;
  }
}

/**
 * Savings discipline reflects actual Savings Account usage. It replaces the
 * prior net-worth factor because Savings is an active member-facing feature.
 */
async function calculateSavingsDiscipline(userId: number, schoolCode: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 50;
    const [account] = await db.select().from(userBankAccounts)
      .where(and(eq(userBankAccounts.userId, userId), eq(userBankAccounts.schoolCode, schoolCode)))
      .limit(1);
    if (!account) return 50;
    const checking = Number(account.checkingBalance ?? 0);
    const savings = Number(account.savingsBalance ?? 0);
    const investment = Number(account.investmentBalance ?? 0);
    const totalBalances = Math.max(0, checking + savings + investment);
    if (totalBalances === 0) return 50;
    const savingsShare = Math.max(0, savings) / totalBalances;
    return Math.max(25, Math.min(100, Math.round(35 + savingsShare * 200)));
  } catch (error) {
    console.error('[Credit Score] Error calculating savings discipline:', error);
    return 50;
  }
}

/**
 * Credit utilization uses real issued Banking & Cards balances. It replaces the
 * prior disabled spending-behavior factor.
 */
async function calculateCreditUtilization(userId: number, schoolCode: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 50;
    const cards = await db.select().from(userCreditCards)
      .where(and(eq(userCreditCards.userId, userId), eq(userCreditCards.schoolCode, schoolCode)));
    if (cards.length === 0) return 50;
    const totalLimit = cards.reduce((sum, card) => sum + Number(card.creditLimit ?? 0), 0);
    const totalBalance = cards.reduce((sum, card) => sum + Number(card.currentBalance ?? 0), 0);
    if (totalLimit <= 0) return 50;
    const utilization = Math.max(0, totalBalance / totalLimit);
    if (utilization <= 0.1) return 100;
    if (utilization <= 0.3) return 90;
    if (utilization <= 0.5) return 70;
    if (utilization <= 0.75) return 40;
    return 15;
  } catch (error) {
    console.error('[Credit Score] Error calculating credit utilization:', error);
    return 50;
  }
}

/**
 * Get economic configuration for a school
 */
async function getEconomicConfig(schoolCode: string): Promise<CreditScoreConfig> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        paymentReliability: 30,
        accountHistory: 20,
        practiceConsistency: 25,
        savingsDiscipline: 15,
        creditUtilization: 10,
        onTimePaymentPoints: 2,
        missedPaymentPenalty: 15,
      };
    }

    const config = await db
      .select()
      .from(economicConfig)
      .where(eq(economicConfig.schoolCode, schoolCode))
      .limit(1);

    if (config.length === 0) {
      // Return default weights
      return {
        paymentReliability: 30,
        accountHistory: 20,
        practiceConsistency: 25,
        savingsDiscipline: 15,
        creditUtilization: 10,
        onTimePaymentPoints: 2,
        missedPaymentPenalty: 15,
      };
    }

    return {
      paymentReliability: parseFloat(config[0].paymentReliabilityWeight.toString()),
      accountHistory: parseFloat(config[0].accountHistoryWeight.toString()),
      practiceConsistency: parseFloat(config[0].practiceConsistencyWeight.toString()),
      savingsDiscipline: parseFloat(config[0].netWorthWeight.toString()),
      creditUtilization: parseFloat(config[0].spendingBehaviorWeight.toString()),
      onTimePaymentPoints: config[0].onTimePaymentPoints,
      missedPaymentPenalty: config[0].missedPaymentPenalty,
    };
  } catch (error) {
    console.error('[Credit Score] Error getting economic config:', error);
    return {
      paymentReliability: 30,
      accountHistory: 20,
      practiceConsistency: 25,
      savingsDiscipline: 15,
      creditUtilization: 10,
      onTimePaymentPoints: 2,
      missedPaymentPenalty: 15,
    };
  }
}

export async function getCreditScoreComposition(schoolCode: string) {
  const config = await getEconomicConfig(schoolCode);
  return normalizeCreditScoreComposition(config);
}

/**
 * Calculate all credit score factors
 */
async function calculateFactors(userId: number, schoolCode: string, rules: CreditScoreRuleConfig): Promise<CreditScoreFactors> {
  const [paymentReliability, accountHistory, practiceConsistency, savingsDiscipline, creditUtilization] = await Promise.all([
    calculatePaymentReliability(userId, schoolCode, rules),
    calculateAccountHistory(userId, schoolCode),
    calculatePracticeConsistency(userId, schoolCode),
    calculateSavingsDiscipline(userId, schoolCode),
    calculateCreditUtilization(userId, schoolCode),
  ]);

  return {
    paymentReliability,
    accountHistory,
    practiceConsistency,
    savingsDiscipline,
    creditUtilization,
  };
}

/**
 * Calculate final credit score from factors and weights
 */
export function calculateFinalScore(factors: CreditScoreFactors, weights: CreditScoreWeights): number {
  const weightedScore =
    (factors.paymentReliability * weights.paymentReliability +
      factors.accountHistory * weights.accountHistory +
      factors.practiceConsistency * weights.practiceConsistency +
      factors.savingsDiscipline * weights.savingsDiscipline +
      factors.creditUtilization * weights.creditUtilization) /
    100;

  // Scale from 0-100 to 300-850
  const scaledScore = 300 + (weightedScore * 550) / 100;

  return Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, Math.round(scaledScore)));
}

/**
 * Update user's credit score (called monthly)
 */
export async function updateCreditScore(userId: number, schoolCode: string, reason = 'Credit score recalculated from persisted activity'): Promise<number> {
  try {
    console.log(`[Credit Score] Updating credit score for user ${userId}`);

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get current credit score
    const currentScoreData = await db
      .select()
      .from(creditScores)
      .where(and(eq(creditScores.userId, userId), eq(creditScores.schoolCode, schoolCode)))
      .limit(1);

    const previousScore = currentScoreData.length > 0 ? currentScoreData[0].score : 500;

    // Get weights
    const weights = await getEconomicConfig(schoolCode);

    // Calculate factors using the same persisted chapter rules exposed to super admins.
    const factors = await calculateFactors(userId, schoolCode, weights);

    // Calculate new score
    const calculatedScore = calculateFinalScore(factors, weights);
    const newScore = Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, Math.max(previousScore - MAX_SCORE_CHANGE_PER_UPDATE, Math.min(previousScore + MAX_SCORE_CHANGE_PER_UPDATE, calculatedScore))));
    const scoreChange = newScore - previousScore;

    console.log(`[Credit Score] User ${userId}: ${previousScore} → ${newScore} (${scoreChange > 0 ? '+' : ''}${scoreChange})`);

    // Update or create credit score record
    if (currentScoreData.length > 0) {
      await db
        .update(creditScores)
        .set({
          score: newScore,
          paymentReliabilityScore: factors.paymentReliability.toString(),
          accountHistoryScore: factors.accountHistory.toString(),
          practiceConsistencyScore: factors.practiceConsistency.toString(),
          netWorthScore: factors.savingsDiscipline.toString(),
          spendingBehaviorScore: factors.creditUtilization.toString(),
          lastCalculatedDate: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(creditScores.userId, userId), eq(creditScores.schoolCode, schoolCode)));
    } else {
      await db.insert(creditScores).values([{
        userId,
        score: newScore,
        paymentReliabilityScore: factors.paymentReliability.toString(),
        accountHistoryScore: factors.accountHistory.toString(),
        practiceConsistencyScore: factors.practiceConsistency.toString(),
        netWorthScore: factors.savingsDiscipline.toString(),
        spendingBehaviorScore: factors.creditUtilization.toString(),
        schoolCode,
      }]);
    }

    // Log credit history
    await db.insert(creditHistory).values({
      userId,
      previousScore,
      newScore,
      scoreChange,
      factors: JSON.stringify(factors),
      reason,
      schoolCode,
    });

    return newScore;
  } catch (error) {
    console.error('[Credit Score] Error updating credit score:', error);
    throw error;
  }
}

/**
 * Get user's current credit score
 */
export async function getUserCreditScore(userId: number, schoolCode: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 500;

    const scoreData = await db
      .select()
      .from(creditScores)
      .where(and(eq(creditScores.userId, userId), eq(creditScores.schoolCode, schoolCode)))
      .limit(1);

    if (scoreData.length === 0) {
      // Create initial credit score
      await db.insert(creditScores).values({
        userId,
        score: 500,
        schoolCode,
      });
      await db.insert(creditHistory).values({ userId, previousScore: 500, newScore: 500, scoreChange: 0, factors: JSON.stringify({ baseline: true }), reason: 'Initial credit score baseline', schoolCode });
      return 500;
    }

    return scoreData[0].score;
  } catch (error) {
    console.error('[Credit Score] Error getting credit score:', error);
    return 500;
  }
}

/**
 * Get credit score details
 */
export async function getCreditScoreDetails(userId: number, schoolCode: string) {
  try {
    const db = await getDb();
    if (!db) return null;

    const scoreData = await db
      .select()
      .from(creditScores)
      .where(and(eq(creditScores.userId, userId), eq(creditScores.schoolCode, schoolCode)))
      .limit(1);

    if (scoreData.length === 0) {
      return null;
    }

    return scoreData[0];
  } catch (error) {
    console.error('[Credit Score] Error getting credit score details:', error);
    return null;
  }
}

/**
 * Initialize credit score for new user
 */
export async function initializeCreditScore(userId: number, schoolCode: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const existing = await db
      .select()
      .from(creditScores)
      .where(and(eq(creditScores.userId, userId), eq(creditScores.schoolCode, schoolCode)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(creditScores).values([{
        userId,
        score: 500,
        schoolCode,
      }]);
    }
  } catch (error) {
    console.error('[Credit Score] Error initializing credit score:', error);
  }
}
