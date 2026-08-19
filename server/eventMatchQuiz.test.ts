import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { EVENT_MATCH_PROFILES, EVENT_MATCH_QUESTIONS, scoreEventMatchQuiz } from "../shared/eventMatchQuiz";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { userEventQuizResults, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function answersFor(optionIds: Record<string, string>) {
  return Object.fromEntries(EVENT_MATCH_QUESTIONS.map((question) => [question.id, optionIds[question.id] ?? question.options[0]!.id]));
}

function context(userId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `event-match-test-${userId}`,
    name: "Event Match Tester",
    schoolCode: "TEST-EVENT-MATCH",
    loginMethod: "custom",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("DECA Event Match Quiz", () => {
  let userId = 0;

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for event quiz test");
    const inserted = await database.insert(users).values({
      openId: `event-match-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: "Event Match Tester",
      schoolCode: "TEST-EVENT-MATCH",
      loginMethod: "custom",
      role: "user",
    });
    userId = Number(inserted[0].insertId);
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database || !userId) return;
    await database.delete(userEventQuizResults).where(eq(userEventQuizResults.userId, userId));
    await database.delete(users).where(eq(users.id, userId));
  });

  it("uses 12 questions and deterministically ranks three supported events", () => {
    expect(EVENT_MATCH_QUESTIONS).toHaveLength(12);
    const result = scoreEventMatchQuiz(answersFor({
      interest: "finance",
      strength: "numbers",
      project: "investments",
      "numbers-comfort": "enjoy",
      "business-lens": "finances",
      environment: "banking",
      statement: "data",
    }));

    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations[0]!.eventCode).toMatch(/^(ACT|BFS|FCE|PFN|FTDM|FOR|SMG|PFL|PMFL)$/);
    expect(result.recommendations.every((item) => EVENT_MATCH_PROFILES.some((profile) => profile.eventCode === item.eventCode))).toBe(true);
    expect(result.recommendations.every((item) => item.compatibility >= 55 && item.compatibility <= 98)).toBe(true);
    expect(result.traitScores.finance).toBeGreaterThan(result.traitScores.hospitality);
  });

  it("persists quiz recommendations and changes the primary event only after explicit selection", async () => {
    const caller = appRouter.createCaller(context(userId));
    const answers = answersFor({ interest: "finance", strength: "numbers", project: "investments", "numbers-comfort": "enjoy", "business-lens": "finances", environment: "banking", statement: "data" });
    const submitted = await caller.preferences.submitEventMatchQuiz({ answers });
    const beforeChoose = await caller.preferences.getEventMatchQuiz();

    expect(submitted.recommendations).toHaveLength(3);
    expect(beforeChoose.primaryEventCode).toBeNull();
    expect(beforeChoose.quiz?.recommendedEventCodes).toEqual(submitted.recommendations.map((item) => item.eventCode));

    await caller.preferences.chooseEventMatch({ eventCode: "ACT" });
    const afterChoose = await caller.preferences.getEventMatchQuiz();
    expect(afterChoose.primaryEventCode).toBe("ACT");
    expect(afterChoose.quiz?.selectedEventCode).toBe("ACT");
  });

  it("connects onboarding and Profile event selection to a skippable quiz with manual event browsing", () => {
    const appSource = readFileSync(join(process.cwd(), "client/src/App.tsx"), "utf8");
    const tourSource = readFileSync(join(process.cwd(), "client/src/components/FirstSignInTour.tsx"), "utf8");
    const quizSource = readFileSync(join(process.cwd(), "client/src/pages/EventMatchQuiz.tsx"), "utf8");
    const profileSource = readFileSync(join(process.cwd(), "client/src/pages/Profile.tsx"), "utf8");

    expect(appSource).toContain('path="/event-match"');
    expect(tourSource).toContain('"/event-match?onboarding=1"');
    expect(quizSource).toContain("Skip for now");
    expect(quizSource).toContain("Browse all DECA events");
    expect(quizSource).toContain("chooseEvent.mutate");
    expect(profileSource).toContain("Find Your DECA Event");
    expect(profileSource).toContain('href="/event-match?retake=1"');
  });
});
