import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { getDb, getLeaderboard } from './db';
import { leaderboard, userAnswers, users } from '../drizzle/schema';

describe('answer-derived leaderboard accuracy', () => {
  const marker = `TEST-LEADERBOARD-${Date.now()}`;
  let firstUserId = 0;
  let secondUserId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error('Database unavailable for leaderboard test');
    const first = await database.insert(users).values({
      openId: `${marker}-first`, name: 'Accurate First', schoolCode: marker, role: 'user', loginMethod: 'custom',
    });
    const second = await database.insert(users).values({
      openId: `${marker}-second`, name: 'Accurate Second', schoolCode: marker, role: 'user', loginMethod: 'custom',
    });
    firstUserId = Number(first[0].insertId);
    secondUserId = Number(second[0].insertId);

    await database.insert(userAnswers).values([
      { userId: firstUserId, questionId: `${marker}-1`, selectedAnswer: 'A', isCorrect: true, schoolCode: marker },
      { userId: firstUserId, questionId: `${marker}-2`, selectedAnswer: 'B', isCorrect: false, schoolCode: marker },
      { userId: firstUserId, questionId: `${marker}-3`, selectedAnswer: 'C', isCorrect: true, schoolCode: marker },
      { userId: secondUserId, questionId: `${marker}-4`, selectedAnswer: 'A', isCorrect: true, schoolCode: marker },
      { userId: secondUserId, questionId: `${marker}-5`, selectedAnswer: 'D', isCorrect: false, schoolCode: marker },
    ]);

    await database.insert(leaderboard).values({
      userId: firstUserId,
      totalQuestionsAnswered: 999,
      totalCorrectAnswers: 1,
      accuracyPercentage: 0,
    });
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    const ids = [firstUserId, secondUserId].filter(Boolean);
    if (!ids.length) return;
    await database.delete(userAnswers).where(inArray(userAnswers.userId, ids));
    await database.delete(leaderboard).where(inArray(leaderboard.userId, ids));
    await database.delete(users).where(inArray(users.id, ids));
  });

  it('uses actual answered and correct records, ignoring stale aggregate values', async () => {
    const entries = await getLeaderboard(1000);
    const first = entries.find((entry) => entry.user.id === firstUserId);
    const second = entries.find((entry) => entry.user.id === secondUserId);

    expect(first?.leaderboard).toMatchObject({
      totalQuestionsAnswered: 3,
      totalCorrectAnswers: 2,
      accuracyPercentage: 67,
    });
    expect(second?.leaderboard).toMatchObject({
      totalQuestionsAnswered: 2,
      totalCorrectAnswers: 1,
      accuracyPercentage: 50,
    });
    expect(entries.findIndex((entry) => entry.user.id === firstUserId)).toBeLessThan(entries.findIndex((entry) => entry.user.id === secondUserId));
  });
});
