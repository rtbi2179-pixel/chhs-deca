import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { membersRouter } from "./membersRouter";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getAnnouncementsBySchool, createAnnouncement, likeAnnouncement, getAnnouncementLikes, addAnnouncementComment, getAnnouncementComments, deleteAnnouncement } from "./db";
import { notifyOwner } from "./_core/notification";
import { getStockPrice } from "./stockPriceService";

import { questions } from "../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";

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
      schoolCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      // Super admins can specify schoolCode, regular admins use their own
      const schoolCode = input.schoolCode || ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User has no school code' })
      }

      const announcement = await createAnnouncement({
        schoolCode,
        authorId: ctx.user.id,
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
      })

      // Email notifications disabled - feature not needed

      return announcement
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

  update: protectedProcedure
    .input(z.object({
      announcementId: z.number(),
      title: z.string().min(1),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      return await db.updateAnnouncement(input.announcementId, {
        title: input.title,
        content: input.content,
      })
    }),

  addAdminComment: protectedProcedure
    .input(z.object({ announcementId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      return await addAnnouncementComment(input.announcementId, ctx.user.id, input.content)
    }),

  getAdminComments: protectedProcedure
    .input(z.object({ announcementId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      return await getAnnouncementComments(input.announcementId)
    }),

  deleteAdminComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      return await db.deleteAnnouncementComment(input.commentId)
    }),
})

export const calendarRouter = router({
  getAll: protectedProcedure
    .input(z.object({ schoolCode: z.string().optional() }).optional())
    .query(({ input, ctx }) => {
      // Super admins can view events for any school code they select
      // Regular users can only see events for their own school code
      const schoolCode = ctx.user.role === 'super_admin' ? input?.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.getAllCalendarEvents(schoolCode)
    }),
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      date: z.string(),
      time: z.string().optional(),
      location: z.string().optional(),
      link: z.string().optional(),
      type: z.enum(['district', 'state', 'icdc', 'chapter', 'deadline']),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can create events' });
      }
      const schoolCode = ctx.user.schoolCode || '';
      return db.createCalendarEvent({
        ...input,
        schoolCode,
        createdBy: ctx.user.id,
      });
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      location: z.string().optional(),
      link: z.string().optional(),
      type: z.enum(['district', 'state', 'icdc', 'chapter', 'deadline']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can update events' });
      }
      const { id, ...updateData } = input;
      return db.updateCalendarEvent(id, updateData);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can delete events' });
      }
      return db.deleteCalendarEvent(input.id);
    }),
});

