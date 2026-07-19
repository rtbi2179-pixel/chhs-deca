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

import { initializeBanksForSchool, getBanksForSchool, getCreditCardsForBank } from './bankInitializer';
import { questions, userAnswers, blueBucks, blueBucksTransactions, leaderboard, cosmetics, userCosmetics, gachaPulls } from "../drizzle/schema";
import { and, eq, sql, inArray, desc, lte } from "drizzle-orm";

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

// ===== GACHA ROUTER =====
export const gachaRouter = router({
  // Get all cosmetics
  getCosmetics: publicProcedure
    .input(z.object({ schoolCode: z.string().optional() }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const allCosmetics = await database
        .select()
        .from(cosmetics);
      return allCosmetics;
    }),

  // Get user's cosmetics inventory
  getUserCosmetics: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const userCosmeticsList = await database
        .select()
        .from(userCosmetics)
        .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
        .where(eq(userCosmetics.userId, ctx.user.id));
      return userCosmeticsList;
    }),

  // Pull from gacha
  pullGacha: protectedProcedure
    .input(z.object({ pulls: z.number().min(1).max(10) }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      const schoolCode = ctx.user.schoolCode;
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User has no school code' });
      }

      // Get all cosmetics for this school
      const allCosmetics = await database
        .select()
        .from(cosmetics)
        .where(eq(cosmetics.schoolCode, schoolCode));

      if (allCosmetics.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No cosmetics available' });
      }

      // Rarity weights
      const rarityWeights = {
        common: 0.60,
        rare: 0.25,
        epic: 0.10,
        legendary: 0.05,
      };

      // Rarity costs
      const rarityCosts = {
        common: 100,
        rare: 250,
        epic: 500,
        legendary: 1000,
      };

      const pulls: any[] = [];
      let totalCost = 0;

      for (let i = 0; i < input.pulls; i++) {
        // Determine rarity
        const rand = Math.random();
        let rarity: 'common' | 'rare' | 'epic' | 'legendary';
        if (rand < rarityWeights.common) rarity = 'common';
        else if (rand < rarityWeights.common + rarityWeights.rare) rarity = 'rare';
        else if (rand < rarityWeights.common + rarityWeights.rare + rarityWeights.epic) rarity = 'epic';
        else rarity = 'legendary';

        // Get cosmetics of this rarity
        const cosmeticsOfRarity = allCosmetics.filter(c => c.rarity === rarity);
        if (cosmeticsOfRarity.length === 0) continue;

        // Pick random cosmetic
        const cosmetic = cosmeticsOfRarity[Math.floor(Math.random() * cosmeticsOfRarity.length)];
        const cost = rarityCosts[rarity];
        totalCost += cost;

        pulls.push({
          cosmetic,
          rarity,
          cost,
        });
      }

      // Check if user has enough blue bucks
      const userBlueBucksList = await database
        .select()
        .from(blueBucks)
        .where(eq(blueBucks.userId, ctx.user.id));

      const currentBucks = userBlueBucksList[0]?.amount || 0;
      if (currentBucks < totalCost) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not enough Blue Bucks' });
      }

      // Deduct blue bucks
      await database
        .update(blueBucks)
        .set({ amount: currentBucks - totalCost })
        .where(eq(blueBucks.userId, ctx.user.id));

      // Add cosmetics to user inventory and record pulls
      for (const pull of pulls) {
        // Add to inventory
        await database
          .insert(userCosmetics)
          .values({
            userId: ctx.user.id,
            cosmeticId: pull.cosmetic.id,
            schoolCode,
          });

        // Record pull
        await database
          .insert(gachaPulls)
          .values({
            userId: ctx.user.id,
            cosmeticId: pull.cosmetic.id,
            rarityObtained: pull.rarity,
            pointsSpent: pull.cost,
            schoolCode,
          });
      }

      return {
        pulls,
        totalCost,
        remainingBucks: currentBucks - totalCost,
      };
    }),

  // Equip cosmetic
  equipCosmetic: protectedProcedure
    .input(z.object({ userCosmeticId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      // Equip the selected cosmetic
      await database
        .update(userCosmetics)
        .set({ isEquipped: true })
        .where(eq(userCosmetics.id, input.userCosmeticId));

      return { success: true };
    }),

  // Get pull history
  getPullHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      const history = await database
        .select()
        .from(gachaPulls)
        .innerJoin(cosmetics, eq(gachaPulls.cosmeticId, cosmetics.id))
        .where(eq(gachaPulls.userId, ctx.user.id))
        .orderBy(desc(gachaPulls.pulledAt));
      
      return history;
    }),
});

