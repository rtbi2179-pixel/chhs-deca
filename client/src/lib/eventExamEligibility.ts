import { allEvents } from "@/pages/Events";

export const QUESTION_BANK_CLUSTERS = [
  "Marketing",
  "Business Management & Administration",
  "Finance",
  "Hospitality & Tourism",
] as const;

export type QuestionBankCluster = (typeof QUESTION_BANK_CLUSTERS)[number];

const EVENT_CLUSTER_TO_QUESTION_BANK_CLUSTER: Record<string, QuestionBankCluster | undefined> = {
  Marketing: "Marketing",
  "Business Management": "Business Management & Administration",
  Finance: "Finance",
  "Hospitality & Tourism": "Hospitality & Tourism",
};

export type EventExamGuidance = {
  eventCode: string;
  eventName: string;
  eventCluster: string;
  isTested: boolean;
  questionBankCluster?: QuestionBankCluster;
};

export function getEventExamGuidance(eventCode?: string | null): EventExamGuidance | null {
  if (!eventCode) return null;
  const event = allEvents.find((candidate) => candidate.code === eventCode.toUpperCase());
  if (!event) return null;

  return {
    eventCode: event.code,
    eventName: event.name,
    eventCluster: event.cluster,
    isTested: event.resources.some((resource) => resource.type === "exam"),
    questionBankCluster: EVENT_CLUSTER_TO_QUESTION_BANK_CLUSTER[event.cluster],
  };
}
