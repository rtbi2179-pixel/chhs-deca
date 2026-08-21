import { describe, expect, it } from "vitest";
import { getOnboardingWalkthroughSteps } from "../client/src/lib/onboardingWalkthrough";

describe("expanded Blue Blazer onboarding walkthrough", () => {
  it("organizes every member-facing Practice, Chapter, and Blue Bucks tool into the three tour parts", () => {
    const memberSteps = getOnboardingWalkthroughSteps({ role: "user", email: "member@example.com" });
    expect(memberSteps).toHaveLength(21);
    expect(memberSteps.map((step) => step.tabLabel)).toEqual([
      "Overview",
      "Events & Event Finder",
      "PI Study Library",
      "Practice",
      "Mock Exams",
      "Project Workspace",
      "AI Study & Roleplay",
      "My Timeline",
      "Profile & Settings",
      "Direct Messages",
      "Calendar",
      "Announcements",
      "Discussion Posts",
      "Volunteer Sign-Ups",
      "Feedback",
      "My Portfolio",
      "Blue Bucks",
      "Banking & Cards",
      "Blue’s News",
      "Stock Market (BBX)",
      "Leaderboard",
    ]);
    expect([...new Set(memberSteps.map((step) => step.part))]).toEqual(["MAIN PRACTICE TOOLS", "CHAPTER TOOLS", "BLUE BUCKS"]);
  });

  it("explains Blue Bucks earning, automatic checking credit, Blue's News rewards, and Investment Account BBX buying power", () => {
    const memberSteps = getOnboardingWalkthroughSteps({ role: "user", email: "member@example.com" });
    const blueBucks = memberSteps.find((step) => step.tabLabel === "Blue Bucks");
    const banking = memberSteps.find((step) => step.tabLabel === "Banking & Cards");
    const news = memberSteps.find((step) => step.tabLabel === "Blue’s News");
    const market = memberSteps.find((step) => step.tabLabel === "Stock Market (BBX)");
    const leaderboard = memberSteps.find((step) => step.tabLabel === "Leaderboard");
    expect(blueBucks?.body).toContain("once");
    expect(blueBucks?.body).toContain("no cash value");
    expect(banking?.body).toContain("credit Checking automatically");
    expect(banking?.body).toContain("7% monthly simulation return");
    expect(news?.body).toContain("Blue Bucks reward");
    expect(market?.body).toContain("Investment Account");
    expect(leaderboard?.body).toContain("Checking + Savings + Investment");
  });

  it("adds management and diagnostics only to the roles that can access those protected workspaces", () => {
    const memberLabels = getOnboardingWalkthroughSteps({ role: "user", email: "member@example.com" }).map((step) => step.tabLabel);
    const adminLabels = getOnboardingWalkthroughSteps({ role: "admin", email: "admin@example.com" }).map((step) => step.tabLabel);
    const designatedSuperAdminLabels = getOnboardingWalkthroughSteps({ role: "super_admin", email: "sahan.mallampati@gmail.com" }).map((step) => step.tabLabel);

    expect(memberLabels).not.toContain("Member Management");
    expect(memberLabels).not.toContain("Chapter Diagnostics");

    expect(adminLabels).toEqual(expect.arrayContaining(["Member Management", "Chapter Management"]));
    expect(adminLabels).not.toContain("Chapter Diagnostics");

    expect(designatedSuperAdminLabels).toEqual(expect.arrayContaining(["Member Management", "Chapter Management", "Chapter Diagnostics"]));
  });
});
