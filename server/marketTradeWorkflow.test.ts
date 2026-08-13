import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { marketTransactions, portfolioCash, portfolioHoldings, portfolioSnapshots, stocks, users } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
const schoolCode = `TEST-MARKET-${Date.now()}`;
const openId = `test-market-${Date.now()}`;
let userId = 0;
let stockId = 0;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = { id: userId, openId, email: `${openId}@example.test`, name: "Market Test User", loginMethod: "custom", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), schoolCode };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("market trade workflow", () => {
  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database connection is required for market workflow tests");
    const user = await database.insert(users).values({ openId, email: `${openId}@example.test`, name: "Market Test User", loginMethod: "custom", role: "user", schoolCode });
    userId = Number(user[0].insertId);
    const stock = await database.insert(stocks).values({ ticker: `T${Date.now().toString().slice(-6)}`, companyName: "Test Market Co.", schoolCode, isActive: true });
    stockId = Number(stock[0].insertId);
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database || !userId) return;
    await database.delete(portfolioSnapshots).where(eq(portfolioSnapshots.userId, userId));
    await database.delete(marketTransactions).where(eq(marketTransactions.userId, userId));
    await database.delete(portfolioHoldings).where(eq(portfolioHoldings.userId, userId));
    await database.delete(portfolioCash).where(eq(portfolioCash.userId, userId));
    await database.delete(stocks).where(eq(stocks.id, stockId));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("settles a buy and sell, preserves the remaining holding, and records execution snapshots", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.market.getCashBalance()).resolves.toBe("10000");
    await expect(caller.market.buyStock({ stockId, ticker: "TEST", blueBucksAmount: "200", pricePerShare: "100" })).resolves.toMatchObject({ success: true, shares: "2" });
    await expect(caller.market.sellStock({ stockId, ticker: "TEST", shares: "1", pricePerShare: "120" })).resolves.toMatchObject({ success: true, newBalance: "9920" });

    const database = await getDb();
    if (!database) throw new Error("Database connection is required for market workflow tests");
    const [holding] = await database.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, userId));
    const snapshots = await caller.market.getPortfolioSnapshots({ limit: 10 });
    const portfolio = await caller.market.getPortfolio();
    const summary = await caller.market.getPortfolioSummary();
    expect(Number(holding.shares)).toBe(1);
    expect(Number(holding.totalInvested)).toBe(100);
    expect(portfolio).toContainEqual(expect.objectContaining({ stockId, shares: "1.000000", totalInvested: "100.00" }));
    expect(summary).toMatchObject({ cashBalance: 9920, investedValue: 100, totalValue: 10020, totalProfit: 20, percentageReturn: 0.2 });
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]).toMatchObject({ value: 10020, gain: 20, percentageReturn: 0.2 });
  });
});
