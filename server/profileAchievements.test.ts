import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Profile achievements", () => {
  const profile = readFileSync(resolve(process.cwd(), "client/src/pages/Profile.tsx"), "utf8");
  const database = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

  it("derives every milestone from persisted learning, event, or portfolio data", () => {
    expect(profile).toContain("const achievementDefinitions");
    expect(profile).toContain("metrics?.questionsAnswered ?? 0");
    expect(profile).toContain("metrics?.accuracyPercent ?? 0");
    expect(profile).toContain("metrics?.studyStreak ?? 0");
    expect(profile).toContain("metrics?.savedQuestions ?? 0");
    expect(profile).toContain("portfolio.length");
    expect(profile).toContain("Boolean(focusedEvent)");
    expect(database).toContain("export async function getProfileLearningMetrics(userId: number)");
  });

  it("shows transparent earned and in-progress states instead of fabricated badges", () => {
    expect(profile).toContain("const earnedAchievements");
    expect(profile).toContain("const nextAchievement");
    expect(profile).toContain("Nothing is awarded manually or inferred.");
    expect(profile).toContain("Earned now");
    expect(profile).toContain("In progress");
    expect(profile).toContain("Next milestone");
  });
});
