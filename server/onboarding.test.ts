import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("first-sign-in onboarding", () => {
  let userId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for onboarding test");
    const inserted = await database.insert(users).values({ openId: `onboarding-${Date.now()}-${Math.random()}`, name: "Onboarding User", schoolCode: "TEST-ONBOARDING", role: "user", loginMethod: "custom" });
    userId = Number(inserted[0].insertId);
  });

  afterEach(async () => {
    const database = await getDb();
    if (database && userId) await database.delete(users).where(eq(users.id, userId));
  });

  it("shows the tour once and persists completion for returning users", async () => {
    const caller = appRouter.createCaller(context({ id: userId, openId: `onboarding-user-${userId}`, name: "Onboarding User", schoolCode: "TEST-ONBOARDING", loginMethod: "custom", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }));
    await expect(caller.preferences.getOnboardingStatus()).resolves.toEqual({ shouldShow: true });
    await expect(caller.preferences.completeOnboarding()).resolves.toEqual({ success: true });
    await expect(caller.preferences.getOnboardingStatus()).resolves.toEqual({ shouldShow: false });
  });
});
