import { and, asc, desc, eq, gt, ne, sql } from "drizzle-orm";
import { eventTimelineCalendarEvents, piLearningModules, timelineItems, userAnswers, userEventTimelines, userPiProgress, users, questions } from "../drizzle/schema";
import { clusterForEvent, getTimelineStrategy, strategyLabel, type TimelineStrategy } from "../shared/timelineRequirements";
import * as db from "./db";

type TimelineUser = { id: number; role: string; schoolCode?: string | null; selectedSchoolCode?: string | null };
type CalendarInput = {
  title: string;
  eventType: "meeting" | "mock_competition" | "testing" | "written_deadline" | "pitchdeck_deadline" | "district_conference" | "state_conference" | "campaign_deadline" | "leadership_conference" | "other";
  startDate?: string | null;
  endDate?: string | null;
  isTbd?: boolean;
  description?: string;
  priority?: "low" | "normal" | "high" | "critical";
  color?: string;
  applicableEventTypes?: string[];
  hardDeadline?: boolean;
};

type TimelineItemType = "pi_learning" | "practice_questions" | "practice_exam" | "roleplay" | "written_project" | "pitch_deck" | "presentation" | "review" | "mock_competition" | "testing" | "conference" | "meeting" | "deadline" | "general";
type TimelineTask = { title: string; description: string; dueDate: string; priority: "low" | "normal" | "high" | "critical"; estimatedMinutes: number; deepLink: string; generatedReason: string; itemType: TimelineItemType };

const CURRENT_COMPETITION_YEAR = "2026-2027";

function effectiveSchoolCode(user: TimelineUser) {
  return user.role === "super_admin" ? user.selectedSchoolCode || user.schoolCode : user.schoolCode;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value?: string | null) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

function createDefaultCalendar(): CalendarInput[] {
  return [
    { title: "PCM", eventType: "meeting", startDate: "2026-08-19", priority: "normal", color: "blue" },
    { title: "President's Club Meeting", eventType: "meeting", isTbd: true, priority: "low", color: "slate" },
    { title: "Fall Leadership Conference", eventType: "leadership_conference", isTbd: true, priority: "normal", color: "blue" },
    { title: "PCM", eventType: "meeting", startDate: "2026-09-16", priority: "normal", color: "blue" },
    { title: "PCM", eventType: "meeting", startDate: "2026-10-14", priority: "normal", color: "blue" },
    { title: "Mock Competition", eventType: "mock_competition", startDate: "2026-10-21", priority: "high", color: "amber", hardDeadline: true },
    { title: "PCM", eventType: "meeting", startDate: "2026-11-11", priority: "normal", color: "blue" },
    { title: "DCDC Testing", eventType: "testing", startDate: "2026-11-16", endDate: "2026-11-19", priority: "critical", color: "rose", hardDeadline: true, applicableEventTypes: ["roleplay_exam", "prepared"] },
    { title: "Written Entries and Pitch Deck Deadline", eventType: "written_deadline", startDate: "2026-11-19", priority: "critical", color: "rose", hardDeadline: true, applicableEventTypes: ["written", "pitch"] },
    { title: "Campaign Deadlines", eventType: "campaign_deadline", startDate: "2026-12-01", priority: "high", color: "amber", hardDeadline: true, applicableEventTypes: ["written", "pitch"] },
    { title: "PCM", eventType: "meeting", startDate: "2026-12-02", priority: "normal", color: "blue" },
    { title: "District Career Development Conference", eventType: "district_conference", startDate: "2026-12-07", priority: "critical", color: "blue", hardDeadline: true },
    { title: "PCM", eventType: "meeting", startDate: "2027-01-06", priority: "normal", color: "blue" },
    { title: "PCM", eventType: "meeting", startDate: "2027-02-10", priority: "normal", color: "blue" },
    { title: "State Career Development Conference", eventType: "state_conference", startDate: "2027-02-25", endDate: "2027-02-27", priority: "critical", color: "violet", hardDeadline: true },
  ];
}

