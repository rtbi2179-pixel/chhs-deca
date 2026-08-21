import { describe, expect, it } from "vitest";
import { getOnboardingProgress, ONBOARDING_CELEBRATION_DURATION_MS, ONBOARDING_SKIP_FADE_DURATION_MS, ONBOARDING_TOUR_ACTIONS } from "../client/src/lib/onboardingTour";
import { getOnboardingWalkthroughSteps } from "../client/src/lib/onboardingWalkthrough";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("onboarding progress and celebration", () => {
  it("reports clear, clamped progress through the complete tour", () => {
    expect(getOnboardingProgress(0, 21)).toEqual({ currentStep: 1, totalSteps: 21, percentage: 5, scale: 1 / 21 });
    expect(getOnboardingProgress(10, 21)).toEqual({ currentStep: 11, totalSteps: 21, percentage: 52, scale: 11 / 21 });
    expect(getOnboardingProgress(20, 21)).toEqual({ currentStep: 21, totalSteps: 21, percentage: 100, scale: 1 });
    expect(getOnboardingProgress(99, 21)).toMatchObject({ currentStep: 21, percentage: 100 });
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
    const memberSteps = getOnboardingWalkthroughSteps("member");
    expect(memberSteps.map((step) => step.path)).toEqual(["/", "/events", "/pi-quizlet", "/practice", "/mock-exams", "/project-workspace", "/speech-ai", "/timeline", "/profile", "/", "/calendar", "/announcements", "/discussions", "/volunteer", "/feedback", "/portfolio-upload", "/practice", "/banking", "/blues-news", "/blue-market", "/leaderboard"]);
    expect(memberSteps.every((step) => step.action.length > 0)).toBe(true);
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
    expect(source).toContain("tourPartStartIndex");
    expect(source).toContain("getOnboardingWalkthroughSteps");
    expect(source).toContain("jumpToPart");
    expect(source).toContain('aria-label="Tour categories"');
    expect(source).toContain('"PRACTICE"');
    expect(source).toContain('"CHAPTER"');
    expect(source).toContain('"BLUE BUCKS"');
    expect(source).toContain('aria-current={isActivePart ? "step" : undefined}');
    expect(source).toContain("ArrowLeft");
  });

  it("keeps the tour panel clear of the desktop sidebar navigation", () => {
    const source = readFileSync(join(process.cwd(), "client/src/components/FirstSignInTour.tsx"), "utf8");
    expect(source).toContain("bottom-4 right-4 left-auto");
    expect(source).not.toContain("bottom-4 left-4 top-auto");
  });
});
