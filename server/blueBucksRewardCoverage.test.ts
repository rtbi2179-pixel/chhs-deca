import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { awardBlueBucks, getBlueBucksBalance, getDb } from "./db";
import { blueBucksTransactions, userBankAccounts, users } from "../drizzle/schema";

describe("Blue Bucks reward coverage", () => {
  const schoolCode = `TEST-REWARD-COVERAGE-${Date.now()}`;
  let userId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const [created] = await database.insert(users).values({
      openId: `reward-coverage-${Date.now()}-${Math.random()}`,
      name: "Reward Coverage Member",
      schoolCode,
      role: "user",
      loginMethod: "custom",
    });
    userId = Number(created.insertId);
    await database.insert(userBankAccounts).values({ userId, schoolCode, checkingBalance: "0", savingsBalance: "0", investmentBalance: "0", totalDebt: "0" });
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database || !userId) return;
    await database.delete(blueBucksTransactions).where(eq(blueBucksTransactions.userId, userId));
    await database.delete(userBankAccounts).where(eq(userBankAccounts.userId, userId));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("credits checking exactly once per source while preserving distinct qualifying rewards", async () => {
    await expect(awardBlueBucks(userId, 100, "correct_first_attempt", schoolCode, 101, "question:first-correct:101")).resolves.toBe(true);
    await expect(awardBlueBucks(userId, 100, "correct_first_attempt", schoolCode, 101, "question:first-correct:101")).resolves.toBe(false);
    await expect(awardBlueBucks(userId, 50, "corrected_answer", schoolCode, 101, "question:corrected:101")).resolves.toBe(true);
    await expect(awardBlueBucks(userId, 25, "news_read", schoolCode, 202, "blue-news:202")).resolves.toBe(true);
    await expect(awardBlueBucks(userId, 15, "discussion_post", schoolCode, 303, "discussion:thread:303")).resolves.toBe(true);

    expect(await getBlueBucksBalance(userId)).toBe(190);
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const ledger = await database.select().from(blueBucksTransactions)
      .where(and(eq(blueBucksTransactions.userId, userId), eq(blueBucksTransactions.schoolCode, schoolCode)));
    expect(ledger).toHaveLength(4);
    expect(new Set(ledger.map((entry) => entry.sourceKey))).toEqual(new Set(["question:first-correct:101", "question:corrected:101", "blue-news:202", "discussion:thread:303"]));
  });

  it("uses the shared ledger path for practice, mock exams, discussions, and Blue’s News", () => {
    const router = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");
    const bbxRouter = readFileSync(join(process.cwd(), "server/bbxRouter.ts"), "utf8");
    expect(router).toContain("awardQuestionBlueBucks");
    expect(router).toContain('"corrected_answer"');
    expect(router).toContain('"discussion_post"');
    expect(router).toContain('"discussion_reply"');
    expect(bbxRouter).toContain('"news_read"');
    expect(bbxRouter).toContain("awardBlueBucks(ctx.user.id");
    expect(bbxRouter).not.toContain("checkingBalance: nextChecking.toFixed(2)");
  });
});
