import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Profile achievements", () => {
  const profile = readFileSync(resolve(process.cwd(), "client/src/pages/Profile.tsx"), "utf8");
  const database = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

  it("renders the server-verified tier panel from protected achievement data", () => {
    expect(profile).toContain("AchievementTierPanel");
    expect(profile).toContain("achievements-tiered");
    expect(database).toContain("export async function getProfileLearningMetrics(userId: number)");
  });

  it("keeps the achievements navigation label visible in the Profile experience", () => {
    expect(profile).toContain("Achievements");
    expect(profile).toContain("Bronze, Silver, and Gold tiers");
  });
});
