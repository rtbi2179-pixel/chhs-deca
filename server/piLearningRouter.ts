import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import {
  piLearningModules,
  piModuleSections,
  piFlashcards,
  piQuizQuestions,
  piScenarioChallenges,
  userPiProgress,
  userPiSectionProgress,
} from "../drizzle/schema";
import { and, eq, desc } from "drizzle-orm";
import { database } from "./_core/index";

export const piLearningRouter = router({
  /**
   * Get all PI Learning Modules for a cluster
   */
  getModulesByCluster: protectedProcedure
    .input(z.object({ cluster: z.string() }))
    .query(async ({ input }) => {
      const modules = await database
        .select()
        .from(piLearningModules)
        .where(eq(piLearningModules.cluster, input.cluster));
      return modules;
    }),

  /**
   * Get a specific PI Learning Module with all its sections
   */
  getModuleWithSections: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ input }) => {
      const module = await database
        .select()
        .from(piLearningModules)
        .where(eq(piLearningModules.id, input.moduleId))
        .limit(1);

      if (!module[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Module not found" });
      }

      const sections = await database
        .select()
        .from(piModuleSections)
        .where(eq(piModuleSections.moduleId, input.moduleId));

      return {
        ...module[0],
        sections,
      };
    }),

  /**
   * Get a specific section with all its content (flashcards, quiz questions, scenarios)
   */
  getSectionContent: protectedProcedure
    .input(z.object({ sectionId: z.number() }))
    .query(async ({ input }) => {
      const section = await database
        .select()
        .from(piModuleSections)
        .where(eq(piModuleSections.id, input.sectionId))
        .limit(1);

      if (!section[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
      }

      const flashcards = await database
        .select()
        .from(piFlashcards)
        .where(eq(piFlashcards.sectionId, input.sectionId));

      const quizQuestions = await database
        .select()
        .from(piQuizQuestions)
        .where(eq(piQuizQuestions.sectionId, input.sectionId));

      const scenarios = await database
        .select()
        .from(piScenarioChallenges)
        .where(eq(piScenarioChallenges.sectionId, input.sectionId));

      return {
        ...section[0],
        flashcards,
        quizQuestions,
        scenarios,
      };
    }),

  /**
   * Update user mastery score for a module
   */
  updateModuleMastery: protectedProcedure
    .input(
      z.object({
        moduleId: z.number(),
        masteryScore: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await database
        .select()
        .from(userPiProgress)
        .where(
          and(
            eq(userPiProgress.userId, ctx.user.id),
            eq(userPiProgress.moduleId, input.moduleId)
          )
        )
        .limit(1);

      if (existing[0]) {
        // Update existing record
        await database
          .update(userPiProgress)
          .set({
            masteryScore: input.masteryScore,
            reviewStatus:
              input.masteryScore >= 80
                ? "fresh"
                : input.masteryScore >= 50
                  ? "rusty"
                  : "needs_review",
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          })
          .where(
            and(
              eq(userPiProgress.userId, ctx.user.id),
              eq(userPiProgress.moduleId, input.moduleId)
            )
          );
      } else {
        // Create new record
        await database.insert(userPiProgress).values({
          userId: ctx.user.id,
          moduleId: input.moduleId,
          masteryScore: input.masteryScore,
          reviewStatus:
            input.masteryScore >= 80
              ? "fresh"
              : input.masteryScore >= 50
                ? "rusty"
                : "needs_review",
          lastReviewedAt: new Date(),
          nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }

      return { success: true };
    }),

  /**
   * Update user progress for a section
   */
  updateSectionProgress: protectedProcedure
    .input(
      z.object({
        sectionId: z.number(),
        isCompleted: z.boolean(),
        score: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await database
        .select()
        .from(userPiSectionProgress)
        .where(
          and(
            eq(userPiSectionProgress.userId, ctx.user.id),
            eq(userPiSectionProgress.sectionId, input.sectionId)
          )
        )
        .limit(1);

      if (existing[0]) {
        // Update existing record
        await database
          .update(userPiSectionProgress)
          .set({
            isCompleted: input.isCompleted,
            score: input.score || existing[0].score,
            lastAttemptAt: new Date(),
          })
          .where(
            and(
              eq(userPiSectionProgress.userId, ctx.user.id),
              eq(userPiSectionProgress.sectionId, input.sectionId)
            )
          );
      } else {
        // Create new record
        await database.insert(userPiSectionProgress).values({
          userId: ctx.user.id,
          sectionId: input.sectionId,
          isCompleted: input.isCompleted,
          score: input.score || 0,
          lastAttemptAt: new Date(),
        });
      }

      return { success: true };
    }),

  /**
   * Get user's progress for a module
   */
  getUserModuleProgress: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const progress = await database
        .select()
        .from(userPiProgress)
        .where(
          and(
            eq(userPiProgress.userId, ctx.user.id),
            eq(userPiProgress.moduleId, input.moduleId)
          )
        )
        .limit(1);

      return progress[0] || null;
    }),

  /**
   * Get user's progress for all modules in a cluster
   */
  getUserClusterProgress: protectedProcedure
    .input(z.object({ cluster: z.string() }))
    .query(async ({ ctx, input }) => {
      const modules = await database
        .select()
        .from(piLearningModules)
        .where(eq(piLearningModules.cluster, input.cluster));

      const moduleIds = modules.map((m) => m.id);

      if (moduleIds.length === 0) {
        return [];
      }

      const progress = await database
        .select()
        .from(userPiProgress)
        .where(
          and(
            eq(userPiProgress.userId, ctx.user.id),
            // We'll filter manually since we need to check against multiple moduleIds
          )
        );

      return progress.filter((p) => moduleIds.includes(p.moduleId));
    }),

  /**
   * Get user's overall mastery dashboard
   */
  getUserMasteryDashboard: protectedProcedure.query(async ({ ctx }) => {
    const allProgress = await database
      .select()
      .from(userPiProgress)
      .where(eq(userPiProgress.userId, ctx.user.id));

    const clusters = [
      "Marketing",
      "Finance",
      "Business Management",
      "Hospitality",
    ];
    const clusterStats = await Promise.all(
      clusters.map(async (cluster) => {
        const modules = await database
          .select()
          .from(piLearningModules)
          .where(eq(piLearningModules.cluster, cluster));

        const clusterProgress = allProgress.filter((p) =>
          modules.some((m) => m.id === p.moduleId)
        );

        const avgMastery =
          clusterProgress.length > 0
            ? Math.round(
                clusterProgress.reduce((sum, p) => sum + p.masteryScore, 0) /
                  clusterProgress.length
              )
            : 0;

        return {
          cluster,
          totalModules: modules.length,
          completedModules: clusterProgress.filter(
            (p) => p.masteryScore >= 80
          ).length,
          averageMastery: avgMastery,
        };
      })
    );

    const overallMastery =
      allProgress.length > 0
        ? Math.round(
            allProgress.reduce((sum, p) => sum + p.masteryScore, 0) /
              allProgress.length
          )
        : 0;

    return {
      overallMastery,
      totalModulesCompleted: allProgress.filter(
        (p) => p.masteryScore >= 80
      ).length,
      clusterStats,
      recentlyReviewed: allProgress
        .sort((a, b) => b.lastReviewedAt.getTime() - a.lastReviewedAt.getTime())
        .slice(0, 5),
    };
  }),

  /**
   * Get modules that need review (spaced repetition)
   */
  getModulesNeedingReview: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const needsReview = await database
      .select()
      .from(userPiProgress)
      .where(
        and(
          eq(userPiProgress.userId, ctx.user.id),
          // We'll filter manually since Drizzle doesn't have a simple way to compare dates
        )
      );

    return needsReview.filter((p) => p.nextReviewAt <= now);
  }),

  /**
   * Create a new PI Learning Module (admin only)
   */
  createModule: protectedProcedure
    .input(
      z.object({
        piId: z.string(),
        cluster: z.string(),
        instructionalArea: z.string(),
        performanceIndicator: z.string(),
        level: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await database.insert(piLearningModules).values({
        piId: input.piId,
        cluster: input.cluster,
        instructionalArea: input.instructionalArea,
        performanceIndicator: input.performanceIndicator,
        level: input.level,
      });

      return result;
    }),

  /**
   * Create a new section for a module (admin only)
   */
  createSection: protectedProcedure
    .input(
      z.object({
        moduleId: z.number(),
        sectionType: z.enum([
          "theory",
          "vocabulary",
          "examples",
          "flashcards",
          "quiz",
          "scenario_challenge",
          "ai_coach_feedback",
        ]),
        title: z.string(),
        content: z.string().optional(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await database.insert(piModuleSections).values({
        moduleId: input.moduleId,
        sectionType: input.sectionType,
        title: input.title,
        content: input.content,
        order: input.order,
      });

      return result;
    }),
});
