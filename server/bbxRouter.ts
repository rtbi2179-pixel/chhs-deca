import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { ensureBbxSeeded, getDb, getOrCreateBbxAccount } from "./db";
import { executionPrice, slippagePct, spreadPct } from "./bbxEngine";
import { advanceBbxSimulation, createBbxEvent } from "./bbxSimulation";

const decimalQuantity = z.string().regex(/^\d+(\.\d{1,6})?$/, "Enter a valid quantity with up to six decimals.");
const isAdmin = (role: string) => role === "super_admin";
const number = (value: unknown) => Number(value ?? 0);
const BLUE_NEWS_READ_REWARD = 25;

async function getCompanyByTicker(ticker: string) {
  await ensureBbxSeeded();
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
  const { bbxCompanies } = await import("../drizzle/schema");
  const [company] = await db.select().from(bbxCompanies).where(eq(bbxCompanies.ticker, ticker)).limit(1);
  if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Fictional BBX company not found" });
  return company;
}

async function getState() {
  await ensureBbxSeeded();
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
  const { bbxMarketState } = await import("../drizzle/schema");
  const [state] = await db.select().from(bbxMarketState).where(eq(bbxMarketState.id, 1)).limit(1);
  if (!state) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX market state is unavailable" });
  return state;
}

function serializeCompany(company: any) {
  const change = number(company.currentPrice) - number(company.previousClose);
  return {
    id: company.id, ticker: company.ticker, symbol: company.symbol, companyName: company.companyName, sector: company.sector,
    description: company.description, price: number(company.currentPrice), previousClose: number(company.previousClose),
    change, changePercent: number(company.previousClose) > 0 ? (change / number(company.previousClose)) * 100 : 0,
    fundamentalValue: number(company.fundamentalValue), revenue: number(company.revenue), netIncome: number(company.netIncome),
    revenueGrowth: number(company.revenueGrowth), profitMargin: number(company.profitMargin), beta: number(company.beta),
    baseVolatility: number(company.baseVolatility), liquidityScore: number(company.liquidityScore), status: company.status,
    simulated: true,
  };
}

