import { describe, expect, it } from "vitest";
import { getOnboardingProgress, ONBOARDING_CELEBRATION_DURATION_MS, ONBOARDING_SKIP_FADE_DURATION_MS, ONBOARDING_TOUR_ACTIONS } from "../client/src/lib/onboardingTour";
import { ONBOARDING_WALKTHROUGH_STEPS } from "../client/src/lib/onboardingWalkthrough";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("onboarding progress and celebration", () => {
  it("reports clear, clamped progress through the seven tour steps", () => {
    expect(getOnboardingProgress(0, 7)).toEqual({ currentStep: 1, totalSteps: 7, percentage: 14, scale: 1 / 7 });
    expect(getOnboardingProgress(3, 7)).toEqual({ currentStep: 4, totalSteps: 7, percentage: 57, scale: 4 / 7 });
    expect(getOnboardingProgress(6, 7)).toEqual({ currentStep: 7, totalSteps: 7, percentage: 100, scale: 1 });
    expect(getOnboardingProgress(99, 7)).toMatchObject({ currentStep: 7, percentage: 100 });
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

  it("routes each walkthrough step to an interactive destination", () => {
    expect(ONBOARDING_WALKTHROUGH_STEPS.map((step) => step.path)).toEqual(["/", "/pi-quizlet", "/practice", "/events", "/calendar", "/banking", "/chapter-mock-exam"]);
    expect(ONBOARDING_WALKTHROUGH_STEPS.every((step) => step.action.length > 0)).toBe(true);
  });

  it("keeps the tour visible as a non-blocking guide while the active tab is explored", () => {
    const source = readFileSync(join(process.cwd(), "client/src/components/FirstSignInTour.tsx"), "utf8");
    expect(source).toContain("modal={false}");
    expect(source).toContain("allowBackgroundInteraction");
    expect(source).toContain("setLocation(step.path)");
  });

  it("can reopen the tour from the Blue Blazer logo after onboarding is completed", () => {
    const source = readFileSync(join(process.cwd(), "client/src/components/FirstSignInTour.tsx"), "utf8");
    expect(source).toContain("blueblazer:restart-tour");
    expect(source).toContain("setStepIndex(0)");
    expect(source).toContain("(!onboarding?.shouldShow && !isOpen)");
    expect(source).toContain("tourOpenVersion");
    expect(source).toContain("scale: 0.985");
    expect(source).toContain("TOUR_PARTS");
  });

  it("provides direct controls for all three tour categories without resetting the tour", () => {
    const source = readFileSync(join(process.cwd(), "client/src/components/FirstSignInTour.tsx"), "utf8");
    expect(source).toContain("TOUR_PART_START_INDEX");
    expect(source).toContain("jumpToPart");
    expect(source).toContain('aria-label="Tour categories"');
    expect(source).toContain('"PRACTICE"');
    expect(source).toContain('"CHAPTER"');
    expect(source).toContain('"BLUE BUCKS"');
    expect(source).toContain('aria-current={isActivePart ? "step" : undefined}');
  });
});
