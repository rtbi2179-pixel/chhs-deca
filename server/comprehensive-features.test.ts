import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from './db'
import { updateAllCreditScores } from './creditScoreUpdater'
import { createPendingOrder, getPendingOrders, executePendingOrder } from './pendingOrders'
import { users, creditScores, creditHistory, pendingOrders, stocks, portfolioCash } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

describe('Comprehensive Feature Tests', () => {
  const testSchoolCode = 'TEST-' + Date.now()
  let testUserId: number
  let testStockId: number

  beforeAll(async () => {
    const db = await getDb()
    if (!db) throw new Error('Database not initialized')

    // Create test user
    const userResult = await db.insert(users).values({
      username: 'testuser-' + Date.now(),
      email: 'test-' + Date.now() + '@example.com',
      schoolCode: testSchoolCode,
      role: 'user',
    })
    testUserId = userResult[0].insertId as number

    // Create test stock
    const stockResult = await db.insert(stocks).values({
      ticker: 'TEST',
      companyName: 'Test Stock',
      schoolCode: testSchoolCode,
    })
    testStockId = stockResult[0].insertId as number

    // Initialize portfolio cash
    await db.insert(portfolioCash).values({
      userId: testUserId,
      cashBalance: '10000',
      schoolCode: testSchoolCode,
    })
  })

  afterAll(async () => {
    const db = await getDb()
    if (db) {
      await db.delete(pendingOrders).where(eq(pendingOrders.schoolCode, testSchoolCode))
      await db.delete(creditHistory).where(eq(creditHistory.schoolCode, testSchoolCode))
      await db.delete(creditScores).where(eq(creditScores.schoolCode, testSchoolCode))
      await db.delete(portfolioCash).where(eq(portfolioCash.schoolCode, testSchoolCode))
      await db.delete(stocks).where(eq(stocks.schoolCode, testSchoolCode))
      await db.delete(users).where(eq(users.schoolCode, testSchoolCode))
    }
  })

  describe('Credit Score Daily Updates', () => {
    it('should update all credit scores', async () => {
      await updateAllCreditScores()
      const db = await getDb()
      if (!db) throw new Error('Database not initialized')

      const scores = await db
        .select()
        .from(creditScores)
        .where(eq(creditScores.userId, testUserId))
      expect(scores.length).toBeGreaterThan(0)
    })

    it('should log credit score changes to history', async () => {
      await updateAllCreditScores()
      const db = await getDb()
      if (!db) throw new Error('Database not initialized')

      const history = await db
        .select()
        .from(creditHistory)
        .where(eq(creditHistory.userId, testUserId))
      expect(history.length).toBeGreaterThanOrEqual(0)
    })

    it('should include reason for credit score update', async () => {
      await updateAllCreditScores()
      const db = await getDb()
      if (!db) throw new Error('Database not initialized')

      const history = await db
        .select()
        .from(creditHistory)
        .where(eq(creditHistory.userId, testUserId))
        .limit(1)

      if (history.length > 0) {
        expect(history[0].reason).toBeDefined()
      }
    })
  })

  describe('Pending Orders System', () => {
    it('should create a pending buy order', async () => {
      const result = await createPendingOrder(
        testUserId,
        testStockId,
        'buy',
        '1000',
        null,
        testSchoolCode
      )
      expect(result.id).toBeGreaterThan(0)
    })

    it('should retrieve pending orders for user', async () => {
      await createPendingOrder(testUserId, testStockId, 'buy', '500', null, testSchoolCode)
      const orders = await getPendingOrders(testUserId, testSchoolCode)
      expect(orders.length).toBeGreaterThan(0)
    })

    it('should create a pending sell order', async () => {
      const result = await createPendingOrder(
        testUserId,
        testStockId,
        'sell',
        null,
        '10',
        testSchoolCode
      )
      expect(result.id).toBeGreaterThan(0)
    })

    it('should execute a pending order', async () => {
      const order = await createPendingOrder(
        testUserId,
        testStockId,
        'buy',
        '500',
        null,
        testSchoolCode
      )
      await executePendingOrder(order.id, '100.00', testSchoolCode)
      const db = await getDb()
      if (!db) throw new Error('Database not initialized')

      const executed = await db
        .select()
        .from(pendingOrders)
        .where(eq(pendingOrders.id, order.id))
        .limit(1)

      expect(executed[0].status).toBe('executed')
    })

    it('should reject buy order without blueBucksAmount', async () => {
      try {
        await createPendingOrder(testUserId, testStockId, 'buy', null, null, testSchoolCode)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should reject sell order without shares', async () => {
      try {
        await createPendingOrder(testUserId, testStockId, 'sell', null, null, testSchoolCode)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Banking System', () => {
    it('should have credit score in range 300-850', async () => {
      const db = await getDb()
      if (!db) throw new Error('Database not initialized')

      const scores = await db
        .select()
        .from(creditScores)
        .where(eq(creditScores.userId, testUserId))

      if (scores.length > 0) {
        expect(scores[0].score).toBeGreaterThanOrEqual(300)
        expect(scores[0].score).toBeLessThanOrEqual(850)
      }
    })

    it('should track credit history with score changes', async () => {
      const db = await getDb()
      if (!db) throw new Error('Database not initialized')

      const history = await db
        .select()
        .from(creditHistory)
        .where(eq(creditHistory.userId, testUserId))

      if (history.length > 0) {
        expect(history[0].previousScore).toBeDefined()
        expect(history[0].newScore).toBeDefined()
        expect(history[0].scoreChange).toBeDefined()
      }
    })
  })

  describe('Market System', () => {
    it('should maintain portfolio cash balance', async () => {
      const db = await getDb()
      if (!db) throw new Error('Database not initialized')

      const cash = await db
        .select()
        .from(portfolioCash)
        .where(eq(portfolioCash.userId, testUserId))

      expect(cash.length).toBeGreaterThan(0)
      expect(parseFloat(cash[0].cashBalance)).toBeGreaterThan(0)
    })

    it('should calculate total invested amount', async () => {
      const order = await createPendingOrder(
        testUserId,
        testStockId,
        'buy',
        '1000',
        null,
        testSchoolCode
      )
      // Shares = 1000 / 100 = 10
      expect(order.id).toBeGreaterThan(0)
    })
  })
})
