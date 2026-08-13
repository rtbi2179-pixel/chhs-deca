import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { savingsInterestAccruals, userBankAccounts, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("savings interest accrual", () => {
  const schoolCode = `TEST-SAVINGS-${Date.now()}`;
  let userId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for savings test");
    const inserted = await database.insert(users).values({ openId: `savings-${Date.now()}-${Math.random()}`, name: "Savings Member", schoolCode, role: "user", loginMethod: "custom" });
    userId = Number(inserted[0].insertId);
    await database.insert(userBankAccounts).values({ userId, schoolCode, checkingBalance: "0.00", savingsBalance: "1200.00", investmentBalance: "0.00", totalDebt: "0.00" });
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database || !userId) return;
    await database.delete(savingsInterestAccruals).where(eq(savingsInterestAccruals.userId, userId));
    await database.delete(userBankAccounts).where(eq(userBankAccounts.userId, userId));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("credits one transparent monthly accrual and blocks a second credit in the same period", async () => {
    const caller = appRouter.createCaller(context({ id: userId, openId: `savings-user-${userId}`, name: "Savings Member", schoolCode, loginMethod: "custom", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }));
    await expect(caller.banking.accrueSavingsInterest()).resolves.toMatchObject({ success: true, apy: 0.5, interestAmount: 0.5, savingsBalance: 1200.5 });
    await expect(caller.banking.accrueSavingsInterest()).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(caller.banking.getBankAccount()).resolves.toMatchObject({ savingsBalance: "1200.50" });
  });
});