export async function ensureTimelineCalendar(schoolCode: string) {
  const database = await db.getDb();
  if (!database) throw new Error("Timeline storage is unavailable");
  const existing = await database.select().from(eventTimelineCalendarEvents).where(and(eq(eventTimelineCalendarEvents.schoolCode, schoolCode), eq(eventTimelineCalendarEvents.competitionYear, CURRENT_COMPETITION_YEAR)));
  if (existing.length) return existing;
  await database.insert(eventTimelineCalendarEvents).values(createDefaultCalendar().map((event) => ({ schoolCode, competitionYear: CURRENT_COMPETITION_YEAR, title: event.title, eventType: event.eventType, startDate: event.startDate ?? null, endDate: event.endDate ?? null, isTbd: event.isTbd ?? false, description: event.description ?? null, priority: event.priority ?? "normal", color: event.color ?? "blue", applicableEventTypes: event.applicableEventTypes ?? null, hardDeadline: event.hardDeadline ?? false })));
  return database.select().from(eventTimelineCalendarEvents).where(and(eq(eventTimelineCalendarEvents.schoolCode, schoolCode), eq(eventTimelineCalendarEvents.competitionYear, CURRENT_COMPETITION_YEAR))).orderBy(asc(eventTimelineCalendarEvents.startDate));
}

async function getProgressContext(userId: number, schoolCode: string) {
  const database = await db.getDb();
  if (!database) throw new Error("Timeline storage is unavailable");
  const [learning, piRows, answerRows] = await Promise.all([
    db.getProfileLearningMetrics(userId),
    database.select({ masteryScore: userPiProgress.masteryScore }).from(userPiProgress).where(eq(userPiProgress.userId, userId)),
    database.select({ instructionalArea: questions.instructionalArea, isCorrect: userAnswers.isCorrect }).from(userAnswers).innerJoin(questions, eq(userAnswers.questionId, questions.id)).where(and(eq(userAnswers.userId, userId), eq(userAnswers.schoolCode, schoolCode))),
  ]);
  const areas = new Map<string, { correct: number; total: number }>();
  answerRows.forEach((row) => { const current = areas.get(row.instructionalArea) ?? { correct: 0, total: 0 }; current.total += 1; current.correct += row.isCorrect ? 1 : 0; areas.set(row.instructionalArea, current); });
  const weakArea = Array.from(areas.entries()).filter(([, value]) => value.total >= 3).sort(([, left], [, right]) => (left.correct / left.total) - (right.correct / right.total))[0]?.[0] ?? null;
  const piMastery = piRows.length ? Math.round(piRows.reduce((sum, row) => sum + row.masteryScore, 0) / piRows.length) : 0;
  return { ...learning, piMastery, weakArea };
}

function taskDate(target: Date, daysBefore: number, start: Date) {
  const planned = addDays(target, -daysBefore);
  return isoDate(planned < start ? addDays(start, 1) : planned);
}

