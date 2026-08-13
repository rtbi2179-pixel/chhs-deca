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
import { getStockPrice, getStockPriceCacheStatus } from "./stockPriceService";
import { getGachaRarityCost, selectGachaRarity, type GachaRarity } from "./gachaRarity";
import { applyCreditCardCharge, applyCreditCardPayment, calculateCashback, summarizeSpending } from "./creditCardMath";
import { calculateMonetaryPressure } from "./economicMonitoring";

import { initializeBanksForSchool, getBanksForSchool, getCreditCardsForBank } from './bankInitializer';
import { questions, userAnswers, users, blueBucks, blueBucksTransactions, leaderboard, cosmetics, userCosmetics, gachaPulls, cardUsageTracking, marketTransactions, economicAuditLog, userFeedback, notificationPreferences, userProfileSettings, adminActivityLogs } from "../drizzle/schema";
import { and, eq, sql, inArray, desc, lte, gte } from "drizzle-orm";
import { piLearningRouter } from "./piLearningRouter";


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
      const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
      const database = await db.getDb();
      if (database && schoolCode) {
        await database.insert(adminActivityLogs).values({
          actorUserId: ctx.user.id,
          schoolCode,
          action: 'announcement_deleted',
          targetType: 'announcement',
          targetId: String(input.announcementId),
        });
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
      const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode;
      const database = await db.getDb();
      if (database && schoolCode) {
        await database.insert(adminActivityLogs).values({
          actorUserId: ctx.user.id,
          schoolCode,
          action: 'announcement_updated',
          targetType: 'announcement',
          targetId: String(input.announcementId),
          details: JSON.stringify({ title: input.title }),
        });
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
      const allCosmetics = input.schoolCode
        ? await database.select().from(cosmetics).where(eq(cosmetics.schoolCode, input.schoolCode))
        : await database.select().from(cosmetics);
      return allCosmetics;
    }),

  // Get user's cosmetics inventory
  getUserCosmetics: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const schoolCode = ctx.user.schoolCode;
      const userCosmeticsList = await database
        .select()
        .from(userCosmetics)
        .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
        .where(schoolCode
          ? and(eq(userCosmetics.userId, ctx.user.id), eq(userCosmetics.schoolCode, schoolCode))
          : eq(userCosmetics.userId, ctx.user.id));
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

      const missingRarities = (["common", "rare", "epic", "legendary"] as GachaRarity[])
        .filter((rarity) => !allCosmetics.some((cosmetic) => cosmetic.rarity === rarity));
      if (missingRarities.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `The gacha catalog is missing: ${missingRarities.join(", ")}.`,
        });
      }

      const pulls: any[] = [];
      let totalCost = 0;

      for (let i = 0; i < input.pulls; i++) {
        // Determine rarity
        const rarity = selectGachaRarity(Math.random());

        // Get cosmetics of this rarity
        const cosmeticsOfRarity = allCosmetics.filter(c => c.rarity === rarity);
        if (cosmeticsOfRarity.length === 0) continue;

        // Pick random cosmetic
        const cosmetic = cosmeticsOfRarity[Math.floor(Math.random() * cosmeticsOfRarity.length)];
        const cost = getGachaRarityCost(rarity);
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

      const ownedCosmetic = await database
        .select()
        .from(userCosmetics)
        .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
        .where(and(
          eq(userCosmetics.id, input.userCosmeticId),
          eq(userCosmetics.userId, ctx.user.id),
        ))
        .limit(1);

      if (!ownedCosmetic[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cosmetic is not in your inventory' });
      }

      if (ctx.user.schoolCode && ownedCosmetic[0].userCosmetics.schoolCode !== ctx.user.schoolCode) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cosmetic belongs to a different chapter' });
      }

      const inventory = await database
        .select()
        .from(userCosmetics)
        .innerJoin(cosmetics, eq(userCosmetics.cosmeticId, cosmetics.id))
        .where(eq(userCosmetics.userId, ctx.user.id));

      const matchingTypeEntries = inventory.filter(
        (entry) => entry.cosmetics.type === ownedCosmetic[0].cosmetics.type,
      );

      for (const entry of matchingTypeEntries) {
        await database
          .update(userCosmetics)
          .set({ isEquipped: false })
          .where(eq(userCosmetics.id, entry.userCosmetics.id));
      }

      await database
        .update(userCosmetics)
        .set({ isEquipped: true })
        .where(and(
          eq(userCosmetics.id, input.userCosmeticId),
          eq(userCosmetics.userId, ctx.user.id),
        ));
      
      return { success: true, equippedType: ownedCosmetic[0].cosmetics.type };
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
  piLearning: piLearningRouter,
  feedback: router({
    submit: protectedProcedure
      .input(z.object({
        category: z.enum(['bug', 'feature', 'content', 'other']),
        subject: z.string().trim().min(3).max(160),
        message: z.string().trim().min(10).max(4000),
      }))
      .mutation(async ({ ctx, input }) => {
        const schoolCode = ctx.user.selectedSchoolCode ?? ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Your account needs a school code before submitting feedback' });
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Feedback storage is unavailable' });
        const inserted = await database.insert(userFeedback).values({
          userId: ctx.user.id,
          schoolCode,
          category: input.category,
          subject: input.subject,
          message: input.message,
        });
        return { success: true, feedbackId: Number(inserted[0].insertId) };
      }),

    listMine: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Feedback storage is unavailable' });
      return database.select().from(userFeedback)
        .where(eq(userFeedback.userId, ctx.user.id))
        .orderBy(desc(userFeedback.createdAt));
    }),

    listForSchool: protectedProcedure
      .input(z.object({ schoolCode: z.string().min(1).optional(), limit: z.number().int().min(1).max(100).default(50) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only administrators can review feedback' });
        }
        const schoolCode = ctx.user.role === 'super_admin'
          ? input?.schoolCode ?? ctx.user.selectedSchoolCode ?? ctx.user.schoolCode
          : ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Select a school before reviewing feedback' });
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Feedback storage is unavailable' });
        return database.select().from(userFeedback)
          .where(eq(userFeedback.schoolCode, schoolCode))
          .orderBy(desc(userFeedback.createdAt))
          .limit(input?.limit ?? 50);
      }),

    review: protectedProcedure
      .input(z.object({
        feedbackId: z.number().int().positive(),
        status: z.enum(['new', 'reviewing', 'resolved', 'dismissed']),
        adminResponse: z.string().trim().max(4000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only administrators can review feedback' });
        }
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Feedback storage is unavailable' });
        const record = await database.select().from(userFeedback).where(eq(userFeedback.id, input.feedbackId)).limit(1);
        if (!record[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Feedback entry not found' });
        const allowedSchoolCode = ctx.user.role === 'super_admin' ? ctx.user.selectedSchoolCode ?? ctx.user.schoolCode : ctx.user.schoolCode;
        if (record[0].schoolCode !== allowedSchoolCode) throw new TRPCError({ code: 'FORBIDDEN', message: 'Feedback belongs to another school' });
        await database.update(userFeedback).set({
          status: input.status,
          adminResponse: input.adminResponse ?? record[0].adminResponse,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        }).where(eq(userFeedback.id, input.feedbackId));
        return { success: true };
      }),
  }),
  preferences: router({
    getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Preferences storage is unavailable' });
      const existing = await database.select().from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id)).limit(1);
      return existing[0] ?? {
        announcementsEnabled: true,
        feedbackResponsesEnabled: true,
        systemUpdatesEnabled: true,
        studyRemindersEnabled: false,
      };
    }),

    updateNotificationPreferences: protectedProcedure
      .input(z.object({
        announcementsEnabled: z.boolean(),
        feedbackResponsesEnabled: z.boolean(),
        systemUpdatesEnabled: z.boolean(),
        studyRemindersEnabled: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Preferences storage is unavailable' });
        await database.insert(notificationPreferences).values({ userId: ctx.user.id, ...input })
          .onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
        return { success: true };
      }),

    getProfileSettings: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Profile settings storage is unavailable' });
      const existing = await database.select().from(userProfileSettings)
        .where(eq(userProfileSettings.userId, ctx.user.id)).limit(1);
      return existing[0] ?? {
        displayName: null,
        bio: null,
        accentColor: 'blue' as const,
        showOnLeaderboard: true,
      };
    }),

    updateProfileSettings: protectedProcedure
      .input(z.object({
        displayName: z.string().trim().min(1).max(60).nullable(),
        bio: z.string().trim().max(280).nullable(),
        accentColor: z.enum(['blue', 'violet', 'emerald', 'rose']),
        showOnLeaderboard: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Profile settings storage is unavailable' });
        await database.insert(userProfileSettings).values({ userId: ctx.user.id, ...input })
          .onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
        return { success: true };
      }),
  }),
  reports: router({
    getMySummary: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Report data is unavailable' });
      const [learning, market, card] = await Promise.all([
        database.select({
          questionsAnswered: sql<number>`count(*)`,
          correctAnswers: sql<number>`coalesce(sum(case when ${userAnswers.isCorrect} = 1 then 1 else 0 end), 0)`,
        }).from(userAnswers).where(eq(userAnswers.userId, ctx.user.id)),
        database.select({
          transactionCount: sql<number>`count(*)`,
          buyVolume: sql<string>`coalesce(sum(case when ${marketTransactions.type} = 'buy' then ${marketTransactions.totalAmount} else 0 end), 0)`,
          sellVolume: sql<string>`coalesce(sum(case when ${marketTransactions.type} = 'sell' then ${marketTransactions.totalAmount} else 0 end), 0)`,
        }).from(marketTransactions).where(and(eq(marketTransactions.userId, ctx.user.id), eq(marketTransactions.status, 'executed'))),
        database.select({
          chargeCount: sql<number>`count(*)`,
          totalSpending: sql<string>`coalesce(sum(${cardUsageTracking.transactionAmount}), 0)`,
        }).from(cardUsageTracking).where(eq(cardUsageTracking.userId, ctx.user.id)),
      ]);
      const questionsAnswered = Number(learning[0]?.questionsAnswered ?? 0);
      const correctAnswers = Number(learning[0]?.correctAnswers ?? 0);
      return {
        generatedAt: new Date(),
        member: { id: ctx.user.id, name: ctx.user.name ?? ctx.user.username ?? 'Blue Blazer Member', schoolCode: ctx.user.schoolCode ?? null },
        learning: {
          questionsAnswered,
          correctAnswers,
          accuracyPercent: questionsAnswered > 0 ? Number(((correctAnswers / questionsAnswered) * 100).toFixed(1)) : 0,
        },
        market: {
          transactionCount: Number(market[0]?.transactionCount ?? 0),
          buyVolume: Number(market[0]?.buyVolume ?? 0),
          sellVolume: Number(market[0]?.sellVolume ?? 0),
        },
        banking: {
          chargeCount: Number(card[0]?.chargeCount ?? 0),
          totalSpending: Number(card[0]?.totalSpending ?? 0),
        },
      };
    }),
  }),
  superAdmin: router({
    getActivityLog: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can review administrator activity' });
        const { adminActivityLogs } = await import('../drizzle/schema');
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Activity log storage is unavailable' });
        const schoolCode = ctx.user.selectedSchoolCode || ctx.user.schoolCode || '';
        return database.select().from(adminActivityLogs)
          .where(eq(adminActivityLogs.schoolCode, schoolCode))
          .orderBy(desc(adminActivityLogs.createdAt))
          .limit(input?.limit ?? 50);
      }),
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

    getEconomicConfig: protectedProcedure
      .input(z.object({ schoolCode: z.string().min(1).optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can view economic configuration' });
        }
        const schoolCode = input?.schoolCode ?? ctx.user.selectedSchoolCode ?? ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Select a school before viewing economic configuration' });
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { economicConfig } = await import('../drizzle/schema');
        const config = await database.select().from(economicConfig).where(eq(economicConfig.schoolCode, schoolCode)).limit(1);
        return config[0] ?? {
          schoolCode,
          paymentReliabilityWeight: '25',
          accountHistoryWeight: '25',
          practiceConsistencyWeight: '20',
          netWorthWeight: '20',
          spendingBehaviorWeight: '10',
          onTimePaymentPoints: 2,
          missedPaymentPenalty: 15,
          savingsInterestRate: '0.5',
        };
      }),

    updateEconomicWeights: protectedProcedure
      .input(z.object({
        schoolCode: z.string().min(1).optional(),
        paymentReliabilityWeight: z.number().min(0).max(100),
        accountHistoryWeight: z.number().min(0).max(100),
        practiceConsistencyWeight: z.number().min(0).max(100),
        netWorthWeight: z.number().min(0).max(100),
        spendingBehaviorWeight: z.number().min(0).max(100),
        reason: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can update economic configuration' });
        }
        const schoolCode = input.schoolCode ?? ctx.user.selectedSchoolCode ?? ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Select a school before updating economic configuration' });
        const totalWeight = input.paymentReliabilityWeight + input.accountHistoryWeight + input.practiceConsistencyWeight + input.netWorthWeight + input.spendingBehaviorWeight;
        if (Math.abs(totalWeight - 100) > 0.001) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Credit-score weights must total 100%' });
        }

        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { economicAuditLog, economicConfig, adminActivityLogs } = await import('../drizzle/schema');
        const existing = await database.select().from(economicConfig).where(eq(economicConfig.schoolCode, schoolCode)).limit(1);
        const values = {
          paymentReliabilityWeight: input.paymentReliabilityWeight.toFixed(2),
          accountHistoryWeight: input.accountHistoryWeight.toFixed(2),
          practiceConsistencyWeight: input.practiceConsistencyWeight.toFixed(2),
          netWorthWeight: input.netWorthWeight.toFixed(2),
          spendingBehaviorWeight: input.spendingBehaviorWeight.toFixed(2),
        };

        if (existing[0]) {
          await database.update(economicConfig).set(values).where(eq(economicConfig.id, existing[0].id));
        } else {
          await database.insert(economicConfig).values({ schoolCode, ...values });
        }

        const prior = existing[0] ?? {
          paymentReliabilityWeight: '25.00',
          accountHistoryWeight: '25.00',
          practiceConsistencyWeight: '20.00',
          netWorthWeight: '20.00',
          spendingBehaviorWeight: '10.00',
        };
        for (const [fieldChanged, newValue] of Object.entries(values)) {
          const oldValue = prior[fieldChanged as keyof typeof values];
          if (String(oldValue) !== newValue) {
            await database.insert(economicAuditLog).values({
              superAdminId: ctx.user.id,
              schoolCode,
              changeType: 'credit_score_weights',
              fieldChanged,
              oldValue: String(oldValue),
              newValue,
              reason: input.reason || null,
            });
          }
        }

        await database.insert(adminActivityLogs).values({
          actorUserId: ctx.user.id,
          schoolCode,
          action: 'economic_weights_updated',
          targetType: 'economic_config',
          targetId: schoolCode,
          details: JSON.stringify({ values, reason: input.reason || null }),
        });

        return { success: true, schoolCode, totalWeight };
      }),

    getEconomicAuditLog: protectedProcedure
      .input(z.object({ schoolCode: z.string().min(1).optional(), limit: z.number().int().min(1).max(100).default(50) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can view economic audit logs' });
        }
        const schoolCode = input?.schoolCode ?? ctx.user.selectedSchoolCode ?? ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Select a school before viewing audit logs' });
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { economicAuditLog } = await import('../drizzle/schema');
        return database.select().from(economicAuditLog)
          .where(eq(economicAuditLog.schoolCode, schoolCode))
          .orderBy(desc(economicAuditLog.createdAt))
          .limit(input?.limit ?? 50);
      }),

    getEconomicMonitoring: protectedProcedure
      .input(z.object({ schoolCode: z.string().min(1).optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'super_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only super admins can view economic monitoring' });
        }
        const schoolCode = input?.schoolCode ?? ctx.user.selectedSchoolCode ?? ctx.user.schoolCode;
        if (!schoolCode) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Select a school before viewing economic monitoring' });
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Monitoring database is unavailable' });
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [activeUsers, issuedRewards, marketActivity, cardActivity, latestAudit] = await Promise.all([
          database.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.schoolCode, schoolCode)),
          database.select({ total: sql<string>`coalesce(sum(${blueBucksTransactions.amount}), 0)` }).from(blueBucksTransactions)
            .where(and(eq(blueBucksTransactions.schoolCode, schoolCode), gte(blueBucksTransactions.createdAt, since))),
          database.select({ count: sql<number>`count(*)`, turnover: sql<string>`coalesce(sum(${marketTransactions.totalAmount}), 0)` }).from(marketTransactions)
            .where(and(eq(marketTransactions.schoolCode, schoolCode), eq(marketTransactions.status, 'executed'), gte(marketTransactions.createdAt, since))),
          database.select({ count: sql<number>`count(*)`, spending: sql<string>`coalesce(sum(${cardUsageTracking.transactionAmount}), 0)` }).from(cardUsageTracking)
            .where(and(eq(cardUsageTracking.schoolCode, schoolCode), gte(cardUsageTracking.transactionDate, since))),
          database.select().from(economicAuditLog).where(eq(economicAuditLog.schoolCode, schoolCode)).orderBy(desc(economicAuditLog.createdAt)).limit(1),
        ]);
        const monitoring = calculateMonetaryPressure({
          rewardUnitsIssued: Number(issuedRewards[0]?.total ?? 0),
          activeUsers: Number(activeUsers[0]?.count ?? 0),
          marketTurnover: Number(marketActivity[0]?.turnover ?? 0),
          cardSpending: Number(cardActivity[0]?.spending ?? 0),
        });
        return {
          schoolCode,
          sampleWindowDays: 30,
          generatedAt: new Date(),
          databaseStatus: 'healthy' as const,
          activeUsers: Number(activeUsers[0]?.count ?? 0),
          rewardUnitsIssued: Number(issuedRewards[0]?.total ?? 0),
          marketTransactions: Number(marketActivity[0]?.count ?? 0),
          marketTurnover: Number(marketActivity[0]?.turnover ?? 0),
          cardTransactions: Number(cardActivity[0]?.count ?? 0),
          cardSpending: Number(cardActivity[0]?.spending ?? 0),
          latestEconomicChangeAt: latestAudit[0]?.createdAt ?? null,
          ...monitoring,
        };
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

    recalculateLeaderboardAccuracies: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return next({ ctx });
      })
      .mutation(async () => {
        const result = await db.recalculateAllLeaderboardAccuracies();
        return result;
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

    getCacheStatus: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can view market cache status' });
      }
      return getStockPriceCacheStatus();
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
          date: new Date(h.calculatedAt ?? new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

    accrueSavingsInterest: protectedProcedure.mutation(async ({ ctx }) => {
      const { userBankAccounts, savingsInterestAccruals } = await import('../drizzle/schema');
      const { getDb } = await import('./db');
      const { calculateMonthlySavingsInterest, savingsInterestPeriodKey, SAVINGS_APY_PERCENT } = await import('./savingsInterest');
      const database = await getDb();
      const schoolCode = ctx.user.schoolCode || '';
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banking data is unavailable' });
      const periodKey = savingsInterestPeriodKey();
      const existing = await database.select().from(savingsInterestAccruals).where(and(
        eq(savingsInterestAccruals.userId, ctx.user.id),
        eq(savingsInterestAccruals.periodKey, periodKey),
      )).limit(1);
      if (existing[0]) throw new TRPCError({ code: 'CONFLICT', message: 'Savings interest was already accrued for this period' });
      const account = await database.select().from(userBankAccounts).where(and(
        eq(userBankAccounts.userId, ctx.user.id),
        eq(userBankAccounts.schoolCode, schoolCode),
      )).limit(1);
      if (!account[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Bank account not found' });
      const balanceBefore = Number(account[0].savingsBalance);
      const interestAmount = calculateMonthlySavingsInterest(balanceBefore);
      const balanceAfter = Number((balanceBefore + interestAmount).toFixed(2));
      if (interestAmount <= 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Add funds to savings before accruing interest' });
      await database.insert(savingsInterestAccruals).values({
        userId: ctx.user.id,
        schoolCode,
        periodKey,
        apy: (SAVINGS_APY_PERCENT / 100).toFixed(4),
        balanceBefore: balanceBefore.toFixed(2),
        interestAmount: interestAmount.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
      });
      await database.update(userBankAccounts).set({ savingsBalance: balanceAfter.toFixed(2) }).where(eq(userBankAccounts.id, account[0].id));
      return { success: true, periodKey, apy: SAVINGS_APY_PERCENT, interestAmount, savingsBalance: balanceAfter };
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

    // Make a credit card payment from checking to an issued card account.
    makePayment: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        amount: z.number().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const { creditCardPayments, userBankAccounts, userCreditCards } = await import('../drizzle/schema');
        const schoolCode = ctx.user.schoolCode || '';
        
        const issuedCard = await database
          .select()
          .from(userCreditCards)
          .where(and(
            eq(userCreditCards.id, input.cardId),
            eq(userCreditCards.userId, ctx.user.id),
            eq(userCreditCards.schoolCode, schoolCode),
          ))
          .limit(1);
        
        if (!issuedCard[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Issued card not found' });
        
        // Get checking account balance
        const account = await database
          .select()
          .from(userBankAccounts)
          .where(and(
            eq(userBankAccounts.userId, ctx.user.id),
            eq(userBankAccounts.schoolCode, schoolCode)
          ))
          .limit(1);
        
        if (!account[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Bank account not found' });
        
        const checkingBalance = parseFloat(account[0].checkingBalance);
        if (checkingBalance < input.amount) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient funds' });
        }
        
        const cardBalance = {
          creditLimit: Number(issuedCard[0].creditLimit),
          currentBalance: Number(issuedCard[0].currentBalance),
        };
        let paymentUpdate;
        try {
          paymentUpdate = applyCreditCardPayment(cardBalance, input.amount);
        } catch (error) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: (error as Error).message });
        }

        // Deduct from checking, reduce card debt, and restore available credit.
        await database
          .update(userBankAccounts)
          .set({
            checkingBalance: (checkingBalance - input.amount).toFixed(2),
            totalDebt: Math.max(0, Number(account[0].totalDebt) - input.amount).toFixed(2),
          })
          .where(and(
            eq(userBankAccounts.userId, ctx.user.id),
            eq(userBankAccounts.schoolCode, schoolCode)
          ));
        
        await database
          .update(userCreditCards)
          .set({
            currentBalance: paymentUpdate.currentBalance.toFixed(2),
            availableCredit: paymentUpdate.availableCredit.toFixed(2),
            utilizationRate: paymentUpdate.utilizationRate.toFixed(2),
          })
          .where(eq(userCreditCards.id, issuedCard[0].id));

        await database.insert(creditCardPayments).values({
          userId: ctx.user.id,
          userCreditCardId: issuedCard[0].id,
          amount: input.amount.toFixed(2),
          status: 'completed',
          dueDate: new Date(),
          paidDate: new Date(),
          daysLate: 0,
          schoolCode,
        });
        
        return {
          success: true,
          newBalance: checkingBalance - input.amount,
          paymentAmount: input.amount,
          remainingCardBalance: paymentUpdate.currentBalance,
          availableCredit: paymentUpdate.availableCredit,
        };
      }),

    // Record an actual issued-card purchase and all related financial effects.
    chargeCard: protectedProcedure
      .input(z.object({
        cardId: z.number().int().positive(),
        amount: z.number().positive(),
        merchantCategory: z.string().trim().min(1).max(50),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const schoolCode = ctx.user.schoolCode || '';
        const { cardUsageTracking, cashbackRewards, creditCards, spendingPatterns, userBankAccounts, userCreditCards } = await import('../drizzle/schema');

        const issuedCard = await database
          .select()
          .from(userCreditCards)
          .where(and(
            eq(userCreditCards.id, input.cardId),
            eq(userCreditCards.userId, ctx.user.id),
            eq(userCreditCards.schoolCode, schoolCode),
          ))
          .limit(1);
        if (!issuedCard[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Issued card not found' });

        const product = await database
          .select()
          .from(creditCards)
          .where(eq(creditCards.id, issuedCard[0].creditCardId))
          .limit(1);
        if (!product[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Card product not found' });

        let chargeUpdate;
        try {
          chargeUpdate = applyCreditCardCharge({
            creditLimit: Number(issuedCard[0].creditLimit),
            currentBalance: Number(issuedCard[0].currentBalance),
          }, input.amount);
        } catch (error) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: (error as Error).message });
        }

        const cashback = calculateCashback(input.amount, Number(product[0].rewardsPercentage));
        const transactionDate = new Date();
        const month = transactionDate.getUTCMonth() + 1;
        const category = input.merchantCategory;

        await database.update(userCreditCards).set({
          currentBalance: chargeUpdate.currentBalance.toFixed(2),
          availableCredit: chargeUpdate.availableCredit.toFixed(2),
          utilizationRate: chargeUpdate.utilizationRate.toFixed(2),
        }).where(eq(userCreditCards.id, issuedCard[0].id));

        await database.insert(cardUsageTracking).values({
          userId: ctx.user.id,
          cardId: product[0].id,
          transactionAmount: input.amount.toFixed(2),
          merchantCategory: category,
          transactionDate,
          schoolCode,
        });

        await database.insert(cashbackRewards).values({
          userId: ctx.user.id,
          cardId: product[0].id,
          amount: cashback.toFixed(2),
          source: `${product[0].name} ${category} purchase`,
          earnedDate: transactionDate,
          schoolCode,
        });

        const existingPattern = await database.select().from(spendingPatterns).where(and(
          eq(spendingPatterns.userId, ctx.user.id),
          eq(spendingPatterns.schoolCode, schoolCode),
          eq(spendingPatterns.merchantCategory, category),
          eq(spendingPatterns.month, month),
        )).limit(1);

        if (existingPattern[0]) {
          const nextTotal = Number(existingPattern[0].monthlySpending) + input.amount;
          const nextCount = existingPattern[0].transactionCount + 1;
          await database.update(spendingPatterns).set({
            monthlySpending: nextTotal.toFixed(2),
            transactionCount: nextCount,
            averageTransactionAmount: (nextTotal / nextCount).toFixed(2),
          }).where(eq(spendingPatterns.id, existingPattern[0].id));
        } else {
          await database.insert(spendingPatterns).values({
            userId: ctx.user.id,
            merchantCategory: category,
            monthlySpending: input.amount.toFixed(2),
            averageTransactionAmount: input.amount.toFixed(2),
            transactionCount: 1,
            month,
            schoolCode,
          });
        }

        const account = await database.select().from(userBankAccounts).where(and(
          eq(userBankAccounts.userId, ctx.user.id),
          eq(userBankAccounts.schoolCode, schoolCode),
        )).limit(1);
        if (account[0]) {
          await database.update(userBankAccounts).set({
            totalDebt: (Number(account[0].totalDebt) + input.amount).toFixed(2),
          }).where(eq(userBankAccounts.id, account[0].id));
        }

        return {
          success: true,
          chargedAmount: input.amount,
          cashback,
          currentBalance: chargeUpdate.currentBalance,
          availableCredit: chargeUpdate.availableCredit,
          utilizationRate: chargeUpdate.utilizationRate,
        };
      }),

    getCardStatement: protectedProcedure
      .input(z.object({
        cardId: z.number().int().positive(),
        month: z.number().int().min(1).max(12).optional(),
        year: z.number().int().min(2000).max(2100).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const schoolCode = ctx.user.schoolCode || '';
        const { cardUsageTracking, cashbackRewards, creditCardPayments, creditCards, userCreditCards } = await import('../drizzle/schema');

        const issuedCard = await database.select().from(userCreditCards).where(and(
          eq(userCreditCards.id, input.cardId),
          eq(userCreditCards.userId, ctx.user.id),
          eq(userCreditCards.schoolCode, schoolCode),
        )).limit(1);
        if (!issuedCard[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Issued card not found' });

        const matchesPeriod = (date: Date) =>
          (!input.month || date.getUTCMonth() + 1 === input.month) &&
          (!input.year || date.getUTCFullYear() === input.year);
        const [product, usage, payments, cashback] = await Promise.all([
          database.select().from(creditCards).where(eq(creditCards.id, issuedCard[0].creditCardId)).limit(1),
          database.select().from(cardUsageTracking).where(and(eq(cardUsageTracking.userId, ctx.user.id), eq(cardUsageTracking.cardId, issuedCard[0].creditCardId))).orderBy(desc(cardUsageTracking.transactionDate)),
          database.select().from(creditCardPayments).where(and(eq(creditCardPayments.userId, ctx.user.id), eq(creditCardPayments.userCreditCardId, issuedCard[0].id))).orderBy(desc(creditCardPayments.createdAt)),
          database.select().from(cashbackRewards).where(and(eq(cashbackRewards.userId, ctx.user.id), eq(cashbackRewards.cardId, issuedCard[0].creditCardId))).orderBy(desc(cashbackRewards.earnedDate)),
        ]);
        const charges = usage.filter((entry) => matchesPeriod(entry.transactionDate));
        const statementPayments = payments.filter((entry) => matchesPeriod(entry.createdAt ?? new Date()));
        const statementCashback = cashback.filter((entry) => matchesPeriod(entry.earnedDate));

        return {
          card: { ...issuedCard[0], product: product[0] ?? null },
          charges,
          payments: statementPayments,
          cashback: statementCashback,
          summary: {
            charges: charges.reduce((total, entry) => total + Number(entry.transactionAmount), 0),
            payments: statementPayments.reduce((total, entry) => total + Number(entry.amount), 0),
            cashback: statementCashback.reduce((total, entry) => total + Number(entry.amount), 0),
            closingBalance: Number(issuedCard[0].currentBalance),
          },
        };
      }),

    getSpendingAnalytics: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return { categories: [], monthly: [], totalSpending: 0 };
      const { cardUsageTracking } = await import('../drizzle/schema');
      const usage = await database.select().from(cardUsageTracking).where(eq(cardUsageTracking.userId, ctx.user.id));
      const summary = summarizeSpending(usage.map((entry) => ({
        amount: Number(entry.transactionAmount),
        category: entry.merchantCategory,
        occurredAt: entry.transactionDate,
      })));
      return {
        ...summary,
        totalSpending: summary.categories.reduce((total, category) => total + category.total, 0),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

// ===== ANNOUNCEMENTS ROUTER =====
