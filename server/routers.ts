import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { questions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  volunteers: router({
    signUp: protectedProcedure
      .input(z.object({ opportunityId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const signup = await db.createVolunteerSignup(ctx.user.id, input.opportunityId);
        
        // Notify admin
        await notifyOwner({
          title: "New Volunteer Sign-Up",
          content: `${ctx.user.name} (${ctx.user.email}) signed up for volunteer opportunity #${input.opportunityId}`,
        });
        
        return signup;
      }),
    getByOpportunity: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(({ input }) => db.getVolunteersByOpportunity(input.opportunityId)),
    getUserSignups: protectedProcedure
      .query(({ ctx }) => db.getUserVolunteerSignups(ctx.user.id)),
    getAllSignups: publicProcedure
      .query(() => db.getAllVolunteerSignups()),
  }),

  practice: router({
    getQuestions: publicProcedure
      .input(z.object({ cluster: z.string().optional(), difficulty: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];

        let query = dbInstance.select().from(questions);

        if (input.cluster) {
          query = query.where(eq(questions.cluster, input.cluster)) as any;
        }

        if (input.difficulty) {
          query = query.where(eq(questions.difficulty, input.difficulty)) as any;
        }

        return query;
      }),
    addBookmark: protectedProcedure
      .input(z.object({ questionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.addBookmark(ctx.user.id, input.questionId);
      }),
    removeBookmark: protectedProcedure
      .input(z.object({ questionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.removeBookmark(ctx.user.id, input.questionId);
      }),
    getBookmarks: protectedProcedure
      .query(({ ctx }) => db.getUserBookmarks(ctx.user.id)),
    isBookmarked: protectedProcedure
      .input(z.object({ questionId: z.number() }))
      .query(({ input, ctx }) => db.isQuestionBookmarked(ctx.user.id, input.questionId)),
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ input }) => db.getLeaderboard(input.limit)),
    getLeaderboardByCluster: publicProcedure
      .input(z.object({ cluster: z.string(), limit: z.number().optional() }))
      .query(({ input }) => db.getLeaderboardByCluster(input.cluster, input.limit)),
    updateLeaderboard: protectedProcedure
      .input(z.object({ correctAnswers: z.number(), totalAnswered: z.number(), cluster: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return db.updateLeaderboard(ctx.user.id, input.correctAnswers, input.totalAnswered, input.cluster);
      }),
  }),

  discussions: router({
    createThread: protectedProcedure
      .input(z.object({ title: z.string(), content: z.string(), category: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return db.createDiscussionThread(ctx.user.id, input.title, input.content, input.category);
      }),
    getThreads: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(({ input }) => db.getDiscussionThreads(input?.category)),
    createReply: protectedProcedure
      .input(z.object({ threadId: z.number(), content: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const reply = await db.createDiscussionReply(input.threadId, ctx.user.id, input.content);
        
        // TODO: Notify thread author about new reply
        
        return reply;
      }),
    getReplies: publicProcedure
      .input(z.object({ threadId: z.number() }))
      .query(({ input }) => db.getDiscussionReplies(input.threadId)),
    deleteThread: protectedProcedure
      .input(z.object({ threadId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const success = await db.deleteDiscussionThread(input.threadId, ctx.user.id, ctx.user.role);
        return { success };
      }),
    deleteReply: protectedProcedure
      .input(z.object({ replyId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const success = await db.deleteDiscussionReply(input.replyId, ctx.user.id, ctx.user.role);
        return { success };
      }),
  }),
});

export type AppRouter = typeof appRouter;
