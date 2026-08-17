export type ScheduledBbxTemplate = { probabilityWeight: number };

const BLUE_NEWS_INTERVAL_MS = 3 * 60 * 60 * 1000;
export const BLUE_NEWS_RETENTION_MS = 4 * 24 * 60 * 60 * 1000;

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
