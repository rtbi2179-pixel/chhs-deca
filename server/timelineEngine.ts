import { and, asc, desc, eq, gt, gte, inArray, ne, sql } from "drizzle-orm";
import { eventPerformanceIndicators, eventTimelineCalendarEvents, piLearningModules, timelineItems, userAnswers, userEventTimelines, userPiProgress, users, questions } from "../drizzle/schema";
import { clusterForEvent, getTimelineStrategy, strategyLabel, type TimelineStrategy } from "../shared/timelineRequirements";
import * as db from "./db";
import { buildAdaptiveWeeklyRoadmap, TRAINING_INTENSITY_PROFILES, type TrainingIntensity, toIsoDate, weekStart } from "./weeklyRoadmap";

type TimelineUser = { id: number; role: string; schoolCode?: string | null; selectedSchoolCode?: string | null };
type CalendarInput = {
  title: string;
  eventType: "meeting" | "mock_competition" | "testing" | "written_deadline" | "pitchdeck_deadline" | "district_conference" | "state_conference" | "icdc_conference" | "campaign_deadline" | "leadership_conference" | "other";
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
type TimelineCompletionMetric = "manual" | "pi_mastery" | "practice_questions";
type TimelineTask = { title: string; description: string; dueDate: string; priority: "low" | "normal" | "high" | "critical"; estimatedMinutes: number; deepLink: string; generatedReason: string; itemType: TimelineItemType; completionMetric?: TimelineCompletionMetric; completionTarget?: number; completionBaseline?: number; successCriteria?: string };

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
    { title: "DECA International Career Development Conference", eventType: "icdc_conference", startDate: "2027-04-17", endDate: "2027-04-20", priority: "critical", color: "blue", hardDeadline: true, description: "Official DECA ICDC milestone: April 17–20, 2027 in Anaheim, California. https://www.deca.org/conferences/icdc" },
  ];
}

export async function ensureTimelineCalendar(schoolCode: string) {
  const database = await db.getDb();
  if (!database) throw new Error("Timeline storage is unavailable");
  const existing = await database.select().from(eventTimelineCalendarEvents).where(and(eq(eventTimelineCalendarEvents.schoolCode, schoolCode), eq(eventTimelineCalendarEvents.competitionYear, CURRENT_COMPETITION_YEAR)));
  if (existing.length) {
    if (!existing.some((event) => event.eventType === "icdc_conference")) {
      const icdc = createDefaultCalendar().find((event) => event.eventType === "icdc_conference")!;
      await database.insert(eventTimelineCalendarEvents).values({ schoolCode, competitionYear: CURRENT_COMPETITION_YEAR, title: icdc.title, eventType: icdc.eventType, startDate: icdc.startDate ?? null, endDate: icdc.endDate ?? null, isTbd: icdc.isTbd ?? false, description: icdc.description ?? null, priority: icdc.priority ?? "normal", color: icdc.color ?? "blue", applicableEventTypes: icdc.applicableEventTypes ?? null, hardDeadline: icdc.hardDeadline ?? false });
    }
    return database.select().from(eventTimelineCalendarEvents).where(and(eq(eventTimelineCalendarEvents.schoolCode, schoolCode), eq(eventTimelineCalendarEvents.competitionYear, CURRENT_COMPETITION_YEAR))).orderBy(asc(eventTimelineCalendarEvents.startDate));
  }
  await database.insert(eventTimelineCalendarEvents).values(createDefaultCalendar().map((event) => ({ schoolCode, competitionYear: CURRENT_COMPETITION_YEAR, title: event.title, eventType: event.eventType, startDate: event.startDate ?? null, endDate: event.endDate ?? null, isTbd: event.isTbd ?? false, description: event.description ?? null, priority: event.priority ?? "normal", color: event.color ?? "blue", applicableEventTypes: event.applicableEventTypes ?? null, hardDeadline: event.hardDeadline ?? false })));
  return database.select().from(eventTimelineCalendarEvents).where(and(eq(eventTimelineCalendarEvents.schoolCode, schoolCode), eq(eventTimelineCalendarEvents.competitionYear, CURRENT_COMPETITION_YEAR))).orderBy(asc(eventTimelineCalendarEvents.startDate));
}

