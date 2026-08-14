export const ONBOARDING_WALKTHROUGH_STEPS = [
  {
    eyebrow: "01 · Get oriented",
    title: "Start from your home base",
    body: "The Home tab keeps your next study move, chapter updates, and quick routes in one clear starting point.",
    icon: "home",
    tabLabel: "Home",
    detail: "Your daily Blue Blazer launchpad",
  },
  {
    eyebrow: "02 · Learn the standard",
    title: "Turn PIs into usable skill",
    body: "Open the PI Study Library to turn performance indicators into plain-English lessons, vocabulary, flashcards, scenarios, and quizzes.",
    icon: "study",
    tabLabel: "PI Study Library",
    detail: "Learn each performance indicator in context",
  },
  {
    eyebrow: "03 · Practice deliberately",
    title: "Strengthen one cluster at a time",
    body: "Use Practice to focus on Marketing, Business, Finance, or Hospitality & Tourism questions, then review why each answer works.",
    icon: "practice",
    tabLabel: "Practice",
    detail: "Question banks organized by career cluster",
  },
  {
    eyebrow: "04 · Connect your preparation",
    title: "Use your chapter resources",
    body: "Visit Events for event-focused preparation, then use Volunteer, Discussions, and Announcements to stay connected to the chapter.",
    icon: "community",
    tabLabel: "Events & Community",
    detail: "Resources, chapter activity, and collaboration",
  },
  {
    eyebrow: "05 · Earn as you learn",
    title: "Meet Blue Bucks",
    body: "Blue Bucks are virtual in-app rewards for correct first attempts and follow-up corrections; each question can reward you only once. Use them only in Blue Blazer’s simulation features, such as Study Cards, cosmetics, banking, and BBX. They have no cash value and cannot be purchased, withdrawn, or used for real money.",
    icon: "blueBucks",
    tabLabel: "Blue Bucks",
    detail: "Virtual rewards for consistent, honest practice",
  },
  {
    eyebrow: "06 · Check your readiness",
    title: "Turn practice into a plan",
    body: "Use Chapter Mock Exams and Progress views to identify weak points, then return to the exact study and practice tabs that will move the needle.",
    icon: "readiness",
    tabLabel: "Mock Exams & Progress",
    detail: "Measure readiness and choose your next move",
  },
] as const;

export type OnboardingWalkthroughIcon = (typeof ONBOARDING_WALKTHROUGH_STEPS)[number]["icon"];
