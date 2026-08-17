import { getDb } from './db'
import { users } from '../drizzle/schema'
import { updateCreditScore } from './creditScoreEngine'

export async function updateAllCreditScores(): Promise<void> {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')

  // Get all users
  const allUsers = await db.select().from(users)

  for (const user of allUsers) {
    try {
      const schoolCode = user.schoolCode || ''
      
      await updateCreditScore(user.id, schoolCode, 'Daily credit score refresh — recorded activity and inactivity applied')
    } catch (error) {
      console.error(`Failed to update credit score for user ${user.id}:`, error)
    }
  }
}

export async function scheduleDailyCreditScoreUpdates(): Promise<void> {
  // This function would be called by Heartbeat scheduler
  // For now, it's a placeholder that can be integrated with the Heartbeat SDK
  console.log('[Credit Score Updater] Daily update scheduled')
}