async function getProgressContext(userId: number, schoolCode: string, eventCode?: string, periodStart?: Date) {
  const database = await db.getDb();
  if (!database) throw new Error("Timeline storage is unavailable");
  const cluster = eventCode ? clusterForEvent(eventCode) : null;
  const answerConditions = [eq(userAnswers.userId, userId), eq(userAnswers.schoolCode, schoolCode)];
  if (cluster) answerConditions.push(eq(questions.cluster, cluster));
  if (periodStart) answerConditions.push(gte(userAnswers.createdAt, periodStart));
  const mappedModules = eventCode ? await database.select({ moduleId: eventPerformanceIndicators.moduleId }).from(eventPerformanceIndicators).where(eq(eventPerformanceIndicators.eventCode, eventCode)) : [];
  const mappedIds = mappedModules.map((row) => row.moduleId);
  const [piRows, answerRows] = await Promise.all([
    mappedIds.length
      ? database.select({ masteryScore: userPiProgress.masteryScore }).from(userPiProgress).where(and(eq(userPiProgress.userId, userId), inArray(userPiProgress.moduleId, mappedIds)))
      : database.select({ masteryScore: userPiProgress.masteryScore }).from(userPiProgress).innerJoin(piLearningModules, eq(userPiProgress.moduleId, piLearningModules.id)).where(and(eq(userPiProgress.userId, userId), cluster ? eq(piLearningModules.cluster, cluster) : sql`1 = 1`)),
    database.select({ instructionalArea: questions.instructionalArea, isCorrect: userAnswers.isCorrect, createdAt: userAnswers.createdAt }).from(userAnswers).innerJoin(questions, eq(userAnswers.questionId, questions.id)).where(and(...answerConditions)),
  ]);
  const areas = new Map<string, { correct: number; total: number }>();
  answerRows.forEach((row) => { const current = areas.get(row.instructionalArea) ?? { correct: 0, total: 0 }; current.total += 1; current.correct += row.isCorrect ? 1 : 0; areas.set(row.instructionalArea, current); });
  const weakArea = Array.from(areas.entries()).filter(([, value]) => value.total >= 3).sort(([, left], [, right]) => (left.correct / left.total) - (right.correct / right.total))[0]?.[0] ?? null;
  const piMastery = piRows.length ? Math.round(piRows.reduce((sum, row) => sum + row.masteryScore, 0) / piRows.length) : 0;
  const masteredPiCount = piRows.filter((row) => row.masteryScore >= 80).length;
  const correctAnswers = answerRows.filter((row) => row.isCorrect).length;
  const activityDays = new Set(answerRows.map((row) => row.createdAt?.toISOString().slice(0, 10)).filter((value): value is string => Boolean(value)));
  const today = new Date();
  const currentDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let studyStreak = 0;
  while (activityDays.has(currentDay.toISOString().slice(0, 10))) { studyStreak += 1; currentDay.setUTCDate(currentDay.getUTCDate() - 1); }
  return { questionsAnswered: answerRows.length, correctAnswers, accuracyPercent: answerRows.length ? Number(((correctAnswers / answerRows.length) * 100).toFixed(1)) : 0, studyStreak, piMastery, masteredPiCount, availablePiCount: mappedIds.length || piRows.length, practiceQuestionCount: answerRows.length, weakArea, periodStart: periodStart ? isoDate(periodStart) : null, eventCluster: cluster };
}

function progressValueForMetric(metric: string, progress: Awaited<ReturnType<typeof getProgressContext>>) {
  if (metric === "pi_mastery") return progress.masteredPiCount;
  if (metric === "practice_questions") return progress.practiceQuestionCount;
  return 0;
}

const COMPETITION_EVENT_TYPES = ["district_conference", "state_conference", "icdc_conference"] as const;
type CompetitionEventType = (typeof COMPETITION_EVENT_TYPES)[number];
type ReadinessFactor = { key: "accuracy" | "practice" | "pi" | "roadmap"; label: string; value: number; target: number; unit: "%" | "questions" | "PIs"; weight: number; detail: string };

function isApplicable(event: { applicableEventTypes: string[] | null }, strategy: TimelineStrategy) {
  return !event.applicableEventTypes || event.applicableEventTypes.includes(strategy);
}

