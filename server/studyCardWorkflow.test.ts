import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { questions, userStudyCards, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("virtual Study Card member workflow", () => {
  const schoolCode = `TEST-STUDY-CARD-${Date.now()}`;
  let userId = 0;
  let questionId = "";

  const user = (): AuthenticatedUser => ({
    id: userId,
    openId: `study-card-user-${userId}`,
    name: "Study Card Student",
    schoolCode,
    loginMethod: "custom",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for study-card workflow test");
    const created = await database.insert(users).values({ openId: `study-card-user-${Date.now()}-${Math.random()}`, name: "Study Card Student", schoolCode, role: "user", loginMethod: "custom" });
    userId = Number(created[0].insertId);
    questionId = `sch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await database.insert(questions).values({
      id: questionId,
      cluster: "Marketing",
      instructionalArea: "Marketing",
      performanceIndicatorFocus: "Test study-card reward",
      cognitiveLevel: "Application",
      difficulty: "Hard",
      stem: "Which answer validates a virtual study-card bonus?",
      optionA: "Correct option",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      correctAnswer: "A",
    });
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    if (userId) {
      await database.delete(userStudyCards).where(eq(userStudyCards.userId, userId));
      await database.delete(users).where(eq(users.id, userId));
    }
    if (questionId) await database.delete(questions).where(eq(questions.id, questionId));
  });

  it("shows a balanced default, permits switching, and persists the virtual active card", async () => {
    const caller = appRouter.createCaller(context(user()));
    await expect(caller.studyCards.catalog()).resolves.toMatchObject({ virtualOnly: true, cards: expect.arrayContaining([expect.objectContaining({ key: "scholar" })]) });
    await expect(caller.studyCards.mine()).resolves.toMatchObject({ cardKey: "blazer", level: 1 });
    await expect(caller.studyCards.select({ cardKey: "scholar" })).resolves.toMatchObject({ cardKey: "scholar", level: 1 });
    await expect(caller.studyCards.mine()).resolves.toMatchObject({ cardKey: "scholar", practiceProgress: 0 });
    await expect(caller.studyCards.select({ cardKey: "entrepreneur" })).resolves.toMatchObject({ cardKey: "entrepreneur" });
  });

  it("awards the entrepreneur hard-question bonus through the existing first-attempt reward guard", async () => {
    const caller = appRouter.createCaller(context(user()));
    await caller.studyCards.select({ cardKey: "entrepreneur" });
    await expect(caller.practice.submitAnswer({ questionId, selectedAnswer: "A", correctAnswer: "A" })).resolves.toMatchObject({
      isCorrect: true,
      blueBucksAwarded: 120,
      studyCardBonus: 20,
    });
    await expect(caller.practice.submitAnswer({ questionId, selectedAnswer: "A", correctAnswer: "A" })).resolves.toMatchObject({
      blueBucksAwarded: 0,
      studyCardBonus: 0,
    });
    await expect(caller.studyCards.mine()).resolves.toMatchObject({ cardKey: "entrepreneur", practiceProgress: 1, bonusBlueBucks: 20 });
  });
});
