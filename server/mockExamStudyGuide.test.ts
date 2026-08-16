import { eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { questions, sessionQuestions, studySessions, users } from "../drizzle/schema";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function question(id: string, cluster: string, instructionalArea: string, performanceIndicatorFocus: string) {
  return {
    id,
    cluster,
    instructionalArea,
    performanceIndicatorFocus,
    cognitiveLevel: "Application",
    difficulty: "Medium",
    stem: `Question for ${performanceIndicatorFocus}`,
    optionA: "Option A",
    optionB: "Option B",
    optionC: "Option C",
    optionD: "Option D",
    correctAnswer: "A",
  };
}

describe("Chapter Mock Exam targeted study guide", () => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const schoolCode = `TEST-MOCK-GUIDE-${stamp}`;
  const questionIds = ["exam-a-1", "exam-a-2", "exam-b-1", "review-a", "review-b", "other-cluster"].map((id) => `${id}-${stamp}`);
  let userId = 0;
  let sessionId = 0;

  const user = (): AuthenticatedUser => ({
    id: userId,
    openId: `mock-guide-user-${stamp}`,
    name: "Mock Guide Student",
    schoolCode,
    loginMethod: "custom",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });

  beforeEach(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database unavailable for mock-exam study-guide test");
    const insertedUser = await database.insert(users).values({ openId: user().openId, name: user().name, schoolCode, role: "user", loginMethod: "custom" });
    userId = Number(insertedUser[0].insertId);
    const insertedSession = await database.insert(studySessions).values({
      userId,
      title: "Chapter Mock Exam — Marketing",
      cluster: "Marketing",
      totalQuestions: 3,
      questionsAnswered: 3,
      correctAnswers: 1,
    });
    sessionId = Number(insertedSession[0].insertId);
    await database.insert(questions).values([
      question(questionIds[0], "Marketing", "Promotion", "Explain promotional mix"),
      question(questionIds[1], "Marketing", "Promotion", "Explain promotional mix"),
      question(questionIds[2], "Marketing", "Selling", "Determine customer needs"),
      question(questionIds[3], "Marketing", "Promotion", "Explain promotional mix"),
      question(questionIds[4], "Marketing", "Selling", "Determine customer needs"),
      question(questionIds[5], "Finance", "Promotion", "Explain promotional mix"),
    ]);
    await database.insert(sessionQuestions).values([
      { sessionId, questionId: questionIds[0], userAnswer: "B", isCorrect: 0 },
      { sessionId, questionId: questionIds[1], userAnswer: "A", isCorrect: 1 },
      { sessionId, questionId: questionIds[2], userAnswer: "B", isCorrect: 0 },
    ]);
  });

  afterEach(async () => {
    const database = await getDb();
    if (!database) return;
    if (sessionId) {
      await database.delete(sessionQuestions).where(eq(sessionQuestions.sessionId, sessionId));
      await database.delete(studySessions).where(eq(studySessions.id, sessionId));
    }
    await database.delete(questions).where(inArray(questions.id, questionIds));
    if (userId) await database.delete(users).where(eq(users.id, userId));
  });

  it("returns concept and PI accuracy plus fresh same-cluster questions for underperforming PIs", async () => {
    const context: TrpcContext = { user: user(), req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const result = await appRouter.createCaller(context).mockExams.getResults({ sessionId });

    expect(result).toMatchObject({ score: 1, total: 3, accuracy: 33 });
    expect(result.instructionalAreas).toEqual(expect.arrayContaining([
      expect.objectContaining({ instructionalArea: "Promotion", accuracy: 50 }),
      expect.objectContaining({ instructionalArea: "Selling", accuracy: 0 }),
    ]));
    expect(result.underperformingPIs).toEqual(expect.arrayContaining([
      expect.objectContaining({ performanceIndicator: "Explain promotional mix", accuracy: 50 }),
      expect.objectContaining({ performanceIndicator: "Determine customer needs", accuracy: 0 }),
    ]));
    const promotionGuide = result.studyGuide.find((section) => section.performanceIndicator === "Explain promotional mix");
    const sellingGuide = result.studyGuide.find((section) => section.performanceIndicator === "Determine customer needs");
    expect(promotionGuide?.questions.length).toBeGreaterThan(0);
    expect(promotionGuide?.questions.every((item) => item.performanceIndicatorFocus === "Explain promotional mix")).toBe(true);
    expect(sellingGuide?.questions).toEqual([expect.objectContaining({ id: questionIds[4], performanceIndicatorFocus: "Determine customer needs" })]);
    const studyQuestionIds = result.studyGuide.flatMap((section) => section.questions).map((item) => item.id);
    expect(studyQuestionIds).not.toContain(questionIds[5]);
    expect(studyQuestionIds).not.toContain(questionIds[0]);
  });
});
