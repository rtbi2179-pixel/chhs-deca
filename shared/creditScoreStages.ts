export type CreditScoreStage = {
  key: "foundation" | "building" | "steady" | "strong" | "elite";
  name: string;
  minScore: number;
  maxScore: number;
  multiplier: number;
  description: string;
};

/**
 * The credit-score bonus is intentionally modest. It rewards sustained use of
 * active Blue Blazer learning and banking tools without overshadowing correct
 * answers or the selected Study Card benefit.
 */
export const CREDIT_SCORE_STAGES: CreditScoreStage[] = [
  { key: "foundation", name: "Foundation", minScore: 300, maxScore: 549, multiplier: 1, description: "Standard Blue Bucks on first-time correct answers." },
  { key: "building", name: "Building", minScore: 550, maxScore: 649, multiplier: 1.03, description: "+3% Blue Bucks on first-time correct answers." },
  { key: "steady", name: "Steady", minScore: 650, maxScore: 719, multiplier: 1.06, description: "+6% Blue Bucks on first-time correct answers." },
  { key: "strong", name: "Strong", minScore: 720, maxScore: 779, multiplier: 1.09, description: "+9% Blue Bucks on first-time correct answers." },
  { key: "elite", name: "Elite", minScore: 780, maxScore: 850, multiplier: 1.12, description: "+12% Blue Bucks on first-time correct answers." },
];

export function getCreditScoreStage(score: number): CreditScoreStage {
  const normalizedScore = Math.max(300, Math.min(850, score));
  return CREDIT_SCORE_STAGES.find((stage) => normalizedScore >= stage.minScore && normalizedScore <= stage.maxScore) ?? CREDIT_SCORE_STAGES[0];
}

export function calculateCreditScoreQuestionReward(amountBeforeCreditStage: number, score: number) {
  const stage = getCreditScoreStage(score);
  const amount = Math.round(amountBeforeCreditStage * stage.multiplier);
  return { amount, multiplier: stage.multiplier, bonus: amount - amountBeforeCreditStage, stage };
}
