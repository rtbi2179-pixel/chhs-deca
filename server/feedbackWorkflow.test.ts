import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { userFeedback, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("user feedback workflow", () => {
  const schoolCode = `TEST-FEEDBACK-${Date.now()}`;
  let reporterId = 0;
  let adminId = 0;

  const userFor = (id: number, role: AuthenticatedUser["role"], name: string): AuthenticatedUser => ({
    id,
    openId: `${role}-${id}`,
    name,
    schoolCode,
    loginMethod: "custom",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for feedback workflow test");
    const stamp = `${Date.now()}-${Math.random()}`;
    const reporter = await database.insert(users).values({ openId: `feedback-reporter-${stamp}`, name: "Feedback Reporter", schoolCode, role: "user", loginMethod: "custom" });
    const admin = await database.insert(users).values({ openId: `feedback-admin-${stamp}`, name: "Feedback Admin", schoolCode, role: "admin", loginMethod: "custom" });
    reporterId = Number(reporter[0].insertId);
    adminId = Number(admin[0].insertId);
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    await database.delete(userFeedback).where(eq(userFeedback.schoolCode, schoolCode));
    if (reporterId) await database.delete(users).where(eq(users.id, reporterId));
    if (adminId) await database.delete(users).where(eq(users.id, adminId));
  });

  it("persists feedback, restricts chapter review, and returns an admin response to the reporter", async () => {
    const reporter = appRouter.createCaller(context(userFor(reporterId, "user", "Feedback Reporter")));
    const created = await reporter.feedback.submit({ category: "feature", subject: "Practice timer improvements", message: "Please allow students to pause and resume a saved practice session." });
    expect(created).toMatchObject({ success: true, feedbackId: expect.any(Number) });
    await expect(reporter.feedback.listForSchool()).rejects.toMatchObject({ code: "FORBIDDEN" });

    const admin = appRouter.createCaller(context(userFor(adminId, "admin", "Feedback Admin")));
    const queue = await admin.feedback.listForSchool();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ id: created.feedbackId, category: "feature", status: "new" });
    await expect(admin.feedback.review({ feedbackId: created.feedbackId, status: "reviewing", adminResponse: "Thank you; the chapter team is reviewing this." })).resolves.toEqual({ success: true });

    const mine = await reporter.feedback.listMine();
    expect(mine[0]).toMatchObject({ status: "reviewing", adminResponse: "Thank you; the chapter team is reviewing this.", reviewedBy: adminId });

    await expect(admin.feedback.review({ feedbackId: created.feedbackId, status: "resolved" })).resolves.toEqual({ success: true });
    const resolved = await reporter.feedback.listMine();
    expect(resolved[0]).toMatchObject({ status: "resolved", adminResponse: "Thank you; the chapter team is reviewing this.", reviewedBy: adminId });
  });
});
