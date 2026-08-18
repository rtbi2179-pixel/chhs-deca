export const EVENT_MATCH_TRAITS = [
  "presentation",
  "analytical",
  "quantitative",
  "creativity",
  "leadership",
  "entrepreneurship",
  "marketing",
  "finance",
  "hospitality",
  "management",
  "teamwork",
  "researchWriting",
  "persuasion",
  "improvisation",
  "preparation",
] as const;

export type EventMatchTrait = (typeof EVENT_MATCH_TRAITS)[number];
export type TraitScores = Record<EventMatchTrait, number>;

export type EventMatchOption = {
  id: string;
  label: string;
  scores: Partial<TraitScores>;
};

export type EventMatchQuestion = {
  id: string;
  prompt: string;
  helper: string;
  options: EventMatchOption[];
};

export const EVENT_MATCH_QUESTIONS: EventMatchQuestion[] = [
  {
    id: "interest",
    prompt: "Which DECA focus sounds most interesting?",
    helper: "Choose the idea you would be most excited to explore.",
    options: [
      { id: "marketing", label: "Creating a marketing campaign", scores: { marketing: 3, creativity: 2, presentation: 1 } },
      { id: "management", label: "Managing a business or team", scores: { management: 3, leadership: 2, analytical: 1 } },
      { id: "finance", label: "Analyzing financial information", scores: { finance: 3, quantitative: 2, analytical: 2 } },
      { id: "startup", label: "Starting or growing my own company", scores: { entrepreneurship: 3, leadership: 2, creativity: 1 } },
      { id: "hospitality", label: "Improving a hotel, restaurant, or travel experience", scores: { hospitality: 3, management: 1, presentation: 1 } },
    ],
  },
  {
    id: "competition-style",
    prompt: "In a competition, I would rather…",
    helper: "There is no wrong answer—DECA has several competition styles.",
    options: [
      { id: "prepare", label: "Prepare a detailed plan beforehand", scores: { preparation: 3, researchWriting: 2 } },
      { id: "think", label: "Think on my feet in a live scenario", scores: { improvisation: 3, presentation: 2, analytical: 1 } },
      { id: "mix", label: "Use a mixture of preparation and live decisions", scores: { preparation: 2, improvisation: 2, presentation: 1 } },
      { id: "unsure", label: "I am not sure yet", scores: { preparation: 1, improvisation: 1 } },
    ],
  },
  {
    id: "presentation-comfort",
    prompt: "How comfortable are you presenting to judges?",
    helper: "Comfort can grow with practice; this only helps match an event style.",
    options: [
      { id: "very", label: "Very comfortable", scores: { presentation: 3, persuasion: 2, improvisation: 1 } },
      { id: "somewhat", label: "Somewhat comfortable", scores: { presentation: 2, persuasion: 1 } },
      { id: "learning", label: "Nervous, but willing to learn", scores: { presentation: 1, preparation: 2 } },
      { id: "less", label: "I would prefer less presentation", scores: { researchWriting: 2, analytical: 1, preparation: 2 } },
    ],
  },
  {
    id: "strength",
    prompt: "Which skill sounds most like you?",
    helper: "Pick the strength you use most naturally today.",
    options: [
      { id: "creative", label: "Creative problem solving", scores: { creativity: 3, marketing: 1, entrepreneurship: 1 } },
      { id: "persuasion", label: "Persuasion and communication", scores: { persuasion: 3, presentation: 2, marketing: 1 } },
      { id: "numbers", label: "Working with numbers", scores: { quantitative: 3, finance: 2, analytical: 1 } },
      { id: "lead", label: "Leading people or projects", scores: { leadership: 3, management: 2, teamwork: 1 } },
      { id: "research", label: "Research and writing", scores: { researchWriting: 3, preparation: 2, analytical: 1 } },
      { id: "service", label: "Customer service", scores: { hospitality: 3, presentation: 1, management: 1 } },
    ],
  },
  {
    id: "team-preference",
    prompt: "Would you rather compete…",
    helper: "You can still build teamwork skills in any event.",
    options: [
      { id: "solo", label: "Individually", scores: { presentation: 1, preparation: 1 } },
      { id: "partner", label: "With a partner", scores: { teamwork: 3, leadership: 1 } },
      { id: "either", label: "Either is fine", scores: { teamwork: 1, presentation: 1 } },
      { id: "unknown", label: "I do not know yet", scores: { teamwork: 1 } },
    ],
  },
  {
    id: "project",
    prompt: "Which project sounds most enjoyable?",
    helper: "Think about the problem you would want to solve.",
    options: [
      { id: "pitch", label: "Pitching a product or recommendation", scores: { persuasion: 3, presentation: 2, marketing: 1 } },
      { id: "business-problem", label: "Solving a business problem", scores: { analytical: 3, management: 2, improvisation: 1 } },
      { id: "plan", label: "Building a business plan", scores: { entrepreneurship: 3, researchWriting: 2, preparation: 2 } },
      { id: "investments", label: "Analyzing investments", scores: { finance: 3, quantitative: 2, analytical: 2 } },
      { id: "advertising", label: "Designing an advertising strategy", scores: { marketing: 3, creativity: 2, presentation: 1 } },
      { id: "experience", label: "Improving a customer experience", scores: { hospitality: 3, management: 1, creativity: 1 } },
    ],
  },
  {
    id: "numbers-comfort",
    prompt: "How do you feel about numbers and financial calculations?",
    helper: "This does not determine your ability—only your current preference.",
    options: [
      { id: "enjoy", label: "I really enjoy them", scores: { quantitative: 3, finance: 3, analytical: 1 } },
      { id: "comfortable", label: "I am comfortable with them", scores: { quantitative: 2, finance: 2 } },
      { id: "can-do", label: "I can do them, but they are not my favorite", scores: { quantitative: 1, analytical: 1 } },
      { id: "avoid", label: "I would rather avoid number-heavy events", scores: { creativity: 1, presentation: 1 } },
    ],
  },
  {
    id: "activity",
    prompt: "Which activity sounds more enjoyable?",
    helper: "Choose the work style that would keep you engaged.",
    options: [
      { id: "speak", label: "Speaking and improvising", scores: { improvisation: 3, presentation: 2, persuasion: 1 } },
      { id: "research", label: "Researching and preparing", scores: { researchWriting: 3, preparation: 2, analytical: 1 } },
      { id: "design", label: "Designing and creating", scores: { creativity: 3, marketing: 1, entrepreneurship: 1 } },
      { id: "analyze", label: "Analyzing information", scores: { analytical: 3, quantitative: 1, finance: 1 } },
    ],
  },
  {
    id: "business-lens",
    prompt: "If a business was struggling, what would you naturally look at first?",
    helper: "Your first instinct says a lot about the business problems you enjoy.",
    options: [
      { id: "marketing", label: "Its marketing", scores: { marketing: 3, creativity: 1, analytical: 1 } },
      { id: "finances", label: "Its finances", scores: { finance: 3, quantitative: 2, analytical: 1 } },
      { id: "people", label: "Its employees and management", scores: { management: 3, leadership: 2, teamwork: 1 } },
      { id: "customers", label: "Its customer experience", scores: { hospitality: 3, management: 1, presentation: 1 } },
      { id: "opportunities", label: "New business opportunities", scores: { entrepreneurship: 3, creativity: 2, leadership: 1 } },
    ],
  },
  {
    id: "preparation-depth",
    prompt: "How much preparation would you prefer before competition?",
    helper: "Some events reward rapid decisions; others reward a long-term project.",
    options: [
      { id: "spontaneous", label: "Mostly spontaneous", scores: { improvisation: 3, presentation: 1 } },
      { id: "some", label: "Some preparation", scores: { preparation: 2, improvisation: 1 } },
      { id: "weeks", label: "Several weeks of preparation", scores: { preparation: 3, researchWriting: 1 } },
      { id: "months", label: "Months working on a detailed project", scores: { preparation: 3, researchWriting: 3, leadership: 1 } },
    ],
  },
  {
    id: "environment",
    prompt: "Which environment interests you most?",
    helper: "This gives a small context boost—it never decides your match by itself.",
    options: [
      { id: "sports", label: "Sports and entertainment", scores: { marketing: 2, presentation: 1 } },
      { id: "retail", label: "Fashion and retail", scores: { marketing: 2, creativity: 1 } },
      { id: "banking", label: "Finance and banking", scores: { finance: 2, quantitative: 1 } },
      { id: "restaurants", label: "Restaurants and hospitality", scores: { hospitality: 2, management: 1 } },
      { id: "startup", label: "Entrepreneurship", scores: { entrepreneurship: 2, leadership: 1 } },
      { id: "business", label: "General business", scores: { management: 2, analytical: 1 } },
      { id: "advertising", label: "Marketing and advertising", scores: { marketing: 2, creativity: 1 } },
    ],
  },
  {
    id: "statement",
    prompt: "Which statement fits you best?",
    helper: "Choose the one that feels most natural—not the one you think sounds best.",
    options: [
      { id: "convince", label: "I like convincing people", scores: { persuasion: 3, presentation: 2, marketing: 1 } },
      { id: "works", label: "I like figuring out why something works", scores: { analytical: 3, quantitative: 1 } },
      { id: "organize", label: "I like organizing people and projects", scores: { management: 3, leadership: 2, teamwork: 1 } },
      { id: "ideas", label: "I like creating new ideas", scores: { creativity: 3, entrepreneurship: 1, marketing: 1 } },
      { id: "data", label: "I like analyzing data", scores: { analytical: 3, quantitative: 2, finance: 1 } },
      { id: "customers", label: "I like helping customers", scores: { hospitality: 3, presentation: 1, management: 1 } },
    ],
  },
];