function competitionMilestones(calendar: Awaited<ReturnType<typeof ensureTimelineCalendar>>, strategy: TimelineStrategy, referenceDate: Date) {
  return calendar.filter((event) => !event.isTbd && event.startDate && (COMPETITION_EVENT_TYPES as readonly string[]).includes(event.eventType) && isApplicable(event, strategy) && parseDate(event.startDate)! >= referenceDate).sort((left, right) => (left.startDate ?? "").localeCompare(right.startDate ?? ""));
}

function planningTarget(calendar: Awaited<ReturnType<typeof ensureTimelineCalendar>>, strategy: TimelineStrategy, referenceDate: Date) {
  const nextCompetition = competitionMilestones(calendar, strategy, referenceDate)[0] ?? null;
  const entryDeadline = calendar.filter((event) => !event.isTbd && event.startDate && isApplicable(event, strategy) && (event.eventType === "written_deadline" || event.eventType === "pitchdeck_deadline" || event.eventType === "campaign_deadline") && parseDate(event.startDate)! >= referenceDate && (!nextCompetition || parseDate(event.startDate)! <= parseDate(nextCompetition.startDate)!)).sort((left, right) => (left.startDate ?? "").localeCompare(right.startDate ?? ""))[0] ?? null;
  return entryDeadline ?? nextCompetition;
}

function readinessPeriodStart(timelineStart: Date, milestone: Awaited<ReturnType<typeof ensureTimelineCalendar>>[number] | null, calendar: Awaited<ReturnType<typeof ensureTimelineCalendar>>, strategy: TimelineStrategy) {
  if (!milestone?.startDate) return timelineStart;
  const prior = calendar.filter((event) => !event.isTbd && event.startDate && (COMPETITION_EVENT_TYPES as readonly string[]).includes(event.eventType) && isApplicable(event, strategy) && parseDate(event.startDate)! < parseDate(milestone.startDate)!).sort((left, right) => (right.startDate ?? "").localeCompare(left.startDate ?? ""))[0];
  const afterPrior = prior?.endDate ?? prior?.startDate;
  return afterPrior ? new Date(Math.max(timelineStart.getTime(), addDays(parseDate(afterPrior)!, 1).getTime())) : timelineStart;
}

function readinessTargets(eventType: CompetitionEventType | null, intensity: TrainingIntensity, daysRemaining: number) {
  const index = eventType === "icdc_conference" ? 2 : eventType === "state_conference" ? 1 : 0;
  const baseQuestions = { essential: [50, 70, 90], competitive: [100, 140, 180], all_in: [180, 240, 300] }[intensity][index];
  const basePis = { essential: [2, 3, 4], competitive: [4, 5, 6], all_in: [6, 8, 10] }[intensity][index];
  const weeklyQuestions = TRAINING_INTENSITY_PROFILES[intensity].practiceQuestions;
  return { practiceQuestions: Math.min(baseQuestions, Math.max(15, weeklyQuestions * Math.max(1, Math.ceil(daysRemaining / 7)))), masteredPis: basePis };
}

export function calculateCompetitionReadinessScore(input: { accuracyPercent: number; practicePercent: number; piPercent: number; roadmapPercent: number }) {
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  return Math.round((clamp(input.accuracyPercent) * 0.35) + (clamp(input.practicePercent) * 0.30) + (clamp(input.piPercent) * 0.20) + (clamp(input.roadmapPercent) * 0.15));
}

