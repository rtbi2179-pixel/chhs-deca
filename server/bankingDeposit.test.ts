import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { blueBucks, blueBucksTransactions, userBankAccounts, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

describe("Blue Bucks checking deposits", () => {
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
    await database.insert(blueBucks).values({ userId, amount: 50 });
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

  it("atomically converts earned Blue Bucks into checking funds and writes an audit-ready ledger entry", async () => {
    await expect(caller().banking.depositBlueBucksToChecking({ amount: 20 })).resolves.toEqual({ success: true, deposited: 20, checkingBalance: 20, remainingBlueBucks: 30 });
    await expect(caller().practice.getBlueBucksBalance()).resolves.toEqual({ balance: 30 });
    await expect(caller().banking.getBankAccount()).resolves.toMatchObject({ checkingBalance: "20.00" });
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const [ledger] = await database.select().from(blueBucksTransactions).where(and(eq(blueBucksTransactions.userId, userId), eq(blueBucksTransactions.schoolCode, schoolCode))).limit(1);
    expect(ledger).toMatchObject({ amount: -20, reason: "bank_deposit" });
  });

  it("rejects deposits exceeding the member’s earned Blue Bucks without changing checking", async () => {
    await expect(caller().banking.depositBlueBucksToChecking({ amount: 51 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller().banking.getBankAccount()).resolves.toMatchObject({ checkingBalance: "0.00" });
    await expect(caller().practice.getBlueBucksBalance()).resolves.toEqual({ balance: 50 });
  });
});
