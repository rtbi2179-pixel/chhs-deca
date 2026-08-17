export const CHAPTER_EXAM_CLUSTERS = [
  "Marketing",
  "Business Management & Administration",
  "Finance",
  "Hospitality & Tourism",
] as const;

export const CHAPTER_EXAM_QUESTION_COUNTS = [25, 50, 75, 100] as const;
export const RAPID_ANSWER_THRESHOLD_SECONDS = 8;

type AvailabilityConfig = {
  isEnabled: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
};

export function getChapterExamAvailability(config: AvailabilityConfig | null | undefined, now = new Date()) {
  if (!config || !config.isEnabled) {
    return { isAvailable: false, reason: "Your chapter has not enabled a chapter mock exam." } as const;
  }
  if (config.availableFrom && now < config.availableFrom) {
    return { isAvailable: false, reason: "The chapter mock exam is not open yet.", opensAt: config.availableFrom } as const;
  }
  if (config.availableUntil && now > config.availableUntil) {
    return { isAvailable: false, reason: "The chapter mock exam availability window has closed.", closedAt: config.availableUntil } as const;
  }
  return { isAvailable: true } as const;
}

export function getChapterExamBaseMinutes(questionCount: number) {
  return Math.max(20, Math.ceil(questionCount * 0.9));
}

export function getChapterExamExpiresAt(startedAt: Date, questionCount: number, extraTimeMinutes: number) {
  return new Date(startedAt.getTime() + (getChapterExamBaseMinutes(questionCount) + extraTimeMinutes) * 60_000);
}

export function isRapidChapterExamAnswer(elapsedSeconds: number) {
  return elapsedSeconds >= 0 && elapsedSeconds <= RAPID_ANSWER_THRESHOLD_SECONDS;
}
