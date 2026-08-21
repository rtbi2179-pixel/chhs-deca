export const ROLEPLAY_COMPETITION_SEASON = "2026-2027" as const;

export type RoleplayEventCategory = "principles" | "individual_series" | "team_decision_making";
export type RoleplayCluster = "Marketing" | "Finance" | "Hospitality & Tourism" | "Business Management" | "Entrepreneurship";

export interface DecaRoleplayEvent {
  eventCode: string;
  eventName: string;
  eventCategory: RoleplayEventCategory;
  careerCluster: RoleplayCluster;
  participantCount: 1 | 2;
  examType: "business_administration_core" | "career_cluster";
  prepMinutes: 10 | 30;
  interviewMinutes: 10 | 15;
  officialCompetitionStructure: string;
  instructionalAreas: readonly string[];
  performanceIndicatorPool: "eventPerformanceIndicators";
  rubricConfiguration: {
    version: string;
    maximumPoints: 100;
    scoringBasis: "equal_weighted_selected_performance_indicators";
    verifiedOfficialRubric: false;
    disclosure: string;
  };
  season: typeof ROLEPLAY_COMPETITION_SEASON;
  sourceVersion: string;
  verificationStatus: "verified";
}

const PRACTICE_RUBRIC = {
  version: "blue-blazer-roleplay-practice-v1",
  maximumPoints: 100 as const,
  scoringBasis: "equal_weighted_selected_performance_indicators" as const,
  verifiedOfficialRubric: false as const,
  disclosure: "This is a Blue Blazer practice score based on observable performance-indicator evidence. It is not an official DECA event score or evaluation form.",
};

const INDIVIDUAL_STRUCTURE = "Two role-plays; a third role-play may be used for finalists.";
const PRINCIPLES_STRUCTURE = "One role-play; a second role-play may be used for finalists.";
const TEAM_STRUCTURE = "One case study; a second case study may be used for finalists.";
const SOURCE_VERSION = "Official DECA High School event pages verified August 2026";

function event(
  eventCode: string,
  eventName: string,
  eventCategory: RoleplayEventCategory,
  careerCluster: RoleplayCluster,
  instructionalAreas: readonly string[],
): DecaRoleplayEvent {
  const isTeam = eventCategory === "team_decision_making";
  const isPrinciples = eventCategory === "principles";
  return {
    eventCode,
    eventName,
    eventCategory,
    careerCluster,
    participantCount: isTeam ? 2 : 1,
    examType: isPrinciples ? "business_administration_core" : "career_cluster",
    prepMinutes: isTeam ? 30 : 10,
    interviewMinutes: isTeam ? 15 : 10,
    officialCompetitionStructure: isTeam ? TEAM_STRUCTURE : isPrinciples ? PRINCIPLES_STRUCTURE : INDIVIDUAL_STRUCTURE,
    instructionalAreas,
    performanceIndicatorPool: "eventPerformanceIndicators",
    rubricConfiguration: PRACTICE_RUBRIC,
    season: ROLEPLAY_COMPETITION_SEASON,
    sourceVersion: SOURCE_VERSION,
    verificationStatus: "verified",
  };
}

/**
 * Server-safe roleplay registry. Timing is intentionally explicit and versioned,
 * while actual scenario PIs are selected from the maintained eventPerformanceIndicators mapping.
 */