function readinessFromProgress(input: { progress: Awaited<ReturnType<typeof getProgressContext>>; items: Array<{ status: string; dueDate?: string | null }>; milestone: Awaited<ReturnType<typeof ensureTimelineCalendar>>[number] | null; periodStart: Date; intensity: TrainingIntensity; now: Date }) {
  const eventType = input.milestone?.eventType as CompetitionEventType | undefined;
  if (!input.milestone?.startDate || !eventType) return { score: 0, level: "No scheduled competition", milestone: null, periodStart: isoDate(input.periodStart), daysRemaining: null, factors: [] as ReadinessFactor[] };
  const milestoneDate = parseDate(input.milestone.startDate)!;
  const daysRemaining = daysBetween(input.now, milestoneDate);
  const targets = readinessTargets(eventType, input.intensity, daysRemaining);
  const scopedItems = input.items.filter((item) => item.dueDate && parseDate(item.dueDate)! >= input.periodStart && parseDate(item.dueDate)! <= milestoneDate);
  const completionPercent = scopedItems.length ? Math.round((scopedItems.filter((item) => item.status === "completed").length / scopedItems.length) * 100) : 0;
  const accuracyPercent = Math.round(input.progress.accuracyPercent);
  const practicePercent = Math.min(100, Math.round((input.progress.practiceQuestionCount / targets.practiceQuestions) * 100));
  const piPercent = Math.min(100, Math.round((input.progress.masteredPiCount / Math.min(targets.masteredPis, Math.max(1, input.progress.availablePiCount))) * 100));
  const score = calculateCompetitionReadinessScore({ accuracyPercent, practicePercent, piPercent, roadmapPercent: completionPercent });
  const level = score >= 85 ? "Competition ready" : score >= 70 ? "Building confidence" : score >= 50 ? "Developing" : "Foundation needed";
  return { score, level, milestone: { title: input.milestone.title, eventType: input.milestone.eventType, startDate: input.milestone.startDate, endDate: input.milestone.endDate }, periodStart: isoDate(input.periodStart), daysRemaining, factors: [
    { key: "accuracy", label: "Event-cluster accuracy", value: accuracyPercent, target: 100, unit: "%", weight: 35, detail: `${input.progress.correctAnswers} correct out of ${input.progress.questionsAnswered} recorded ${input.progress.eventCluster ?? "event"} questions in this milestone period.` },
    { key: "practice", label: "Focused practice volume", value: input.progress.practiceQuestionCount, target: targets.practiceQuestions, unit: "questions", weight: 30, detail: `${input.progress.practiceQuestionCount} of ${targets.practiceQuestions} recommended questions for this ${input.intensity.replace("_", " ")} plan.` },
    { key: "pi", label: "Event PI mastery", value: input.progress.masteredPiCount, target: Math.min(targets.masteredPis, Math.max(1, input.progress.availablePiCount)), unit: "PIs", weight: 20, detail: `${input.progress.masteredPiCount} event-relevant PIs at 80% mastery or higher.` },
    { key: "roadmap", label: "Milestone roadmap completion", value: completionPercent, target: 100, unit: "%", weight: 15, detail: `${scopedItems.filter((item) => item.status === "completed").length} of ${scopedItems.length} planned tasks through this competition milestone are complete.` },
  ] };
}

function taskDate(target: Date, daysBefore: number, start: Date) {
  const planned = addDays(target, -daysBefore);
  return isoDate(planned < start ? addDays(start, 1) : planned);
}

