import { TRPCError } from "@trpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { chapterExamAttempts, dailyPracticeStats, discussionThreads, studySessions, userAnswers, userFeedback, users, websiteInteractionEvents } from "../drizzle/schema";
import * as db from "./db";
import { protectedProcedure, router } from "./_core/trpc";

export const DESIGNATED_DIAGNOSTIC_EMAILS = new Set([
  "sahan.mallampati@gmail.com",
  "rtbi2179@gmail.com",
]);

type DiagnosticsUser = { role: string; email?: string | null };

export function isDesignatedDiagnosticsAdmin(user: DiagnosticsUser) {
  return user.role === "super_admin" && Boolean(user.email && DESIGNATED_DIAGNOSTIC_EMAILS.has(user.email.toLowerCase()));
}

export function assertDesignatedDiagnosticsAdmin(user: DiagnosticsUser) {
  if (!isDesignatedDiagnosticsAdmin(user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Chapter diagnostics are restricted to Sahan Mallampati and Ricardo Burciaga." });
  }
}

const diagnosticsInput = z.object({ schoolCode: z.string().trim().min(1).max(50) });
const trackingInput = z.object({
  eventType: z.enum(["page_view", "control_click"]),
  path: z.string().trim().min(1).max(255),
  label: z.string().trim().min(1).max(120).optional(),
});

function dayStart(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function displayName(member: { name: string | null; firstName: string | null; lastName: string | null; username: string | null; email: string | null }) {
  return member.name || [member.firstName, member.lastName].filter(Boolean).join(" ") || member.username || member.email || "Unnamed member";
}

export const superAdminDiagnosticsRouter = router({
  listChapters: protectedProcedure.query(async ({ ctx }) => {
    assertDesignatedDiagnosticsAdmin(ctx.user);
    return db.getAllSchoolCodes();
  }),

  trackInteraction: protectedProcedure.input(trackingInput).mutation(async ({ ctx, input }) => {
    const database = await db.getDb();
    const schoolCode = ctx.user.schoolCode;
    if (!database || !schoolCode) return { recorded: false };
    await database.insert(websiteInteractionEvents).values({
      userId: ctx.user.id,
      schoolCode,
      eventType: input.eventType,
      path: input.path,
      label: input.label?.slice(0, 120),
    });
    return { recorded: true };
  }),

  getChapter: protectedProcedure.input(diagnosticsInput).query(async ({ ctx, input }) => {
    assertDesignatedDiagnosticsAdmin(ctx.user);
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Diagnostics storage is unavailable." });

    const members = await database.select({ id: users.id, name: users.name, firstName: users.firstName, lastName: users.lastName, username: users.username, email: users.email, role: users.role, primaryEventCode: users.primaryEventCode, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(eq(users.schoolCode, input.schoolCode));
    const memberIds = members.map((member) => member.id);
    const [answers, practice, sessions, chapterAttempts, threads, feedback, interactions] = await Promise.all([
      database.select({ userId: userAnswers.userId, isCorrect: userAnswers.isCorrect, createdAt: userAnswers.createdAt }).from(userAnswers).where(eq(userAnswers.schoolCode, input.schoolCode)),
      database.select({ userId: dailyPracticeStats.userId, questionsCompleted: dailyPracticeStats.questionsCompleted, correctAnswers: dailyPracticeStats.correctAnswers, practiceDate: dailyPracticeStats.practiceDate }).from(dailyPracticeStats).where(eq(dailyPracticeStats.schoolCode, input.schoolCode)),
      memberIds.length ? database.select({ userId: studySessions.userId, questionsAnswered: studySessions.questionsAnswered, correctAnswers: studySessions.correctAnswers, createdAt: studySessions.createdAt }).from(studySessions).where(inArray(studySessions.userId, memberIds)) : Promise.resolve([]),
      database.select({ userId: chapterExamAttempts.userId, accuracy: chapterExamAttempts.accuracy, completedAt: chapterExamAttempts.completedAt, suspiciousActivityCount: chapterExamAttempts.suspiciousActivityCount }).from(chapterExamAttempts).where(eq(chapterExamAttempts.schoolCode, input.schoolCode)),
      database.select({ id: discussionThreads.id, createdAt: discussionThreads.createdAt }).from(discussionThreads).where(eq(discussionThreads.schoolCode, input.schoolCode)),
      database.select({ id: userFeedback.id, status: userFeedback.status, createdAt: userFeedback.createdAt }).from(userFeedback).where(eq(userFeedback.schoolCode, input.schoolCode)),
      database.select({ userId: websiteInteractionEvents.userId, eventType: websiteInteractionEvents.eventType, path: websiteInteractionEvents.path, label: websiteInteractionEvents.label, createdAt: websiteInteractionEvents.createdAt }).from(websiteInteractionEvents).where(eq(websiteInteractionEvents.schoolCode, input.schoolCode)).orderBy(desc(websiteInteractionEvents.createdAt)).limit(5000),
    ]);

    const answerByUser = new Map<number, { answered: number; correct: number; lastAnsweredAt: Date | null }>();
    for (const answer of answers) {
      const current = answerByUser.get(answer.userId) ?? { answered: 0, correct: 0, lastAnsweredAt: null };
      current.answered += 1;
      current.correct += answer.isCorrect ? 1 : 0;
      if (!current.lastAnsweredAt || (answer.createdAt && answer.createdAt > current.lastAnsweredAt)) current.lastAnsweredAt = answer.createdAt;
      answerByUser.set(answer.userId, current);
    }
    const interactionByUser = new Map<number, Date>();
    const interactionPaths = new Map<string, number>();
    const interactionLabels = new Map<string, number>();
    for (const interaction of interactions) {
      const previous = interactionByUser.get(interaction.userId);
      if (!previous || interaction.createdAt > previous) interactionByUser.set(interaction.userId, interaction.createdAt);
      if (interaction.eventType === "page_view") interactionPaths.set(interaction.path, (interactionPaths.get(interaction.path) ?? 0) + 1);
      if (interaction.eventType === "control_click" && interaction.label) interactionLabels.set(interaction.label, (interactionLabels.get(interaction.label) ?? 0) + 1);
    }
    const roster = members.map((member) => {
      const learning = answerByUser.get(member.id) ?? { answered: 0, correct: 0, lastAnsweredAt: null };
      const lastInteractionAt = interactionByUser.get(member.id) ?? null;
      const lastActiveAt = [member.lastSignedIn, learning.lastAnsweredAt, lastInteractionAt].filter(Boolean).sort((left, right) => right!.getTime() - left!.getTime())[0] ?? null;
      return {
        id: member.id,
        name: displayName(member),
        email: member.email,
        role: member.role,
        focusedEvent: member.primaryEventCode,
        joinedAt: member.createdAt,
        lastSignedIn: member.lastSignedIn,
        lastActiveAt,
        questionsAnswered: learning.answered,
        accuracy: learning.answered ? Number(((learning.correct / learning.answered) * 100).toFixed(1)) : 0,
        lastInteractionAt,
      };
    }).sort((left, right) => right.questionsAnswered - left.questionsAnswered || left.name.localeCompare(right.name));
    const totalAnswered = answers.length;
    const totalCorrect = answers.filter((answer) => answer.isCorrect).length;
    const sevenDaysAgo = dayStart(7);
    const thirtyDaysAgo = dayStart(30);
    const activeLast7Days = roster.filter((member) => member.lastActiveAt && member.lastActiveAt >= sevenDaysAgo).length;
    const interactions30Days = interactions.filter((event) => event.createdAt >= thirtyDaysAgo);

    return {
      schoolCode: input.schoolCode,
      generatedAt: new Date(),
      summary: {
        memberCount: members.length,
        activeLast7Days,
        questionsAnswered: totalAnswered,
        accuracy: totalAnswered ? Number(((totalCorrect / totalAnswered) * 100).toFixed(1)) : 0,
        practiceDays: new Set(practice.map((entry) => `${entry.userId}:${entry.practiceDate}`)).size,
        studySessions: sessions.length,
        chapterExamAttempts: chapterAttempts.length,
        completedChapterExams: chapterAttempts.filter((attempt) => attempt.completedAt).length,
        suspiciousExamFlags: chapterAttempts.reduce((total, attempt) => total + attempt.suspiciousActivityCount, 0),
        discussionThreads: threads.length,
        feedbackCount: feedback.length,
        unresolvedFeedback: feedback.filter((entry) => entry.status === "new" || entry.status === "reviewing").length,
        totalViews: interactions.filter((entry) => entry.eventType === "page_view").length,
        totalClicks: interactions.filter((entry) => entry.eventType === "control_click").length,
        viewsLast30Days: interactions30Days.filter((entry) => entry.eventType === "page_view").length,
        clicksLast30Days: interactions30Days.filter((entry) => entry.eventType === "control_click").length,
      },
      topViews: Array.from(interactionPaths.entries()).sort((left, right) => right[1] - left[1]).slice(0, 8).map(([path, count]) => ({ path, count })),
      topClicks: Array.from(interactionLabels.entries()).sort((left, right) => right[1] - left[1]).slice(0, 8).map(([label, count]) => ({ label, count })),
      roster,
    };
  }),
});
