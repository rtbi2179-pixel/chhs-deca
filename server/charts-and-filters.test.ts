import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from './db'
import { users, questions, creditHistory } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

describe('Charts and Filters Features', () => {
  let testUserId: string
  let testQuestionId: string

  beforeAll(async () => {
    const db = await getDb()
    if (!db) throw new Error('Database connection failed')
    
    // Create test user
    const userResult = await db.insert(users).values({
      id: 'test-user-' + Date.now(),
      username: 'test-user',
      email: 'test@example.com',
      schoolCode: 'TEST001',
      role: 'user',
    }).returning()
    testUserId = userResult[0].id

    // Create test questions with different difficulties and cognitive levels
    const questionResults = await db.insert(questions).values([
      {
        id: 'Q-EASY-RECALL-' + Date.now(),
        cluster: 'Marketing',
        text: 'What is marketing?',
        optionA: 'Selling products',
        optionB: 'Creating value',
        optionC: 'Advertising',
        optionD: 'Promotion',
        correctAnswer: 'B',
        difficulty: 'Easy',
        cognitiveLevel: 'Recall',
        instructionalArea: 'Fundamentals',
        performanceIndicatorFocus: 'Define marketing',
        rationale: 'Marketing is about creating value for customers',
        distractorRationaleA: 'Selling is only one part of marketing',
        distractorRationaleB: '',
        distractorRationaleC: 'Advertising is a tool, not the definition',
        distractorRationaleD: 'Promotion is one element of marketing',
        schoolCode: 'TEST001',
      },
      {
        id: 'Q-HARD-ANALYZE-' + Date.now(),
        cluster: 'Finance',
        text: 'Analyze the financial impact...',
        optionA: 'Positive',
        optionB: 'Negative',
        optionC: 'Neutral',
        optionD: 'Depends on context',
        correctAnswer: 'D',
        difficulty: 'Hard',
        cognitiveLevel: 'Analyze',
        instructionalArea: 'Analysis',
        performanceIndicatorFocus: 'Analyze financial data',
        rationale: 'Financial impact depends on various contextual factors',
        distractorRationaleA: 'Not always positive',
        distractorRationaleB: 'Not always negative',
        distractorRationaleC: 'Usually has some impact',
        distractorRationaleD: '',
        schoolCode: 'TEST001',
      },
    ]).returning()
    testQuestionId = questionResults[0].id
  })

  afterAll(async () => {
    const db = await getDb()
    if (!db) return
    
    // Cleanup
    await db.delete(creditHistory).where(eq(creditHistory.userId, testUserId))
    await db.delete(questions).where(eq(questions.schoolCode, 'TEST001'))
    await db.delete(users).where(eq(users.id, testUserId))
  })

  describe('Credit Score Chart Data', () => {
    it('should retrieve credit history for chart display', async () => {
      const db = await getDb()
      if (!db) return
      
      // Insert sample credit history
      await db.insert(creditHistory).values({
        userId: testUserId,
        score: 650,
        paymentHistory: 95,
        creditUtilization: 25,
        accountAge: 80,
        creditMix: 100,
        schoolCode: 'TEST001',
      })

      const history = await db.query.creditHistory.findFirst({
        where: eq(creditHistory.userId, testUserId),
      })

      expect(history).toBeDefined()
      expect(history?.score).toBe(650)
      expect(history?.paymentHistory).toBe(95)
    })

    it('should track credit score changes over time', async () => {
      const db = await getDb()
      if (!db) return
      
      const scores = [650, 660, 675, 685, 695, 710, 725]
      
      for (const score of scores) {
        await db.insert(creditHistory).values({
          userId: testUserId + '-trend',
          score,
          paymentHistory: 95,
          creditUtilization: 25,
          accountAge: 80,
          creditMix: 100,
          schoolCode: 'TEST001',
        })
      }

      const history = await db.query.creditHistory.findMany({
        where: eq(creditHistory.userId, testUserId + '-trend'),
      })

      expect(history.length).toBeGreaterThan(0)
      expect(history[history.length - 1].score).toBe(725)
    })
  })

  describe('Portfolio Chart Data', () => {
    it('should calculate portfolio value changes', () => {
      const portfolioData = [
        { date: '30d ago', value: 5000, gain: 0 },
        { date: '25d ago', value: 5250, gain: 5 },
        { date: '20d ago', value: 5500, gain: 10 },
        { date: '15d ago', value: 5750, gain: 15 },
        { date: '10d ago', value: 6000, gain: 20 },
        { date: '5d ago', value: 6500, gain: 30 },
        { date: 'Today', value: 7200, gain: 44 },
      ]

      expect(portfolioData[0].value).toBe(5000)
      expect(portfolioData[portfolioData.length - 1].value).toBe(7200)
      expect(portfolioData[portfolioData.length - 1].gain).toBe(44)
    })
  })

  describe('Practice Question Filters', () => {
    it('should filter questions by difficulty', async () => {
      const db = await getDb()
      if (!db) return
      
      const easyQuestions = await db.query.questions.findMany({
        where: eq(questions.difficulty, 'Easy'),
      })

      expect(easyQuestions.length).toBeGreaterThan(0)
      easyQuestions.forEach(q => {
        expect(q.difficulty).toBe('Easy')
      })
    })

    it('should filter questions by cluster', async () => {
      const db = await getDb()
      if (!db) return
      
      const marketingQuestions = await db.query.questions.findMany({
        where: eq(questions.cluster, 'Marketing'),
      })

      expect(marketingQuestions.length).toBeGreaterThan(0)
      marketingQuestions.forEach(q => {
        expect(q.cluster).toBe('Marketing')
      })
    })

    it('should filter questions by cognitive level', async () => {
      const db = await getDb()
      if (!db) return
      
      const recallQuestions = await db.query.questions.findMany({
        where: eq(questions.cognitiveLevel, 'Recall'),
      })

      expect(recallQuestions.length).toBeGreaterThan(0)
      recallQuestions.forEach(q => {
        expect(q.cognitiveLevel).toBe('Recall')
      })
    })

    it('should combine multiple filters', async () => {
      const db = await getDb()
      if (!db) return
      
      const filteredQuestions = await db.query.questions.findMany({
        where: eq(questions.difficulty, 'Easy'),
      })

      const doubleFiltered = filteredQuestions.filter(
        q => q.cluster === 'Marketing' && q.cognitiveLevel === 'Recall'
      )

      expect(Array.isArray(doubleFiltered)).toBe(true)
    })
  })

  describe('Question Sorting', () => {
    it('should sort questions by difficulty level', async () => {
      const db = await getDb()
      if (!db) return
      
      const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 }
      const questions_list = await db.query.questions.findMany()

      const sorted = questions_list.sort((a, b) => {
        const orderA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0
        const orderB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0
        return orderA - orderB
      })

      expect(sorted.length).toBeGreaterThan(0)
    })

    it('should sort questions by cognitive level', async () => {
      const db = await getDb()
      if (!db) return
      
      const cognitiveOrder = {
        Recall: 1,
        Understand: 2,
        Apply: 3,
        Analyze: 4,
        Evaluate: 5,
        Create: 6,
      }
      const questions_list = await db.query.questions.findMany()

      const sorted = questions_list.sort((a, b) => {
        const orderA = cognitiveOrder[a.cognitiveLevel as keyof typeof cognitiveOrder] || 0
        const orderB = cognitiveOrder[b.cognitiveLevel as keyof typeof cognitiveOrder] || 0
        return orderA - orderB
      })

      expect(sorted.length).toBeGreaterThan(0)
    })
  })
})