function generatedTasks(strategy: TimelineStrategy, eventCode: string, start: Date, deadlines: Awaited<ReturnType<typeof ensureTimelineCalendar>>, progress: Awaited<ReturnType<typeof getProgressContext>>, referenceDate = new Date()) {
  const planningStart = start > referenceDate ? start : referenceDate;
  const strategyDeadlines = deadlines.filter((event) => !event.isTbd && event.startDate && isApplicable(event, strategy));
  const targetMilestone = planningTarget(deadlines, strategy, referenceDate);
  const mock = strategyDeadlines.find((event) => event.eventType === "mock_competition" && parseDate(event.startDate!)! >= referenceDate);
  const target = parseDate(targetMilestone?.startDate) ?? addDays(planningStart, 42);
  const daysRemaining = daysBetween(planningStart, target);
  const mode: "gradual" | "accelerated" | "emergency" = daysRemaining <= 35 ? "emergency" : daysRemaining <= 75 ? "accelerated" : "gradual";
  const cluster = clusterForEvent(eventCode);
  const practiceLink = `/practice?cluster=${encodeURIComponent(cluster)}`;
  const piLink = `/pi-quizlet?event=${encodeURIComponent(eventCode)}`;
  const piTarget = mode === "gradual" ? 4 : 3;
  const practiceTarget = mode === "gradual" ? 30 : 20;
  const weakReason = progress.weakArea ? `Your practice history identifies ${progress.weakArea} as an area to reinforce.` : "This establishes the event knowledge base needed for the next phase.";
  const common: TimelineTask[] = [
    { title: `Master ${piTarget} event PI modules`, description: `Complete priority performance indicators for ${eventCode} and reach the mastery threshold.`, dueDate: taskDate(target, mode === "gradual" ? 50 : 21, planningStart), priority: "high", estimatedMinutes: 45, deepLink: piLink, generatedReason: weakReason, itemType: "pi_learning", completionMetric: "pi_mastery", completionTarget: piTarget, completionBaseline: progress.masteredPiCount, successCriteria: `${piTarget} additional PI modules reach at least 80% mastery.` },
    { title: `Complete ${practiceTarget} focused ${cluster} questions`, description: `Practice your event cluster, then review every incorrect answer before continuing.`, dueDate: taskDate(target, mode === "gradual" ? 35 : 14, planningStart), priority: "high", estimatedMinutes: 35, deepLink: practiceLink, generatedReason: progress.accuracyPercent < 75 ? `Your recorded accuracy is ${progress.accuracyPercent.toFixed(1)}%, so targeted practice is a high-value next step.` : "Use timed practice to retain event knowledge.", itemType: "practice_questions", completionMetric: "practice_questions", completionTarget: practiceTarget, completionBaseline: progress.practiceQuestionCount, successCriteria: `${practiceTarget} additional answered questions in Blue Blazer.` },
  ];
  const strategyTasks: TimelineTask[] = strategy === "written" ? [
    { title: "Choose project scope and rubric path", description: "Confirm the project, review the rubric, and define evidence you need to collect.", dueDate: taskDate(target, 42, planningStart), priority: "critical", estimatedMinutes: 50, deepLink: "/project-workspace", generatedReason: "Written events require a defined project and rubric plan before drafting.", itemType: "written_project", successCriteria: "Project scope, requirements, and research plan documented." },
    { title: "Complete research and source collection", description: "Collect market, competitor, and supporting evidence before drafting the written submission.", dueDate: taskDate(target, 30, planningStart), priority: "critical", estimatedMinutes: 70, deepLink: "/project-workspace", generatedReason: "Evidence collection needs to finish before the first full written draft can be built.", itemType: "written_project", successCriteria: "Required research evidence and sources gathered." },
    { title: "Draft executive summary and market analysis", description: "Create a complete first-pass executive summary and target-market analysis.", dueDate: taskDate(target, 21, planningStart), priority: "critical", estimatedMinutes: 70, deepLink: "/project-workspace", generatedReason: "A full draft must exist at least 14 days before the submission deadline.", itemType: "written_project", successCriteria: "Executive summary and market analysis have a complete first draft." },
    { title: "Complete financial or implementation plan", description: "Document the calculations, resources, implementation steps, and evaluation method required for your project.", dueDate: taskDate(target, 12, planningStart), priority: "critical", estimatedMinutes: 60, deepLink: "/project-workspace", generatedReason: "A written plan is only competition-ready once recommendations are supported by an executable plan.", itemType: "written_project", successCriteria: "Required financials or implementation plan is complete." },
    { title: "Rubric audit and final formatting", description: "Check evidence, page requirements, formatting, and every scoring criterion.", dueDate: taskDate(target, 3, planningStart), priority: "critical", estimatedMinutes: 45, deepLink: "/project-workspace", generatedReason: "Hard deadlines do not move; final quality control belongs immediately before submission.", itemType: "review", successCriteria: "Every rubric item, format requirement, and submission file is verified." },
  ] : strategy === "pitch" ? [
    { title: "Define the problem, solution, and target customer", description: "Write the story that anchors your pitch deck and validate each assumption.", dueDate: taskDate(target, 42, start), priority: "critical", estimatedMinutes: 50, deepLink: "/project-workspace", generatedReason: "Pitch events need a clear problem-solution story before slides are built.", itemType: "pitch_deck", successCriteria: "Problem, solution, and target customer are clearly defined." },
    { title: "Build the first pitch deck", description: "Create a complete deck with market, model, financial, and implementation slides.", dueDate: taskDate(target, 21, start), priority: "critical", estimatedMinutes: 75, deepLink: "/project-workspace", generatedReason: "A complete first deck is required early enough to practice and improve visual storytelling.", itemType: "pitch_deck", successCriteria: "Pitch deck includes the required story, market, model, and financial slides." },
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

export async function getOrGenerateTimeline(user: TimelineUser, requestedStartDate?: string, requestedIntensity?: TrainingIntensity) {
  const database = await db.getDb();
  const schoolCode = effectiveSchoolCode(user);
  if (!database || !schoolCode) throw new Error("A school code is required to build a competition timeline.");
  const [account] = await database.select({ primaryEventCode: users.primaryEventCode, eventSelectedAt: users.eventSelectedAt }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!account?.primaryEventCode) return { timeline: null, calendar: await ensureTimelineCalendar(schoolCode), preview: null, requiresStartDate: false };
  const calendar = await ensureTimelineCalendar(schoolCode);
  const eventCode = account.primaryEventCode;
  const strategy = getTimelineStrategy(eventCode);
  const latestCalendarEdit = calendar.reduce<Date | null>((latest, event) => !latest || event.updatedAt > latest ? event.updatedAt : latest, null);
  let [timeline] = await database.select().from(userEventTimelines).where(and(eq(userEventTimelines.userId, user.id), eq(userEventTimelines.eventCode, eventCode), eq(userEventTimelines.status, "active"))).orderBy(desc(userEventTimelines.updatedAt)).limit(1);
  if (!timeline && !requestedStartDate) return { timeline: null, calendar, preview: null, requiresStartDate: true, eventCode };
  const requestedStart = requestedStartDate ? parseDate(requestedStartDate) : null;
  if (requestedStartDate && (!requestedStart || requestedStart > addDays(new Date(), 1))) throw new Error("Choose today or an earlier preparation start date.");
  const start = timeline ? parseDate(timeline.startDate)! : requestedStart ?? account.eventSelectedAt ?? new Date();
  const [measuredTask] = timeline ? await database.select({ id: timelineItems.id }).from(timelineItems)
    .where(and(eq(timelineItems.timelineId, timeline.id), ne(timelineItems.completionMetric, "manual")))
    .limit(1) : [];
  const [weeklyTask] = timeline ? await database.select({ id: timelineItems.id }).from(timelineItems)
    .where(and(eq(timelineItems.timelineId, timeline.id), sql`${timelineItems.weekStartDate} is not null`))
    .limit(1) : [];
  const nextCompetition = competitionMilestones(calendar, strategy, new Date())[0] ?? null;
  const activePlanningTarget = planningTarget(calendar, strategy, new Date());
  const stale = Boolean(timeline && ((latestCalendarEdit && timeline.updatedAt < latestCalendarEdit) || !measuredTask || !weeklyTask || (activePlanningTarget?.startDate && timeline.targetDate !== activePlanningTarget.startDate)));
  if (!timeline || stale) {
    if (timeline) await database.delete(timelineItems).where(and(eq(timelineItems.timelineId, timeline.id), ne(timelineItems.status, "completed")));
    const intensity = timeline?.trainingIntensity ?? requestedIntensity ?? "competitive";
    const milestonePeriodStart = readinessPeriodStart(start, nextCompetition, calendar, strategy);
    const progress = await getProgressContext(user.id, schoolCode, eventCode, milestonePeriodStart);
    const baseGeneration = generatedTasks(strategy, eventCode, start, calendar, progress, new Date());
    const anchors = calendar.filter((event) => !event.isTbd && event.startDate && (event.hardDeadline || event.eventType === "mock_competition") && (!event.applicableEventTypes || event.applicableEventTypes.includes(strategy))).map((event) => ({ date: parseDate(event.startDate!)!, title: event.title }));
    const weeklyGeneration = buildAdaptiveWeeklyRoadmap({ strategy, eventCode, cluster: baseGeneration.cluster, timelineStart: start, generationStart: timeline ? weekStart(new Date()) : undefined, targetDate: parseDate(baseGeneration.targetDate) ?? addDays(start, 42), intensity, progress, anchors });
    const generation = { ...baseGeneration, tasks: weeklyGeneration.tasks, currentWeekTitle: weeklyGeneration.currentWeekTitle, intensity };
    const readinessScore = 0;
    if (!timeline) {
      const created = await database.insert(userEventTimelines).values({ userId: user.id, eventCode, schoolCode, competitionYear: CURRENT_COMPETITION_YEAR, startDate: isoDate(start), targetDate: generation.targetDate, timelineMode: generation.mode, trainingIntensity: generation.intensity, status: "active", readinessScore, currentPhase: generation.currentWeekTitle });
      const timelineId = Number(created[0].insertId);
      timeline = (await database.select().from(userEventTimelines).where(eq(userEventTimelines.id, timelineId)).limit(1))[0];
    } else {
      await database.update(userEventTimelines).set({ targetDate: generation.targetDate, timelineMode: generation.mode, trainingIntensity: generation.intensity, readinessScore, currentPhase: generation.currentWeekTitle, updatedAt: new Date() }).where(eq(userEventTimelines.id, timeline.id));
      timeline = (await database.select().from(userEventTimelines).where(eq(userEventTimelines.id, timeline.id)).limit(1))[0];
    }
    await database.insert(timelineItems).values(generation.tasks.map((task, index) => ({ timelineId: timeline!.id, title: task.title, description: task.description, itemType: task.itemType, dueDate: task.dueDate, weekStartDate: task.weekStartDate, weekTitle: task.weekTitle, priority: task.priority, status: "upcoming" as const, estimatedMinutes: task.estimatedMinutes, deepLink: task.deepLink, completionMetric: task.completionMetric ?? "manual", completionTarget: task.completionTarget ?? 0, completionBaseline: task.completionBaseline ?? 0, successCriteria: task.successCriteria ?? null, hardDeadline: false, generatedReason: task.generatedReason, sortOrder: index })));
  }
  const milestonePeriodStart = readinessPeriodStart(start, nextCompetition, calendar, strategy);
  let [items, progress] = await Promise.all([
    database.select().from(timelineItems).where(eq(timelineItems.timelineId, timeline.id)).orderBy(asc(timelineItems.dueDate), asc(timelineItems.sortOrder)),
    getProgressContext(user.id, schoolCode, eventCode, milestonePeriodStart),
  ]);
  const automaticallyCompleted = items.filter((item) => item.status !== "completed" && item.completionMetric !== "manual" && item.completionTarget > 0 && Math.max(0, progressValueForMetric(item.completionMetric, progress) - item.completionBaseline) >= item.completionTarget);
  if (automaticallyCompleted.length) {
    await Promise.all(automaticallyCompleted.map((item) => database.update(timelineItems).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(timelineItems.id, item.id))));
    items = await database.select().from(timelineItems).where(eq(timelineItems.timelineId, timeline.id)).orderBy(asc(timelineItems.dueDate), asc(timelineItems.sortOrder));
  }
  const readiness = readinessFromProgress({ progress, items, milestone: nextCompetition, periodStart: milestonePeriodStart, intensity: timeline.trainingIntensity as TrainingIntensity, now: new Date() });
  if (timeline.readinessScore !== readiness.score) {
    await database.update(userEventTimelines).set({ readinessScore: readiness.score, updatedAt: new Date() }).where(eq(userEventTimelines.id, timeline.id));
    timeline = { ...timeline, readinessScore: readiness.score };
  }
  const enrichedItems = items.map((item) => {
    const completedValue = item.completionMetric === "manual" ? 0 : Math.max(0, progressValueForMetric(item.completionMetric, progress) - item.completionBaseline);
    return { ...item, completedValue, completionPercent: item.completionTarget > 0 ? Math.min(100, Math.round((completedValue / item.completionTarget) * 100)) : null };
  });
  const completed = enrichedItems.filter((item) => item.status === "completed").length;
  const now = new Date();
  const nextTask = enrichedItems.find((item) => item.status !== "completed" && (!item.dueDate || parseDate(item.dueDate)! >= now)) ?? enrichedItems.find((item) => item.status !== "completed") ?? null;
  const thisWeekStart = toIsoDate(weekStart(now));
  const thisWeekItems = enrichedItems.filter((item) => item.weekStartDate === thisWeekStart);
  const weeklyProgressPercent = thisWeekItems.length ? Math.round((thisWeekItems.filter((item) => item.status === "completed").length / thisWeekItems.length) * 100) : 0;
  const intensityProfile = TRAINING_INTENSITY_PROFILES[timeline.trainingIntensity as TrainingIntensity];
  return { timeline: { ...timeline, strategy, strategyLabel: strategyLabel(strategy), daysRemaining: daysBetween(now, parseDate(timeline.targetDate) ?? now), progressPercent: enrichedItems.length ? Math.round((completed / enrichedItems.length) * 100) : 0, readinessScore: readiness.score, readiness, nextCompetition: readiness.milestone, progressContext: progress, nextTask, thisWeekStart, thisWeekItems, weeklyProgressPercent, intensityProfile }, items: enrichedItems, calendar, preview: { eventCode, currentPhase: timeline.currentPhase, readinessScore: readiness.score, readiness, nextCompetition: readiness.milestone, nextTask, daysRemaining: readiness.daysRemaining, thisWeekItems, weeklyProgressPercent, trainingIntensity: timeline.trainingIntensity } };
}

/** Changes only unfinished work in upcoming weeks; current and historical progress remain intact. */
export async function updateTimelineTrainingIntensity(user: TimelineUser, intensity: TrainingIntensity) {
  const database = await db.getDb();
  if (!database) throw new Error("Timeline storage is unavailable");
  const schoolCode = effectiveSchoolCode(user);
  if (!schoolCode) throw new Error("A school code is required to update training intensity.");
  const [account] = await database.select({ primaryEventCode: users.primaryEventCode }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!account?.primaryEventCode) throw new Error("Select a DECA event before changing your training intensity.");
  const eventCode = account.primaryEventCode;
  const [timeline] = await database.select().from(userEventTimelines).where(and(eq(userEventTimelines.userId, user.id), eq(userEventTimelines.eventCode, eventCode), eq(userEventTimelines.status, "active"))).orderBy(desc(userEventTimelines.updatedAt)).limit(1);
  if (!timeline) throw new Error("Create a roadmap before changing its training intensity.");
  const nextWeek = addDays(weekStart(new Date()), 7);
  await database.delete(timelineItems).where(and(eq(timelineItems.timelineId, timeline.id), ne(timelineItems.status, "completed"), gt(timelineItems.weekStartDate, toIsoDate(weekStart(new Date())))));
  const strategy = getTimelineStrategy(eventCode);
  const calendar = await ensureTimelineCalendar(schoolCode);
  const nextCompetition = competitionMilestones(calendar, strategy, new Date())[0] ?? null;
  const milestonePeriodStart = readinessPeriodStart(parseDate(timeline.startDate) ?? new Date(), nextCompetition, calendar, strategy);
  const progress = await getProgressContext(user.id, schoolCode, eventCode, milestonePeriodStart);
  const baseGeneration = generatedTasks(strategy, eventCode, parseDate(timeline.startDate) ?? new Date(), calendar, progress, new Date());
  const anchors = calendar.filter((event) => !event.isTbd && event.startDate && (event.hardDeadline || event.eventType === "mock_competition") && (!event.applicableEventTypes || event.applicableEventTypes.includes(strategy))).map((event) => ({ date: parseDate(event.startDate!)!, title: event.title }));
  const weeklyGeneration = buildAdaptiveWeeklyRoadmap({ strategy, eventCode, cluster: baseGeneration.cluster, timelineStart: parseDate(timeline.startDate) ?? new Date(), generationStart: nextWeek, targetDate: parseDate(baseGeneration.targetDate) ?? parseDate(timeline.targetDate) ?? addDays(nextWeek, 42), intensity, progress, anchors });
  const existing = await database.select({ count: sql<number>`count(*)` }).from(timelineItems).where(eq(timelineItems.timelineId, timeline.id));
  await database.insert(timelineItems).values(weeklyGeneration.tasks.map((task, index) => ({ timelineId: timeline.id, title: task.title, description: task.description, itemType: task.itemType, dueDate: task.dueDate, weekStartDate: task.weekStartDate, weekTitle: task.weekTitle, priority: task.priority, status: "upcoming" as const, estimatedMinutes: task.estimatedMinutes, deepLink: task.deepLink, completionMetric: task.completionMetric ?? "manual", completionTarget: task.completionTarget ?? 0, completionBaseline: task.completionBaseline ?? 0, successCriteria: task.successCriteria ?? null, hardDeadline: false, generatedReason: task.generatedReason, sortOrder: Number(existing[0]?.count ?? 0) + index })));
  await database.update(userEventTimelines).set({ trainingIntensity: intensity, targetDate: baseGeneration.targetDate, currentPhase: weeklyGeneration.currentWeekTitle, updatedAt: new Date() }).where(eq(userEventTimelines.id, timeline.id));
  return { success: true, intensity, nextWeekStart: toIsoDate(nextWeek) };
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
