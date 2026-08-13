import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { userAnswers, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("personal report export summary", () => {
  const schoolCode = `TEST-REPORT-${Date.now()}`;
  let memberId = 0;
  let otherMemberId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for report test");
    const stamp = `${Date.now()}-${Math.random()}`;
    const member = await database.insert(users).values({ openId: `report-member-${stamp}`, name: "Report Member", schoolCode, role: "user", loginMethod: "custom" });
    const other = await database.insert(users).values({ openId: `report-other-${stamp}`, name: "Other Member", schoolCode, role: "user", loginMethod: "custom" });
    memberId = Number(member[0].insertId);
    otherMemberId = Number(other[0].insertId);
    await database.insert(userAnswers).values([
      { userId: memberId, questionId: `REPORT-Q1-${stamp}`, selectedAnswer: "A", isCorrect: true, schoolCode },
      { userId: otherMemberId, questionId: `REPORT-Q2-${stamp}`, selectedAnswer: "B", isCorrect: false, schoolCode },
    ]);
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    if (memberId || otherMemberId) await database.delete(userAnswers).where(inArray(userAnswers.userId, [memberId, otherMemberId]));
    if (memberId) await database.delete(users).where(eq(users.id, memberId));
    if (otherMemberId) await database.delete(users).where(eq(users.id, otherMemberId));
  });

  it("returns only the authenticated member's personal learning totals", async () => {
    const caller = appRouter.createCaller(context({ id: memberId, openId: `report-user-${memberId}`, name: "Report Member", schoolCode, loginMethod: "custom", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }));
    await expect(caller.reports.getMySummary()).resolves.toMatchObject({
      member: { id: memberId, name: "Report Member", schoolCode },
      learning: { questionsAnswered: 1, correctAnswers: 1, accuracyPercent: 100 },
      market: { transactionCount: 0, buyVolume: 0, sellVolume: 0 },
      banking: { chargeCount: 0, totalSpending: 0 },
    });
  });
});
