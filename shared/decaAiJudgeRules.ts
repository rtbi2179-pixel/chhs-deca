export type DecaRubricCriterion = {
  id: string;
  title: string;
  maximumPoints: number;
  assessableFromTranscript: boolean;
  evidenceFocus: string;
};

export type DecaAiJudgeRuleSet = {
  competitionYear: "2026-2027";
  eventCode: "EIP";
  eventName: "Innovation Plan";
  eventFamily: "Entrepreneurship";
  version: "DECA-2026-2027-EIP-v1";
  participantMin: number;
  participantMax: number;
  preparedEntryType: string;
  preparedEntryLimit: string;
  presentationTimeSeconds: number;
  judgeInteractionRules: string;
  maximumPoints: number;
  sourceUrl: string;
  sourceVersion: string;
  verified: true;
  annualTopic: null;
  criteria: readonly DecaRubricCriterion[];
};

export type DecaAiJudgeEventRegistryEntry = {
  competitionYear: "2026-2027";
  eventCode: string;
  eventName: string;
  category: string;
  participantMin: number | null;
  participantMax: number | null;
  preparedEntryType: string | null;
  preparedEntryLimit: string | null;
  presentationTimeSeconds: number | null;
  maximumPoints: number | null;
  sourceVersion: string;
  lastVerifiedAt: string | null;
  verified: boolean;
};

/**
 * This intentionally contains only the structured fields required to score the
 * first verified event. It is not a reproduction of the DECA Guide.
 */
export const VERIFIED_DECA_AI_JUDGE_RULE_SETS: readonly DecaAiJudgeRuleSet[] = [
  {
    competitionYear: "2026-2027",
    eventCode: "EIP",
    eventName: "Innovation Plan",
    eventFamily: "Entrepreneurship",
    version: "DECA-2026-2027-EIP-v1",
    participantMin: 1,
    participantMax: 3,
    preparedEntryType: "Concept pitch deck",
    preparedEntryLimit: "20 slides",
    presentationTimeSeconds: 15 * 60,
    judgeInteractionRules: "The 15-minute window includes judge questions; every participant presents and responds to questions.",
    maximumPoints: 100,
    sourceUrl: "https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c727b824720be717aa59f_HS_EIP_Guidelines.pdf",
    sourceVersion: "DECA Guide 2026-27, Innovation Plan",
    verified: true,
    annualTopic: null,
    criteria: [
      { id: "overview", title: "Overview", maximumPoints: 15, assessableFromTranscript: true, evidenceFocus: "Business idea, customer segments, problem solved, and evidence-supported rationale." },
      { id: "business_opportunity", title: "Business Opportunity", maximumPoints: 15, assessableFromTranscript: true, evidenceFocus: "Needs, root causes, scope, urgency, relevance, and supporting evidence." },
      { id: "customer_segments", title: "Customer Segments", maximumPoints: 15, assessableFromTranscript: true, evidenceFocus: "Target needs, behaviors, challenges, and fit to problem and solution." },
      { id: "unique_value_proposition", title: "Unique Value Proposition", maximumPoints: 15, assessableFromTranscript: true, evidenceFocus: "Clear differentiation, why the solution matters, and comparisons to alternatives." },
      { id: "solution", title: "Solution", maximumPoints: 15, assessableFromTranscript: true, evidenceFocus: "Features, connection to the need, feasibility, and value proposition alignment." },
      { id: "organization", title: "Organization", maximumPoints: 5, assessableFromTranscript: true, evidenceFocus: "Logical sequence that can be followed and understood." },
      { id: "persuasion", title: "Persuasion", maximumPoints: 5, assessableFromTranscript: true, evidenceFocus: "A clear, logically supported case for pursuing the innovation plan." },
      { id: "delivery", title: "Delivery", maximumPoints: 5, assessableFromTranscript: false, evidenceFocus: "Requires audio or video evidence of engagement techniques." },
      { id: "presentation_design", title: "Presentation Design", maximumPoints: 5, assessableFromTranscript: false, evidenceFocus: "Requires slide or video evidence of visual aids, themes, professionalism, and value." },
      { id: "overall_impression", title: "Overall Impression", maximumPoints: 5, assessableFromTranscript: false, evidenceFocus: "Requires audio or video evidence for professional presence, poise, and confidence." },
    ],
  },
] as const;