function generatedTasks(strategy: TimelineStrategy, eventCode: string, start: Date, deadlines: Awaited<ReturnType<typeof ensureTimelineCalendar>>, progress: Awaited<ReturnType<typeof getProgressContext>>) {
  const strategyDeadlines = deadlines.filter((event) => !event.isTbd && event.startDate && (!event.applicableEventTypes || event.applicableEventTypes.includes(strategy)));
  const district = strategyDeadlines.find((event) => event.eventType === "district_conference");
  const written = strategyDeadlines.find((event) => event.eventType === "written_deadline" || event.eventType === "pitchdeck_deadline");
  const mock = strategyDeadlines.find((event) => event.eventType === "mock_competition");
  const target = parseDate((strategy === "written" || strategy === "pitch") ? written?.startDate ?? district?.startDate : district?.startDate) ?? addDays(start, 42);
  const daysRemaining = daysBetween(start, target);
  const mode: "gradual" | "accelerated" | "emergency" = daysRemaining <= 35 ? "emergency" : daysRemaining <= 75 ? "accelerated" : "gradual";
  const cluster = clusterForEvent(eventCode);
  const practiceLink = `/practice?cluster=${encodeURIComponent(cluster)}`;
  const piLink = `/pi-quizlet?event=${encodeURIComponent(eventCode)}`;
  const weakReason = progress.weakArea ? `Your practice history identifies ${progress.weakArea} as an area to reinforce.` : "This establishes the event knowledge base needed for the next phase.";
  const common: TimelineTask[] = [
    { title: "Complete event PI foundation", description: `Study the priority performance indicators for ${eventCode}.`, dueDate: taskDate(target, mode === "gradual" ? 50 : 21, start), priority: "high", estimatedMinutes: 45, deepLink: piLink, generatedReason: weakReason, itemType: "pi_learning" },
    { title: `Targeted ${cluster} practice`, description: `Complete a focused practice set and review every incorrect answer.`, dueDate: taskDate(target, mode === "gradual" ? 35 : 14, start), priority: "high", estimatedMinutes: 35, deepLink: practiceLink, generatedReason: progress.accuracyPercent < 75 ? `Your recorded accuracy is ${progress.accuracyPercent.toFixed(1)}%, so targeted practice is a high-value next step.` : "Use timed practice to retain event knowledge.", itemType: "practice_questions" },
  ];
  const strategyTasks: TimelineTask[] = strategy === "written" ? [
    { title: "Choose project scope and rubric path", description: "Confirm the project, review the rubric, and define evidence you need to collect.", dueDate: taskDate(target, 42, start), priority: "critical", estimatedMinutes: 50, deepLink: "/events", generatedReason: "Written events require a defined project and rubric plan before drafting.", itemType: "written_project" },
    { title: "Draft executive summary and market analysis", description: "Create a complete first-pass executive summary and target-market analysis.", dueDate: taskDate(target, 21, start), priority: "critical", estimatedMinutes: 70, deepLink: "/events", generatedReason: "A full draft must exist at least 14 days before the submission deadline.", itemType: "written_project" },
    { title: "Rubric audit and final formatting", description: "Check evidence, page requirements, formatting, and every scoring criterion.", dueDate: taskDate(target, 3, start), priority: "critical", estimatedMinutes: 45, deepLink: "/events", generatedReason: "Hard deadlines do not move; final quality control belongs immediately before submission.", itemType: "review" },
  ] : strategy === "pitch" ? [
    { title: "Define the problem, solution, and target customer", description: "Write the story that anchors your pitch deck and validate each assumption.", dueDate: taskDate(target, 42, start), priority: "critical", estimatedMinutes: 50, deepLink: "/events", generatedReason: "Pitch events need a clear problem-solution story before slides are built.", itemType: "pitch_deck" },
    { title: "Build the first pitch deck", description: "Create a complete deck with market, model, financial, and implementation slides.", dueDate: taskDate(target, 21, start), priority: "critical", estimatedMinutes: 75, deepLink: "/events", generatedReason: "A complete first deck is required early enough to practice and improve visual storytelling.", itemType: "pitch_deck" },
    { title: "Practice the timed pitch and judge questions", description: "Run a timed presentation and rehearse concise answers to likely judge questions.", dueDate: taskDate(target, 7, start), priority: "high", estimatedMinutes: 40, deepLink: "/ai/roleplay", generatedReason: "A pitch deck only succeeds when the live delivery is practiced under timing.", itemType: "presentation" },
  ] : strategy === "prepared" ? [
    { title: "Build your presentation structure", description: "Organize the opening, business recommendation, objection handling, and close.", dueDate: taskDate(target, 35, start), priority: "high", estimatedMinutes: 45, deepLink: "/ai/roleplay", generatedReason: "Prepared presentations require a repeatable structure before timing practice.", itemType: "presentation" },
    { title: "Run a timed judge simulation", description: "Practice delivery, objections, and question responses under competition timing.", dueDate: taskDate(target, 10, start), priority: "high", estimatedMinutes: 35, deepLink: "/ai/roleplay", generatedReason: "Timed rehearsal turns product knowledge into confident live delivery.", itemType: "roleplay" },
  ] : strategy === "simulation" ? [
    { title: "Review simulation rules and decision goals", description: "Set a disciplined approach for decisions, risk, and reflection.", dueDate: taskDate(target, 28, start), priority: "high", estimatedMinutes: 30, deepLink: "/market", generatedReason: "Simulation events reward deliberate, documented decisions rather than random activity.", itemType: "general" },
    { title: "Complete a simulation review", description: "Review outcomes, compare decisions to strategy, and identify one improvement.", dueDate: taskDate(target, 7, start), priority: "high", estimatedMinutes: 30, deepLink: "/market", generatedReason: "Reflection makes simulation progress transferable to competition decisions.", itemType: "review" },
  ] : [
    { title: "Practice event roleplay structure", description: "Rehearse introductions, PI identification, business recommendations, and conclusions.", dueDate: taskDate(target, 28, start), priority: "high", estimatedMinutes: 35, deepLink: "/ai/roleplay", generatedReason: "Roleplay events require turning PI knowledge into concise business recommendations.", itemType: "roleplay" },
    { title: "Complete a timed roleplay simulation", description: "Practice under competition timing and review your delivery afterward.", dueDate: taskDate(target, 7, start), priority: "critical", estimatedMinutes: 35, deepLink: "/ai/roleplay", generatedReason: "The final phase prioritizes competition timing, communication, and PI integration.", itemType: "roleplay" },
  ];
  const mockTask: TimelineTask[] = mock?.startDate && parseDate(mock.startDate)! >= start ? [{ title: "Prepare for Mock Competition", description: "Complete one full simulation and review your weakest preparation area before mock competition.", dueDate: taskDate(parseDate(mock.startDate)!, 2, start), priority: "critical", estimatedMinutes: 50, deepLink: strategy === "written" || strategy === "pitch" ? "/events" : "/ai/roleplay", generatedReason: "Mock Competition is an administrator-defined major milestone.", itemType: "mock_competition" }] : [];
  return { tasks: [...common, ...strategyTasks, ...mockTask], targetDate: isoDate(target), mode, daysRemaining, cluster };
}