export const bbxRouter = router({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    await ensureBbxSeeded();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxCompanies, bbxEvents, bbxMarketState, bbxNews, bbxPriceHistory, userBankAccounts } = await import("../drizzle/schema");
    const state = await getState();
    const account = await getOrCreateBbxAccount(ctx.user.id);
    const [bankAccount] = await db.select({ investmentBalance: userBankAccounts.investmentBalance }).from(userBankAccounts).where(and(eq(userBankAccounts.userId, ctx.user.id), eq(userBankAccounts.schoolCode, ctx.user.schoolCode ?? ""))).limit(1);
    const companies = await db.select().from(bbxCompanies).where(eq(bbxCompanies.status, "active"));
    const news = await db.select().from(bbxNews).orderBy(desc(bbxNews.publishedAt)).limit(10);
    const sorted = companies.map(serializeCompany).sort((a, b) => b.changePercent - a.changePercent);
    const sectors = Array.from(new Set(companies.map((company) => company.sector))).map((sector) => {
      const entries = companies.filter((company) => company.sector === sector).map(serializeCompany);
      return { sector, changePercent: entries.reduce((sum, entry) => sum + entry.changePercent, 0) / Math.max(entries.length, 1), volatility: entries.reduce((sum, entry) => sum + entry.baseVolatility, 0) / Math.max(entries.length, 1) };
    });
    const historyRows = await db.select({ tickNumber: bbxPriceHistory.tickNumber, timestamp: bbxPriceHistory.simulationTimestamp, price: bbxPriceHistory.price, sector: bbxCompanies.sector })
      .from(bbxPriceHistory).innerJoin(bbxCompanies, eq(bbxPriceHistory.companyId, bbxCompanies.id)).orderBy(desc(bbxPriceHistory.tickNumber)).limit(4800);
    const buildPerformance = (rows: typeof historyRows) => {
      const byTick = new Map<number, { total: number; count: number; timestamp: Date }>();
      rows.forEach((row) => { const current = byTick.get(row.tickNumber) ?? { total: 0, count: 0, timestamp: row.timestamp }; current.total += number(row.price); current.count += 1; byTick.set(row.tickNumber, current); });
      const averages = Array.from(byTick.entries()).sort(([left], [right]) => left - right).map(([tickNumber, value]) => ({ tickNumber, timestamp: value.timestamp, value: value.total / value.count }));
      const base = averages[0]?.value ?? 1;
      return averages.map((point) => ({ tickNumber: point.tickNumber, timestamp: point.timestamp, index: (point.value / Math.max(base, 0.01)) * 100, changePercent: ((point.value / Math.max(base, 0.01)) - 1) * 100 }));
    };
    const recentAffectedRows = await db.select({ sector: bbxEvents.sector, headline: bbxNews.headline, eventId: bbxEvents.id, publishedAt: bbxNews.publishedAt })
      .from(bbxEvents).innerJoin(bbxNews, eq(bbxNews.eventId, bbxEvents.id)).where(sql`${bbxEvents.sector} IS NOT NULL`).orderBy(desc(bbxNews.publishedAt)).limit(12);
    const affectedSectors = Array.from(new Map(recentAffectedRows.filter((row) => row.sector).map((row) => [row.sector!, row])).values()).slice(0, 3).map((event) => ({ sector: event.sector!, eventId: event.eventId, headline: event.headline, publishedAt: event.publishedAt, series: buildPerformance(historyRows.filter((row) => row.sector === event.sector)) }));
    return { state: { marketOpen: state.marketOpen, marketRegime: state.marketRegime, tickNumber: state.tickNumber, simulationTimestamp: state.simulationTimestamp, benchmarkLevel: number(state.benchmarkLevel), benchmarkChangePercent: ((number(state.benchmarkLevel) - number(state.previousBenchmarkLevel)) / Math.max(number(state.previousBenchmarkLevel), 0.01)) * 100 }, cash: number(bankAccount?.investmentBalance ?? account.cashBalance), companies: companies.map(serializeCompany), movers: { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() }, sectors, news, performance: { market: buildPerformance(historyRows), affectedSectors } };
  }),

  getQuote: protectedProcedure.input(z.object({ ticker: z.string().min(5).max(16) })).query(async ({ ctx, input }) => {
    const company = await getCompanyByTicker(input.ticker);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxPositions, bbxPriceHistory } = await import("../drizzle/schema");
    const [position] = await db.select().from(bbxPositions).where(and(eq(bbxPositions.userId, ctx.user.id), eq(bbxPositions.companyId, company.id))).limit(1);
    const history = await db.select().from(bbxPriceHistory).where(eq(bbxPriceHistory.companyId, company.id)).orderBy(desc(bbxPriceHistory.tickNumber)).limit(1);
    const spread = spreadPct(number(company.liquidityScore), 1 + Math.abs(number(history[0]?.eventFactor)) * 5);
    const contributors: Array<[string, number]> = history[0] ? [
      ["Market", number(history[0].benchmarkFactor)], ["Sector", number(history[0].sectorFactor)], ["Event", number(history[0].eventFactor)], ["Order flow", number(history[0].userImpactFactor)], ["Fundamentals", number(history[0].meanReversionFactor)], ["Company activity", number(history[0].noiseFactor)],
    ] : [];
    return { ...serializeCompany(company), bid: number(company.currentPrice) * (1 - spread / 2), ask: number(company.currentPrice) * (1 + spread / 2), spreadPercent: spread * 100, position: position ? { quantity: number(position.quantity), averageCost: number(position.averageCost) } : { quantity: 0, averageCost: 0 }, contributors: contributors.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3).map(([label, value]) => ({ label, value })) };
  }),

  getChart: protectedProcedure.input(z.object({ ticker: z.string(), range: z.enum(["1D", "1W", "1M", "ALL"]).default("1D") })).query(async ({ input }) => {
    const company = await getCompanyByTicker(input.ticker);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxPriceHistory } = await import("../drizzle/schema");
    const limit = input.range === "1D" ? 120 : input.range === "1W" ? 840 : input.range === "1M" ? 3600 : 10000;
    const points = await db.select().from(bbxPriceHistory).where(eq(bbxPriceHistory.companyId, company.id)).orderBy(desc(bbxPriceHistory.tickNumber)).limit(limit);
    return points.reverse().map((point) => ({ tickNumber: point.tickNumber, timestamp: point.simulationTimestamp, price: number(point.price) }));
  }),

  getNews: protectedProcedure.input(z.object({ ticker: z.string().optional(), sector: z.string().optional(), limit: z.number().min(1).max(50).default(20) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxCompanies, bbxEvents, bbxNews } = await import("../drizzle/schema");
    const rows = await db.select({ id: bbxNews.id, headline: bbxNews.headline, body: bbxNews.body, whyItMatters: bbxNews.whyItMatters, scopeLabel: bbxNews.scopeLabel, publishedAt: bbxNews.publishedAt, eventId: bbxEvents.id, severity: bbxEvents.severity, ticker: bbxCompanies.ticker, companyName: bbxCompanies.companyName, sector: bbxEvents.sector }).from(bbxNews).innerJoin(bbxEvents, eq(bbxNews.eventId, bbxEvents.id)).leftJoin(bbxCompanies, eq(bbxEvents.companyId, bbxCompanies.id)).orderBy(desc(bbxNews.publishedAt)).limit(input.limit);
    return rows.filter((row) => (!input.ticker || row.ticker === input.ticker) && (!input.sector || row.sector === input.sector));
  }),

  getBluesNews: protectedProcedure.input(z.object({ limit: z.number().min(1).max(25).default(10) })).query(async ({ ctx, input }) => {
    await ensureBbxSeeded();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxCompanies, bbxEvents, bbxNews, bbxNewsReads } = await import("../drizzle/schema");
    const rows = await db.select({
      id: bbxNews.id, headline: bbxNews.headline, body: bbxNews.body, whyItMatters: bbxNews.whyItMatters,
      scopeLabel: bbxNews.scopeLabel, publishedAt: bbxNews.publishedAt, isSimulated: bbxNews.isSimulated,
      severity: bbxEvents.severity, ticker: bbxCompanies.ticker, companyName: bbxCompanies.companyName,
      sector: bbxEvents.sector, readAt: bbxNewsReads.readAt,
    }).from(bbxNews)
      .innerJoin(bbxEvents, eq(bbxNews.eventId, bbxEvents.id))
      .leftJoin(bbxCompanies, eq(bbxEvents.companyId, bbxCompanies.id))
      .leftJoin(bbxNewsReads, and(eq(bbxNewsReads.newsId, bbxNews.id), eq(bbxNewsReads.userId, ctx.user.id)))
      .orderBy(desc(bbxNews.publishedAt)).limit(input.limit);
    return rows.map((row) => ({ ...row, isRead: Boolean(row.readAt) }));
  }),

  getUnreadNewsCount: protectedProcedure.query(async ({ ctx }) => {
    await ensureBbxSeeded();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxNews, bbxNewsReads } = await import("../drizzle/schema");
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(bbxNews)
      .leftJoin(bbxNewsReads, and(eq(bbxNewsReads.newsId, bbxNews.id), eq(bbxNewsReads.userId, ctx.user.id)))
      .where(sql`${bbxNewsReads.id} IS NULL`);
    return { count: Number(result?.count ?? 0) };
  }),

  markNewsRead: protectedProcedure.input(z.object({ newsId: z.number().int().positive().optional(), markAll: z.boolean().optional() }).refine((input) => Boolean(input.newsId) || input.markAll === true, { message: "Select an article or mark all articles as read." })).mutation(async ({ ctx, input }) => {
    await ensureBbxSeeded();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxNews, bbxNewsReads, userBankAccounts } = await import("../drizzle/schema");
    const newsIds = input.markAll
      ? (await db.select({ id: bbxNews.id }).from(bbxNews)).map((article) => article.id)
      : [input.newsId!];
    if (newsIds.length === 0) return { marked: 0, rewarded: 0, rewardPerArticle: BLUE_NEWS_READ_REWARD };
    await getOrCreateBbxAccount(ctx.user.id);
    return db.transaction(async (tx) => {
      const existing = await tx.select({ newsId: bbxNewsReads.newsId, rewardedAt: bbxNewsReads.rewardedAt }).from(bbxNewsReads).where(and(eq(bbxNewsReads.userId, ctx.user.id), inArray(bbxNewsReads.newsId, newsIds)));
      const existingById = new Map(existing.map((row) => [row.newsId, row]));
      const unreadIds = newsIds.filter((newsId) => !existingById.has(newsId));
      if (unreadIds.length) await tx.insert(bbxNewsReads).values(unreadIds.map((newsId) => ({ userId: ctx.user.id, newsId, rewardedAt: new Date() })));
      const legacyUnrewardedIds = existing.filter((row) => !row.rewardedAt).map((row) => row.newsId);
      if (legacyUnrewardedIds.length) await tx.update(bbxNewsReads).set({ rewardedAt: new Date() }).where(and(eq(bbxNewsReads.userId, ctx.user.id), inArray(bbxNewsReads.newsId, legacyUnrewardedIds)));
      const rewardCount = unreadIds.length + legacyUnrewardedIds.length;
      if (!rewardCount) return { marked: 0, rewarded: 0, rewardPerArticle: BLUE_NEWS_READ_REWARD };
      const [account] = await tx.select().from(userBankAccounts).where(and(eq(userBankAccounts.userId, ctx.user.id), eq(userBankAccounts.schoolCode, ctx.user.schoolCode ?? ""))).limit(1);
      const nextChecking = number(account?.checkingBalance) + rewardCount * BLUE_NEWS_READ_REWARD;
      if (account) await tx.update(userBankAccounts).set({ checkingBalance: nextChecking.toFixed(2) }).where(eq(userBankAccounts.id, account.id));
      else await tx.insert(userBankAccounts).values({ userId: ctx.user.id, schoolCode: ctx.user.schoolCode ?? "", checkingBalance: nextChecking.toFixed(2), savingsBalance: "0", investmentBalance: "0", totalDebt: "0" });
      return { marked: unreadIds.length, rewarded: rewardCount * BLUE_NEWS_READ_REWARD, rewardPerArticle: BLUE_NEWS_READ_REWARD };
    });
  }),

  getPortfolio: protectedProcedure.query(async ({ ctx }) => {
    await ensureBbxSeeded();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxCompanies, bbxPositions, userBankAccounts } = await import("../drizzle/schema");
    const account = await getOrCreateBbxAccount(ctx.user.id);
    const [bankAccount] = await db.select({ investmentBalance: userBankAccounts.investmentBalance }).from(userBankAccounts).where(and(eq(userBankAccounts.userId, ctx.user.id), eq(userBankAccounts.schoolCode, ctx.user.schoolCode ?? ""))).limit(1);
    const rows = await db.select().from(bbxPositions).innerJoin(bbxCompanies, eq(bbxPositions.companyId, bbxCompanies.id)).where(eq(bbxPositions.userId, ctx.user.id));
    const holdings = rows.map((row: any) => { const position = row.bbxPositions; const company = row.bbxCompanies; const quantity = number(position.quantity); const cost = quantity * number(position.averageCost); const value = quantity * number(company.currentPrice); return { ticker: company.ticker, companyName: company.companyName, sector: company.sector, quantity, averageCost: number(position.averageCost), marketValue: value, unrealizedPnl: value - cost, unrealizedPnlPercent: cost > 0 ? ((value - cost) / cost) * 100 : 0 }; });
    const holdingsValue = holdings.reduce((sum, entry) => sum + entry.marketValue, 0);
    const cash = number(bankAccount?.investmentBalance ?? account.cashBalance);
    const totalValue = cash + holdingsValue;
    return { cash, startingBalance: number(account.startingBalance), realizedPnl: number(account.realizedPnl), holdings, holdingsValue, totalValue, totalReturn: totalValue - number(account.startingBalance), totalReturnPercent: ((totalValue - number(account.startingBalance)) / number(account.startingBalance)) * 100 };
  }),

  placeMarketOrder: protectedProcedure.input(z.object({ ticker: z.string().min(5).max(16), side: z.enum(["buy", "sell"]), quantity: decimalQuantity, idempotencyKey: z.string().min(12).max(80) })).mutation(async ({ ctx, input }) => {
    await ensureBbxSeeded();
    await getOrCreateBbxAccount(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BBX storage is unavailable" });
    const { bbxAccounts, bbxCompanies, bbxLedger, bbxMarketState, bbxOrders, bbxPositions, userBankAccounts } = await import("../drizzle/schema");
    return db.transaction(async (tx) => {
      const [state] = await tx.select().from(bbxMarketState).where(eq(bbxMarketState.id, 1)).limit(1);
      if (!state?.marketOpen) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The simulated market is paused." });
      await tx.execute(sql`SELECT userId FROM bbxAccounts WHERE userId = ${ctx.user.id} FOR UPDATE`);
      await tx.execute(sql`SELECT userId FROM userBankAccounts WHERE userId = ${ctx.user.id} FOR UPDATE`);
      const [existing] = await tx.select().from(bbxOrders).where(and(eq(bbxOrders.userId, ctx.user.id), eq(bbxOrders.idempotencyKey, input.idempotencyKey))).limit(1);
      if (existing) return { orderId: existing.id, status: existing.status, fillPrice: number(existing.fillPrice), grossAmount: number(existing.grossAmount), duplicate: true };
      const [company] = await tx.select().from(bbxCompanies).where(eq(bbxCompanies.ticker, input.ticker)).limit(1);
      if (!company || company.status !== "active") throw new TRPCError({ code: "NOT_FOUND", message: "This simulated listing is not available for trading." });
      const [account] = await tx.select().from(bbxAccounts).where(eq(bbxAccounts.userId, ctx.user.id)).limit(1);
      const [bankAccount] = await tx.select().from(userBankAccounts).where(and(eq(userBankAccounts.userId, ctx.user.id), eq(userBankAccounts.schoolCode, ctx.user.schoolCode ?? ""))).limit(1);
      const [position] = await tx.select().from(bbxPositions).where(and(eq(bbxPositions.userId, ctx.user.id), eq(bbxPositions.companyId, company.id))).limit(1);
      const quantity = Number(input.quantity);
      const estimatedValue = quantity * number(company.currentPrice);
      const spread = spreadPct(number(company.liquidityScore), 1 + Math.abs(number(company.temporaryOrderImpact)) * 5);
      const slippage = slippagePct(estimatedValue, Math.max(50000, number(company.liquidityScore) * 750000));
      const fillPrice = executionPrice(input.side, number(company.currentPrice), spread, slippage);
      const grossAmount = quantity * fillPrice;
      if (!bankAccount) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Transfer funds into your Banking investment account before trading." });
      if (input.side === "buy" && number(bankAccount.investmentBalance) + 1e-8 < grossAmount) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient investment-account funds for this simulated order." });
      if (input.side === "sell" && number(position?.quantity) + 1e-8 < quantity) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot sell more simulated shares than you own." });
      const orderResult = await tx.insert(bbxOrders).values({ userId: ctx.user.id, companyId: company.id, side: input.side, requestedQuantity: input.quantity, filledQuantity: input.quantity, fillPrice: fillPrice.toFixed(6), grossAmount: grossAmount.toFixed(4), spreadCost: (quantity * number(company.currentPrice) * spread / 2).toFixed(4), slippageCost: (quantity * number(company.currentPrice) * slippage).toFixed(4), status: "filled", idempotencyKey: input.idempotencyKey, tickNumber: state.tickNumber });
      const orderId = Number((orderResult as any)[0]?.insertId);
      const nextCash = input.side === "buy" ? number(bankAccount.investmentBalance) - grossAmount : number(bankAccount.investmentBalance) + grossAmount;
      const nextQuantity = input.side === "buy" ? number(position?.quantity) + quantity : number(position?.quantity) - quantity;
      const nextAverageCost = input.side === "buy" ? ((number(position?.quantity) * number(position?.averageCost) + grossAmount) / nextQuantity) : number(position?.averageCost);
      if (position) {
        if (nextQuantity <= 1e-8) await tx.delete(bbxPositions).where(eq(bbxPositions.id, position.id));
        else await tx.update(bbxPositions).set({ quantity: nextQuantity.toFixed(6), averageCost: nextAverageCost.toFixed(6) }).where(eq(bbxPositions.id, position.id));
      } else await tx.insert(bbxPositions).values({ userId: ctx.user.id, companyId: company.id, quantity: nextQuantity.toFixed(6), averageCost: nextAverageCost.toFixed(6) });
      const realizedPnl = input.side === "sell" ? number(account.realizedPnl) + quantity * (fillPrice - number(position?.averageCost)) : number(account.realizedPnl);
      await tx.update(bbxAccounts).set({ cashBalance: nextCash.toFixed(4), realizedPnl: realizedPnl.toFixed(4) }).where(eq(bbxAccounts.userId, ctx.user.id));
      await tx.update(userBankAccounts).set({ investmentBalance: nextCash.toFixed(2) }).where(eq(userBankAccounts.id, bankAccount.id));
      await tx.insert(bbxLedger).values({ userId: ctx.user.id, orderId, amount: (input.side === "buy" ? -grossAmount : grossAmount).toFixed(4), balanceAfter: nextCash.toFixed(4), reason: input.side === "buy" ? "trade_buy" : "trade_sell" });
      await tx.update(bbxCompanies).set({ temporaryOrderImpact: (number(company.temporaryOrderImpact) + (input.side === "buy" ? 1 : -1) * Math.min(0.0025, grossAmount / 100000000)).toFixed(8) }).where(eq(bbxCompanies.id, company.id));
      return { orderId, status: "filled", fillPrice, grossAmount, spreadPercent: spread * 100, slippagePercent: slippage * 100, duplicate: false };
    });
  }),

  getTransactions: protectedProcedure.input(z.object({ limit: z.number().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const { bbxCompanies, bbxOrders } = await import("../drizzle/schema");
    return db.select({ id: bbxOrders.id, side: bbxOrders.side, quantity: bbxOrders.filledQuantity, fillPrice: bbxOrders.fillPrice, grossAmount: bbxOrders.grossAmount, createdAt: bbxOrders.createdAt, ticker: bbxCompanies.ticker, companyName: bbxCompanies.companyName }).from(bbxOrders).innerJoin(bbxCompanies, eq(bbxOrders.companyId, bbxCompanies.id)).where(eq(bbxOrders.userId, ctx.user.id)).orderBy(desc(bbxOrders.createdAt)).limit(input.limit);
  }),

  getLeaderboard: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const { bbxAccounts, bbxCompanies, bbxPositions, users } = await import("../drizzle/schema");
    const accounts = await db.select({ userId: bbxAccounts.userId, name: users.name, cash: bbxAccounts.cashBalance, starting: bbxAccounts.startingBalance }).from(bbxAccounts).innerJoin(users, eq(bbxAccounts.userId, users.id));
    const positions = await db.select({ userId: bbxPositions.userId, quantity: bbxPositions.quantity, currentPrice: bbxCompanies.currentPrice }).from(bbxPositions).innerJoin(bbxCompanies, eq(bbxPositions.companyId, bbxCompanies.id));
    const markedValueByUser = new Map<number, number>();
    positions.forEach((position) => markedValueByUser.set(position.userId, (markedValueByUser.get(position.userId) ?? 0) + number(position.quantity) * number(position.currentPrice)));
    return accounts.map((account) => {
      const totalValue = number(account.cash) + (markedValueByUser.get(account.userId) ?? 0);
      return { userId: account.userId, name: account.name ?? "Member", totalReturnPercent: ((totalValue - number(account.starting)) / Math.max(number(account.starting), 1)) * 100 };
    }).sort((a, b) => b.totalReturnPercent - a.totalReturnPercent).slice(0, 25);
  }),

  advanceNow: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only super admins can advance BBX manually." });
    return advanceBbxSimulation();
  }),
  setRegime: protectedProcedure.input(z.object({ regime: z.enum(["bull", "neutral", "bear", "high_volatility"]) })).mutation(async ({ ctx, input }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only super admins can change BBX conditions." });
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { bbxAdminAudit, bbxMarketState } = await import("../drizzle/schema");
    await db.update(bbxMarketState).set({ marketRegime: input.regime }).where(eq(bbxMarketState.id, 1));
    await db.insert(bbxAdminAudit).values({ adminUserId: ctx.user.id, action: "set_regime", payload: { regime: input.regime } });
    return { success: true };
  }),
  setMarketOpen: protectedProcedure.input(z.object({ open: z.boolean() })).mutation(async ({ ctx, input }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only super admins can pause BBX." });
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { bbxAdminAudit, bbxMarketState } = await import("../drizzle/schema");
    await db.update(bbxMarketState).set({ marketOpen: input.open }).where(eq(bbxMarketState.id, 1));
    await db.insert(bbxAdminAudit).values({ adminUserId: ctx.user.id, action: input.open ? "resume_market" : "pause_market", payload: {} });
    return { success: true };
  }),
  injectEvent: protectedProcedure.input(z.object({ templateId: z.string(), ticker: z.string().optional(), sector: z.string().optional() })).mutation(async ({ ctx, input }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only super admins can inject BBX events." });
    const company = input.ticker ? await getCompanyByTicker(input.ticker) : undefined;
    const result = await createBbxEvent({ templateId: input.templateId, companyId: company?.id, sector: input.sector, createdBy: "admin" });
    const db = await getDb(); const { bbxAdminAudit } = await import("../drizzle/schema");
    await db?.insert(bbxAdminAudit).values({ adminUserId: ctx.user.id, action: "inject_event", payload: { templateId: input.templateId, ticker: input.ticker ?? null, sector: input.sector ?? null } });
    return result;
  }),
  getAdminOptions: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only super admins can manage BBX." });
    await ensureBbxSeeded();
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { bbxCompanies } = await import("../drizzle/schema");
    const eventBank = (await import("./bbxEventBank.json")).default as Array<{ id: string; scope: string; severity: string; headlineTemplate: string }>;
    const companies = await db.select({ ticker: bbxCompanies.ticker, companyName: bbxCompanies.companyName, sector: bbxCompanies.sector }).from(bbxCompanies).orderBy(asc(bbxCompanies.ticker));
    return { templates: eventBank.map((template) => ({ id: template.id, scope: template.scope, severity: template.severity, headline: template.headlineTemplate })), companies };
  }),
  getLearningGuide: protectedProcedure.query(() => ([
    { title: "Diversification", lesson: "Holding more than one fictional company can reduce the impact of any single company event." },
    { title: "Risk and volatility", lesson: "A larger price range does not guarantee a better outcome; it means greater uncertainty." },
    { title: "News and expectations", lesson: "BBX events move simulated prices because their structured result differs from what the fictional market expected." },
    { title: "Liquidity and execution", lesson: "Bid/ask spreads and slippage mean the final simulated fill can differ slightly from the displayed midpoint." },
  ])),
});
