import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DECA_ROLEPLAY_EVENTS } from "../shared/decaRoleplayEvents";
import { buildDeliveryAnalysis, calculateSafeRoleplayScore, performanceLevelForScore, type ScenarioPi } from "./roleplayEngine";

const pis: ScenarioPi[] = [
  { moduleId: 1, piId: "MK:001", performanceIndicator: "Explain customer needs", instructionalArea: "Marketing" },
  { moduleId: 2, piId: "MK:002", performanceIndicator: "Measure a recommendation", instructionalArea: "Marketing" },
];

describe("native roleplay simulator safeguards", () => {
  it("keeps current verified timing explicit for every supported category", () => {
    for (const event of DECA_ROLEPLAY_EVENTS) {
      if (event.eventCategory === "team_decision_making") {
        expect(event).toMatchObject({ participantCount: 2, prepMinutes: 30, interviewMinutes: 15, verificationStatus: "verified" });
      } else {
        expect(event).toMatchObject({ participantCount: 1, prepMinutes: 10, interviewMinutes: 10, verificationStatus: "verified" });
      }
    }
  });

  it("requires an exact transcript excerpt before an AI PI level can award points", () => {
    const transcript = "I will interview current customers before changing the promotion and use the survey results to identify their needs.";
    const score = calculateSafeRoleplayScore(pis, transcript, [
      { piId: "MK:001", level: "Strong", evidenceQuotes: ["I will interview current customers before changing the promotion"], evaluation: "Specific research step.", improvement: "Name the response target." },
      { piId: "MK:002", level: "Exceptional", evidenceQuotes: ["We will double revenue in six months"], evaluation: "Unsupported claim.", improvement: "Define a measurable metric." },
    ]);

    expect(score.piScores[0]).toMatchObject({ level: "Strong", score: 82 });
    expect(score.piScores[1]).toMatchObject({ level: "Not Demonstrated", score: 0, evidenceQuotes: [] });
    expect(score.overallScore).toBe(41);
    expect(score.performanceLevel).toBe("Developing");
  });

  it("preserves calibrated performance anchor boundaries", () => {
    expect(performanceLevelForScore(90)).toBe("Exceptional");
    expect(performanceLevelForScore(75)).toBe("Strong");
    expect(performanceLevelForScore(60)).toBe("Adequate");
    expect(performanceLevelForScore(40)).toBe("Developing");
    expect(performanceLevelForScore(15)).toBe("Minimal");
    expect(performanceLevelForScore(14)).toBe("Not Demonstrated");
  });

  it("keeps a fully evidenced response above a weak or malformed response", () => {
    const transcript = "I will interview current customers before changing the promotion. I will track weekly response rate and compare it against the current baseline.";
    const strong = calculateSafeRoleplayScore(pis, transcript, [
      { piId: "MK:001", level: "Strong", evidenceQuotes: ["I will interview current customers before changing the promotion"], evaluation: "Applies research.", improvement: "Add a sample size." },
      { piId: "MK:002", level: "Strong", evidenceQuotes: ["I will track weekly response rate and compare it against the current baseline"], evaluation: "Uses a measurable metric.", improvement: "Set a target." },
    ]);
    const weak = calculateSafeRoleplayScore(pis, transcript, "malformed model response");

    expect(strong.overallScore).toBe(82);
    expect(strong.performanceLevel).toBe("Strong");
    expect(weak.overallScore).toBe(0);
    expect(weak.piScores.every((item) => item.level === "Not Demonstrated")).toBe(true);
    expect(strong.overallScore).toBeGreaterThan(weak.overallScore);
  });

  it("keeps transcript-derived delivery signals separate from PI score arithmetic", () => {
    const delivery = buildDeliveryAnalysis("Um, we should use a specific customer survey and measure weekly response rate.", 30);
    expect(delivery).toMatchObject({ source: "transcript_and_recording_duration", fillerWordCount: 1 });
    expect(delivery.limitations).toContain("does not affect the DECA practice score");
    expect(delivery.limitations).toContain("eye contact");
  });

  it("replaces the standalone iframe with a private, native account workflow", () => {
    const page = readFileSync(resolve(process.cwd(), "client/src/pages/RoleplayAI.tsx"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/roleplayRouter.ts"), "utf8");
    expect(page).not.toContain("<iframe");
    expect(page).not.toContain("chhsdeca-hn7kwxwp.manus.space");
    expect(page).toContain("trpc.roleplay.startAttempt.useMutation");
    expect(page).toContain("trpc.roleplay.uploadInterviewAudio.useMutation");
    expect(page).toContain("Delivery analysis — separate from score");
    expect(router).toContain("ownedAttempt");
    expect(router).toContain("getRecordingPlayback");
    expect(router).toContain("storageGet(recording.audioStorageKey)");
    expect(router).not.toContain("audioStorageKey: recording.audioStorageKey");
  });
});