export async function getOrGenerateTimeline(user: TimelineUser) {
  const database = await db.getDb();
  const schoolCode = effectiveSchoolCode(user);
  if (!database || !schoolCode) throw new Error("A school code is required to build a competition timeline.");
  const [account] = await database.select({ primaryEventCode: users.primaryEventCode, eventSelectedAt: users.eventSelectedAt }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!account?.primaryEventCode) return { timeline: null, calendar: await ensureTimelineCalendar(schoolCode), preview: null };
  const calendar = await ensureTimelineCalendar(schoolCode);
  const eventCode = account.primaryEventCode;
  const strategy = getTimelineStrategy(eventCode);
  const start = account.eventSelectedAt ?? new Date();
  const latestCalendarEdit = calendar.reduce<Date | null>((latest, event) => !latest || event.updatedAt > latest ? event.updatedAt : latest, null);
  let [timeline] = await database.select().from(userEventTimelines).where(and(eq(userEventTimelines.userId, user.id), eq(userEventTimelines.eventCode, eventCode), eq(userEventTimelines.status, "active"))).orderBy(desc(userEventTimelines.updatedAt)).limit(1);
  const stale = Boolean(timeline && latestCalendarEdit && timeline.updatedAt < latestCalendarEdit);
  if (!timeline || stale) {
    if (timeline) await database.delete(timelineItems).where(and(eq(timelineItems.timelineId, timeline.id), ne(timelineItems.status, "completed")));
    const progress = await getProgressContext(user.id, schoolCode);
    const generation = generatedTasks(strategy, eventCode, start, calendar, progress);
    const readinessScore = Math.round(Math.min(100, progress.piMastery * 0.35 + progress.accuracyPercent * 0.35 + (progress.studyStreak >= 3 ? 20 : progress.studyStreak * 6) + 10));
    if (!timeline) {
      const created = await database.insert(userEventTimelines).values({ userId: user.id, eventCode, schoolCode, competitionYear: CURRENT_COMPETITION_YEAR, startDate: isoDate(start), targetDate: generation.targetDate, timelineMode: generation.mode, status: "active", readinessScore, currentPhase: strategyLabel(strategy) });
      const timelineId = Number(created[0].insertId);
      timeline = (await database.select().from(userEventTimelines).where(eq(userEventTimelines.id, timelineId)).limit(1))[0];
    } else {
      await database.update(userEventTimelines).set({ targetDate: generation.targetDate, timelineMode: generation.mode, readinessScore, currentPhase: strategyLabel(strategy), updatedAt: new Date() }).where(eq(userEventTimelines.id, timeline.id));
      timeline = (await database.select().from(userEventTimelines).where(eq(userEventTimelines.id, timeline.id)).limit(1))[0];
    }
    await database.insert(timelineItems).values(generation.tasks.map((task, index) => ({ timelineId: timeline!.id, title: task.title, description: task.description, itemType: task.itemType, dueDate: task.dueDate, priority: task.priority, status: "upcoming" as const, estimatedMinutes: task.estimatedMinutes, deepLink: task.deepLink, hardDeadline: false, generatedReason: task.generatedReason, sortOrder: index })));
  }
  const [items, progress] = await Promise.all([
    database.select().from(timelineItems).where(eq(timelineItems.timelineId, timeline.id)).orderBy(asc(timelineItems.dueDate), asc(timelineItems.sortOrder)),
    getProgressContext(user.id, schoolCode),
  ]);
  const completed = items.filter((item) => item.status === "completed").length;
  const readiness = timeline.readinessScore;
  const now = new Date();
  const nextTask = items.find((item) => item.status !== "completed" && (!item.dueDate || parseDate(item.dueDate)! >= now)) ?? items.find((item) => item.status !== "completed") ?? null;
  return { timeline: { ...timeline, strategy, strategyLabel: strategyLabel(strategy), daysRemaining: daysBetween(now, parseDate(timeline.targetDate) ?? now), progressPercent: items.length ? Math.round((completed / items.length) * 100) : 0, readinessScore: readiness, progressContext: progress, nextTask }, items, calendar, preview: { eventCode, currentPhase: timeline.currentPhase, readinessScore: readiness, nextTask, daysRemaining: daysBetween(now, parseDate(timeline.targetDate) ?? now) } };
}

