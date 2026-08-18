import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { awardBlueBucks, getDb } from "./db";
import { blueBucks, blueBucksTransactions, userBankAccounts, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

describe("Blue Bucks automatic checking credits", () => {
  const schoolCode = `TEST-BANK-DEPOSIT-${Date.now()}`;
  let userId = 0;

  const caller = () => appRouter.createCaller({
    user: { id: userId, openId: `bank-deposit-${userId}`, name: "Bank Deposit Member", schoolCode, role: "user", loginMethod: "custom", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } satisfies AuthenticatedUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const created = await database.insert(users).values({ openId: `bank-deposit-${Date.now()}-${Math.random()}`, name: "Bank Deposit Member", schoolCode, role: "user", loginMethod: "custom" });
    userId = Number(created[0].insertId);
    await database.insert(blueBucks).values({ userId, amount: 0 });
    await database.insert(userBankAccounts).values({ userId, checkingBalance: "0.00", savingsBalance: "0.00", investmentBalance: "0.00", totalDebt: "0.00", schoolCode });
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    await database.delete(blueBucksTransactions).where(and(eq(blueBucksTransactions.userId, userId), eq(blueBucksTransactions.schoolCode, schoolCode)));
    await database.delete(userBankAccounts).where(eq(userBankAccounts.userId, userId));
    await database.delete(blueBucks).where(eq(blueBucks.userId, userId));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("credits earned Blue Bucks directly into checking and writes an audit-ready ledger entry", async () => {
    await expect(awardBlueBucks(userId, 20, "correct_first_attempt", schoolCode, 919191)).resolves.toBe(true);
    await expect(caller().practice.getBlueBucksBalance()).resolves.toEqual({ balance: 20 });
    await expect(caller().banking.getBankAccount()).resolves.toMatchObject({ checkingBalance: "20.00" });
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const [ledger] = await database.select().from(blueBucksTransactions).where(and(eq(blueBucksTransactions.userId, userId), eq(blueBucksTransactions.schoolCode, schoolCode))).limit(1);
    expect(ledger).toMatchObject({ amount: 20, reason: "correct_first_attempt" });
  });

  it("rejects the retired manual wallet-to-checking conversion without changing checking", async () => {
    await expect(caller().banking.depositBlueBucksToChecking({ amount: 1 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(caller().banking.getBankAccount()).resolves.toMatchObject({ checkingBalance: "0.00" });
    await expect(caller().practice.getBlueBucksBalance()).resolves.toEqual({ balance: 0 });
  });
});
