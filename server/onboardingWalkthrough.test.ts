import { describe, expect, it } from "vitest";
import { ONBOARDING_WALKTHROUGH_STEPS } from "../client/src/lib/onboardingWalkthrough";

describe("expanded Blue Blazer onboarding walkthrough", () => {
  it("organizes every member-facing Practice, Chapter, and Blue Bucks tool into the three tour parts", () => {
    expect(ONBOARDING_WALKTHROUGH_STEPS).toHaveLength(16);
    expect(ONBOARDING_WALKTHROUGH_STEPS.map((step) => step.tabLabel)).toEqual([
      "Overview",
      "PI Study Library",
      "Practice",
      "Mock Exams",
      "Leaderboard",
      "AI Study & Roleplay",
      "Events & Community",
      "Calendar",
      "Announcements",
      "Discussion Posts",
      "Volunteer Sign-Ups",
      "Feedback",
      "Blue Bucks",
      "Banking & Cards",
      "Blue’s News",
      "Stock Market (BBX)",
    ]);
    expect([...new Set(ONBOARDING_WALKTHROUGH_STEPS.map((step) => step.part))]).toEqual(["MAIN PRACTICE TOOLS", "CHAPTER TOOLS", "BLUE BUCKS"]);
  });

  it("explains Blue Bucks earning, automatic checking credit, Blue's News rewards, and Investment Account BBX buying power", () => {
    const blueBucks = ONBOARDING_WALKTHROUGH_STEPS.find((step) => step.tabLabel === "Blue Bucks");
    const banking = ONBOARDING_WALKTHROUGH_STEPS.find((step) => step.tabLabel === "Banking & Cards");
    const news = ONBOARDING_WALKTHROUGH_STEPS.find((step) => step.tabLabel === "Blue’s News");
    const market = ONBOARDING_WALKTHROUGH_STEPS.find((step) => step.tabLabel === "Stock Market (BBX)");
    expect(blueBucks?.body).toContain("once per question");
    expect(blueBucks?.body).toContain("no cash value");
    expect(banking?.body).toContain("Checking balance automatically");
    expect(banking?.body).toContain("7% monthly simulation return");
    expect(news?.body).toContain("Blue Bucks reward");
    expect(market?.body).toContain("Investment Account balance");
  });
});
