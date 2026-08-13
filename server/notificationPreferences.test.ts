import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { notificationPreferences, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("notification preferences", () => {
  let userId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for notification preference test");
    const inserted = await database.insert(users).values({
      openId: `notification-preferences-${Date.now()}-${Math.random()}`,
      name: "Notification Preference User",
      schoolCode: "TEST-PREFERENCES",
      role: "user",
      loginMethod: "custom",
    });
    userId = Number(inserted[0].insertId);
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    if (userId) {
      await database.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
      await database.delete(users).where(eq(users.id, userId));
    }
  });

  it("returns sensible defaults and persists only the current user's choices", async () => {
    const caller = appRouter.createCaller(context({
      id: userId,
      openId: `notification-user-${userId}`,
      name: "Notification Preference User",
      schoolCode: "TEST-PREFERENCES",
      loginMethod: "custom",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.preferences.getNotificationPreferences()).resolves.toMatchObject({
      announcementsEnabled: true,
      feedbackResponsesEnabled: true,
      systemUpdatesEnabled: true,
      studyRemindersEnabled: false,
    });

    await expect(caller.preferences.updateNotificationPreferences({
      announcementsEnabled: false,
      feedbackResponsesEnabled: true,
      systemUpdatesEnabled: false,
      studyRemindersEnabled: true,
    })).resolves.toEqual({ success: true });

    await expect(caller.preferences.getNotificationPreferences()).resolves.toMatchObject({
      announcementsEnabled: false,
      feedbackResponsesEnabled: true,
      systemUpdatesEnabled: false,
      studyRemindersEnabled: true,
    });
  });
});
