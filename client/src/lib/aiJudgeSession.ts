export const AI_JUDGE_SELECTOR_ENTRY_KEY = "blue-blazer:ai-judge-selector-entry";

export function markAiJudgeSelectorEntry() {
  if (typeof window !== "undefined") window.sessionStorage.setItem(AI_JUDGE_SELECTOR_ENTRY_KEY, String(Date.now()));
}

export function hasAiJudgeSelectorEntry() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage.getItem(AI_JUDGE_SELECTOR_ENTRY_KEY));
}

export function shouldRedirectToAiJudgeSelector(hasSelectorEntry: boolean) {
  return !hasSelectorEntry;
}

export function canEvaluateRecordedEvidence(input: { savedSessionId: number | null; hasWrittenEntry: boolean; hasRecording: boolean; durationMs: number }) {
  return input.savedSessionId !== null || (input.hasWrittenEntry && input.hasRecording && input.durationMs >= 15_000);
}
