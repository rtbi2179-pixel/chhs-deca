import { describe, expect, it } from "vitest";
import { getOnboardingProgress, ONBOARDING_CELEBRATION_DURATION_MS, ONBOARDING_SKIP_FADE_DURATION_MS, ONBOARDING_TOUR_ACTIONS } from "../client/src/lib/onboardingTour";
import { ONBOARDING_WALKTHROUGH_STEPS } from "../client/src/lib/onboardingWalkthrough";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("onboarding progress and celebration", () => {
  it("reports clear, clamped progress through the complete tour", () => {
    expect(getOnboardingProgress(0, 16)).toEqual({ currentStep: 1, totalSteps: 16, percentage: 6, scale: 1 / 16 });
    expect(getOnboardingProgress(7, 16)).toEqual({ currentStep: 8, totalSteps: 16, percentage: 50, scale: 1 / 2 });
    expect(getOnboardingProgress(15, 16)).toEqual({ currentStep: 16, totalSteps: 16, percentage: 100, scale: 1 });
    expect(getOnboardingProgress(99, 16)).toMatchObject({ currentStep: 16, percentage: 100 });
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
    expect(ONBOARDING_WALKTHROUGH_STEPS.map((step) => step.path)).toEqual(["/", "/pi-quizlet", "/practice", "/mock-exams", "/leaderboard", "/speech-ai", "/events", "/calendar", "/announcements", "/discussions", "/volunteer", "/feedback", "/practice", "/banking", "/blues-news", "/blue-market"]);
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

  it("keeps the tour panel clear of the desktop sidebar navigation", () => {
    const source = readFileSync(join(process.cwd(), "client/src/components/FirstSignInTour.tsx"), "utf8");
    expect(source).toContain("bottom-4 right-4 left-auto");
    expect(source).not.toContain("bottom-4 left-4 top-auto");
  });
});
