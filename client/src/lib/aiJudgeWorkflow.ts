export type RecordedEvaluationAction = "blocked" | "submit_new" | "retry_saved";
export type RoleplayScoreAction = "blocked" | "upload_then_score" | "score_saved";

export function getRecordedEvaluationAction(input: { savedSessionId: number | null; hasWrittenEntry: boolean; hasRecording: boolean; durationMs: number }): RecordedEvaluationAction {
  if (input.savedSessionId !== null) return "retry_saved";
  if (input.hasWrittenEntry && input.hasRecording && input.durationMs >= 15_000) return "submit_new";
  return "blocked";
}

export function getRoleplayScoreAction(input: { hasLocalRecording: boolean; hasSavedRecording: boolean; isProcessing: boolean }): RoleplayScoreAction {
  if (input.isProcessing) return "blocked";
  if (input.hasSavedRecording) return "score_saved";
  if (input.hasLocalRecording) return "upload_then_score";
  return "blocked";
}

export function getEvaluationProgressState(stage: "idle" | "reviewing" | "matching" | "validating" | "saving" | "creating" | "uploadingPaper" | "uploadingRecording" | "evaluating") {
  const order = ["idle", "creating", "uploadingPaper", "uploadingRecording", "reviewing", "matching", "validating", "evaluating", "saving"] as const;
  const index = order.indexOf(stage as typeof order[number]);
  return { activeIndex: Math.max(0, index), progress: index <= 0 ? 0 : Math.min(92, 12 + index * 11) };
}
