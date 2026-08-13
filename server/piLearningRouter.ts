import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import {
  piFlashcards,
  piLearningModules,
  piModuleSections,
  piQuizQuestions,
  piScenarioChallenges,
  userPiProgress,
  userPiSectionProgress,
} from "../drizzle/schema";

export const PI_CLUSTERS = [
  "Marketing",
  "Finance",
  "Business Management & Administration",
  "Hospitality & Tourism",
  "Business Administration Core",
  "Entrepreneurship",
  "Personal Financial Literacy",
] as const;

const sectionWeights: Record<string, number> = {
  theory: 10,
  vocabulary: 10,
  flashcards: 20,
  quiz: 25,
  scenario_challenge: 20,
  examples: 0,
  ai_coach_feedback: 15,
};

async function requireDatabase() {
  const database = await db.getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Learning database is unavailable." });
  }
  return database;
}

function reviewStatusFor(score: number): "fresh" | "rusty" | "needs_review" {
  if (score >= 85) return "fresh";
  if (score >= 50) return "rusty";
  return "needs_review";
}

function nextReviewFor(score: number): Date {
  const days = score >= 85 ? 14 : score >= 50 ? 7 : 1;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function recalculateModuleProgress(userId: number, moduleId: number) {
  const database = await requireDatabase();
  const sections = await database
    .select({ id: piModuleSections.id, sectionType: piModuleSections.sectionType })
    .from(piModuleSections)
    .where(eq(piModuleSections.moduleId, moduleId));

  const sectionIds = sections.map(section => section.id);
  const progressRows = sectionIds.length
    ? await database
        .select()
        .from(userPiSectionProgress)
        .where(and(eq(userPiSectionProgress.userId, userId), inArray(userPiSectionProgress.sectionId, sectionIds)))
    : [];

  const progressBySection = new Map(progressRows.map(progress => [progress.sectionId, progress]));
  const countByType = new Map<string, number>();
  for (const section of sections) {
    countByType.set(section.sectionType, (countByType.get(section.sectionType) ?? 0) + 1);
  }

  let masteryScore = 0;
  for (const section of sections) {
    const weight = sectionWeights[section.sectionType] ?? 0;
    const perSectionWeight = weight / (countByType.get(section.sectionType) ?? 1);
    const progress = progressBySection.get(section.id);
    const score = progress?.isCompleted ? Math.min(100, Math.max(0, progress.score)) : 0;
    masteryScore += perSectionWeight * (score / 100);
  }

  const roundedScore = Math.round(Math.min(100, Math.max(0, masteryScore)));
  const now = new Date();
  await database
    .insert(userPiProgress)
    .values({
      userId,
      moduleId,
      masteryScore: roundedScore,
      reviewStatus: reviewStatusFor(roundedScore),
      lastReviewedAt: now,
      nextReviewAt: nextReviewFor(roundedScore),
    })
    .onDuplicateKeyUpdate({
      set: {
        masteryScore: roundedScore,
        reviewStatus: reviewStatusFor(roundedScore),
        lastReviewedAt: now,
        nextReviewAt: nextReviewFor(roundedScore),
        updatedAt: now,
      },
    });

  return { masteryScore: roundedScore, reviewStatus: reviewStatusFor(roundedScore), lastReviewedAt: now };
}

export const piLearningRouter = router({
  getClusters: protectedProcedure.query(async () => {
    return PI_CLUSTERS;
  }),

  getModulesByCluster: protectedProcedure
    .input(z.object({ cluster: z.enum(PI_CLUSTERS) }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      return database
        .select()
        .from(piLearningModules)
        .where(eq(piLearningModules.cluster, input.cluster))
        .orderBy(asc(piLearningModules.instructionalArea), asc(piLearningModules.performanceIndicator));
    }),

  getModuleWithSections: protectedProcedure
    .input(z.object({ moduleId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      const [module] = await database
        .select()
        .from(piLearningModules)
        .where(eq(piLearningModules.id, input.moduleId))
        .limit(1);
      if (!module) throw new TRPCError({ code: "NOT_FOUND", message: "PI module not found." });

      const sections = await database
        .select()
        .from(piModuleSections)
        .where(eq(piModuleSections.moduleId, module.id))
        .orderBy(asc(piModuleSections.order));
      return { ...module, sections };
    }),

  getSectionContent: protectedProcedure
    .input(z.object({ sectionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const database = await requireDatabase();
      const [section] = await database
        .select()
        .from(piModuleSections)
        .where(eq(piModuleSections.id, input.sectionId))
        .limit(1);
      if (!section) throw new TRPCError({ code: "NOT_FOUND", message: "PI section not found." });

      const [flashcards, quizQuestions, scenarios] = await Promise.all([
        section.sectionType === "flashcards"
          ? database.select().from(piFlashcards).where(eq(piFlashcards.sectionId, section.id)).orderBy(asc(piFlashcards.id))
          : Promise.resolve([]),
        section.sectionType === "quiz"
          ? database.select().from(piQuizQuestions).where(eq(piQuizQuestions.sectionId, section.id)).orderBy(asc(piQuizQuestions.id))
          : Promise.resolve([]),
        section.sectionType === "scenario_challenge"
          ? database.select().from(piScenarioChallenges).where(eq(piScenarioChallenges.sectionId, section.id)).orderBy(asc(piScenarioChallenges.id))
          : Promise.resolve([]),
      ]);

      return { ...section, content: section.content ?? "", flashcards, quizQuestions, scenarios };
    }),

  getUserModuleProgress: protectedProcedure
    .input(z.object({ moduleId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [progress] = await database
        .select()
        .from(userPiProgress)
        .where(and(eq(userPiProgress.userId, ctx.user.id), eq(userPiProgress.moduleId, input.moduleId)))
        .limit(1);
      return progress ?? {
        userId: ctx.user.id,
        moduleId: input.moduleId,
        masteryScore: 0,
        reviewStatus: "needs_review" as const,
        lastReviewedAt: null,
        nextReviewAt: null,
      };
    }),

  getUserClusterProgress: protectedProcedure
    .input(z.object({ cluster: z.enum(PI_CLUSTERS) }))
    .query(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const modules = await database.select({ id: piLearningModules.id }).from(piLearningModules).where(eq(piLearningModules.cluster, input.cluster));
      const moduleIds = modules.map(module => module.id);
      if (!moduleIds.length) return [];
      return database
        .select()
        .from(userPiProgress)
        .where(and(eq(userPiProgress.userId, ctx.user.id), inArray(userPiProgress.moduleId, moduleIds)));
    }),

  getUserMasteryDashboard: protectedProcedure.query(async ({ ctx }) => {
    const database = await requireDatabase();
    const [modules, progress] = await Promise.all([
      database.select({ id: piLearningModules.id, cluster: piLearningModules.cluster }).from(piLearningModules),
      database.select().from(userPiProgress).where(eq(userPiProgress.userId, ctx.user.id)),
    ]);
    const progressByModule = new Map(progress.map(item => [item.moduleId, item]));
    const clusters = PI_CLUSTERS.map(cluster => {
      const clusterModules = modules.filter(module => module.cluster === cluster);
      const entries = clusterModules.map(module => progressByModule.get(module.id)).filter(Boolean);
      const averageMastery = entries.length
        ? Math.round(entries.reduce((sum, item) => sum + item!.masteryScore, 0) / entries.length)
        : 0;
      return {
        cluster,
        totalModules: clusterModules.length,
        completedModules: entries.filter(item => item!.masteryScore >= 85).length,
        averageMastery,
      };
    });
    return {
      overallMastery: progress.length ? Math.round(progress.reduce((sum, item) => sum + item.masteryScore, 0) / progress.length) : 0,
      totalModulesCompleted: progress.filter(item => item.masteryScore >= 85).length,
      clusters,
      recentlyReviewed: [...progress].sort((a, b) => b.lastReviewedAt.getTime() - a.lastReviewedAt.getTime()).slice(0, 5),
    };
  }),

  getModulesNeedingReview: protectedProcedure.query(async ({ ctx }) => {
    const database = await requireDatabase();
    return database
      .select()
      .from(userPiProgress)
      .where(and(eq(userPiProgress.userId, ctx.user.id), lte(userPiProgress.nextReviewAt, new Date())))
      .orderBy(asc(userPiProgress.nextReviewAt));
  }),

  updateSectionProgress: protectedProcedure
    .input(z.object({ sectionId: z.number().int().positive(), isCompleted: z.boolean(), score: z.number().int().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const [section] = await database
        .select({ moduleId: piModuleSections.moduleId })
        .from(piModuleSections)
        .where(eq(piModuleSections.id, input.sectionId))
        .limit(1);
      if (!section) throw new TRPCError({ code: "NOT_FOUND", message: "PI section not found." });
      const now = new Date();
      await database
        .insert(userPiSectionProgress)
        .values({ userId: ctx.user.id, sectionId: input.sectionId, isCompleted: input.isCompleted, score: input.score, lastAttemptAt: now })
        .onDuplicateKeyUpdate({ set: { isCompleted: input.isCompleted, score: input.score, lastAttemptAt: now, updatedAt: now } });
      return recalculateModuleProgress(ctx.user.id, section.moduleId);
    }),

  updateModuleMastery: protectedProcedure
    .input(z.object({ moduleId: z.number().int().positive(), masteryScore: z.number().int().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const database = await requireDatabase();
      const now = new Date();
      await database
        .insert(userPiProgress)
        .values({ userId: ctx.user.id, moduleId: input.moduleId, masteryScore: input.masteryScore, reviewStatus: reviewStatusFor(input.masteryScore), lastReviewedAt: now, nextReviewAt: nextReviewFor(input.masteryScore) })
        .onDuplicateKeyUpdate({ set: { masteryScore: input.masteryScore, reviewStatus: reviewStatusFor(input.masteryScore), lastReviewedAt: now, nextReviewAt: nextReviewFor(input.masteryScore), updatedAt: now } });
      return { success: true };
    }),

  submitTeachBack: protectedProcedure
    .input(z.object({ moduleId: z.number().int().positive(), response: z.string().trim().min(20).max(5000) }))
    .mutation(async ({ input }) => {
      const database = await requireDatabase();
      const [module] = await database.select().from(piLearningModules).where(eq(piLearningModules.id, input.moduleId)).limit(1);
      if (!module) throw new TRPCError({ code: "NOT_FOUND", message: "PI module not found." });
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert DECA business educator. Give concise, constructive feedback in 2-3 sentences. Identify a strength, one precise improvement, and one concrete business or competition application. Do not invent facts outside the student's response.",
            },
            {
              role: "user",
              content: `Performance Indicator: ${module.performanceIndicator}\nInstructional area: ${module.instructionalArea}\n\nStudent teach-back:\n${input.response}`,
            },
          ],
        });
        const feedback = response.choices[0]?.message?.content;
        if (!feedback) throw new Error("The AI provider returned no feedback.");
        return { feedback: typeof feedback === "string" ? feedback : JSON.stringify(feedback) };
      } catch (error) {
        console.error("PI teach-back feedback failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI feedback could not be generated. Please try again." });
      }
    }),

  createModule: protectedProcedure
    .input(z.object({ piId: z.string().min(1), cluster: z.enum(PI_CLUSTERS), instructionalArea: z.string().min(1), performanceIndicator: z.string().min(1), level: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN" });
      const database = await requireDatabase();
      return database.insert(piLearningModules).values(input);
    }),
});
