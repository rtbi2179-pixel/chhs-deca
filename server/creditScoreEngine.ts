import { getDb } from './db';
import { creditScores, creditHistory, userBankAccounts, creditCardPayments, financialProfiles, economicConfig } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const MIN_CREDIT_SCORE = 300;
const MAX_CREDIT_SCORE = 850;

interface CreditScoreFactors {
  paymentReliability: number; // 0-100
  accountHistory: number; // 0-100
  practiceConsistency: number; // 0-100
  netWorth: number; // 0-100
  spendingBehavior: number; // 0-100
}

interface CreditScoreWeights {
  paymentReliability: number; // 25%
  accountHistory: number; // 25%
  practiceConsistency: number; // 20%
  netWorth: number; // 20%
  spendingBehavior: number; // 10%
}

/**
 * Calculate payment reliability factor (25% weight)
 * Based on payment history: on-time, late, and missed payments
 */
async function calculatePaymentReliability(userId: number, schoolCode: string): Promise<number> {
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

    const total = payments.length;
    const onTimePercentage = (onTimeCount / total) * 100;
    const latePercentage = (lateCount / total) * 100;
    const missedPercentage = (missedCount / total) * 100;

    // Score calculation: on-time is good, late is bad, missed is very bad
    let score = 50; // Base score
    score += onTimePercentage * 0.5; // On-time: up to +50
    score -= latePercentage * 0.3; // Late: up to -30
    score -= missedPercentage * 1.0; // Missed: up to -100

    return Math.max(0, Math.min(100, score));
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
    // TODO: Integrate with practice streak system
    // For now, return neutral score
    // This will be updated when practice streak data is available
    return 50;
  } catch (error) {
    console.error('[Credit Score] Error calculating practice consistency:', error);
    return 50;
  }
}

/**
 * Calculate net worth factor (20% weight)
 * Net Worth = Assets - Debt
 */
async function calculateNetWorth(userId: number, schoolCode: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 50;

    const profile = await db
      .select()
      .from(financialProfiles)
      .where(and(eq(financialProfiles.userId, userId), eq(financialProfiles.schoolCode, schoolCode)))
      .limit(1);

    if (profile.length === 0) {
      return 50; // Neutral score
    }

    const netWorth = parseFloat(profile[0].netWorth.toString());

    // Score based on net worth:
    // Negative net worth: 0 points
    // 0-1000: 20 points
    // 1000-5000: 40 points
    // 5000-10000: 60 points
    // 10000-50000: 80 points
    // 50000+: 100 points
    if (netWorth < 0) return 0;
    if (netWorth < 1000) return 20;
    if (netWorth < 5000) return 40;
    if (netWorth < 10000) return 60;
    if (netWorth < 50000) return 80;
    return 100;
  } catch (error) {
    console.error('[Credit Score] Error calculating net worth:', error);
    return 50;
  }
}

/**
 * Calculate spending behavior factor (10% weight)
 * Currently disabled - will be enabled when store functionality exists
 */
async function calculateSpendingBehavior(userId: number, schoolCode: string): Promise<number> {
  try {
    // TODO: Implement when Blue Blazer Store is ready
    // For now, return neutral score
    return 50;
  } catch (error) {
    console.error('[Credit Score] Error calculating spending behavior:', error);
    return 50;
  }
}

/**
 * Get economic configuration for a school
 */
async function getEconomicConfig(schoolCode: string): Promise<CreditScoreWeights> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        paymentReliability: 25,
        accountHistory: 25,
        practiceConsistency: 20,
        netWorth: 20,
        spendingBehavior: 10,
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
        paymentReliability: 25,
        accountHistory: 25,
        practiceConsistency: 20,
        netWorth: 20,
        spendingBehavior: 10,
      };
    }

    return {
      paymentReliability: parseFloat(config[0].paymentReliabilityWeight.toString()),
      accountHistory: parseFloat(config[0].accountHistoryWeight.toString()),
      practiceConsistency: parseFloat(config[0].practiceConsistencyWeight.toString()),
      netWorth: parseFloat(config[0].netWorthWeight.toString()),
      spendingBehavior: parseFloat(config[0].spendingBehaviorWeight.toString()),
    };
  } catch (error) {
    console.error('[Credit Score] Error getting economic config:', error);
    return {
      paymentReliability: 25,
      accountHistory: 25,
      practiceConsistency: 20,
      netWorth: 20,
      spendingBehavior: 10,
    };
  }
}

/**
 * Calculate all credit score factors
 */
async function calculateFactors(userId: number, schoolCode: string): Promise<CreditScoreFactors> {
  const [paymentReliability, accountHistory, practiceConsistency, netWorth, spendingBehavior] = await Promise.all([
    calculatePaymentReliability(userId, schoolCode),
    calculateAccountHistory(userId, schoolCode),
    calculatePracticeConsistency(userId, schoolCode),
    calculateNetWorth(userId, schoolCode),
    calculateSpendingBehavior(userId, schoolCode),
  ]);

  return {
    paymentReliability,
    accountHistory,
    practiceConsistency,
    netWorth,
    spendingBehavior,
  };
}

/**
 * Calculate final credit score from factors and weights
 */
function calculateFinalScore(factors: CreditScoreFactors, weights: CreditScoreWeights): number {
  const weightedScore =
    (factors.paymentReliability * weights.paymentReliability +
      factors.accountHistory * weights.accountHistory +
      factors.practiceConsistency * weights.practiceConsistency +
      factors.netWorth * weights.netWorth +
      factors.spendingBehavior * weights.spendingBehavior) /
    100;

  // Scale from 0-100 to 300-850
  const scaledScore = 300 + (weightedScore * 550) / 100;

  return Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, Math.round(scaledScore)));
}

/**
 * Update user's credit score (called monthly)
 */
export async function updateCreditScore(userId: number, schoolCode: string): Promise<number> {
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

    // Calculate factors
    const factors = await calculateFactors(userId, schoolCode);

    // Get weights
    const weights = await getEconomicConfig(schoolCode);

    // Calculate new score
    const newScore = calculateFinalScore(factors, weights);
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
          netWorthScore: factors.netWorth.toString(),
          spendingBehaviorScore: factors.spendingBehavior.toString(),
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
        netWorthScore: factors.netWorth.toString(),
        spendingBehaviorScore: factors.spendingBehavior.toString(),
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
      reason: 'Monthly update',
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
