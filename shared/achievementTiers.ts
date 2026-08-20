export const ACHIEVEMENT_TIERS = ["bronze", "silver", "gold"] as const;

export type AchievementTier = (typeof ACHIEVEMENT_TIERS)[number];
export type AchievementMetric = "questionsAnswered" | "accuracy" | "studyStreak" | "savedQuestions" | "eventFocusDays" | "portfolioItems";

export const ACHIEVEMENT_TIER_DEFINITIONS = [
  {
    id: "first-step",
    title: "First Step",
    description: "Build momentum by returning to practice over time.",
    metric: "questionsAnswered" as const,
    metricLabel: "practice questions",
    tiers: [
      { tier: "bronze" as const, label: "Bronze", threshold: 1, criteria: "Answer 1 practice question" },
      { tier: "silver" as const, label: "Silver", threshold: 10, criteria: "Answer 10 practice questions" },
      { tier: "gold" as const, label: "Gold", threshold: 50, criteria: "Answer 50 practice questions" },
    ],
  },
  {
    id: "practice-builder",
    title: "Practice Builder",
    description: "Develop a substantial base of practice experience.",
    metric: "questionsAnswered" as const,
    metricLabel: "practice questions",
    tiers: [
      { tier: "bronze" as const, label: "Bronze", threshold: 25, criteria: "Answer 25 practice questions" },
      { tier: "silver" as const, label: "Silver", threshold: 75, criteria: "Answer 75 practice questions" },
      { tier: "gold" as const, label: "Gold", threshold: 200, criteria: "Answer 200 practice questions" },
    ],
  },
  {
    id: "precision-practice",
    title: "Precision Practice",
    description: "Show accurate work across meaningful sets of questions.",
    metric: "accuracy" as const,
    metricLabel: "accuracy",
    tiers: [
      { tier: "bronze" as const, label: "Bronze", threshold: 80, minimumQuestions: 10, criteria: "Maintain 80% accuracy after 10 questions" },
      { tier: "silver" as const, label: "Silver", threshold: 85, minimumQuestions: 25, criteria: "Maintain 85% accuracy after 25 questions" },
      { tier: "gold" as const, label: "Gold", threshold: 90, minimumQuestions: 50, criteria: "Maintain 90% accuracy after 50 questions" },
    ],
  },
  {
    id: "consistency",
    title: "Consistency",
    description: "Keep a sustained study habit active across multiple days.",
    metric: "studyStreak" as const,
    metricLabel: "consecutive days",
    tiers: [
      { tier: "bronze" as const, label: "Bronze", threshold: 3, criteria: "Reach a 3-day study streak" },
      { tier: "silver" as const, label: "Silver", threshold: 7, criteria: "Reach a 7-day study streak" },
      { tier: "gold" as const, label: "Gold", threshold: 21, criteria: "Reach a 21-day study streak" },
    ],
  },
  {
    id: "knowledge-keeper",
    title: "Knowledge Keeper",
    description: "Save questions for deliberate review and reflection.",
    metric: "savedQuestions" as const,
    metricLabel: "saved questions",
    tiers: [
      { tier: "bronze" as const, label: "Bronze", threshold: 5, criteria: "Save 5 practice questions" },
      { tier: "silver" as const, label: "Silver", threshold: 15, criteria: "Save 15 practice questions" },
      { tier: "gold" as const, label: "Gold", threshold: 40, criteria: "Save 40 practice questions" },
    ],
  },
  {
    id: "event-ready",
    title: "Event Ready",
    description: "Keep a focused event selected as you prepare for competition.",
    metric: "eventFocusDays" as const,
    metricLabel: "days focused",
    tiers: [
      { tier: "bronze" as const, label: "Bronze", threshold: 1, criteria: "Choose a focused event" },
      { tier: "silver" as const, label: "Silver", threshold: 14, criteria: "Keep a focused event for 14 days" },
      { tier: "gold" as const, label: "Gold", threshold: 45, criteria: "Keep a focused event for 45 days" },
    ],
  },
  {
    id: "portfolio-starter",
    title: "Portfolio Starter",
    description: "Document evidence of your DECA development and learning.",
    metric: "portfolioItems" as const,
    metricLabel: "portfolio items",
    tiers: [
      { tier: "bronze" as const, label: "Bronze", threshold: 1, criteria: "Add 1 portfolio item" },
      { tier: "silver" as const, label: "Silver", threshold: 3, criteria: "Add 3 portfolio items" },
      { tier: "gold" as const, label: "Gold", threshold: 6, criteria: "Add 6 portfolio items" },
    ],
  },
] as const;

export type AchievementId = (typeof ACHIEVEMENT_TIER_DEFINITIONS)[number]["id"];
