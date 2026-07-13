import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

export const membersRouter = router({
  // Get all members in a chapter (admin only)
  getMembers: protectedProcedure
    .input(z.object({ schoolCode: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      // Check role first
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can view members' })
      }
      
      // Determine school code: super admins can use input, regular admins use their own
      let schoolCode = ctx.user.schoolCode;
      if (ctx.user.role === 'super_admin' && input?.schoolCode) {
        schoolCode = input.schoolCode;
      }
      
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.getMembersForChapter(schoolCode)
    }),

  // Get member profile
  getMember: protectedProcedure
    .input(z.object({ memberId: z.number(), schoolCode: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      // Check role first
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      
      // Determine school code: super admins can use input, regular admins use their own
      let schoolCode = ctx.user.schoolCode;
      if (ctx.user.role === 'super_admin' && input?.schoolCode) {
        schoolCode = input.schoolCode;
      }
      
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.getMemberProfile(input.memberId, schoolCode)
    }),

  // Portfolio management
  createPortfolioItem: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      category: z.string().min(1),
      description: z.string().optional(),
      fileUrl: z.string().optional(),
      externalUrl: z.string().optional(),
      memberProgressNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const schoolCode = ctx.user.schoolCode;
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User has no school code' })
      }
      if (!input.fileUrl && !input.externalUrl) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Either file or external link is required' })
      }
      return db.createPortfolioItem({
        userId: ctx.user.id,
        schoolCode: schoolCode,
        ...input,
      })
    }),

  getPortfolioItems: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const userId = input?.userId || ctx.user.id
      if (!ctx.user.schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User has no school code' })
      }
      // Members can only view their own portfolio
      // Admins can view any member's portfolio in their chapter
      if (userId !== ctx.user.id && ctx.user.role === 'user') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return db.getPortfolioItems(userId, ctx.user.schoolCode)
    }),

  updatePortfolioItem: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      title: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      fileUrl: z.string().optional(),
      externalUrl: z.string().optional(),
      memberProgressNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { itemId, ...updates } = input
      return db.updatePortfolioItem(itemId, ctx.user.id, updates)
    }),

  deletePortfolioItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return db.deletePortfolioItem(input.itemId, ctx.user.id)
    }),

  updatePortfolioStatus: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      status: z.enum(['not_started', 'in_progress', 'ready_for_review', 'needs_revision', 'completed']),
      feedback: z.string().optional(),
      schoolCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.updatePortfolioItemStatus(input.itemId, ctx.user.id, schoolCode, input.status, input.feedback)
    }),

  // Admin notes
  createAdminNote: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      note: z.string().min(1),
      schoolCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.createAdminNote({
        schoolCode,
        memberId: input.memberId,
        adminId: ctx.user.id,
        note: input.note,
      })
    }),

  getAdminNotes: protectedProcedure
    .input(z.object({ memberId: z.number(), schoolCode: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.getAdminNotes(input.memberId, schoolCode, ctx.user.id)
    }),

  updateAdminNote: protectedProcedure
    .input(z.object({
      noteId: z.number(),
      note: z.string().min(1),
      schoolCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.updateAdminNote(input.noteId, ctx.user.id, schoolCode, input.note)
    }),

  deleteAdminNote: protectedProcedure
    .input(z.object({ noteId: z.number(), schoolCode: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.deleteAdminNote(input.noteId, ctx.user.id, schoolCode)
    }),

  // Direct messaging
  sendMessage: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      body: z.string().min(1),
      schoolCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.sendDirectMessage({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        schoolCode,
        body: input.body,
      })
    }),

  getMessages: protectedProcedure
    .input(z.object({ otherUserId: z.number(), schoolCode: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.getDirectMessages(ctx.user.id, input.otherUserId, schoolCode)
    }),

  markMessageRead: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return db.markMessageAsRead(input.messageId, ctx.user.id)
    }),

  getConversations: protectedProcedure
    .input(z.object({ schoolCode: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
            return db.getConversationList(ctx.user.id, schoolCode)
    }),

  searchUsers: protectedProcedure
    .input(z.object({ emailQuery: z.string().min(1), schoolCode: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode
      if (!schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'School code is required' })
      }
      return db.searchUsersByEmail(schoolCode, input.emailQuery, ctx.user.id)
    }),
});
