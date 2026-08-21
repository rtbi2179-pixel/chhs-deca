import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { announcements, calendarEvents, chapterTabVisits, discussionReplies, discussionThreads, users, volunteerOpportunities } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

describe("chapter update badges", () => {
  const suffix = Date.now();
  const schoolCode = `BADGE-${suffix}`;
  const otherSchoolCode = `OTHER-${suffix}`;
  let memberId = 0;
  let adminId = 0;
  let threadId = 0;

  const caller = () => appRouter.createCaller({
    user: { id: memberId, openId: `badge-member-${suffix}`, name: "Badge Member", email: `badge-member-${suffix}@example.com`, schoolCode, role: "user", loginMethod: "custom", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as NonNullable<TrpcContext["user"]>,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const adminResult = await database.insert(users).values({ openId: `badge-admin-${suffix}`, email: `badge-admin-${suffix}@example.com`, name: "Badge Admin", schoolCode, role: "admin", loginMethod: "custom" });
    const memberResult = await database.insert(users).values({ openId: `badge-member-${suffix}`, email: `badge-member-${suffix}@example.com`, name: "Badge Member", schoolCode, role: "user", loginMethod: "custom" });
    adminId = Number(adminResult[0].insertId);
    memberId = Number(memberResult[0].insertId);
    await database.insert(calendarEvents).values({ title: `Badge calendar ${suffix}`, date: "2026-08-21", type: "chapter", schoolCode, createdBy: adminId });
    await database.insert(announcements).values({ schoolCode, authorId: adminId, title: `Badge announcement ${suffix}`, content: "A chapter update." });
    const thread = await database.insert(discussionThreads).values({ userId: adminId, title: `Badge discussion ${suffix}`, content: "Discuss this chapter update.", discussionType: "chapter", schoolCode });
    threadId = Number(thread[0].insertId);
    await database.insert(discussionReplies).values({ threadId, userId: adminId, content: "A new reply." });
    await database.insert(volunteerOpportunities).values({ title: `Badge volunteer ${suffix}`, date: new Date("2026-08-22T12:00:00.000Z"), schoolCode, spotsAvailable: 3, hoursOffered: 2 });
    await database.insert(announcements).values({ schoolCode: otherSchoolCode, authorId: adminId, title: `Other announcement ${suffix}`, content: "Not for this chapter." });
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database) return;
    await database.delete(chapterTabVisits).where(eq(chapterTabVisits.schoolCode, schoolCode));
    await database.delete(discussionReplies).where(eq(discussionReplies.threadId, threadId));
    await database.delete(discussionThreads).where(eq(discussionThreads.id, threadId));
    await database.delete(volunteerOpportunities).where(eq(volunteerOpportunities.schoolCode, schoolCode));
    await database.delete(announcements).where(and(eq(announcements.authorId, adminId), eq(announcements.title, `Badge announcement ${suffix}`)));
    await database.delete(announcements).where(and(eq(announcements.authorId, adminId), eq(announcements.title, `Other announcement ${suffix}`)));
    await database.delete(calendarEvents).where(and(eq(calendarEvents.createdBy, adminId), eq(calendarEvents.title, `Badge calendar ${suffix}`)));
    await database.delete(users).where(eq(users.id, memberId));
    await database.delete(users).where(eq(users.id, adminId));
  });

  it("counts only unseen additions for the member’s active chapter, including new discussion replies", async () => {
    expect(await caller().chapterUpdates.getUnreadCounts()).toEqual({ calendar: 1, announcements: 1, discussions: 2, volunteer: 1, total: 5 });
  });

  it("clears only the opened tab, keeps other chapter badges intact, and marks repeated visits idempotently", async () => {
    await caller().chapterUpdates.markSeen({ tab: "calendar" });
    await caller().chapterUpdates.markSeen({ tab: "calendar" });
    expect(await caller().chapterUpdates.getUnreadCounts()).toEqual({ calendar: 0, announcements: 1, discussions: 2, volunteer: 1, total: 4 });
    const database = await getDb();
    const visits = await database!.select().from(chapterTabVisits).where(and(eq(chapterTabVisits.userId, memberId), eq(chapterTabVisits.schoolCode, schoolCode), eq(chapterTabVisits.tab, "calendar")));
    expect(visits).toHaveLength(1);
  });

  it("surfaces additions created after the member viewed a tab", async () => {
    await caller().chapterUpdates.markSeen({ tab: "volunteer" });
    const database = await getDb();
    await database!.insert(volunteerOpportunities).values({ title: `Badge volunteer follow-up ${suffix}`, date: new Date("2026-08-23T12:00:00.000Z"), schoolCode, spotsAvailable: 1, hoursOffered: 1 });
    expect((await caller().chapterUpdates.getUnreadCounts()).volunteer).toBe(1);
    await database!.delete(volunteerOpportunities).where(eq(volunteerOpportunities.title, `Badge volunteer follow-up ${suffix}`));
  });
});