export const appRouter = router({
  announcements: announcementsRouter,
  system: systemRouter,
  superAdmin: router({
    selectSchool: protectedProcedure
      .input(z.object({ schoolCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can select schools' })
        }
        return await db.updateUserSelectedSchool(ctx.user.id, input.schoolCode)
      }),
    
    getSelectedSchool: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can access this' })
        }
        return { selectedSchoolCode: ctx.user.selectedSchoolCode }
      }),
    
    getAllSchools: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can access this' })
        }
        return await db.getAllSchoolCodes()
      }),
  }),
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
    
    demoteFromAdmin: protectedProcedure
      .input(z.object({
        email: z.string().email("Valid email is required"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Only super_admin can demote
          console.log('[DEMOTE DEBUG]', { userId: ctx.user?.id, email: ctx.user?.email, role: ctx.user?.role, loginMethod: ctx.user?.loginMethod });
          if (ctx.user.role !== "super_admin") {
            throw new Error(`Only super admins can demote users. Current role: ${ctx.user?.role || 'unknown'}`);
          }
          
          const result = await db.demoteFromAdmin(input.email);
          return result;
        } catch (error: any) {
          throw new Error(error.message);
        }
      }),
    
    updateMySchoolCode: protectedProcedure
      .input(z.object({
        schoolCode: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Only super admins can change their school code
          if (ctx.user.role !== 'super_admin') {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can change school code' });
          }
          
          await db.updateUserSchoolCode(ctx.user.id, input.schoolCode);
          return { success: true, schoolCode: input.schoolCode };
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
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
    getAll: publicProcedure
      .input(z.object({ schoolCode: z.string().optional() }).optional())
      .query(({ input }) => db.getAllVolunteerOpportunitiesAdmin(input?.schoolCode)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        date: z.date(),
        spotsAvailable: z.number().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can create opportunities' });
        }
        const schoolCode = ctx.user.schoolCode || '';
        return db.createVolunteerOpportunityAdmin(input.title, input.description || '', input.date, input.spotsAvailable, schoolCode);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        spotsAvailable: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can update opportunities' });
        }
        const { id, ...updates } = input;
        return db.updateVolunteerOpportunityAdmin(id, updates);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can delete opportunities' });
        }
        return db.deleteVolunteerOpportunityAdmin(input.id);
      }),
  }),

  practice: router({
    getQuestions: publicProcedure
      .input(z.object({
        cluster: z.string().optional(),
        difficulty: z.string().optional(),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
      }))
      .query(async ({ input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) return { questions: [], total: 0, page: input.page, pageSize: input.pageSize, totalPages: 0 };

        // Build where conditions
        const whereConditions: any[] = [];
        
        if (input.cluster && input.cluster !== "all") {
          whereConditions.push(eq(questions.cluster, input.cluster));
        }
        
        if (input.difficulty && input.difficulty !== "all") {
          whereConditions.push(eq(questions.difficulty, input.difficulty));
        }
        
        // Combine conditions with AND
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
        
        let baseQuery = db_instance.select().from(questions);
        let countQuery = db_instance.select({ count: sql`COUNT(*)` }).from(questions);
        
        if (whereClause) {
          baseQuery = baseQuery.where(whereClause) as any;
          countQuery = countQuery.where(whereClause) as any;
        }

        // Get total count
        const countResult = await countQuery;
        const total = (countResult[0]?.count as number) || 0;

        // Apply pagination
        const offset = (input.page - 1) * input.pageSize;
        const paginatedQuery = baseQuery.limit(input.pageSize).offset(offset);
        const questionsList = await paginatedQuery;

        return {
          questions: questionsList,
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        };
      }),

    addBookmark: protectedProcedure
      .input(z.object({ questionId: z.string() }))
      .mutation(({ input, ctx }) => db.addBookmark(ctx.user.id, input.questionId)),

    removeBookmark: protectedProcedure
      .input(z.object({ questionId: z.string() }))
      .mutation(({ input, ctx }) => db.removeBookmark(ctx.user.id, input.questionId)),

    isBookmarked: protectedProcedure
      .input(z.object({ questionId: z.string() }))
      .query(({ input, ctx }) => db.isQuestionBookmarked(ctx.user.id, input.questionId)),

    getBookmarkedQuestions: protectedProcedure
      .query(({ ctx }) => db.getBookmarkedQuestionsWithDetails(ctx.user.id)),

    createStudySession: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        questionIds: z.array(z.string()),
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

  market: router({
    getStocks: protectedProcedure
      .query(async ({ ctx }) => {
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No school code' });
        return await db.getActiveStocks(schoolCode);
      }),
    
    getCashBalance: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getCashBalance(ctx.user.id);
      }),
    
    getPortfolio: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getPortfolioHoldings(ctx.user.id);
      }),
    
    buyStock: protectedProcedure
      .input(z.object({ stockId: z.number(), blueBucksAmount: z.string(), pricePerShare: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No school code' });
        
        const shares = (parseFloat(input.blueBucksAmount) / parseFloat(input.pricePerShare)).toString();
        const currentBalance = await db.getCashBalance(ctx.user.id);
        
        if (parseFloat(currentBalance) < parseFloat(input.blueBucksAmount)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient Blue Bucks' });
        }
        
        await db.recordMarketTransaction(ctx.user.id, input.stockId, 'buy', shares, input.pricePerShare, schoolCode);
        await db.updatePortfolioHolding(ctx.user.id, input.stockId, shares, input.pricePerShare, input.blueBucksAmount, schoolCode);
        const newBalance = (parseFloat(currentBalance) - parseFloat(input.blueBucksAmount)).toString();
        await db.updateCashBalance(ctx.user.id, newBalance);
        
        return { success: true, shares, newBalance };
      }),
    
    sellStock: protectedProcedure
      .input(z.object({ stockId: z.number(), shares: z.string(), pricePerShare: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No school code' });
        
        const totalAmount = (parseFloat(input.shares) * parseFloat(input.pricePerShare)).toString();
        await db.recordMarketTransaction(ctx.user.id, input.stockId, 'sell', input.shares, input.pricePerShare, schoolCode);
        const currentBalance = await db.getCashBalance(ctx.user.id);
        const newBalance = (parseFloat(currentBalance) + parseFloat(totalAmount)).toString();
        await db.updateCashBalance(ctx.user.id, newBalance);
        
        return { success: true, newBalance };
      }),
    
    getLeaderboard: protectedProcedure
      .query(async ({ ctx }) => {
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No school code' });
        return await db.getMarketLeaderboard(schoolCode, 50);
      }),
    
    getStockPriceData: protectedProcedure
      .input(z.object({ ticker: z.string() }))
      .query(async ({ input }) => {
        return await getStockPrice(input.ticker);
      }),
    
    initializeDefaultStocks: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can initialize stocks' });
        }
        
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No school code' });
        
        const defaultStocks = [
          { ticker: 'AAPL', name: 'Apple Inc.' },
          { ticker: 'MSFT', name: 'Microsoft Corporation' },
          { ticker: 'GOOGL', name: 'Alphabet Inc.' },
          { ticker: 'AMZN', name: 'Amazon.com Inc.' },
          { ticker: 'TSLA', name: 'Tesla Inc.' },
          { ticker: 'META', name: 'Meta Platforms Inc.' },
          { ticker: 'NVDA', name: 'NVIDIA Corporation' },
          { ticker: 'JPM', name: 'JPMorgan Chase & Co.' },
          { ticker: 'V', name: 'Visa Inc.' },
          { ticker: 'WMT', name: 'Walmart Inc.' },
        ];
        
        for (const stock of defaultStocks) {
          await db.getOrCreateStock(stock.ticker, stock.name, schoolCode);
        }
        
        return { success: true, count: defaultStocks.length };
      }),
  }),

  calendar: calendarRouter,

  members: membersRouter,

  discussions: router({
    getThreads: publicProcedure
      .input(z.object({ category: z.string().optional(), discussionType: z.enum(["universal", "chapter"]).optional() }).optional())
      .query(({ input, ctx }) => db.getDiscussionThreads(input?.category, input?.discussionType, ctx.user?.schoolCode || undefined)),

    createThread: protectedProcedure
      .input(z.object({ title: z.string(), content: z.string(), category: z.string().default("general"), discussionType: z.enum(["universal", "chapter"]).default("universal") }))
      .mutation(({ input, ctx }) => db.createDiscussionThread(ctx.user.id, input.title, input.content, input.category, input.discussionType, ctx.user.schoolCode || undefined)),

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
