export const STUDY_CARD_KEYS = [
  "scholar",
  "scholar_pro",
  "investor",
  "entrepreneur",
  "social",
  "leader",
  "collector",
  "competitor",
  "blazer",
  "maverick",
] as const;

export type StudyCardKey = (typeof STUDY_CARD_KEYS)[number];

export type StudyCardProfile = {
  key: StudyCardKey;
  name: string;
  title: string;
  focus: string;
  liveBenefit: string;
  tradeoff: string;
  supportedNow: boolean;
};

export const STUDY_CARD_CATALOG: StudyCardProfile[] = [
  { key: "scholar", name: "Scholar Card", title: "The Grinder", focus: "High-volume practice", liveBenefit: "+10% Blue Bucks on first-time correct practice answers", tradeoff: "No bonus for market, banking, or cosmetic activity", supportedNow: true },
  { key: "scholar_pro", name: "Scholar Pro Card", title: "The Perfectionist", focus: "Accuracy and mastery", liveBenefit: "Accuracy milestones are tracked for upcoming quiz rewards", tradeoff: "Does not reward rapid, low-quality volume", supportedNow: false },
  { key: "investor", name: "Investor Card", title: "The Banker", focus: "Financial literacy", liveBenefit: "Banking and market milestones are tracked for upcoming rewards", tradeoff: "No practice-question multiplier", supportedNow: false },
  { key: "entrepreneur", name: "Entrepreneur Card", title: "The Risk Taker", focus: "Hard challenges", liveBenefit: "+20% Blue Bucks on first-time correct hard practice answers", tradeoff: "No bonus on easy or medium questions", supportedNow: true },
  { key: "social", name: "Social Card", title: "The Connector", focus: "Chapter community", liveBenefit: "Community contribution milestones are tracked for upcoming rewards", tradeoff: "Community rewards will be daily-capped to prevent spam", supportedNow: false },
  { key: "leader", name: "Leader Card", title: "The Officer", focus: "Chapter contribution", liveBenefit: "Volunteer and chapter activity milestones are tracked for upcoming rewards", tradeoff: "Less emphasis on individual practice volume", supportedNow: false },
  { key: "collector", name: "Collector Card", title: "The Drip Merchant", focus: "Cosmetic collection", liveBenefit: "Cosmetic collection milestones are tracked for upcoming rewards", tradeoff: "No practice-question multiplier", supportedNow: false },
  { key: "competitor", name: "Competitor Card", title: "The Tournament Player", focus: "Competition preparation", liveBenefit: "Mock-exam and AI-prep milestones are tracked for upcoming rewards", tradeoff: "Benefits are focused on preparation activities", supportedNow: false },
  { key: "blazer", name: "Balanced Card", title: "The Blazer", focus: "Broad, steady progress", liveBenefit: "+5% Blue Bucks on first-time correct practice answers", tradeoff: "No specialized high multiplier", supportedNow: true },
  { key: "maverick", name: "Maverick Card", title: "The Wildcard", focus: "Adaptable study", liveBenefit: "A deterministic daily focus can grant 2× first-time correct practice rewards on cluster-question days", tradeoff: "The featured activity changes daily", supportedNow: true },
];

const DAILY_FOCUSES = ["Cluster questions", "Discussion contributions", "Study review", "Portfolio reflection"] as const;

export function getMaverickDailyFocus(userId: number, date = new Date()): (typeof DAILY_FOCUSES)[number] {
  const key = `${userId}-${date.toISOString().slice(0, 10)}`;
  const seed = Array.from(key).reduce((total, character) => total + character.charCodeAt(0), 0);
  return DAILY_FOCUSES[seed % DAILY_FOCUSES.length];
}

export function getQuestionRewardMultiplier(cardKey: StudyCardKey, difficulty: string, userId: number, date = new Date()) {
  if (cardKey === "scholar") return 1.1;
  if (cardKey === "entrepreneur" && difficulty === "Hard") return 1.2;
  if (cardKey === "blazer") return 1.05;
  if (cardKey === "maverick" && getMaverickDailyFocus(userId, date) === "Cluster questions") return 2;
  return 1;
}

export function calculateStudyCardQuestionReward(baseAmount: number, cardKey: StudyCardKey, difficulty: string, userId: number, date = new Date()) {
  const multiplier = getQuestionRewardMultiplier(cardKey, difficulty, userId, date);
  const amount = Math.round(baseAmount * multiplier);
  return { amount, multiplier, bonus: amount - baseAmount };
}

export function calculateStudyCardLevel(practiceProgress: number) {
  return Math.min(5, 1 + Math.floor(Math.max(0, practiceProgress) / 250));
}
