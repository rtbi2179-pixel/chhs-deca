import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { userBankAccounts, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

describe("banking, roadmap, leaderboard, and achievement refinements", () => {
  const schoolCode = `NET-WORTH-BOARD-${Date.now()}`;
  let firstUserId = 0;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const first = await database.insert(users).values({ openId: `net-worth-first-${Date.now()}`, name: "Net Worth First", schoolCode, role: "user", loginMethod: "custom" });
    const second = await database.insert(users).values({ openId: `net-worth-second-${Date.now()}`, name: "Net Worth Second", schoolCode, role: "user", loginMethod: "custom" });
    firstUserId = Number(first[0].insertId);
    const secondUserId = Number(second[0].insertId);
    await database.insert(userBankAccounts).values([
      { userId: firstUserId, schoolCode, checkingBalance: "120.00", savingsBalance: "80.00", investmentBalance: "300.00", totalDebt: "999.00" },
      { userId: secondUserId, schoolCode, checkingBalance: "450.00", savingsBalance: "100.00", investmentBalance: "200.00", totalDebt: "0.00" },
    ]);
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database) return;
    await database.delete(userBankAccounts).where(eq(userBankAccounts.schoolCode, schoolCode));
    await database.delete(users).where(eq(users.schoolCode, schoolCode));
  });

  it("ranks chapter members by the real combined Blue Bucks balances and never subtracts debt", async () => {
    const caller = appRouter.createCaller({
      user: { id: firstUserId, openId: "net-worth-context", name: "Net Worth First", schoolCode, role: "user", loginMethod: "custom", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } satisfies AuthenticatedUser,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    const result = await caller.banking.getNetWorthLeaderboard({ limit: 10 });
    expect(result.map((entry) => ({ name: entry.name, netWorth: entry.netWorth }))).toEqual([
      { name: "Net Worth Second", netWorth: 750 },
      { name: "Net Worth First", netWorth: 500 },
    ]);
  });

  it("keeps the dashboard, roadmap, leaderboard, and achievement interfaces aligned with the new experience", () => {
    const banking = readFileSync(join(process.cwd(), "client/src/pages/BankingDashboard.tsx"), "utf8");
    const timeline = readFileSync(join(process.cwd(), "client/src/pages/CompetitionTimeline.tsx"), "utf8");
    const engine = readFileSync(join(process.cwd(), "server/timelineEngine.ts"), "utf8");
    const board = readFileSync(join(process.cwd(), "client/src/pages/Leaderboard.tsx"), "utf8");
    const achievements = readFileSync(join(process.cwd(), "client/src/components/AchievementTierPanel.tsx"), "utf8");
    expect(banking).not.toContain("Total Debt");
    expect(banking).not.toContain("bankAccount?.totalDebt");
    expect(timeline).toContain("refetchInterval: 30_000");
    expect(timeline).toContain("showReadinessDetails");
    expect(timeline).toContain("showPastWeeks");
    expect(engine).toContain("automaticallyCompleted");
    expect(engine).toContain("progressValueForMetric");
    expect(board).toContain("getNetWorthLeaderboard");
    expect(board).toContain("Checking + Savings + Investment");
    expect(board).not.toContain("practice.getLeaderboard");
    expect(achievements).toContain("Next tier");
    expect(achievements).toContain("Your collection");
  });
});