const unverifiedPreparedEvents: ReadonlyArray<readonly [string, string, string]> = [
  ["BOR", "Business Services Operations Research", "Business Operations Research"],
  ["BMOR", "Buying and Merchandising Operations Research", "Business Operations Research"],
  ["FOR", "Finance Operations Research", "Business Operations Research"],
  ["HTOR", "Hospitality and Tourism Operations Research", "Business Operations Research"],
  ["SEOR", "Sports and Entertainment Marketing Operations Research", "Business Operations Research"],
  ["PMBS", "Business Solutions Project", "Project Management"],
  ["PMCD", "Career Development Project", "Project Management"],
  ["PMCA", "Community Awareness Project", "Project Management"],
  ["PMCG", "Community Giving Project", "Project Management"],
  ["PMFL", "Financial Literacy Project", "Project Management"],
  ["PMSP", "Sales Project", "Project Management"],
  ["EBG", "Business Growth Plan", "Entrepreneurship"],
  ["EFB", "Franchise Business Plan", "Entrepreneurship"],
  ["EIB", "Independent Business Plan", "Entrepreneurship"],
  ["IBP", "International Business Plan", "Entrepreneurship"],
  ["ESB", "Start-Up Business Plan", "Entrepreneurship"],
  ["IMCE", "Integrated Marketing Campaign—Event", "Integrated Marketing Campaign"],
  ["IMCP", "Integrated Marketing Campaign—Product", "Integrated Marketing Campaign"],
  ["IMCS", "Integrated Marketing Campaign—Service", "Integrated Marketing Campaign"],
  ["SMG", "Stock Market Game", "Other Prepared Presentation"],
];

/**
 * This is an event registry, not a scoring registry. Entries remain unverified
 * until their event-specific guideline and evaluation form have been checked.
 */
export const DECA_AI_JUDGE_EVENT_REGISTRY: readonly DecaAiJudgeEventRegistryEntry[] = [
  ...VERIFIED_DECA_AI_JUDGE_RULE_SETS.map((ruleSet) => ({
    competitionYear: ruleSet.competitionYear,
    eventCode: ruleSet.eventCode,
    eventName: ruleSet.eventName,
    category: ruleSet.eventFamily,
    participantMin: ruleSet.participantMin,
    participantMax: ruleSet.participantMax,
    preparedEntryType: ruleSet.preparedEntryType,
    preparedEntryLimit: ruleSet.preparedEntryLimit,
    presentationTimeSeconds: ruleSet.presentationTimeSeconds,
    maximumPoints: ruleSet.maximumPoints,
    sourceVersion: ruleSet.sourceVersion,
    lastVerifiedAt: "2026-08-21",
    verified: true,
  })),
  ...unverifiedPreparedEvents.map(([eventCode, eventName, category]) => ({
    competitionYear: "2026-2027" as const,
    eventCode,
    eventName,
    category,
    participantMin: null,
    participantMax: null,
    preparedEntryType: null,
    preparedEntryLimit: null,
    presentationTimeSeconds: null,
    maximumPoints: null,
    sourceVersion: "Official DECA 2026–2027 competitive-event directory; detailed rule form pending verification",
    lastVerifiedAt: null,
    verified: false,
  })),
];

/** Explicit historical alias; it never changes stored historical event codes. */
export const DECA_AI_JUDGE_LEGACY_EVENT_ALIASES: Readonly<Record<string, string>> = { EIN: "EIP" };

export function getVerifiedDecaAiJudgeRuleSet(competitionYear: string, eventCode: string) {
  return VERIFIED_DECA_AI_JUDGE_RULE_SETS.find((ruleSet) => ruleSet.competitionYear === competitionYear && ruleSet.eventCode === eventCode.toUpperCase()) ?? null;
}
