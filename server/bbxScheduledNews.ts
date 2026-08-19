export type BlueNewsImpactDirection = "positive" | "negative" | "neutral";
export type ScheduledBbxTemplate = {
  probabilityWeight: number;
  impactRanges?: { broadMarketPct?: readonly number[] };
};

const BLUE_NEWS_INTERVAL_MS = 3 * 60 * 60 * 1000;
export const BLUE_NEWS_RETENTION_MS = 4 * 24 * 60 * 60 * 1000;
export const BLUE_NEWS_CYCLE_EVENTS = 32;
export const BLUE_NEWS_CYCLE_DISTRIBUTION: Record<BlueNewsImpactDirection, number> = {
  positive: 17,
  negative: 12,
  neutral: 3,
};

export function blueNewsScheduleKey(now = new Date()) {
  return new Date(Math.floor(now.getTime() / BLUE_NEWS_INTERVAL_MS) * BLUE_NEWS_INTERVAL_MS).toISOString().slice(0, 13);
}

export function blueNewsRetentionCutoff(now = new Date()) {
  return new Date(now.getTime() - BLUE_NEWS_RETENTION_MS);
}

export function chooseBlueNewsTemplate<T extends ScheduledBbxTemplate>(templates: T[], random = Math.random) {
  if (templates.length === 0) throw new Error("At least one BBX event template is required");
  const totalWeight = templates.reduce((sum, template) => sum + template.probabilityWeight, 0);
  let roll = random() * totalWeight;
  for (const template of templates) {
    roll -= template.probabilityWeight;
    if (roll <= 0) return template;
  }
  return templates[templates.length - 1];
}

export function getBlueNewsImpactDirection(template: ScheduledBbxTemplate): BlueNewsImpactDirection {
  const range = template.impactRanges?.broadMarketPct ?? [0, 0];
  const midpoint = ((range[0] ?? 0) + (range[1] ?? range[0] ?? 0)) / 2;
  return midpoint > 0 ? "positive" : midpoint < 0 ? "negative" : "neutral";
}

/**
 * Produces a deterministic, evenly distributed cycle of 17 positive, 12
 * negative, and 3 neutral headlines. The mix counterbalances the event bank's
 * larger negative impacts while preserving meaningful downside events.
 */
export function getBlueNewsCycleDirection(tickNumber: number): BlueNewsImpactDirection {
  const slot = ((tickNumber % BLUE_NEWS_CYCLE_EVENTS) + BLUE_NEWS_CYCLE_EVENTS) % BLUE_NEWS_CYCLE_EVENTS;
  const counts: Record<BlueNewsImpactDirection, number> = { positive: 0, negative: 0, neutral: 0 };
  const directions: BlueNewsImpactDirection[] = ["positive", "negative", "neutral"];
  let chosen: BlueNewsImpactDirection = "positive";

  for (let index = 0; index <= slot; index += 1) {
    chosen = directions.reduce((best, direction) => {
      const bestGap = ((index + 1) * BLUE_NEWS_CYCLE_DISTRIBUTION[best]) / BLUE_NEWS_CYCLE_EVENTS - counts[best];
      const gap = ((index + 1) * BLUE_NEWS_CYCLE_DISTRIBUTION[direction]) / BLUE_NEWS_CYCLE_EVENTS - counts[direction];
      return gap > bestGap ? direction : best;
    }, directions[0]);
    counts[chosen] += 1;
  }

  return chosen;
}

export function chooseCalibratedBlueNewsTemplate<T extends ScheduledBbxTemplate>(templates: T[], tickNumber: number, random = Math.random) {
  if (templates.length === 0) throw new Error("At least one BBX event template is required");
  const direction = getBlueNewsCycleDirection(tickNumber);
  const matching = templates.filter((template) => getBlueNewsImpactDirection(template) === direction);
  return chooseBlueNewsTemplate(matching.length > 0 ? matching : templates, random);
}

export function projectedBlueNewsCycleLogReturn(templates: ScheduledBbxTemplate[]) {
  if (templates.length === 0) return 0;
  const expectedByDirection = (direction: BlueNewsImpactDirection) => {
    const matching = templates.filter((template) => getBlueNewsImpactDirection(template) === direction);
    const totalWeight = matching.reduce((sum, template) => sum + template.probabilityWeight, 0);
    if (totalWeight <= 0) return 0;
    return matching.reduce((sum, template) => {
      const range = template.impactRanges?.broadMarketPct ?? [0, 0];
      const midpoint = ((range[0] ?? 0) + (range[1] ?? range[0] ?? 0)) / 2;
      return sum + template.probabilityWeight * Math.log1p(midpoint);
    }, 0) / totalWeight;
  };
  return (["positive", "negative", "neutral"] as BlueNewsImpactDirection[]).reduce(
    (sum, direction) => sum + expectedByDirection(direction) * BLUE_NEWS_CYCLE_DISTRIBUTION[direction],
    0,
  ) / BLUE_NEWS_CYCLE_EVENTS;
}
