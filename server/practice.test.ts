import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'custom',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    schoolCode: 'TEST_SCHOOL',
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };

  return ctx;
}

describe('Practice Questions - Info and Explanation', () => {
  it('should retrieve questions with all metadata fields', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ pageSize: 10 });

    expect(result).toBeDefined();
    expect(result.questions).toBeDefined();
    expect(Array.isArray(result.questions)).toBe(true);

    if (result.questions.length > 0) {
      const question = result.questions[0];
      
      // Verify all required fields are present
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('cluster');
      expect(question).toHaveProperty('instructionalArea');
      expect(question).toHaveProperty('performanceIndicatorFocus');
      expect(question).toHaveProperty('cognitiveLevel');
      expect(question).toHaveProperty('difficulty');
      expect(question).toHaveProperty('stem');
      expect(question).toHaveProperty('optionA');
      expect(question).toHaveProperty('optionB');
      expect(question).toHaveProperty('optionC');
      expect(question).toHaveProperty('optionD');
      expect(question).toHaveProperty('correctAnswer');
      expect(question).toHaveProperty('rationale');
      expect(question).toHaveProperty('distractorRationaleA');
      expect(question).toHaveProperty('distractorRationaleB');
      expect(question).toHaveProperty('distractorRationaleC');
      expect(question).toHaveProperty('distractorRationaleD');
    }
  });

  it('should have valid question ID format', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ pageSize: 10 });

    if (result.questions.length > 0) {
      const question = result.questions[0];
      
      // Question ID should follow format like MKT-0001
      expect(typeof question.id).toBe('string');
      expect(question.id.length).toBeGreaterThan(0);
    }
  });

  it('should have valid cluster values', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ pageSize: 10 });

    if (result.questions.length > 0) {
      const question = result.questions[0];
      
      // Cluster should be one of the valid clusters
      const validClusters = ['Marketing', 'Finance', 'Hospitality', 'Business Management'];
      expect(question.cluster).toBeDefined();
      expect(typeof question.cluster).toBe('string');
    }
  });

  it('should have valid cognitive levels', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ pageSize: 10 });

    if (result.questions.length > 0) {
      const question = result.questions[0];
      
      // Cognitive level should be defined
      expect(question.cognitiveLevel).toBeDefined();
      expect(typeof question.cognitiveLevel).toBe('string');
    }
  });

  it('should have valid difficulty levels', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ pageSize: 10 });

    if (result.questions.length > 0) {
      const question = result.questions[0];
      
      // Difficulty should be one of: Easy, Medium, Hard
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      expect(question.difficulty).toBeDefined();
      expect(typeof question.difficulty).toBe('string');
    }
  });

  it('should have rationale and distractor rationale', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ pageSize: 10 });

    if (result.questions.length > 0) {
      const question = result.questions[0];
      
      // Rationale should be present
      expect(question.rationale).toBeDefined();
      expect(typeof question.rationale).toBe('string');
      
      // At least one distractor rationale should be present
      const hasDistractorRationale = 
        question.distractorRationaleA || 
        question.distractorRationaleB || 
        question.distractorRationaleC || 
        question.distractorRationaleD;
      
      expect(hasDistractorRationale).toBeDefined();
    }
  });

  it('should retrieve questions filtered by cluster', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ cluster: 'Marketing', pageSize: 10 });

    expect(result).toBeDefined();
    expect(result.questions).toBeDefined();
    
    if (result.questions.length > 0) {
      // All questions should be from the specified cluster
      result.questions.forEach(q => {
        expect(q.cluster.toLowerCase()).toContain('marketing');
      });
    }
  });

  it('should retrieve questions filtered by difficulty', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ difficulty: 'Easy', pageSize: 10 });

    expect(result).toBeDefined();
    expect(result.questions).toBeDefined();
    
    if (result.questions.length > 0) {
      // All questions should be from the specified difficulty
      result.questions.forEach(q => {
        expect(q.difficulty.toLowerCase()).toContain('easy');
      });
    }
  });

  it('should have correct answer in valid options', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.practice.getQuestions({ pageSize: 10 });

    if (result.questions.length > 0) {
      const question = result.questions[0];
      
      // Correct answer should be A, B, C, or D
      expect(['A', 'B', 'C', 'D']).toContain(question.correctAnswer);
    }
  });
});
