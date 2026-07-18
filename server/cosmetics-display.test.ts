import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getDb } from './db'
import { users, cosmetics, userCosmetics } from '../drizzle/schema'
import { eq, and } from 'drizzle-orm'

describe('Cosmetics Display', () => {
  let db: any
  let testUserId: number

  beforeAll(async () => {
    db = await getDb()
    // Create test user
    const userResult = await db.insert(users).values({
      username: `test_cosmetics_${Date.now()}`,
      passwordHash: 'hash',
      schoolCode: 'TEST',
      role: 'user',
    })
    testUserId = userResult[0].insertId
  })

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.delete(userCosmetics).where(eq(userCosmetics.userId, testUserId))
      await db.delete(users).where(eq(users.id, testUserId))
    }
  })

  it('should display equipped profile frame cosmetic', async () => {
    // Create a cosmetic
    const cosmeticResult = await db.insert(cosmetics).values({
      name: 'Gold Frame',
      type: 'profile_frame',
      rarity: 'epic',
      cost: 500,
      imageUrl: 'https://example.com/frame.png',
      schoolCode: 'TEST',
    })
    const cosmeticId = cosmeticResult[0].insertId

    // Add to user's cosmetics and equip
    await db.insert(userCosmetics).values({
      userId: testUserId,
      cosmeticId,
      isEquipped: true,
      schoolCode: 'TEST',
    })

    // Fetch user cosmetics
    const result = await db
      .select({
        cosmetics: {
          id: cosmetics.id,
          name: cosmetics.name,
          type: cosmetics.type,
          imageUrl: cosmetics.imageUrl,
          rarity: cosmetics.rarity,
        },
        userCosmetics: {
          isEquipped: userCosmetics.isEquipped,
        },
      })
      .from(userCosmetics)
      .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
      .where(eq(userCosmetics.userId, testUserId))

    expect(result).toHaveLength(1)
    expect(result[0].cosmetics.name).toBe('Gold Frame')
    expect(result[0].cosmetics.type).toBe('profile_frame')
    expect(result[0].userCosmetics.isEquipped).toBe(true)
  })

  it('should display equipped banner cosmetic', async () => {
    // Create a banner cosmetic
    const cosmeticResult = await db.insert(cosmetics).values({
      name: 'Starry Banner',
      type: 'banner',
      rarity: 'rare',
      cost: 250,
      imageUrl: 'https://example.com/banner.png',
      schoolCode: 'TEST',
    })
    const cosmeticId = cosmeticResult[0].insertId

    // Add to user's cosmetics and equip
    await db.insert(userCosmetics).values({
      userId: testUserId,
      cosmeticId,
      isEquipped: true,
      schoolCode: 'TEST',
    })

    // Fetch user cosmetics
    const result = await db
      .select({
        cosmetics: {
          id: cosmetics.id,
          name: cosmetics.name,
          type: cosmetics.type,
          imageUrl: cosmetics.imageUrl,
          rarity: cosmetics.rarity,
        },
        userCosmetics: {
          isEquipped: userCosmetics.isEquipped,
        },
      })
      .from(userCosmetics)
      .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
      .where(eq(userCosmetics.userId, testUserId))

    expect(result.some(r => r.cosmetics.type === 'banner')).toBe(true)
  })

  it('should display cosmetics with correct rarity levels', async () => {
    // Create cosmetics with different rarities
    const rarities = ['common', 'rare', 'epic', 'legendary']

    for (const rarity of rarities) {
      const cosmeticResult = await db.insert(cosmetics).values({
        name: `${rarity} Cosmetic`,
        type: 'profile_frame',
        rarity,
        cost: 100,
        imageUrl: 'https://example.com/cosmetic.png',
        schoolCode: 'TEST',
      })

      await db.insert(userCosmetics).values({
        userId: testUserId,
        cosmeticId: cosmeticResult[0].insertId,
        isEquipped: false,
        schoolCode: 'TEST',
      })
    }

    // Fetch all user cosmetics
    const result = await db
      .select({
        cosmetics: {
          rarity: cosmetics.rarity,
        },
      })
      .from(userCosmetics)
      .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
      .where(eq(userCosmetics.userId, testUserId))

    const fetchedRarities = result.map(r => r.cosmetics.rarity)
    expect(fetchedRarities).toContain('common')
    expect(fetchedRarities).toContain('rare')
    expect(fetchedRarities).toContain('epic')
    expect(fetchedRarities).toContain('legendary')
  })
})