export async function updateTimelineItem(user: TimelineUser, itemId: number, status?: "upcoming" | "current" | "completed" | "skipped" | "rescheduled", dueDate?: string) {
  const database = await db.getDb();
  if (!database) throw new Error("Timeline storage is unavailable");
  const [item] = await database.select({ item: timelineItems, timeline: userEventTimelines }).from(timelineItems).innerJoin(userEventTimelines, eq(timelineItems.timelineId, userEventTimelines.id)).where(eq(timelineItems.id, itemId)).limit(1);
  if (!item || item.timeline.userId !== user.id) throw new Error("Timeline task not found.");
  if (dueDate && item.item.hardDeadline) throw new Error("Hard competition deadlines cannot be moved.");
  await database.update(timelineItems).set({ ...(status ? { status, completedAt: status === "completed" ? new Date() : null } : {}), ...(dueDate ? { dueDate } : {}), updatedAt: new Date() }).where(eq(timelineItems.id, itemId));
  return { success: true };
}

export async function listTimelineCalendar(user: TimelineUser) {
  const schoolCode = effectiveSchoolCode(user);
  if (!schoolCode) throw new Error("A school code is required.");
  return ensureTimelineCalendar(schoolCode);
}

export async function saveTimelineCalendarEvent(user: TimelineUser, input: CalendarInput & { id?: number }) {
  if (user.role !== "admin" && user.role !== "super_admin") throw new Error("Only chapter administrators can manage competition deadlines.");
  const schoolCode = effectiveSchoolCode(user);
  const database = await db.getDb();
  if (!database || !schoolCode) throw new Error("Timeline storage is unavailable");
  const values = { title: input.title, eventType: input.eventType, startDate: input.isTbd ? null : input.startDate ?? null, endDate: input.isTbd ? null : input.endDate ?? null, isTbd: input.isTbd ?? false, description: input.description ?? null, priority: input.priority ?? "normal", color: input.color ?? "blue", applicableEventTypes: input.applicableEventTypes ?? null, hardDeadline: input.hardDeadline ?? false, updatedAt: new Date() };
  if (input.id) { await database.update(eventTimelineCalendarEvents).set(values).where(and(eq(eventTimelineCalendarEvents.id, input.id), eq(eventTimelineCalendarEvents.schoolCode, schoolCode))); return { id: input.id }; }
  const created = await database.insert(eventTimelineCalendarEvents).values({ ...values, schoolCode, competitionYear: CURRENT_COMPETITION_YEAR });
  return { id: Number(created[0].insertId) };
}

export async function deleteTimelineCalendarEvent(user: TimelineUser, id: number) {
  if (user.role !== "admin" && user.role !== "super_admin") throw new Error("Only chapter administrators can manage competition deadlines.");
  const schoolCode = effectiveSchoolCode(user);
  const database = await db.getDb();
  if (!database || !schoolCode) throw new Error("Timeline storage is unavailable");
  await database.delete(eventTimelineCalendarEvents).where(and(eq(eventTimelineCalendarEvents.id, id), eq(eventTimelineCalendarEvents.schoolCode, schoolCode)));
  return { success: true };
}
