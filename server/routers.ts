import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getAnnouncementsBySchool, createAnnouncement, likeAnnouncement, getAnnouncementLikes, addAnnouncementComment, getAnnouncementComments, deleteAnnouncement } from "./db";
import { notifyOwner } from "./_core/notification";
import { questions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  announcements: announcementsRouter,
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
    signup: publicProcedure
      .input(z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Valid email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        schoolCode: z.string().min(1, "School code is required"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Get client IP
          const clientIp = ctx.req.headers['x-forwarded-for']?.toString().split(',')[0] || ctx.req.socket.remoteAddress || 'unknown';
          
          // Check rate limit
          const rateLimit = await db.checkIpRateLimit(clientIp, 'signup');
          if (rateLimit.isLimited) {
            throw new Error("Too many signup attempts. Please try again later.");
          }
          
          // Track attempt
          await db.trackIpAttempt(clientIp, 'signup');
          
          await db.createCustomAuthUser(
            input.firstName,
            input.lastName,
            input.email,
            input.password,
            input.schoolCode
          );
          
          // Reset on success
          await db.resetIpRateLimit(clientIp, 'signup');
          
          return { success: true };
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Valid email is required"),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await db.authenticateUser(input.email, input.password);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, user.id.toString(), cookieOptions);
          return { success: true, user };
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    getSchoolCodes: publicProcedure
      .query(() => db.getActiveSchoolCodes()),
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email("Valid email is required"),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await db.requestPasswordReset(input.email);
          return { success: true, message: "Password reset email sent" };
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.resetPassword(input.token, input.newPassword);
          return { success: true, message: "Password reset successful" };
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    verifyEmail: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.verifyEmail(input.token);
          return { success: true, message: "Email verified successfully" };
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    generateTwoFactorCode: protectedProcedure
      .mutation(async ({ ctx }) => {
        try {
          const result = await db.generateTwoFactorCode(ctx.user.id);
          return { success: true, message: "2FA code sent to email" };
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    verifyTwoFactorCode: publicProcedure
      .input(z.object({
        userId: z.number(),
        code: z.string().length(6, "Code must be 6 digits"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await db.verifyTwoFactorCode(input.userId, input.code);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, input.userId.toString(), cookieOptions);
          return { success: true, message: "2FA verification successful" };
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    resendEmailVerification: publicProcedure
      .input(z.object({
        email: z.string().email("Valid email is required"),
      }))
      .mutation(async ({ input }) => {
        try {
          const user = await db.getUserByEmail(input.email);
          if (!user) {
            throw new Error("User not found");
          }
          await db.sendEmailVerification(user.id);
          return { success: true, message: "Verification email sent" };
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    
    promoteToAdmin: publicProcedure
      .input(z.object({
        email: z.string().email("Valid email is required"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Only super_admin can promote
          if (ctx.user?.role !== "super_admin") {
            throw new Error("Only super admins can promote users");
          }
          
          const result = await db.promoteToAdmin(input.email);
          return result;
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    
    demoteFromAdmin: publicProcedure
      .input(z.object({
        email: z.string().email("Valid email is required"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Only super_admin can demote
          if (ctx.user?.role !== "super_admin") {
            throw new Error("Only super admins can demote users");
          }
          
          const result = await db.demoteFromAdmin(input.email);
          return result;
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    
    getAllAdmins: publicProcedure
      .query(async ({ ctx }) => {
        try {
          // Only admins can view admin list
          if (!ctx.user || (ctx.user.role !== "admin" && ctx.user.role !== "super_admin")) {
            throw new Error("Unauthorized");
          }
          
          const admins = await db.getAllAdmins();
          return admins;
        } catch (error: any) {
          throw new Error(error.message);
        }
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
      .query(async ({ input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) return [];

        let baseQuery = db_instance.select().from(questions);

        if (input.cluster && input.cluster !== "all") {
          baseQuery = baseQuery.where(eq(questions.cluster, input.cluster)) as any;
        }

        if (input.difficulty && input.difficulty !== "all") {
          baseQuery = baseQuery.where(eq(questions.difficulty, input.difficulty)) as any;
        }

        return await baseQuery;
      }),

    addBookmark: protectedProcedure
      .input(z.object({ questionId: z.number() }))
      .mutation(({ input, ctx }) => db.addBookmark(ctx.user.id, input.questionId)),

    removeBookmark: protectedProcedure
      .input(z.object({ questionId: z.number() }))
      .mutation(({ input, ctx }) => db.removeBookmark(ctx.user.id, input.questionId)),

    isBookmarked: protectedProcedure
      .input(z.object({ questionId: z.number() }))
      .query(({ input, ctx }) => db.isQuestionBookmarked(ctx.user.id, input.questionId)),

    getBookmarkedQuestions: protectedProcedure
      .query(({ ctx }) => db.getBookmarkedQuestionsWithDetails(ctx.user.id)),

    createStudySession: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        questionIds: z.array(z.number()),
      }))
      .mutation(({ input, ctx }) => db.createStudySession(ctx.user.id, input.name, input.questionIds)),

    updateLeaderboard: protectedProcedure
      .input(z.object({
        correctAnswers: z.number(),
        totalAnswered: z.number(),
        cluster: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateLeaderboard(ctx.user.id, input.correctAnswers, input.totalAnswered, input.cluster);
        return { success: true };
      }),

    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(({ input }) => db.getLeaderboard(input.limit)),

    getLeaderboardByCluster: publicProcedure
      .input(z.object({ cluster: z.string(), limit: z.number().default(50) }))
      .query(({ input }) => db.getLeaderboardByCluster(input.cluster, input.limit)),
  }),

  discussions: router({
    getThreads: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(() => db.getDiscussionThreads()),

    createThread: protectedProcedure
      .input(z.object({ title: z.string(), content: z.string(), category: z.string().default("general") }))
      .mutation(({ input, ctx }) => db.createDiscussionThread(ctx.user.id, input.title, input.content, input.category)),

    getReplies: publicProcedure
      .input(z.object({ threadId: z.number() }))
      .query(({ input }) => db.getDiscussionReplies(input.threadId)),

    createReply: protectedProcedure
      .input(z.object({ threadId: z.number(), content: z.string() }))
      .mutation(({ input, ctx }) => db.createDiscussionReply(ctx.user.id, input.threadId, input.content)),

    deleteThread: protectedProcedure
      .input(z.object({ threadId: z.number() }))
      .mutation(({ input, ctx }) => db.deleteDiscussionThread(input.threadId, ctx.user.id, ctx.user.role)),

    deleteReply: protectedProcedure
      .input(z.object({ replyId: z.number() }))
      .mutation(({ input, ctx }) => db.deleteDiscussionReply(input.replyId, ctx.user.id, ctx.user.role)),
  }),
});

export type AppRouter = typeof appRouter;

// ===== ANNOUNCEMENTS ROUTER =====
export const announcementsRouter = router({
  getBySchool: publicProcedure
    .input(z.object({ schoolCode: z.string() }))
    .query(async ({ input }) => {
      return await getAnnouncementsBySchool(input.schoolCode)
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      imageUrl: z.string().optional(),
      fileUrl: z.string().optional(),
      fileName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      if (!ctx.user.schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User has no school code' })
      }

      return await createAnnouncement({
        schoolCode: ctx.user.schoolCode,
        authorId: ctx.user.id,
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
      })
    }),

  like: protectedProcedure
    .input(z.object({ announcementId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await likeAnnouncement(input.announcementId, ctx.user.id)
    }),

  getLikes: publicProcedure
    .input(z.object({ announcementId: z.number() }))
    .query(async ({ input }) => {
      return await getAnnouncementLikes(input.announcementId)
    }),

  addComment: protectedProcedure
    .input(z.object({ announcementId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await addAnnouncementComment(input.announcementId, ctx.user.id, input.content)
    }),

  getComments: publicProcedure
    .input(z.object({ announcementId: z.number() }))
    .query(async ({ input }) => {
      return await getAnnouncementComments(input.announcementId)
    }),

  delete: protectedProcedure
    .input(z.object({ announcementId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      return await deleteAnnouncement(input.announcementId)
    }),
})
