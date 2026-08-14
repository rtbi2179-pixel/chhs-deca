import { describe, expect, it } from "vitest";
import { ONBOARDING_WALKTHROUGH_STEPS } from "../client/src/lib/onboardingWalkthrough";

describe("expanded Blue Blazer onboarding walkthrough", () => {
  it("introduces the primary learning, practice, community, financial, and readiness tabs in a concise sequence", () => {
    expect(ONBOARDING_WALKTHROUGH_STEPS).toHaveLength(6);
    expect(ONBOARDING_WALKTHROUGH_STEPS.map((step) => step.tabLabel)).toEqual([
      "Home",
      "PI Study Library",
      "Practice",
      "Events & Community",
      "Blue Bucks",
      "Mock Exams & Progress",
    ]);
  });

  it("explains Blue Bucks as a virtual, one-reward-per-question feature with no cash value", () => {
    const blueBucks = ONBOARDING_WALKTHROUGH_STEPS.find((step) => step.tabLabel === "Blue Bucks");
    expect(blueBucks?.body).toContain("each question can reward you only once");
    expect(blueBucks?.body).toContain("no cash value");
    expect(blueBucks?.body).toContain("cannot be purchased, withdrawn, or used for real money");
  });
});
