import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { questions, sessionQuestions, studySessions, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("cluster-focused Chapter Mock Exams", () => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const schoolCode = `TEST-MOCK-CLUSTER-${stamp}`;
  const marketingQuestionIds: string[] = [];
  const financeQuestionIds: string[] = [];
  let userId = 0;
  let sessionId = 0;

  const testUser = (): AuthenticatedUser => ({
    id: userId,
    openId: `mock-cluster-user-${stamp}`,
    name: "Mock Cluster Student",
    schoolCode,
    loginMethod: "custom",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for mock-exam cluster workflow test");
    const insertedUser = await database.insert(users).values({ openId: `mock-cluster-user-${stamp}`, name: "Mock Cluster Student", schoolCode, role: "user", loginMethod: "custom" });
    userId = Number(insertedUser[0].insertId);

    const difficulties = [
      ...Array.from({ length: 25 }, () => "Easy"),
      ...Array.from({ length: 50 }, () => "Medium"),
      ...Array.from({ length: 25 }, () => "Hard"),
    ];
    const seedQuestions = ["Marketing", "Finance"].flatMap((cluster) => difficulties.map((difficulty, index) => {
      const id = `mock-${cluster.toLowerCase()}-${stamp}-${index}`;
      (cluster === "Marketing" ? marketingQuestionIds : financeQuestionIds).push(id);
      return {
        id,
        cluster,
        instructionalArea: `${cluster} Concepts`,
        performanceIndicatorFocus: `Test ${cluster} indicator ${index}`,
        cognitiveLevel: "Application",
        difficulty,
        stem: `Test ${cluster} question ${index}`,
        optionA: "Correct option",
        optionB: "Option B",
        optionC: "Option C",
        optionD: "Option D",
        correctAnswer: "A",
      };
    }));
    await database.insert(questions).values(seedQuestions);
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    if (sessionId) {
      await database.delete(sessionQuestions).where(eq(sessionQuestions.sessionId, sessionId));
      await database.delete(studySessions).where(eq(studySessions.id, sessionId));
    }
    const questionIds = [...marketingQuestionIds, ...financeQuestionIds];
    if (questionIds.length) await database.delete(questions).where(inArray(questions.id, questionIds));
    if (userId) await database.delete(users).where(eq(users.id, userId));
  });

  it("persists a 100-question session using only unanswered questions in the selected cluster", async () => {
    const caller = appRouter.createCaller(context(testUser()));
    const created = await caller.mockExams.createChapterMock({ cluster: "Marketing" });
    sessionId = created.sessionId;

    expect(created).toMatchObject({ cluster: "Marketing", totalQuestions: 100, difficultyPlan: { easy: 25, medium: 50, hard: 25 } });
    const database = await getDb();
    if (!database) throw new Error("Database unavailable after mock generation");
    const persisted = await database.select({ cluster: questions.cluster, questionId: sessionQuestions.questionId })
      .from(sessionQuestions)
      .innerJoin(questions, eq(sessionQuestions.questionId, questions.id))
      .where(eq(sessionQuestions.sessionId, created.sessionId));
    const [session] = await database.select().from(studySessions)
      .where(and(eq(studySessions.id, created.sessionId), eq(studySessions.userId, userId)));

    expect(persisted).toHaveLength(100);
    expect(persisted.every((question) => question.cluster === "Marketing")).toBe(true);
    expect(persisted.some((question) => financeQuestionIds.includes(question.questionId))).toBe(false);
    expect(session?.cluster).toBe("Marketing");
  });
});
