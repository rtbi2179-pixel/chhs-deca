import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CREDIT_SCORE_STAGES, calculateCreditScoreQuestionReward, getCreditScoreStage } from "../shared/creditScoreStages";

describe("credit-score Blue Bucks stages", () => {
  it("uses five balanced stages with a modest maximum question-reward advantage", () => {
    expect(CREDIT_SCORE_STAGES.map((stage) => stage.name)).toEqual(["Foundation", "Building", "Steady", "Strong", "Elite"]);
    expect(CREDIT_SCORE_STAGES.map((stage) => stage.multiplier)).toEqual([1, 1.03, 1.06, 1.09, 1.12]);
    expect(CREDIT_SCORE_STAGES.at(-1)?.multiplier).toBeLessThanOrEqual(1.12);
  });

  it("selects score boundaries predictably and adds the stage multiplier after the Study Card reward", () => {
    expect(getCreditScoreStage(300).name).toBe("Foundation");
    expect(getCreditScoreStage(550).name).toBe("Building");
    expect(getCreditScoreStage(650).name).toBe("Steady");
    expect(getCreditScoreStage(720).name).toBe("Strong");
    expect(getCreditScoreStage(780).name).toBe("Elite");
    expect(calculateCreditScoreQuestionReward(110, 720)).toMatchObject({ amount: 120, bonus: 10, multiplier: 1.09, stage: { name: "Strong" } });
  });

  it("wires active banking and learning signals into the member reward and score presentation", () => {
    const engine = readFileSync(join(process.cwd(), "server/creditScoreEngine.ts"), "utf8");
    const router = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");
    const banking = readFileSync(join(process.cwd(), "client/src/pages/BankingDashboard.tsx"), "utf8");

    expect(engine).toContain("Savings discipline reflects actual Savings Account usage");
    expect(engine).toContain("Credit utilization uses real issued Banking & Cards balances");
    expect(router).toContain("calculateCreditScoreQuestionReward(studyCardReward.amount, score)");
    expect(router).toContain("creditScoreMultiplier");
    expect(engine).toContain("Savings Discipline");
    expect(engine).toContain("Credit Utilization");
    expect(router).toContain("getCreditScoreComposition");
    expect(banking).toContain("creditScoreComposition");
    expect(banking).toContain("100% total");
    expect(banking).toContain("Blue Bucks reward stages");
  });
});
