export const CREDIT_SCORE_TREND_WINDOW_DAYS = 30;
export const CREDIT_SCORE_TREND_BUCKET_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type CreditScoreHistoryRecord = {
  calculatedAt: Date | string | null;
  newScore: number;
  scoreChange: number;
  reason?: string | null;
};

export type CreditScoreTrendPoint = {
  date: string;
  periodStart: string;
  periodEnd: string;
  score: number;
  change: number;
  sampleCount: number;
  reason: string | null;
};

function formatPeriodDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(value);
}

export function buildCreditScoreMonthlyTrend(history: CreditScoreHistoryRecord[], now = new Date()): CreditScoreTrendPoint[] {
  const windowEnd = now.getTime();
  const windowStart = windowEnd - CREDIT_SCORE_TREND_WINDOW_DAYS * DAY_MS;
  const bucketCount = Math.ceil(CREDIT_SCORE_TREND_WINDOW_DAYS / CREDIT_SCORE_TREND_BUCKET_DAYS);
  const buckets = new Map<number, Array<CreditScoreHistoryRecord & { timestamp: number }>>();

  for (const record of history) {
    if (!record.calculatedAt) continue;
    const timestamp = new Date(record.calculatedAt).getTime();
    if (!Number.isFinite(timestamp) || timestamp < windowStart || timestamp > windowEnd) continue;
    const bucketIndex = Math.min(bucketCount - 1, Math.floor((timestamp - windowStart) / (CREDIT_SCORE_TREND_BUCKET_DAYS * DAY_MS)));
    const bucket = buckets.get(bucketIndex) ?? [];
    bucket.push({ ...record, timestamp });
    buckets.set(bucketIndex, bucket);
  }

  let previousScore: number | null = null;
  return Array.from(buckets.entries()).sort(([left], [right]) => left - right).map(([bucketIndex, records]) => {
    const ordered = records.slice().sort((left, right) => left.timestamp - right.timestamp);
    const latest = ordered[ordered.length - 1];
    const periodStart = new Date(windowStart + bucketIndex * CREDIT_SCORE_TREND_BUCKET_DAYS * DAY_MS);
    const periodEnd = new Date(Math.min(windowStart + ((bucketIndex + 1) * CREDIT_SCORE_TREND_BUCKET_DAYS - 1) * DAY_MS, windowEnd));
    const change = previousScore === null ? latest.scoreChange : latest.newScore - previousScore;
    previousScore = latest.newScore;
    return {
      date: `${formatPeriodDate(periodStart)}–${formatPeriodDate(periodEnd)}`,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      score: latest.newScore,
      change,
      sampleCount: ordered.length,
      reason: latest.reason ?? null,
    };
  });
}