export const DECA_ROLEPLAY_EVENTS: readonly DecaRoleplayEvent[] = [
  event("AAM", "Apparel and Accessories Marketing Series", "individual_series", "Marketing", ["Marketing", "Product/Service Management", "Selling"]),
  event("ASM", "Automotive Services Marketing Series", "individual_series", "Marketing", ["Marketing", "Customer Relations", "Product/Service Management"]),
  event("BSM", "Business Services Marketing Series", "individual_series", "Marketing", ["Marketing", "Selling", "Customer Relations"]),
  event("FMS", "Food Marketing Series", "individual_series", "Marketing", ["Marketing", "Operations", "Product/Service Management"]),
  event("MCS", "Marketing Communications Series", "individual_series", "Marketing", ["Marketing", "Communications", "Promotion"]),
  event("RMS", "Retail Merchandising Series", "individual_series", "Marketing", ["Marketing", "Merchandising", "Customer Relations"]),
  event("SEM", "Sports and Entertainment Marketing Series", "individual_series", "Marketing", ["Marketing", "Selling", "Promotion"]),
  event("PMK", "Principles of Marketing", "principles", "Marketing", ["Business Administration Core", "Marketing", "Communication Skills"]),
  event("MTDM", "Marketing Management Team Decision Making", "team_decision_making", "Marketing", ["Marketing", "Promotion", "Economics"]),
  event("BTDM", "Buying and Merchandising Team Decision Making", "team_decision_making", "Marketing", ["Marketing", "Merchandising", "Operations"]),
  event("STDM", "Sports and Entertainment Marketing Team Decision Making", "team_decision_making", "Marketing", ["Marketing", "Promotion", "Communications"]),

  event("ACT", "Accounting Applications Series", "individual_series", "Finance", ["Accounting", "Finance", "Operations"]),
  event("BFS", "Business Finance Series", "individual_series", "Finance", ["Finance", "Economics", "Business Management"]),
  event("FCE", "Financial Consulting", "individual_series", "Finance", ["Finance", "Customer Relations", "Professional Development"]),
  event("PFN", "Principles of Finance", "principles", "Finance", ["Business Administration Core", "Finance", "Communication Skills"]),
  event("FTDM", "Financial Services Team Decision Making", "team_decision_making", "Finance", ["Finance", "Economics", "Customer Relations"]),

  event("HLM", "Hotel and Lodging Management Series", "individual_series", "Hospitality & Tourism", ["Hospitality", "Operations", "Customer Relations"]),
  event("QSRM", "Quick Serve Restaurant Management Series", "individual_series", "Hospitality & Tourism", ["Hospitality", "Operations", "Customer Relations"]),
  event("RFSM", "Restaurant and Food Service Management Series", "individual_series", "Hospitality & Tourism", ["Hospitality", "Operations", "Marketing"]),
  event("PHT", "Principles of Hospitality and Tourism", "principles", "Hospitality & Tourism", ["Business Administration Core", "Hospitality", "Communication Skills"]),
  event("HTDM", "Hospitality Services Team Decision Making", "team_decision_making", "Hospitality & Tourism", ["Hospitality", "Customer Relations", "Operations"]),
  event("TTDM", "Travel and Tourism Team Decision Making", "team_decision_making", "Hospitality & Tourism", ["Hospitality", "Marketing", "Customer Relations"]),

  event("HRM", "Human Resources Management Series", "individual_series", "Business Management", ["Business Management", "Human Resources", "Operations"]),
  event("PBM", "Principles of Business Management and Administration", "principles", "Business Management", ["Business Administration Core", "Business Management", "Communication Skills"]),
  event("BLTDM", "Business Law and Ethics Team Decision Making", "team_decision_making", "Business Management", ["Business Law", "Ethics", "Business Management"]),

  event("ENT", "Entrepreneurship Series", "individual_series", "Entrepreneurship", ["Entrepreneurship", "Business Management", "Marketing"]),
  event("PEN", "Principles of Entrepreneurship", "principles", "Entrepreneurship", ["Business Administration Core", "Entrepreneurship", "Communication Skills"]),
  event("ETDM", "Entrepreneurship Team Decision Making", "team_decision_making", "Entrepreneurship", ["Entrepreneurship", "Business Management", "Finance"]),
] as const;

export function getDecaRoleplayEvent(eventCode: string) {
  return DECA_ROLEPLAY_EVENTS.find((entry) => entry.eventCode === eventCode);
}

export function isDecaRoleplayEvent(eventCode: string | null | undefined): eventCode is string {
  return Boolean(eventCode && getDecaRoleplayEvent(eventCode));
}