export type EventMatchProfile = {
  eventCode: string;
  weights: Partial<TraitScores>;
  focusLabel: string;
  style: "roleplay" | "prepared" | "selling" | "team" | "simulation";
};

const roleplay = (eventCode: string, focusLabel: string, weights: Partial<TraitScores>): EventMatchProfile => ({
  eventCode,
  focusLabel,
  style: "roleplay",
  weights: { presentation: 3, improvisation: 3, analytical: 2, ...weights },
});

const prepared = (eventCode: string, focusLabel: string, weights: Partial<TraitScores>): EventMatchProfile => ({
  eventCode,
  focusLabel,
  style: "prepared",
  weights: { preparation: 3, researchWriting: 3, analytical: 2, ...weights },
});

const selling = (eventCode: string, focusLabel: string, weights: Partial<TraitScores>): EventMatchProfile => ({
  eventCode,
  focusLabel,
  style: "selling",
  weights: { presentation: 3, persuasion: 3, improvisation: 2, ...weights },
});

const team = (eventCode: string, focusLabel: string, weights: Partial<TraitScores>): EventMatchProfile => ({
  eventCode,
  focusLabel,
  style: "team",
  weights: { teamwork: 3, presentation: 2, improvisation: 2, analytical: 2, ...weights },
});

export const EVENT_MATCH_PROFILES: EventMatchProfile[] = [
  roleplay("AAM", "apparel and retail marketing", { marketing: 3, creativity: 2 }),
  roleplay("ASM", "automotive services marketing", { marketing: 3, management: 2 }),
  roleplay("BSM", "business services marketing", { marketing: 3, analytical: 2 }),
  roleplay("FMS", "food marketing", { marketing: 3, management: 2 }),
  roleplay("MCS", "advertising and communications", { marketing: 3, creativity: 3 }),
  roleplay("RMS", "retail merchandising", { marketing: 3, management: 2 }),
  roleplay("SEM", "sports and entertainment marketing", { marketing: 3, presentation: 3, creativity: 2 }),
  roleplay("PMK", "marketing fundamentals", { marketing: 3, preparation: 1 }),
  team("MTDM", "marketing management", { marketing: 3, management: 2 }),
  team("BTDM", "buying and merchandising", { marketing: 3, analytical: 2 }),
  team("STDM", "sports and entertainment marketing", { marketing: 3, creativity: 2 }),
  selling("PSE", "professional selling", { marketing: 2, management: 1 }),
  prepared("SEOR", "sports and entertainment operations research", { marketing: 3, creativity: 1 }),
  prepared("BMOR", "buying and merchandising operations research", { marketing: 3, analytical: 1 }),
  prepared("IMCE", "integrated event marketing", { marketing: 3, creativity: 3 }),
  prepared("IMCP", "integrated product marketing", { marketing: 3, creativity: 3 }),
  prepared("IMCS", "integrated service marketing", { marketing: 3, creativity: 3 }),
  prepared("PMSP", "sales project management", { marketing: 3, persuasion: 2 }),
  roleplay("ACT", "accounting applications", { finance: 3, quantitative: 3, analytical: 3 }),
  roleplay("BFS", "business finance", { finance: 3, quantitative: 3, analytical: 3 }),
  selling("FCE", "financial consulting", { finance: 3, analytical: 2, quantitative: 2 }),
  roleplay("PFN", "finance fundamentals", { finance: 3, quantitative: 2 }),
  team("FTDM", "financial services", { finance: 3, quantitative: 2, analytical: 2 }),
  prepared("FOR", "finance operations research", { finance: 3, quantitative: 3, analytical: 3 }),
  { eventCode: "SMG", focusLabel: "investment portfolio management", style: "simulation", weights: { finance: 3, quantitative: 3, analytical: 3, teamwork: 2, preparation: 2 } },
  roleplay("HLM", "hotel and lodging management", { hospitality: 3, management: 2 }),
  roleplay("QSRM", "quick service restaurant management", { hospitality: 3, management: 3 }),
  roleplay("RFSM", "restaurant and food service management", { hospitality: 3, management: 3 }),
  roleplay("PHT", "hospitality and tourism fundamentals", { hospitality: 3, presentation: 2 }),
  team("HTDM", "hospitality services", { hospitality: 3, management: 2 }),
  team("TTDM", "travel and tourism", { hospitality: 3, creativity: 1 }),
  selling("HTPS", "hospitality and tourism professional selling", { hospitality: 3, management: 1 }),
  prepared("HTOR", "hospitality and tourism operations research", { hospitality: 3, management: 2 }),
  roleplay("HRM", "human resources management", { management: 3, leadership: 3, teamwork: 2 }),
  roleplay("PBM", "business management fundamentals", { management: 3, leadership: 2 }),
  team("BLTDM", "business law and ethics", { management: 3, analytical: 2 }),
  prepared("BOR", "business services operations research", { management: 3, analytical: 2 }),
  prepared("PMBS", "business solutions project", { management: 3, leadership: 2, entrepreneurship: 1 }),
  prepared("PMCD", "career development project", { leadership: 3, researchWriting: 3, preparation: 3 }),
  prepared("PMCA", "community awareness project", { leadership: 3, creativity: 2, marketing: 1 }),
  prepared("PMCG", "community giving project", { leadership: 3, teamwork: 2, management: 1 }),
  prepared("IBP", "international business planning", { entrepreneurship: 3, researchWriting: 3, management: 2 }),
  roleplay("ENT", "entrepreneurship", { entrepreneurship: 3, creativity: 2, leadership: 2 }),
  roleplay("PEN", "entrepreneurship fundamentals", { entrepreneurship: 3, creativity: 2 }),
  team("ETDM", "entrepreneurship", { entrepreneurship: 3, creativity: 2 }),
  prepared("EBG", "business growth planning", { entrepreneurship: 3, researchWriting: 3, management: 2 }),
  prepared("EFB", "franchise business planning", { entrepreneurship: 3, researchWriting: 3, management: 2 }),
  prepared("EIB", "independent business planning", { entrepreneurship: 3, researchWriting: 3, creativity: 1 }),
  prepared("EIP", "innovation planning", { entrepreneurship: 3, creativity: 3, researchWriting: 2 }),
  prepared("ESB", "start-up business planning", { entrepreneurship: 3, creativity: 2, researchWriting: 3 }),
  roleplay("PFL", "personal financial literacy", { finance: 3, quantitative: 2, analytical: 2 }),
  prepared("PMFL", "financial literacy project management", { finance: 3, leadership: 2, researchWriting: 2 }),
];

