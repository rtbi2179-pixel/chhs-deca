import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { userProfileSettings, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("profile customization", () => {
  let userId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for profile customization test");
    const inserted = await database.insert(users).values({ openId: `profile-settings-${Date.now()}-${Math.random()}`, name: "Profile Settings User", schoolCode: "TEST-PROFILE", role: "user", loginMethod: "custom" });
    userId = Number(inserted[0].insertId);
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database || !userId) return;
    await database.delete(userProfileSettings).where(eq(userProfileSettings.userId, userId));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("returns defaults and persists profile customization together with the selected website style", async () => {
    const caller = appRouter.createCaller(context({
      id: userId, openId: `profile-user-${userId}`, name: "Profile Settings User", schoolCode: "TEST-PROFILE", loginMethod: "custom", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    }));
    await expect(caller.preferences.getProfileSettings()).resolves.toMatchObject({ displayName: null, bio: null, accentColor: "blue", websiteTheme: "glass", showOnLeaderboard: true });
    await expect(caller.preferences.updateProfileSettings({ displayName: "ICDC Competitor", bio: "Studying finance and business administration.", accentColor: "emerald", websiteTheme: "blazer", showOnLeaderboard: false })).resolves.toEqual({ success: true });
    await expect(caller.preferences.getProfileSettings()).resolves.toMatchObject({ displayName: "ICDC Competitor", bio: "Studying finance and business administration.", accentColor: "emerald", websiteTheme: "blazer", showOnLeaderboard: false });
    await expect(caller.preferences.updateWebsiteTheme({ websiteTheme: "glass" })).resolves.toEqual({ success: true, websiteTheme: "glass" });
    await expect(caller.preferences.getProfileSettings()).resolves.toMatchObject({ websiteTheme: "glass" });
  });
});
