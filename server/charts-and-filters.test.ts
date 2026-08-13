import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from './db';
import { creditHistory, questions, users } from '../drizzle/schema';

describe('Charts and Filters Features', () => {
  const schoolCode = `TEST-CHART-${Date.now()}`;
  const questionIds = [`Q-EASY-${Date.now()}`, `Q-HARD-${Date.now()}`];
  let testUserId = 0;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error('Database connection failed');
    const user = await database.insert(users).values({ openId: `chart-user-${Date.now()}`, name: 'Chart Test User', schoolCode, role: 'user', loginMethod: 'custom' });
    testUserId = Number(user[0].insertId);
    await database.insert(questions).values([
      { id: questionIds[0], cluster: 'Marketing', instructionalArea: 'Fundamentals', performanceIndicatorFocus: 'Define marketing', cognitiveLevel: 'Recall', difficulty: 'Easy', stem: 'What is marketing?', optionA: 'Selling products', optionB: 'Creating value', optionC: 'Advertising', optionD: 'Promotion', correctAnswer: 'B', rationale: 'Creating value.' },
      { id: questionIds[1], cluster: 'Finance', instructionalArea: 'Analysis', performanceIndicatorFocus: 'Analyze financial data', cognitiveLevel: 'Analyze', difficulty: 'Hard', stem: 'Analyze the financial impact.', optionA: 'Positive', optionB: 'Negative', optionC: 'Neutral', optionD: 'Depends', correctAnswer: 'D', rationale: 'It depends.' },
    ]);
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database || !testUserId) return;
    await database.delete(creditHistory).where(eq(creditHistory.userId, testUserId));
    await database.delete(questions).where(inArray(questions.id, questionIds));
    await database.delete(users).where(eq(users.id, testUserId));
  });

  it('retrieves credit history prepared for chart display', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database connection failed');
    await database.insert(creditHistory).values({ userId: testUserId, previousScore: 640, newScore: 650, scoreChange: 10, factors: JSON.stringify({ paymentHistory: 95 }), reason: 'chart test', schoolCode });
    const [history] = await database.select().from(creditHistory).where(eq(creditHistory.userId, testUserId));
    expect(history).toMatchObject({ previousScore: 640, newScore: 650, scoreChange: 10 });
  });

  it('tracks a chronological score-change series', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database connection failed');
    await database.insert(creditHistory).values({ userId: testUserId, previousScore: 650, newScore: 675, scoreChange: 25, factors: '{}', reason: 'trend test', schoolCode });
    const history = await database.select().from(creditHistory).where(eq(creditHistory.userId, testUserId));
    expect(history.map((entry) => entry.newScore)).toContain(675);
  });

  it('filters the isolated questions by difficulty', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database connection failed');
    const result = await database.select().from(questions).where(and(inArray(questions.id, questionIds), eq(questions.difficulty, 'Easy')));
    expect(result.map((question) => question.id)).toEqual([questionIds[0]]);
  });

  it('filters the isolated questions by cluster', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database connection failed');
    const result = await database.select().from(questions).where(and(inArray(questions.id, questionIds), eq(questions.cluster, 'Finance')));
    expect(result.map((question) => question.id)).toEqual([questionIds[1]]);
  });

  it('filters the isolated questions by cognitive level', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database connection failed');
    const result = await database.select().from(questions).where(and(inArray(questions.id, questionIds), eq(questions.cognitiveLevel, 'Recall')));
    expect(result.map((question) => question.id)).toEqual([questionIds[0]]);
  });

  it('supports deterministic difficulty ordering for the isolated question set', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database connection failed');
    const result = await database.select().from(questions).where(inArray(questions.id, questionIds));
    const sorted = [...result].sort((left, right) => left.difficulty.localeCompare(right.difficulty));
    expect(sorted.map((question) => question.difficulty)).toEqual(['Easy', 'Hard']);
  });
});