const traitLabels: Record<EventMatchTrait, string> = {
  presentation: "Presentation",
  analytical: "Analytical thinking",
  quantitative: "Quantitative thinking",
  creativity: "Creativity",
  leadership: "Leadership",
  entrepreneurship: "Entrepreneurship",
  marketing: "Marketing interest",
  finance: "Finance interest",
  hospitality: "Hospitality interest",
  management: "Management interest",
  teamwork: "Teamwork",
  researchWriting: "Research and writing",
  persuasion: "Persuasion",
  improvisation: "Quick decision making",
  preparation: "Preparation",
};

export type EventMatchRecommendation = {
  eventCode: string;
  compatibility: number;
  focusLabel: string;
  style: EventMatchProfile["style"];
  strengths: string[];
};

export function blankTraitScores(): TraitScores {
  return Object.fromEntries(EVENT_MATCH_TRAITS.map((trait) => [trait, 0])) as TraitScores;
}

export function scoreEventMatchQuiz(answerIds: Record<string, string>) {
  const traitScores = blankTraitScores();
  for (const question of EVENT_MATCH_QUESTIONS) {
    const answer = question.options.find((option) => option.id === answerIds[question.id]);
    if (!answer) throw new Error(`Please answer the ${question.id} question.`);
    for (const [trait, value] of Object.entries(answer.scores) as Array<[EventMatchTrait, number]>) {
      traitScores[trait] += value;
    }
  }

  const rawScores = EVENT_MATCH_PROFILES.map((profile) => ({
    profile,
    score: EVENT_MATCH_TRAITS.reduce((total, trait) => total + traitScores[trait] * (profile.weights[trait] ?? 0), 0),
  }));
  const maxScore = Math.max(...rawScores.map((item) => item.score), 1);
  const recommendations = rawScores
    .sort((a, b) => b.score - a.score || a.profile.eventCode.localeCompare(b.profile.eventCode))
    .slice(0, 3)
    .map(({ profile, score }, index): EventMatchRecommendation => {
      const strengths = EVENT_MATCH_TRAITS
        .filter((trait) => traitScores[trait] > 0 && (profile.weights[trait] ?? 0) > 0)
        .sort((left, right) => (traitScores[right] * (profile.weights[right] ?? 0)) - (traitScores[left] * (profile.weights[left] ?? 0)))
        .slice(0, 4)
        .map((trait) => traitLabels[trait]);
      return {
        eventCode: profile.eventCode,
        compatibility: Math.max(55, Math.min(98, Math.round(61 + (score / maxScore) * 35 - index * 2))),
        focusLabel: profile.focusLabel,
        style: profile.style,
        strengths,
      };
    });

  return { traitScores, recommendations };
}
