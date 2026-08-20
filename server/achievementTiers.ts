import { desc, eq, sql } from "drizzle-orm";
import { achievementUnlocks, users } from "../drizzle/schema";
import { ACHIEVEMENT_TIER_DEFINITIONS, type AchievementId, type AchievementTier } from "../shared/achievementTiers";
import * as db from "./db";

type AchievementUser = { id: number; schoolCode?: string | null };

export type AchievementUnlock = {
  achievementId: AchievementId;
  achievementTitle: string;
  tier: AchievementTier;
  tierLabel: string;
  criteria: string;
};

function focusDays(eventSelectedAt: Date | null) {
  if (!eventSelectedAt) return 0;
  const elapsed = Math.floor((Date.now() - eventSelectedAt.getTime()) / 86_400_000);
  return Math.max(1, elapsed + 1);
}

export async function getAchievementTierSummary(user: AchievementUser) {
  const database = await db.getDb();
  if (!database) throw new Error("Achievement storage is unavailable");

  const [learning, accountRows, portfolio, recordedUnlocks] = await Promise.all([
    db.getProfileLearningMetrics(user.id),
    database.select({ primaryEventCode: users.primaryEventCode, eventSelectedAt: users.eventSelectedAt }).from(users).where(eq(users.id, user.id)).limit(1),
    user.schoolCode ? db.getPortfolioItems(user.id, user.schoolCode) : Promise.resolve([]),
    database.select().from(achievementUnlocks).where(eq(achievementUnlocks.userId, user.id)).orderBy(desc(achievementUnlocks.unlockedAt)),
  ]);

  const metrics = {
    questionsAnswered: learning.questionsAnswered,
    accuracy: learning.accuracyPercent,
    studyStreak: learning.studyStreak,
    savedQuestions: learning.savedQuestions,
    eventFocusDays: accountRows[0]?.primaryEventCode ? focusDays(accountRows[0]?.eventSelectedAt ?? null) : 0,
    portfolioItems: portfolio.length,
  };
  const recordedKeys = new Set(recordedUnlocks.map((unlock) => `${unlock.achievementId}:${unlock.tier}`));
  const achievements = ACHIEVEMENT_TIER_DEFINITIONS.map((achievement) => {
    const value = metrics[achievement.metric];
    const tiers = achievement.tiers.map((tier) => {
      const minimumQuestions = "minimumQuestions" in tier ? tier.minimumQuestions : undefined;
      const hasMinimumSample = !minimumQuestions || metrics.questionsAnswered >= minimumQuestions;
      const earned = hasMinimumSample && value >= tier.threshold;
      return { ...tier, value, earned, progressPercent: Math.min(100, Math.round((value / tier.threshold) * 100)) };
    });
    return { ...achievement, value, tiers };
  });
  const earnedUnlocks: AchievementUnlock[] = achievements.flatMap((achievement) => achievement.tiers.filter((tier) => tier.earned).map((tier) => ({ achievementId: achievement.id as AchievementId, achievementTitle: achievement.title, tier: tier.tier, tierLabel: tier.label, criteria: tier.criteria })));
  const pendingUnlocks = earnedUnlocks.filter((unlock) => !recordedKeys.has(`${unlock.achievementId}:${unlock.tier}`));
  const nextUnlock = achievements.flatMap((achievement) => achievement.tiers.filter((tier) => !tier.earned).map((tier) => ({ achievementId: achievement.id, achievementTitle: achievement.title, tier: tier.tier, tierLabel: tier.label, criteria: tier.criteria, value: tier.value, threshold: tier.threshold, progressPercent: tier.progressPercent }))).sort((left, right) => right.progressPercent - left.progressPercent)[0] ?? null;

  return { achievements, earnedCount: earnedUnlocks.length, tierCount: ACHIEVEMENT_TIER_DEFINITIONS.length * 3, pendingUnlocks, nextUnlock };
}

export async function recordAchievementUnlocks(user: AchievementUser, requestedUnlocks: Array<{ achievementId: string; tier: AchievementTier }>): Promise<{ unlocked: AchievementUnlock[] }> {
  const database = await db.getDb();
  if (!database) throw new Error("Achievement storage is unavailable");
  const summary = await getAchievementTierSummary(user);
  const eligible = new Map<string, AchievementUnlock>(summary.pendingUnlocks.map((unlock) => [`${unlock.achievementId}:${unlock.tier}`, unlock]));
  const requested = requestedUnlocks.flatMap((unlock) => {
    const eligibleUnlock = eligible.get(`${unlock.achievementId}:${unlock.tier}`);
    return eligibleUnlock ? [eligibleUnlock] : [];
  });
  if (!requested.length) return { unlocked: [] as AchievementUnlock[] };

  const existing = await database.select({ achievementId: achievementUnlocks.achievementId, tier: achievementUnlocks.tier }).from(achievementUnlocks).where(eq(achievementUnlocks.userId, user.id));
  const existingKeys = new Set(existing.map((unlock) => `${unlock.achievementId}:${unlock.tier}`));
  const newUnlocks = requested.filter((unlock) => !existingKeys.has(`${unlock.achievementId}:${unlock.tier}`));
  if (!newUnlocks.length) return { unlocked: [] as AchievementUnlock[] };

  await database.insert(achievementUnlocks).values(newUnlocks.map((unlock) => ({ userId: user.id, achievementId: unlock.achievementId, tier: unlock.tier }))).onDuplicateKeyUpdate({ set: { unlockedAt: sql`unlockedAt` } });
  return { unlocked: newUnlocks };
}
