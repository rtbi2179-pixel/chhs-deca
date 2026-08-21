import { z } from "zod";
import { deleteTimelineCalendarEvent, getOrGenerateTimeline, listTimelineCalendar, saveTimelineCalendarEvent, updateTimelineItem } from "./timelineEngine";
import { protectedProcedure, router } from "./_core/trpc";

const calendarEventInput = z.object({
  id: z.number().optional(), title: z.string().trim().min(1).max(255), eventType: z.enum(["meeting", "mock_competition", "testing", "written_deadline", "pitchdeck_deadline", "district_conference", "state_conference", "campaign_deadline", "leadership_conference", "other"]), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), isTbd: z.boolean().optional(), description: z.string().max(2000).optional(), priority: z.enum(["low", "normal", "high", "critical"]).optional(), color: z.string().max(30).optional(), applicableEventTypes: z.array(z.string().max(30)).max(5).optional(), hardDeadline: z.boolean().optional(),
});

export const timelineRouter = router({
  getMine: protectedProcedure.query(({ ctx }) => getOrGenerateTimeline(ctx.user)),
  start: protectedProcedure.input(z.object({ startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).mutation(({ ctx, input }) => getOrGenerateTimeline(ctx.user, input.startDate)),
  updateItem: protectedProcedure.input(z.object({ itemId: z.number(), status: z.enum(["upcoming", "current", "completed", "skipped", "rescheduled"]).optional(), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })).mutation(({ ctx, input }) => updateTimelineItem(ctx.user, input.itemId, input.status, input.dueDate)),
  getCalendar: protectedProcedure.query(({ ctx }) => listTimelineCalendar(ctx.user)),
  saveCalendarEvent: protectedProcedure.input(calendarEventInput).mutation(({ ctx, input }) => saveTimelineCalendarEvent(ctx.user, input)),
  deleteCalendarEvent: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteTimelineCalendarEvent(ctx.user, input.id)),
});
