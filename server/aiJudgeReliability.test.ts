import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canEvaluateRecordedEvidence, shouldRedirectToAiJudgeSelector } from "../client/src/lib/aiJudgeSession";
import { isJudgeSessionExpired, JUDGE_SESSION_IDLE_LIMIT_MS } from "../client/src/hooks/useJudgeSessionExpiry";
import { getEvaluationProgressState, getRecordedEvaluationAction, getRoleplayScoreAction } from "../client/src/lib/aiJudgeWorkflow";
import { isRoleplayAttemptExpired, ROLEPLAY_ATTEMPT_IDLE_LIMIT_MS } from "./roleplayRouter";

describe("AI Judge reliability and discoverability", () => {
  it("expires unfinished roleplay attempts after one hour while retaining completed history", () => {
    const now = Date.UTC(2026, 7, 21, 12, 0, 0);
    expect(isRoleplayAttemptExpired({ status: "preparing", updatedAt: new Date(now - ROLEPLAY_ATTEMPT_IDLE_LIMIT_MS - 1) } as never, now)).toBe(true);
    expect(isRoleplayAttemptExpired({ status: "preparing", updatedAt: new Date(now - ROLEPLAY_ATTEMPT_IDLE_LIMIT_MS + 1) } as never, now)).toBe(false);
    expect(isRoleplayAttemptExpired({ status: "completed", updatedAt: new Date(now - ROLEPLAY_ATTEMPT_IDLE_LIMIT_MS - 1) } as never, now)).toBe(false);
  });

  it("routes fresh judge sessions to the selector and expires browser activity after one hour", () => {
    const now = Date.UTC(2026, 7, 21, 12, 0, 0);
    expect(shouldRedirectToAiJudgeSelector(false)).toBe(true);
    expect(shouldRedirectToAiJudgeSelector(true)).toBe(false);
    expect(isJudgeSessionExpired(now - JUDGE_SESSION_IDLE_LIMIT_MS - 1, now)).toBe(true);
    expect(isJudgeSessionExpired(now - JUDGE_SESSION_IDLE_LIMIT_MS + 1, now)).toBe(false);
  });

  it("only enables recorded Written AI Judge evaluation for a durable retry or adequate evidence", () => {
    expect(canEvaluateRecordedEvidence({ savedSessionId: null, hasWrittenEntry: false, hasRecording: false, durationMs: 0 })).toBe(false);
    expect(canEvaluateRecordedEvidence({ savedSessionId: null, hasWrittenEntry: true, hasRecording: true, durationMs: 14_999 })).toBe(false);
    expect(canEvaluateRecordedEvidence({ savedSessionId: null, hasWrittenEntry: true, hasRecording: true, durationMs: 15_000 })).toBe(true);
    expect(canEvaluateRecordedEvidence({ savedSessionId: 42, hasWrittenEntry: false, hasRecording: false, durationMs: 0 })).toBe(true);
  });

  it("chooses submit or retry paths for the two AI Judge buttons", () => {
    expect(getRecordedEvaluationAction({ savedSessionId: null, hasWrittenEntry: false, hasRecording: true, durationMs: 30_000 })).toBe("blocked");
    expect(getRecordedEvaluationAction({ savedSessionId: null, hasWrittenEntry: true, hasRecording: true, durationMs: 15_000 })).toBe("submit_new");
    expect(getRecordedEvaluationAction({ savedSessionId: 8, hasWrittenEntry: false, hasRecording: false, durationMs: 0 })).toBe("retry_saved");
    expect(getRoleplayScoreAction({ hasLocalRecording: false, hasSavedRecording: false, isProcessing: false })).toBe("blocked");
    expect(getRoleplayScoreAction({ hasLocalRecording: true, hasSavedRecording: false, isProcessing: false })).toBe("upload_then_score");
    expect(getRoleplayScoreAction({ hasLocalRecording: true, hasSavedRecording: true, isProcessing: false })).toBe("score_saved");
    expect(getRoleplayScoreAction({ hasLocalRecording: true, hasSavedRecording: true, isProcessing: true })).toBe("blocked");
  });

  it("moves visible progress forward as evidence is uploaded and evaluated", () => {
    expect(getEvaluationProgressState("idle").progress).toBe(0);
    expect(getEvaluationProgressState("uploadingPaper").progress).toBeGreaterThan(getEvaluationProgressState("creating").progress);
    expect(getEvaluationProgressState("evaluating").progress).toBeGreaterThan(getEvaluationProgressState("uploadingRecording").progress);
  });

  it("keeps both judge workflows visibly staged, retryable, and auto-navigable to stored feedback", () => {
    const roleplayPage = readFileSync(resolve(process.cwd(), "client/src/pages/RoleplayAI.tsx"), "utf8");
    const writtenPage = readFileSync(resolve(process.cwd(), "client/src/pages/WrittenEventAI.tsx"), "utf8");
    expect(roleplayPage).toContain("Evaluation progress");
    expect(roleplayPage).toContain("useJudgeSessionExpiry");
    expect(roleplayPage).toContain("Building scorecard");
    expect(roleplayPage).toContain("getRoleplayScoreAction");
    expect(roleplayPage).toContain('navigate("/speech-ai")');
    expect(roleplayPage).toContain("ROLEPLAY AI JUDGE");
    expect(writtenPage).toContain("EvaluationProgress");
    expect(writtenPage).toContain("judge-results-heading");
    expect(writtenPage).toContain("useJudgeSessionExpiry");
    expect(writtenPage).toContain("Evaluation complete · feedback starts here");
    expect(writtenPage).toContain("getRecordedEvaluationAction");
    expect(writtenPage).toContain("recordedAction === \"retry_saved\"");
    expect(writtenPage).toContain("Retry saved evaluation");
    expect(writtenPage).toContain("scrollIntoView");
  });

  it("uses the requested tool names in the AI Judge selection hub", () => {
    const selector = readFileSync(resolve(process.cwd(), "client/src/pages/SpeechAI.tsx"), "utf8");
    expect(selector).toContain("Roleplay AI Judge");
    expect(selector).toContain("Written AI Judge");
  });
});
