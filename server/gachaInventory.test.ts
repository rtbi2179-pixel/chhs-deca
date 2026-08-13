import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { cosmetics, userCosmetics, users } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const schoolCode = `TEST-GACHA-${Date.now()}`;
const openId = `test-gacha-${Date.now()}`;
let userId = 0;
let firstInventoryId = 0;
let secondInventoryId = 0;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId,
    email: `${openId}@example.test`,
    name: "Gacha Test User",
    loginMethod: "custom",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    schoolCode,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("gacha inventory", () => {
  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database connection is required for gacha inventory tests");

    const createdUser = await database.insert(users).values({
      openId,
      email: `${openId}@example.test`,
      name: "Gacha Test User",
      loginMethod: "custom",
      schoolCode,
      role: "user",
    });
    userId = Number(createdUser[0].insertId);

    const firstCosmetic = await database.insert(cosmetics).values({
      name: "Test Frame One",
      type: "profile_frame",
      rarity: "common",
      cost: 100,
      schoolCode,
    });
    const secondCosmetic = await database.insert(cosmetics).values({
      name: "Test Frame Two",
      type: "profile_frame",
      rarity: "rare",
      cost: 250,
      schoolCode,
    });

    const firstInventory = await database.insert(userCosmetics).values({
      userId,
      cosmeticId: Number(firstCosmetic[0].insertId),
      schoolCode,
      isEquipped: true,
    });
    const secondInventory = await database.insert(userCosmetics).values({
      userId,
      cosmeticId: Number(secondCosmetic[0].insertId),
      schoolCode,
      isEquipped: false,
    });

    firstInventoryId = Number(firstInventory[0].insertId);
    secondInventoryId = Number(secondInventory[0].insertId);
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database || !userId) return;
    await database.delete(userCosmetics).where(eq(userCosmetics.userId, userId));
    await database.delete(cosmetics).where(eq(cosmetics.schoolCode, schoolCode));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("equips the selected inventory entry and unequips another cosmetic of the same type", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.gacha.equipCosmetic({ userCosmeticId: secondInventoryId })).resolves.toMatchObject({
      success: true,
      equippedType: "profile_frame",
    });

    const database = await getDb();
    if (!database) throw new Error("Database connection is required for gacha inventory tests");
    const inventory = await database
      .select()
      .from(userCosmetics)
      .where(and(eq(userCosmetics.userId, userId), eq(userCosmetics.schoolCode, schoolCode)));

    expect(inventory.find((entry) => entry.id === firstInventoryId)?.isEquipped).toBe(false);
    expect(inventory.find((entry) => entry.id === secondInventoryId)?.isEquipped).toBe(true);
  });

  it("does not allow a user to equip an inventory record they do not own", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.gacha.equipCosmetic({ userCosmeticId: 999999999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
