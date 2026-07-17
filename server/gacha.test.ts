import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { users, cosmetics, gachaPulls, userCosmetics, blueBucks } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Gacha System', () => {
  let database: any;
  let testUserId: number;
  let testCosmeticId: number;

  beforeAll(async () => {
    database = await getDb();
    if (!database) throw new Error('Failed to connect to database');

    // Create test user
    const userResult = await database
      .insert(users)
      .values({
        username: `test-gacha-${Date.now()}`,
        passwordHash: 'hash',
        schoolCode: 'TEST_SCHOOL',
        name: 'Test User',
        email: `test-gacha-${Date.now()}@test.com`,
      });
    testUserId = userResult[0].insertId;

    // Create test cosmetic
    const cosmeticResult = await database
      .insert(cosmetics)
      .values({
        name: 'Test Frame',
        type: 'profile_frame',
        rarity: 'common',
        cost: 100,
        schoolCode: 'TEST_SCHOOL',
        description: 'A test cosmetic',
      });
    testCosmeticId = cosmeticResult[0].insertId;

    // Initialize blue bucks for test user
    await database
      .insert(blueBucks)
      .values({
        userId: testUserId,
        amount: 10000,
      });
  });

  afterAll(async () => {
    if (!database) return;

    // Clean up test data
    await database
      .delete(gachaPulls)
      .where(eq(gachaPulls.userId, testUserId));

    await database
      .delete(userCosmetics)
      .where(eq(userCosmetics.userId, testUserId));

    await database
      .delete(blueBucks)
      .where(eq(blueBucks.userId, testUserId));

    await database
      .delete(users)
      .where(eq(users.id, testUserId));

    await database
      .delete(cosmetics)
      .where(eq(cosmetics.id, testCosmeticId));
  });

  it('should record gacha pulls in pull history', async () => {
    // Insert a gacha pull
    await database
      .insert(gachaPulls)
      .values({
        userId: testUserId,
        cosmeticId: testCosmeticId,
        rarityObtained: 'common',
        pointsSpent: 100,
        schoolCode: 'TEST_SCHOOL',
      });

    // Fetch pull history
    const history = await database
      .select()
      .from(gachaPulls)
      .innerJoin(cosmetics, eq(gachaPulls.cosmeticId, cosmetics.id))
      .where(eq(gachaPulls.userId, testUserId));

    expect(history.length).toBeGreaterThan(0);
    expect(history[0].gachaPulls.rarityObtained).toBe('common');
    expect(history[0].gachaPulls.pointsSpent).toBe(100);
    expect(history[0].cosmetics.name).toBe('Test Frame');
  });

  it('should track user cosmetics inventory', async () => {
    // Add cosmetic to user inventory
    await database
      .insert(userCosmetics)
      .values({
        userId: testUserId,
        cosmeticId: testCosmeticId,
        schoolCode: 'TEST_SCHOOL',
      });

    // Fetch user cosmetics
    const inventory = await database
      .select()
      .from(userCosmetics)
      .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
      .where(eq(userCosmetics.userId, testUserId));

    expect(inventory.length).toBeGreaterThan(0);
    expect(inventory[0].cosmetics.name).toBe('Test Frame');
    expect(inventory[0].userCosmetics.isEquipped).toBe(false);
  });

  it('should support equipping cosmetics', async () => {
    // Get user cosmetic
    const userCosmeticResult = await database
      .select()
      .from(userCosmetics)
      .where(eq(userCosmetics.userId, testUserId));

    if (userCosmeticResult.length === 0) {
      throw new Error('No user cosmetics found');
    }

    const userCosmeticId = userCosmeticResult[0].id;

    // Equip cosmetic
    await database
      .update(userCosmetics)
      .set({ isEquipped: true })
      .where(eq(userCosmetics.id, userCosmeticId));

    // Verify cosmetic is equipped
    const equipped = await database
      .select()
      .from(userCosmetics)
      .where(eq(userCosmetics.id, userCosmeticId));

    expect(equipped[0].isEquipped).toBe(true);
  });

  it('should track multiple pulls in history', async () => {
    // Insert multiple pulls
    for (let i = 0; i < 3; i++) {
      await database
        .insert(gachaPulls)
        .values({
          userId: testUserId,
          cosmeticId: testCosmeticId,
          rarityObtained: ['common', 'rare', 'epic'][i],
          pointsSpent: [100, 250, 500][i],
          schoolCode: 'TEST_SCHOOL',
        });
    }

    // Fetch all pulls for user
    const allPulls = await database
      .select()
      .from(gachaPulls)
      .where(eq(gachaPulls.userId, testUserId));

    // Should have at least 3 pulls (1 from first test + 3 from this test)
    expect(allPulls.length).toBeGreaterThanOrEqual(3);
  });
});
