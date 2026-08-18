import { describe, expect, it } from "vitest";
import { ONBOARDING_WALKTHROUGH_STEPS } from "../client/src/lib/onboardingWalkthrough";

describe("expanded Blue Blazer onboarding walkthrough", () => {
  it("organizes the current product into Main Practice Tools, Chapter Tools, and Blue Bucks", () => {
    expect(ONBOARDING_WALKTHROUGH_STEPS).toHaveLength(7);
    expect(ONBOARDING_WALKTHROUGH_STEPS.map((step) => step.tabLabel)).toEqual([
      "Home",
      "PI Study Library",
      "Practice",
      "Events & Community",
      "Chapter",
      "Blue Bucks",
      "Mock Exams & Progress",
    ]);
    expect([...new Set(ONBOARDING_WALKTHROUGH_STEPS.map((step) => step.part))]).toEqual(["MAIN PRACTICE TOOLS", "CHAPTER TOOLS", "BLUE BUCKS"]);
  });

  it("explains Blue Bucks as a virtual, one-reward-per-question feature with no cash value", () => {
    const blueBucks = ONBOARDING_WALKTHROUGH_STEPS.find((step) => step.tabLabel === "Blue Bucks");
    expect(blueBucks?.body).toContain("each question can reward you only once");
    expect(blueBucks?.body).toContain("no cash value");
  });
});
