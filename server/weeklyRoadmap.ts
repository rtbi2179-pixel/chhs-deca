import type { TimelineStrategy } from "../shared/timelineRequirements";

export const TRAINING_INTENSITIES = ["essential", "competitive", "all_in"] as const;
export type TrainingIntensity = (typeof TRAINING_INTENSITIES)[number];

export const TRAINING_INTENSITY_PROFILES: Record<TrainingIntensity, { label: string; weeklyHours: string; typicalTasks: string; piModules: number; practiceQuestions: number; roleplays: number; includeSimulation: boolean }> = {
  essential: { label: "Essential", weeklyHours: "1–2 hrs/week", typicalTasks: "2–3 major tasks", piModules: 2, practiceQuestions: 25, roleplays: 1, includeSimulation: false },
  competitive: { label: "Competitive", weeklyHours: "2–4 hrs/week", typicalTasks: "4–5 major tasks", piModules: 4, practiceQuestions: 50, roleplays: 2, includeSimulation: false },
  all_in: { label: "All-In", weeklyHours: "4–7+ hrs/week", typicalTasks: "5–7 major tasks", piModules: 6, practiceQuestions: 90, roleplays: 3, includeSimulation: true },
};

export type WeeklyRoadmapTask = {
  title: string;
  description: string;
  dueDate: string;
  weekStartDate: string;
  weekTitle: string;
  priority: "low" | "normal" | "high" | "critical";
  estimatedMinutes: number;
  deepLink: string;
  generatedReason: string;
  itemType: "pi_learning" | "practice_questions" | "practice_exam" | "roleplay" | "written_project" | "pitch_deck" | "presentation" | "review" | "mock_competition" | "testing" | "conference" | "meeting" | "deadline" | "general";
  completionMetric?: "manual" | "pi_mastery" | "practice_questions";
  completionTarget?: number;
  completionBaseline?: number;
  successCriteria?: string;
};

export type WeeklyRoadmapProgress = { masteredPiCount: number; practiceQuestionCount: number; accuracyPercent: number; weakArea: string | null };

function atNoon(value: Date) {
  const copy = new Date(value);
  copy.setUTCHours(12, 0, 0, 0);
  return copy;
}

export function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function weekStart(value: Date) {
  const date = atNoon(value);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date;
}

