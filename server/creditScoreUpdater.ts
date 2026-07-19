import { getDb } from './db'
import { creditScores, creditHistory, users } from '../drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { getUserCreditScore, getCreditScoreDetails } from './creditScoreEngine'

export async function updateAllCreditScores(): Promise<void> {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')

  // Get all users
  const allUsers = await db.select().from(users)

  for (const user of allUsers) {
    try {
      const schoolCode = user.schoolCode || ''
      
      // Get current credit score
      const oldScore = await getUserCreditScore(user.id, schoolCode)
      
      // Recalculate credit score
      const newScore = await getUserCreditScore(user.id, schoolCode)
      
      // Get score details for history
      const details = await getCreditScoreDetails(user.id, schoolCode)
      
      // Update credit score if changed
      if (oldScore !== newScore) {
        const scoreChange = newScore - oldScore
        
        // Update credit scores table
        const existing = await db
          .select()
          .from(creditScores)
          .where(and(eq(creditScores.userId, user.id), eq(creditScores.schoolCode, schoolCode)))
          .limit(1)

        if (existing.length > 0) {
          await db
            .update(creditScores)
            .set({
              score: newScore,
              lastCalculatedDate: new Date(),
            })
            .where(eq(creditScores.id, existing[0].id))
        } else {
          await db.insert(creditScores).values({
            userId: user.id,
            score: newScore,
            schoolCode,
          })
        }

        // Log to credit history
        await db.insert(creditHistory).values({
          userId: user.id,
          previousScore: oldScore,
          newScore: newScore,
          scoreChange,
          factors: JSON.stringify(details),
          reason: 'Daily credit score update',
          schoolCode,
        })
      }
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
