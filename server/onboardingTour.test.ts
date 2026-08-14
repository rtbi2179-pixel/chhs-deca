import { describe, expect, it } from "vitest";
import { getOnboardingProgress, ONBOARDING_CELEBRATION_DURATION_MS, ONBOARDING_SKIP_FADE_DURATION_MS, ONBOARDING_TOUR_ACTIONS } from "../client/src/lib/onboardingTour";

describe("onboarding progress and celebration", () => {
  it("reports clear, clamped progress through the six tour steps", () => {
    expect(getOnboardingProgress(0)).toEqual({ currentStep: 1, totalSteps: 6, percentage: 17, scale: 1 / 6 });
    expect(getOnboardingProgress(2)).toEqual({ currentStep: 3, totalSteps: 6, percentage: 50, scale: 1 / 2 });
    expect(getOnboardingProgress(5)).toEqual({ currentStep: 6, totalSteps: 6, percentage: 100, scale: 1 });
    expect(getOnboardingProgress(99)).toMatchObject({ currentStep: 6, percentage: 100 });
  });

  it("keeps the completion celebration brief", () => {
    expect(ONBOARDING_CELEBRATION_DURATION_MS).toBeGreaterThanOrEqual(600);
    expect(ONBOARDING_CELEBRATION_DURATION_MS).toBeLessThanOrEqual(1200);
  });

  it("keeps the Skip Tour fade-out brief and perceptible", () => {
    expect(ONBOARDING_SKIP_FADE_DURATION_MS).toBeGreaterThanOrEqual(160);
    expect(ONBOARDING_SKIP_FADE_DURATION_MS).toBeLessThanOrEqual(400);
  });

  it("defines a visible early-exit label shared by every onboarding step", () => {
    expect(ONBOARDING_TOUR_ACTIONS.skipLabel).toBe("Skip Tour");
    expect(ONBOARDING_TOUR_ACTIONS.replayLabel).toBe("Replay onboarding tour");
  });
});
