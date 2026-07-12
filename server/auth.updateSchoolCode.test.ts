import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from './db'
import { users } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

describe('Auth - Update School Code', () => {
  let db: any

  beforeAll(async () => {
    db = await getDb()
  })

  afterAll(async () => {
    // Clean up test data
    if (db) {
      await db.delete(users).where(eq(users.email, 'test-schoolcode@example.com'))
    }
  })

  it('should update user school code', async () => {
    // Create a test user
    const userResult = await db.insert(users).values({
      email: 'test-schoolcode@example.com',
      name: 'Test User',
      role: 'super_admin',
      loginMethod: 'custom',
      schoolCode: 'OLD123',
    })

    const userId = userResult[0].insertId

    // Verify initial school code
    let user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    expect(user[0].schoolCode).toBe('OLD123')

    // Update school code using the db function
    const { updateUserSchoolCode } = await import('./db')
    await updateUserSchoolCode(userId, 'NEW456')

    // Verify school code was updated
    user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    expect(user[0].schoolCode).toBe('NEW456')
  })

  it('should allow super admin to change school code multiple times', async () => {
    // Create a test user
    const userResult = await db.insert(users).values({
      email: 'test-schoolcode-multi@example.com',
      name: 'Test User Multi',
      role: 'super_admin',
      loginMethod: 'custom',
      schoolCode: 'INITIAL',
    })

    const userId = userResult[0].insertId
    const { updateUserSchoolCode } = await import('./db')

    // Update multiple times
    await updateUserSchoolCode(userId, 'FIRST')
    let user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    expect(user[0].schoolCode).toBe('FIRST')

    await updateUserSchoolCode(userId, 'SECOND')
    user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    expect(user[0].schoolCode).toBe('SECOND')

    await updateUserSchoolCode(userId, 'THIRD')
    user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    expect(user[0].schoolCode).toBe('THIRD')

    // Clean up
    await db.delete(users).where(eq(users.email, 'test-schoolcode-multi@example.com'))
  })
})
