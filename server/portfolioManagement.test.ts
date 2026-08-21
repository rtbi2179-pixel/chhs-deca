import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateSafeRubricScore } from "./aiJudgeEngine";
import { getVerifiedDecaAiJudgeRuleSet } from "../shared/decaAiJudgeRules";

const projectFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("portfolio competition-management safeguards", () => {
  it("keeps official criterion caps and evidence verification in server code", () => {
    const rules = getVerifiedDecaAiJudgeRuleSet("2026-2027", "EIP")!;
    const score = calculateSafeRubricScore(rules, [{
      criterionId: "overview",
      assessability: "assessed",
      awardedPoints: 999,
      confidence: 1,
      evidence: [{ type: "transcript", reference: "[P01]", summary: "Submitted evidence" }],
      judgeComment: "Evidence is present.",
      improvement: "Increase measurable support.",
    }], "The project defines a customer problem and a specific solution.");
    expect(score.items.find((item) => item.criterionId === "overview")?.awardedPoints).toBe(15);
  });

  it("requires a verified event rule set before portfolio AI evaluation", () => {
    const engine = projectFile("server/portfolioAiEngine.ts");
    expect(engine).toContain("No verified official DECA rubric is registered");
    expect(engine).toContain("calculateSafeRubricScore");
    expect(engine).toContain("Integrity concerns never affect rubric points");
  });

  it("stores integrity findings separately from rubric scores and requires a human decision", () => {
    const schema = projectFile("drizzle/schema.ts");
    const router = projectFile("server/portfolioRouter.ts");
    expect(schema).toContain("export const portfolioIntegrityFindings");
    expect(schema).toContain("humanDecision");
    expect(router).toContain("decideIntegrityFinding");
    expect(router).toContain("humanDecision: input.decision");
    expect(router).toContain("integrityFindings.length");
  });

  it("protects checkpoint-owned timeline items from adaptive roadmap regeneration", () => {
    const timeline = projectFile("server/timelineEngine.ts");
    expect(timeline).toContain("portfolioCheckpointTimelineLinks");
    expect(timeline).toContain("protectedCheckpointItemIds");
    expect(timeline).toContain("notInArray(timelineItems.id, protectedCheckpointItemIds)");
    expect(timeline).toContain("syncCheckpointTimelineItems(database, checkpoint.id, schoolCode, user.id)");
  });

  it("keeps portfolio file access and uploads server-authorized with private storage keys", () => {
    const router = projectFile("server/portfolioRouter.ts");
    const engine = projectFile("server/portfolioEngine.ts");
    expect(router).toContain("canUserAccessSubmission");
    expect(router).toContain("storagePut(storageKey, file, input.mimeType)");
    expect(router).toContain("storageGet(row.file.storageKey)");
    expect(engine).toContain("You do not have access to this portfolio submission");
    expect(router).toContain("portfolio-submissions");
  });

  it("uses an authenticated durable schedule for checkpoint due-date reminders", () => {
    const engine = projectFile("server/portfolioEngine.ts");
    const bootstrap = projectFile("server/_core/index.ts");
    expect(engine).toContain("postPortfolioDueDateNotifications");
    expect(engine).toContain("[7, 3, 1, 0]");
    expect(engine).toContain("portfolio-checkpoint-reminder-");
    expect(bootstrap).toContain('app.post("/api/scheduled/portfolio-reminders"');
    expect(bootstrap).toContain("portfolioNotificationSchedules");
    expect(bootstrap).toContain('error: "cron-only"');
  });
});
