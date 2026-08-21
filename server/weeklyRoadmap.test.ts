import { describe, expect, it } from "vitest";
import { buildAdaptiveWeeklyRoadmap, TRAINING_INTENSITY_PROFILES, weekStart } from "./weeklyRoadmap";

const input = {
  strategy: "roleplay_exam" as const,
  eventCode: "ACT",
  cluster: "Finance",
  timelineStart: new Date("2026-08-20T12:00:00.000Z"),
  targetDate: new Date("2026-10-21T12:00:00.000Z"),
  progress: { masteredPiCount: 2, practiceQuestionCount: 12, accuracyPercent: 68, weakArea: "Pricing" },
};

describe("adaptive weekly DECA roadmap", () => {
  it("changes weekly workload by selected intensity without changing the fixed competition anchor", () => {
    const essential = buildAdaptiveWeeklyRoadmap({ ...input, intensity: "essential" });
    const competitive = buildAdaptiveWeeklyRoadmap({ ...input, intensity: "competitive" });
    const allIn = buildAdaptiveWeeklyRoadmap({ ...input, intensity: "all_in" });
    const firstEssentialQuestions = essential.tasks.find((task) => task.itemType === "practice_questions");
    const firstCompetitiveQuestions = competitive.tasks.find((task) => task.itemType === "practice_questions");
    const firstAllInQuestions = allIn.tasks.find((task) => task.itemType === "practice_questions");

    expect(firstEssentialQuestions?.completionTarget).toBe(25);
    expect(firstCompetitiveQuestions?.completionTarget).toBe(50);
    expect(firstAllInQuestions?.completionTarget).toBe(90);
    expect(essential.tasks.filter((task) => task.weekStartDate === "2026-08-17")).toHaveLength(3);
    expect(competitive.tasks.filter((task) => task.weekStartDate === "2026-08-17")).toHaveLength(4);
    expect(allIn.tasks.filter((task) => task.weekStartDate === "2026-08-17")).toHaveLength(5);
    expect(essential.tasks.at(-1)?.dueDate).toBe("2026-10-21");
    expect(competitive.tasks.at(-1)?.dueDate).toBe("2026-10-21");
    expect(allIn.tasks.at(-1)?.dueDate).toBe("2026-10-21");
    expect(allIn.tasks.some((task) => task.itemType === "practice_exam")).toBe(true);
  });

  it("creates dated weekly blocks with measurable PI and question goals", () => {
    const roadmap = buildAdaptiveWeeklyRoadmap({ ...input, intensity: "competitive", anchors: [{ date: new Date("2026-10-21T12:00:00.000Z"), title: "Mock Competition" }] });
    expect(roadmap.tasks[0]).toMatchObject({ weekStartDate: "2026-08-17", completionMetric: "pi_mastery", completionTarget: 4 });
    expect(roadmap.tasks.some((task) => task.completionMetric === "practice_questions" && task.completionTarget === 50)).toBe(true);
    expect(roadmap.tasks.every((task) => task.weekTitle.length > 0 && task.deepLink.startsWith("/"))).toBe(true);
    expect(roadmap.tasks[0]?.generatedReason).toContain("Mock Competition");
    expect(weekStart(new Date("2026-08-20T12:00:00.000Z")).toISOString().slice(0, 10)).toBe("2026-08-17");
  });

  it("keeps all intensity profiles transparent before selection", () => {
    expect(TRAINING_INTENSITY_PROFILES.essential).toMatchObject({ weeklyHours: "1–2 hrs/week", typicalTasks: "2–3 major tasks" });
    expect(TRAINING_INTENSITY_PROFILES.competitive).toMatchObject({ weeklyHours: "2–4 hrs/week", piModules: 4, practiceQuestions: 50 });
    expect(TRAINING_INTENSITY_PROFILES.all_in).toMatchObject({ weeklyHours: "4–7+ hrs/week", includeSimulation: true });
  });
});
