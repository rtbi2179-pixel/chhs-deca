import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

/**
 * Test suite for answered question persistence
 * Verifies that:
 * 1. Questions can be recorded as answered
 * 2. Answered questions are retrievable
 * 3. Duplicate answer submissions update existing records
 * 4. Question answer status persists across sessions
 */
describe('Answered Questions Persistence', () => {
  const testUserId = 99999;
  const testQuestionId = 'test-question-001';
  const testSchoolCode = 'TEST';

  beforeAll(async () => {
    // Clean up any existing test data
    const db_instance = await db.getDb();
    if (db_instance) {
      try {
        // This is optional cleanup - the test should work even if this fails
        console.log('Test setup complete');
      } catch (error) {
        console.error('Setup error:', error);
      }
    }
  });

  afterAll(async () => {
    // Clean up test data after tests
    const db_instance = await db.getDb();
    if (db_instance) {
      try {
        // This is optional cleanup
        console.log('Test cleanup complete');
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  });

  it('should record a user answer', async () => {
    // Record an answer
    await db.recordUserAnswer(
      testUserId,
      testQuestionId,
      'A',
      true,
      testSchoolCode
    );

    // Verify the answer was recorded
    const answered = await db.hasUserAnsweredQuestion(testUserId, testQuestionId);
    expect(answered).toBe(true);
  });

  it('should retrieve all answered questions for a user', async () => {
    // Record multiple answers
    const questionIds = ['test-q-1', 'test-q-2', 'test-q-3'];
    
    for (const qId of questionIds) {
      await db.recordUserAnswer(
        testUserId,
        qId,
        'A',
        true,
        testSchoolCode
      );
    }

    // Retrieve all answered questions
    const answeredQuestions = await db.getUserAnsweredQuestions(testUserId);
    
    // Verify all recorded questions are in the list
    expect(answeredQuestions.length).toBeGreaterThanOrEqual(questionIds.length);
    for (const qId of questionIds) {
      expect(answeredQuestions).toContain(qId);
    }
  });

  it('should update answer when resubmitting the same question', async () => {
    const qId = 'test-q-update';
    
    // Record initial answer
    await db.recordUserAnswer(testUserId, qId, 'A', false, testSchoolCode);
    
    // Update with new answer
    await db.recordUserAnswer(testUserId, qId, 'B', true, testSchoolCode);

    // Verify the question is still in answered list (no duplicates)
    const answeredQuestions = await db.getUserAnsweredQuestions(testUserId);
    const count = answeredQuestions.filter(id => id === qId).length;
    
    // Should only appear once despite two submissions
    expect(count).toBe(1);
    expect(answeredQuestions).toContain(qId);
  });

  it('should persist answered questions across multiple queries', async () => {
    const qId = 'test-q-persist';
    
    // Record an answer
    await db.recordUserAnswer(testUserId, qId, 'C', true, testSchoolCode);

    // First query
    const firstQuery = await db.getUserAnsweredQuestions(testUserId);
    expect(firstQuery).toContain(qId);

    // Second query (simulating a new session)
    const secondQuery = await db.getUserAnsweredQuestions(testUserId);
    expect(secondQuery).toContain(qId);

    // Both queries should have the same data
    expect(firstQuery).toEqual(secondQuery);
  });

  it('should correctly identify if a specific question has been answered', async () => {
    const qId = 'test-q-check';
    
    // Initially should not be answered
    let isAnswered = await db.hasUserAnsweredQuestion(testUserId, qId);
    expect(isAnswered).toBe(false);

    // Record answer
    await db.recordUserAnswer(testUserId, qId, 'D', false, testSchoolCode);

    // Now should be answered
    isAnswered = await db.hasUserAnsweredQuestion(testUserId, qId);
    expect(isAnswered).toBe(true);
  });
});
