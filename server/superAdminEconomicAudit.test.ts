import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { economicAuditLog, economicConfig, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("super-admin economic audit workflow", () => {
  const schoolCode = `TEST-AUDIT-${Date.now()}`;
  let userId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for audit test");
    const inserted = await database.insert(users).values({
      openId: `audit-admin-${Date.now()}-${Math.random()}`,
      name: "Economic Audit Admin",
      schoolCode,
      selectedSchoolCode: schoolCode,
      role: "super_admin",
      loginMethod: "custom",
    });
    userId = Number(inserted[0].insertId);
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    await database.delete(economicAuditLog).where(eq(economicAuditLog.schoolCode, schoolCode));
    await database.delete(economicConfig).where(eq(economicConfig.schoolCode, schoolCode));
    if (userId) await database.delete(users).where(eq(users.id, userId));
  });

  it("persists changed weights and returns the chapter-scoped audit history", async () => {
    const caller = appRouter.createCaller(createContext({
      id: userId,
      openId: `audit-admin-${userId}`,
      name: "Economic Audit Admin",
      schoolCode,
      selectedSchoolCode: schoolCode,
      loginMethod: "custom",
      role: "super_admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.superAdmin.updateEconomicWeights({
      paymentReliabilityWeight: 30,
      accountHistoryWeight: 20,
      practiceConsistencyWeight: 20,
      netWorthWeight: 20,
      spendingBehaviorWeight: 10,
      reason: "Rebalance payment and history emphasis",
    })).resolves.toMatchObject({ success: true, schoolCode, totalWeight: 100 });

    const config = await caller.superAdmin.getEconomicConfig();
    expect(Number(config.paymentReliabilityWeight)).toBe(30);
    expect(Number(config.accountHistoryWeight)).toBe(20);

    const logs = await caller.superAdmin.getEconomicAuditLog();
    expect(logs).toHaveLength(2);
    expect(logs.map((entry) => entry.fieldChanged).sort()).toEqual([
      "accountHistoryWeight",
      "paymentReliabilityWeight",
    ]);
    expect(logs.every((entry) => entry.superAdminId === userId && entry.reason === "Rebalance payment and history emphasis")).toBe(true);

    await expect(caller.superAdmin.getEconomicMonitoring()).resolves.toMatchObject({
      schoolCode,
      sampleWindowDays: 30,
      databaseStatus: "healthy",
      activeUsers: expect.any(Number),
      pressureIndex: expect.any(Number),
    });
  });

  it("blocks non-super-admin callers from all economic configuration procedures", async () => {
    const caller = appRouter.createCaller(createContext({
      id: userId,
      openId: `regular-user-${userId}`,
      name: "Regular User",
      schoolCode,
      loginMethod: "custom",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.superAdmin.getEconomicConfig()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.superAdmin.getEconomicAuditLog()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.superAdmin.getEconomicMonitoring()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.superAdmin.updateEconomicWeights({
      paymentReliabilityWeight: 25,
      accountHistoryWeight: 25,
      practiceConsistencyWeight: 20,
      netWorthWeight: 20,
      spendingBehaviorWeight: 10,
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
