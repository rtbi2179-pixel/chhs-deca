export const ONBOARDING_STEP_COUNT = 3;
export const ONBOARDING_CELEBRATION_DURATION_MS = 900;
export const ONBOARDING_SKIP_FADE_DURATION_MS = 240;
export const ONBOARDING_TOUR_ACTIONS = {
  replayLabel: "Replay onboarding tour",
  skipLabel: "Skip Tour",
} as const;

export function getOnboardingProgress(stepIndex: number, totalSteps = ONBOARDING_STEP_COUNT) {
  const currentStep = Math.min(Math.max(stepIndex + 1, 1), totalSteps);
  const percentage = Math.round((currentStep / totalSteps) * 100);
  return { currentStep, totalSteps, percentage, scale: currentStep / totalSteps };
}