export const appRouter = router({
  announcements: announcementsRouter,
  system: systemRouter,
  gacha: gachaRouter,
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
    getBlueBucksBalance: protectedProcedure
      .query(async ({ ctx }) => {
        const balance = await db.getBlueBucksBalance(ctx.user.id);
        return { balance };
      }),

    getQuestions: publicProcedure
      .input(z.object({
        cluster: z.string().optional(),
        difficulty: z.string().optional(),
        cognitiveLevel: z.string().optional(),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(10000).default(10000),
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
        
        if (input.cognitiveLevel && input.cognitiveLevel !== "all") {
          whereConditions.push(eq(questions.cognitiveLevel, input.cognitiveLevel));
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

        // Fetch all questions without pagination limit
        const questionsList = await baseQuery.limit(input.pageSize);

        return {
          questions: questionsList,
          total,
          page: 1,
          pageSize: questionsList.length,
          totalPages: 1,
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

    getAnsweredQuestions: protectedProcedure
      .query(async ({ ctx }) => {
        const answeredQuestionIds = await db.getUserAnsweredQuestions(ctx.user.id);
        return { answeredQuestionIds };
      }),

    submitAnswer: protectedProcedure
      .input(z.object({
        questionId: z.string(),
        selectedAnswer: z.string().length(1),
        correctAnswer: z.string().length(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No school code' });

        const isCorrect = input.selectedAnswer === input.correctAnswer;
        
        // Record the answer
        await db.recordUserAnswer(ctx.user.id, input.questionId, input.selectedAnswer, isCorrect, schoolCode);
        
        // Award Blue Bucks if correct (100 points for correct answer)
        // Use a hash of the question ID as the relatedId for tracking duplicate rewards
        let blueBucksAwarded = 0;
        if (isCorrect) {
          const questionHash = Math.abs(input.questionId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000000;
          const awarded = await db.awardBlueBucks(ctx.user.id, 100, 'correct_first_attempt', schoolCode, questionHash);
          if (awarded) {
            blueBucksAwarded = 100;
          }
        }
        
        // Get updated balance
        const balance = await db.getBlueBucksBalance(ctx.user.id);
        
        return {
          isCorrect,
          blueBucksAwarded,
          newBalance: balance,
          message: isCorrect ? `Correct! You earned ${blueBucksAwarded} Blue Bucks! (Total: ${balance})` : 'Incorrect answer.',
        };
      }),

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
      .input(z.object({ stockId: z.number(), blueBucksAmount: z.string(), pricePerShare: z.string(), ticker: z.string() }))
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
      .input(z.object({ stockId: z.number(), shares: z.string(), pricePerShare: z.string(), ticker: z.string() }))
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
    
    getTransactionHistory: protectedProcedure
      .input(z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
        ticker: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getTransactionHistoryFiltered(
          ctx.user.id,
          input.limit,
          input.offset,
          input.ticker,
          input.startDate,
          input.endDate
        );
      }),
    
    getStockPriceData: publicProcedure
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

    // Check if market is currently open (US Eastern Time 9:30 AM - 4:00 PM, Mon-Fri)
    isMarketOpen: publicProcedure
      .query(() => {
        const now = new Date();
        // Convert to US Eastern Time
        const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        
        const dayOfWeek = estTime.getDay();
        const hour = estTime.getHours();
        const minute = estTime.getMinutes();
        
        // Market is closed on weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return { isOpen: false, reason: 'Market closed on weekends' };
        }
        
        // Market hours: 9:30 AM - 4:00 PM EST
        const openHour = 9;
        const openMinute = 30;
        const closeHour = 16;
        const closeMinute = 0;
        
        const currentMinutes = hour * 60 + minute;
        const openMinutes = openHour * 60 + openMinute;
        const closeMinutes = closeHour * 60 + closeMinute;
        
        const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        
        return {
          isOpen,
          currentTime: estTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York' }),
          marketOpenTime: '9:30 AM EST',
          marketCloseTime: '4:00 PM EST',
        };
      }),

    // Get portfolio snapshot history
    getPortfolioSnapshots: protectedProcedure
      .input(z.object({ limit: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const snapshots = await db.getPortfolioSnapshotHistory(ctx.user.id, input.limit);
        return snapshots.map(s => ({
          date: new Date(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: parseFloat(s.totalValue.toString()),
          gain: parseFloat(s.totalProfit.toString()),
          percentageReturn: parseFloat(s.percentageReturn.toString()),
        }));
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
  
  portfolios: router({
    uploadPortfolio: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No school code' });
        
        await db.uploadPortfolio(
          ctx.user.id,
          input.fileName,
          input.fileUrl,
          input.fileKey,
          input.fileSize,
          input.mimeType,
          schoolCode
        );
        return { success: true };
      }),
    
    getUserPortfolios: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserPortfolios(ctx.user.id);
      }),
    
    getSchoolPortfolios: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can view all portfolios' });
        }
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No school code' });
        return await db.getSchoolPortfolios(schoolCode);
      }),
    
    deletePortfolio: protectedProcedure
      .input(z.object({ portfolioId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can delete portfolios' });
        }
        await db.deletePortfolio(input.portfolioId);
        return { success: true };
      }),
  }),
  banking: router({
    getCreditScore: protectedProcedure.query(async ({ ctx }) => {
      const { getUserCreditScore, getCreditScoreDetails } = await import("./creditScoreEngine");
      const schoolCode = ctx.user.schoolCode || '';
      const score = await getUserCreditScore(ctx.user.id, schoolCode);
      const details = await getCreditScoreDetails(ctx.user.id, schoolCode);
      return { score, details };
    }),

    getCreditScoreHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const history = await db.getCreditHistory(ctx.user.id, input.limit);
        return history.map(h => ({
          date: new Date(h.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: h.newScore,
          change: h.scoreChange,
          reason: h.reason,
        }));
      }),

    transferFunds: protectedProcedure
      .input(z.object({ fromAccount: z.enum(['checking', 'savings', 'investment']), toAccount: z.enum(['checking', 'savings', 'investment']), amount: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { userBankAccounts } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const schoolCode = ctx.user.schoolCode || '';
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const account = await database.select().from(userBankAccounts).where(and(eq(userBankAccounts.userId, ctx.user.id), eq(userBankAccounts.schoolCode, schoolCode))).limit(1);
        if (!account[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Bank account not found' });
        const fromKey = (input.fromAccount + 'Balance') as keyof typeof account[0];
        const toKey = (input.toAccount + 'Balance') as keyof typeof account[0];
        const fromBalance = parseFloat(account[0][fromKey] as unknown as string);
        const toBalance = parseFloat(account[0][toKey] as unknown as string);
        if (fromBalance < input.amount) throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient funds' });
        const updates: Record<string, string> = {};
        updates[input.fromAccount + 'Balance'] = (fromBalance - input.amount).toString();
        updates[input.toAccount + 'Balance'] = (toBalance + input.amount).toString();
        await database.update(userBankAccounts).set(updates).where(and(eq(userBankAccounts.userId, ctx.user.id), eq(userBankAccounts.schoolCode, schoolCode)));
        return { success: true };
      }),

    applyCreditCard: protectedProcedure
      .input(z.object({ creditCardId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { userCreditCards, creditCards } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { getUserCreditScore } = await import('./creditScoreEngine');
        const schoolCode = ctx.user.schoolCode || '';
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const existing = await database.select().from(userCreditCards).where(and(eq(userCreditCards.userId, ctx.user.id), eq(userCreditCards.creditCardId, input.creditCardId))).limit(1);
        if (existing.length > 0) throw new TRPCError({ code: 'CONFLICT', message: 'You already have this card' });
        const card = await database.select().from(creditCards).where(eq(creditCards.id, input.creditCardId)).limit(1);
        if (card.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Card not found' });
        const creditScore = await getUserCreditScore(ctx.user.id, schoolCode);
        if (creditScore < card[0].creditScoreRequired) throw new TRPCError({ code: 'FORBIDDEN', message: 'Credit score too low' });
        let creditLimit = 1000;
        if (card[0].tier === 'rewards') creditLimit = 5000;
        if (card[0].tier === 'elite') creditLimit = 10000;
        await database.insert(userCreditCards).values({ userId: ctx.user.id, creditCardId: input.creditCardId, creditLimit: creditLimit.toString(), availableCredit: creditLimit.toString(), schoolCode: schoolCode });
        return { success: true, creditLimit };
      }),

    getBankAccount: protectedProcedure.query(async ({ ctx }) => {
      const { userBankAccounts } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const schoolCode = ctx.user.schoolCode || "";
      const database = await getDb();
      if (!database) return { checkingBalance: "0", savingsBalance: "0", investmentBalance: "0", totalDebt: "0" };
      const account = await database
        .select()
        .from(userBankAccounts)
        .where(and(eq(userBankAccounts.userId, ctx.user.id), eq(userBankAccounts.schoolCode, schoolCode)))
        .limit(1);
      return account[0] || { checkingBalance: "0", savingsBalance: "0", investmentBalance: "0", totalDebt: "0" };
    }),

    getAvailableCards: protectedProcedure.query(async ({ ctx }) => {
      const { getUserCreditScore } = await import('./creditScoreEngine');
      const { creditCards } = await import('../drizzle/schema');
      const { getDb } = await import('./db');
      const schoolCode = ctx.user.schoolCode || '';
      const creditScore = await getUserCreditScore(ctx.user.id, schoolCode);
      const database = await getDb();
      if (!database) return [];
      const cards = await database.select().from(creditCards).where(and(eq(creditCards.schoolCode, schoolCode), lte(creditCards.creditScoreRequired, creditScore)));
      return cards;
    }),

    getUserCards: protectedProcedure.query(async ({ ctx }) => {
      const { userCreditCards, creditCards } = await import('../drizzle/schema');
      const { getDb } = await import('./db');
      const schoolCode = ctx.user.schoolCode || '';
      const database = await getDb();
      if (!database) return [];
      const userCards = await database.select().from(userCreditCards).where(and(eq(userCreditCards.userId, ctx.user.id), eq(userCreditCards.schoolCode, schoolCode)));
      const cardsWithDetails = await Promise.all(
        userCards.map(async (userCard: any) => {
          const cardDetail = await database.select().from(creditCards).where(eq(creditCards.id, userCard.creditCardId)).limit(1);
          return {
            ...userCard,
            cardDetails: cardDetail[0] || null,
          };
        })
      );
      return cardsWithDetails;
    }),

    // Get payment history for user
    getPaymentHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const database = await getDb();
        if (!database) return [];
        
        const userPayments = await database
          .select()
          .from(blueBucksTransactions)
          .where(eq(blueBucksTransactions.userId, ctx.user.id))
          .orderBy(desc(blueBucksTransactions.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return userPayments;
      }),

    // Get rewards earned by user
    getRewardsEarned: protectedProcedure
      .query(async ({ ctx }) => {
        const { rewards } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const database = await getDb();
        if (!database) return { totalRewards: '0', rewardsList: [] };
        
        const userRewards = await database
          .select()
          .from(rewards)
          .where(eq(rewards.userId, ctx.user.id))
          .orderBy(desc(rewards.earnedAt));
        
        const totalRewards = userRewards.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        return {
          totalRewards: totalRewards.toString(),
          rewardsList: userRewards,
        };
      }),

    // Get savings account interest earned
    getSavingsInterest: protectedProcedure
      .query(async ({ ctx }) => {
        const { userBankAccounts } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const schoolCode = ctx.user.schoolCode || '';
        const database = await getDb();
        if (!database) return { savingsBalance: '0', interestEarned: '0', apy: '0.5' };
        
        const account = await database
          .select()
          .from(userBankAccounts)
          .where(and(eq(userBankAccounts.userId, ctx.user.id), eq(userBankAccounts.schoolCode, schoolCode)))
          .limit(1);
        
        if (!account[0]) return { savingsBalance: '0', interestEarned: '0', apy: '0.5' };
        
        const savingsBalance = parseFloat(account[0].savingsBalance);
        const apy = 0.005; // 0.5% APY
        const interestEarned = (savingsBalance * apy) / 12; // Monthly interest
        
        return {
          savingsBalance: account[0].savingsBalance,
          interestEarned: interestEarned.toString(),
          apy: (apy * 100).toString(),
        };
      }),

    // Get card usage tracking for a specific card
    getCardUsageTracking: protectedProcedure
      .input(z.object({ cardId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { cardUsageTracking } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const database = await getDb();
        if (!database) return [];
        const usage = await database
          .select()
          .from(cardUsageTracking)
          .where(and(eq(cardUsageTracking.userId, ctx.user.id), eq(cardUsageTracking.cardId, input.cardId)))
          .orderBy(desc(cardUsageTracking.transactionDate));
        return usage;
      }),

    // Get cashback rewards for a user
    getCashbackRewards: protectedProcedure
      .input(z.object({ cardId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const { cashbackRewards } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const database = await getDb();
        if (!database) return [];
        const conditions = [eq(cashbackRewards.userId, ctx.user.id)];
        if (input.cardId) {
          conditions.push(eq(cashbackRewards.cardId, input.cardId));
        }
        const rewards = await database
          .select()
          .from(cashbackRewards)
          .where(and(...conditions))
          .orderBy(desc(cashbackRewards.earnedDate));
        return rewards;
      }),

    // Get spending patterns by category
    getSpendingPatterns: protectedProcedure
      .input(z.object({ month: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const { spendingPatterns } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const database = await getDb();
        if (!database) return [];
        const conditions = [eq(spendingPatterns.userId, ctx.user.id)];
        if (input.month) {
          conditions.push(eq(spendingPatterns.month, input.month));
        }
        const patterns = await database
          .select()
          .from(spendingPatterns)
          .where(and(...conditions))
          .orderBy(desc(spendingPatterns.monthlySpending));
        return patterns;
      }),


    getBanks: protectedProcedure.query(async ({ ctx }) => {
      const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
      if (!schoolCode) throw new TRPCError({ code: "BAD_REQUEST", message: "No school code" });
      return await getBanksForSchool(schoolCode);
    }),

    getCreditCards: protectedProcedure
      .input(z.object({ bankId: z.number() }))
      .query(async ({ input }) => {
        return await getCreditCardsForBank(input.bankId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ===== ANNOUNCEMENTS ROUTER =====
