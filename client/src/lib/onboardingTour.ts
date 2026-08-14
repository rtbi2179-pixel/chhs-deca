export const ONBOARDING_STEP_COUNT = 3;
export const ONBOARDING_CELEBRATION_DURATION_MS = 900;

export function getOnboardingProgress(stepIndex: number, totalSteps = ONBOARDING_STEP_COUNT) {
  const currentStep = Math.min(Math.max(stepIndex + 1, 1), totalSteps);
  const percentage = Math.round((currentStep / totalSteps) * 100);
  return { currentStep, totalSteps, percentage, scale: currentStep / totalSteps };
}