function addDays(value: Date, days: number) {
  const copy = new Date(value);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

function phaseForWeek(strategy: TimelineStrategy, daysUntilTarget: number, index: number) {
  if (daysUntilTarget <= 7) return "Final Competition Readiness";
  if (daysUntilTarget <= 14) return "Full Simulation + Final Polish";
  if (daysUntilTarget <= 28) return strategy === "written" || strategy === "pitch" ? "Rubric Audit + Revision" : "Timed Practice + Weakness Correction";
  if (daysUntilTarget <= 49) return strategy === "written" || strategy === "pitch" ? "Draft Development" : "Roleplay Development";
  const early = ["Foundation + Diagnostic", "Core PI Mastery", "Knowledge Development", "Begin Applied Practice"];
  return early[Math.min(index, early.length - 1)];
}

function strategyTask(strategy: TimelineStrategy, eventCode: string, index: number, profile: (typeof TRAINING_INTENSITY_PROFILES)[TrainingIntensity], week: string, dueDate: string, phase: string): WeeklyRoadmapTask {
  const common = { dueDate, weekStartDate: week, weekTitle: phase, priority: phase.includes("Final") ? "critical" as const : "high" as const, estimatedMinutes: profile.includeSimulation ? 45 : 35, generatedReason: `This ${phase.toLowerCase()} block is scheduled backward from your next fixed competition anchor.` };
  if (strategy === "written") {
    const stages = [
      ["Define project scope and rubric requirements", "Document the project goal, audience, required sections, and evidence plan."],
      ["Build research and evidence bank", "Collect credible market, competitor, and project evidence before drafting."],
      ["Draft priority written sections", "Produce a complete draft section and connect every recommendation to evidence."],
      ["Run a rubric audit and revision", "Check every required criterion, formatting rule, and support claim before the next milestone."],
    ] as const;
    const [title, description] = stages[index % stages.length];
    return { ...common, title, description, deepLink: "/project-workspace", itemType: "written_project", successCriteria: "The named written-event deliverable is complete and ready for rubric review." };
  }
  if (strategy === "pitch") {
    const stages = [
      ["Refine your problem, solution, and customer story", "Tighten the narrative that connects the customer need, innovation, and business value."],
      ["Build or revise the pitch deck", "Create a focused deck section supported by customer, market, model, or financial evidence."],
      ["Practice the timed pitch and judge questions", "Deliver a timed run and record improvements for clarity, evidence, and question handling."],
    ] as const;
    const [title, description] = stages[index % stages.length];
    return { ...common, title, description, deepLink: "/project-workspace", itemType: "pitch_deck", successCriteria: "The planned pitch-deck or delivery milestone is complete." };
  }
  if (strategy === "simulation") return { ...common, title: "Run a deliberate simulation decision review", description: "Make decisions using a written strategy, then identify one adjustment from the results.", deepLink: "/market", itemType: "review", successCriteria: "A simulation decision and its reflection are documented." };
  if (strategy === "prepared") return { ...common, title: `Complete ${profile.roleplays} prepared presentation rehearsal${profile.roleplays === 1 ? "" : "s"}`, description: "Practice structured delivery, objections, and judge responses under the event timing.", deepLink: "/ai/roleplay", itemType: "presentation", successCriteria: `${profile.roleplays} prepared presentation rehearsal${profile.roleplays === 1 ? "" : "s"} completed.` };
  return { ...common, title: `Complete ${profile.roleplays} ${eventCode} roleplay simulation${profile.roleplays === 1 ? "" : "s"}`, description: "Practice PI-driven business recommendations, then identify one delivery and one content improvement.", deepLink: "/ai/roleplay", itemType: "roleplay", successCriteria: `${profile.roleplays} roleplay simulation${profile.roleplays === 1 ? "" : "s"} completed and reviewed.` };
}

/**
 * Creates student work blocks; fixed dates remain external calendar anchors.
 * Current performance is captured as the baseline so automated goals remain measurable.
 */
export function buildAdaptiveWeeklyRoadmap(input: { strategy: TimelineStrategy; eventCode: string; cluster: string; timelineStart: Date; generationStart?: Date; targetDate: Date; intensity: TrainingIntensity; progress: WeeklyRoadmapProgress; anchors?: Array<{ date: Date; title: string }> }) {
  const profile = TRAINING_INTENSITY_PROFILES[input.intensity];
  const firstWeek = weekStart(input.generationStart && input.generationStart > input.timelineStart ? input.generationStart : input.timelineStart);
  const targetWeek = weekStart(input.targetDate);
  const tasks: WeeklyRoadmapTask[] = [];
  let cursor = firstWeek;
  let generatedWeek = 0;
  while (cursor <= targetWeek && generatedWeek < 32) {
    const due = new Date(Math.min(addDays(cursor, 6).getTime(), input.targetDate.getTime()));
    const dueDate = toIsoDate(due);
    const startDate = toIsoDate(cursor);
    const nextAnchor = input.anchors?.filter((anchor) => anchor.date >= cursor).sort((left, right) => left.date.getTime() - right.date.getTime())[0];
    const planningAnchor = nextAnchor?.date ?? input.targetDate;
    const daysUntilTarget = daysBetween(cursor, planningAnchor);
    const absoluteIndex = Math.floor(daysBetween(weekStart(input.timelineStart), cursor) / 7);
    const phase = phaseForWeek(input.strategy, daysUntilTarget, absoluteIndex);
    const anchorReason = `This week works backward from ${nextAnchor?.title ?? "your next fixed competition anchor"}.`;
    const reason = input.progress.weakArea ? `${input.progress.weakArea} is the weakest recorded instructional area, so this week balances repair with event preparation. ${anchorReason}` : `This work advances your ${input.eventCode} preparation. ${anchorReason}`;
    tasks.push({ title: `Master ${profile.piModules} assigned event PI module${profile.piModules === 1 ? "" : "s"}`, description: `Focus on event-relevant indicators and reach the mastery threshold before this training block closes.`, dueDate, weekStartDate: startDate, weekTitle: phase, priority: "high", estimatedMinutes: 15 * profile.piModules, deepLink: `/pi-quizlet?event=${encodeURIComponent(input.eventCode)}`, generatedReason: reason, itemType: "pi_learning", completionMetric: "pi_mastery", completionTarget: profile.piModules, completionBaseline: input.progress.masteredPiCount + generatedWeek * profile.piModules, successCriteria: `${profile.piModules} additional event PI modules reach at least 80% mastery.` });
    tasks.push({ title: `Complete ${profile.practiceQuestions} focused ${input.cluster} questions`, description: "Practice event-cluster questions in Blue Blazer, then review every incorrect answer before closing the block.", dueDate, weekStartDate: startDate, weekTitle: phase, priority: "high", estimatedMinutes: Math.max(25, Math.round(profile.practiceQuestions * 0.7)), deepLink: `/practice?cluster=${encodeURIComponent(input.cluster)}`, generatedReason: input.progress.accuracyPercent < 75 ? `Your recorded accuracy is ${input.progress.accuracyPercent.toFixed(1)}%, so focused questions are a high-value readiness lever.` : reason, itemType: "practice_questions", completionMetric: "practice_questions", completionTarget: profile.practiceQuestions, completionBaseline: input.progress.practiceQuestionCount + generatedWeek * profile.practiceQuestions, successCriteria: `${profile.practiceQuestions} additional questions answered in Blue Blazer.` });
    tasks.push(strategyTask(input.strategy, input.eventCode, generatedWeek, profile, startDate, dueDate, phase));
    if (input.intensity !== "essential") tasks.push({ title: "Review this week’s mistakes and weak-area pattern", description: "Use Blue Blazer results to identify the one concept or decision pattern that should shape next week’s targeted practice.", dueDate, weekStartDate: startDate, weekTitle: phase, priority: "normal", estimatedMinutes: 20, deepLink: "/practice", generatedReason: "Competitive and All-In plans include a dedicated review loop so practice produces measurable correction, not only repetition.", itemType: "review", successCriteria: "One weakness and one concrete correction are identified from completed practice." });
    if (profile.includeSimulation) tasks.push({ title: "Run a timed Blue Blazer competition simulation", description: "Complete a longer timed practice and document the one mistake pattern to correct next week.", dueDate, weekStartDate: startDate, weekTitle: phase, priority: "normal", estimatedMinutes: 45, deepLink: "/practice", generatedReason: "All-In preparation adds an additional timed simulation without moving fixed competition dates.", itemType: "practice_exam", successCriteria: "Timed practice completed and one improvement priority recorded." });
    cursor = addDays(cursor, 7);
    generatedWeek += 1;
  }
  return { tasks, profile, currentWeekTitle: phaseForWeek(input.strategy, daysBetween(weekStart(new Date()), input.targetDate), Math.floor(daysBetween(weekStart(input.timelineStart), weekStart(new Date())) / 7)) };
}
