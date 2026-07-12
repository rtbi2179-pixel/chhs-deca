import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from './db'
import { users, calendarEvents } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

describe('Calendar Events - School Code Filtering', () => {
  let db: any

  beforeAll(async () => {
    db = await getDb()
  })

  afterAll(async () => {
    // Clean up test data
    if (db) {
      await db.delete(calendarEvents).where(eq(calendarEvents.title, 'Test Event'))
      await db.delete(users).where(eq(users.email, 'test-calendar@example.com'))
    }
  })

  it('should store schoolCode with calendar events', async () => {
    // Create a test user
    const userResult = await db.insert(users).values({
      email: 'test-calendar@example.com',
      schoolCode: 'TEST123',
      name: 'Test User',
      role: 'admin',
      loginMethod: 'custom',
    })

    const userId = userResult[0].insertId

    // Create a calendar event with schoolCode
    const eventResult = await db.insert(calendarEvents).values({
      title: 'Test Event',
      description: 'Test Description',
      date: '2026-07-15',
      type: 'chapter',
      schoolCode: 'TEST123',
      createdBy: userId,
    })

    expect(eventResult).toBeDefined()

    // Verify the event was stored with the correct schoolCode
    const events = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.title, 'Test Event'))

    expect(events).toHaveLength(1)
    expect(events[0].schoolCode).toBe('TEST123')
  })

  it('should filter events by schoolCode', async () => {
    // Create two test users with different school codes
    const user1Result = await db.insert(users).values({
      email: 'test-calendar-1@example.com',
      schoolCode: 'SCHOOL1',
      name: 'Test User 1',
      role: 'admin',
      loginMethod: 'custom',
    })

    const user2Result = await db.insert(users).values({
      email: 'test-calendar-2@example.com',
      schoolCode: 'SCHOOL2',
      name: 'Test User 2',
      role: 'admin',
      loginMethod: 'custom',
    })

    const userId1 = user1Result[0].insertId
    const userId2 = user2Result[0].insertId

    // Create events for each school
    await db.insert(calendarEvents).values({
      title: 'School 1 Event',
      description: 'Event for School 1',
      date: '2026-07-20',
      type: 'chapter',
      schoolCode: 'SCHOOL1',
      createdBy: userId1,
    })

    await db.insert(calendarEvents).values({
      title: 'School 2 Event',
      description: 'Event for School 2',
      date: '2026-07-21',
      type: 'chapter',
      schoolCode: 'SCHOOL2',
      createdBy: userId2,
    })

    // Query events for SCHOOL1 only
    const school1Events = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.schoolCode, 'SCHOOL1'))

    expect(school1Events).toHaveLength(1)
    expect(school1Events[0].title).toBe('School 1 Event')
    expect(school1Events[0].schoolCode).toBe('SCHOOL1')

    // Query events for SCHOOL2 only
    const school2Events = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.schoolCode, 'SCHOOL2'))

    expect(school2Events).toHaveLength(1)
    expect(school2Events[0].title).toBe('School 2 Event')
    expect(school2Events[0].schoolCode).toBe('SCHOOL2')

    // Verify events are isolated by school code
    expect(school1Events[0].id).not.toBe(school2Events[0].id)
  })

  it('should not return events for different school codes', async () => {
    // Create a test user with SCHOOL3
    const userResult = await db.insert(users).values({
      email: 'test-calendar-3@example.com',
      schoolCode: 'SCHOOL3',
      name: 'Test User 3',
      role: 'admin',
      loginMethod: 'custom',
    })

    const userId = userResult[0].insertId

    // Create an event for SCHOOL3
    await db.insert(calendarEvents).values({
      title: 'School 3 Event',
      description: 'Event for School 3',
      date: '2026-07-22',
      type: 'chapter',
      schoolCode: 'SCHOOL3',
      createdBy: userId,
    })

    // Query for SCHOOL1 events (should not include SCHOOL3 event)
    const school1Events = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.schoolCode, 'SCHOOL1'))

    const hasSchool3Event = school1Events.some((e: any) => e.schoolCode === 'SCHOOL3')
    expect(hasSchool3Event).toBe(false)
  })
})
