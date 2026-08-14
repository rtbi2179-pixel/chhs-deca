import { describe, expect, it } from "vitest";
import { getOnboardingProgress, ONBOARDING_CELEBRATION_DURATION_MS } from "../client/src/lib/onboardingTour";

describe("onboarding progress and celebration", () => {
  it("reports clear, clamped progress through the three tour steps", () => {
    expect(getOnboardingProgress(0)).toEqual({ currentStep: 1, totalSteps: 3, percentage: 33, scale: 1 / 3 });
    expect(getOnboardingProgress(1)).toEqual({ currentStep: 2, totalSteps: 3, percentage: 67, scale: 2 / 3 });
    expect(getOnboardingProgress(2)).toEqual({ currentStep: 3, totalSteps: 3, percentage: 100, scale: 1 });
    expect(getOnboardingProgress(99)).toMatchObject({ currentStep: 3, percentage: 100 });
  });

  it("keeps the completion celebration brief", () => {
    expect(ONBOARDING_CELEBRATION_DURATION_MS).toBeGreaterThanOrEqual(600);
    expect(ONBOARDING_CELEBRATION_DURATION_MS).toBeLessThanOrEqual(1200);
  });
});
