import { describe, expect, it } from "vitest";
import bbxEventBank from "./bbxEventBank.json";
import { BLUE_NEWS_CYCLE_DISTRIBUTION, BLUE_NEWS_CYCLE_EVENTS, BLUE_NEWS_RETENTION_MS, blueNewsRetentionCutoff, blueNewsScheduleKey, chooseBlueNewsTemplate, chooseCalibratedBlueNewsTemplate, getBlueNewsCycleDirection, getBlueNewsImpactDirection, projectedBlueNewsCycleLogReturn } from "./bbxScheduledNews";

describe("BBX Blue’s News schedule", () => {
  it("uses one stable UTC idempotency key for a three-hour schedule window", () => {
    expect(blueNewsScheduleKey(new Date("2026-08-14T03:00:00.000Z"))).toBe("2026-08-14T03");
    expect(blueNewsScheduleKey(new Date("2026-08-14T05:59:59.999Z"))).toBe("2026-08-14T03");
    expect(blueNewsScheduleKey(new Date("2026-08-14T06:00:00.000Z"))).toBe("2026-08-14T06");
  });

  it("selects an event with its configured weighted probability bands", () => {
    const templates = [{ id: "lower", probabilityWeight: 2 }, { id: "higher", probabilityWeight: 8 }];
    expect(chooseBlueNewsTemplate(templates, () => 0.19).id).toBe("lower");
    expect(chooseBlueNewsTemplate(templates, () => 0.21).id).toBe("higher");
  });

  it("refuses an invalid empty event-bank configuration", () => {
    expect(() => chooseBlueNewsTemplate([], () => 0.5)).toThrow("At least one BBX event template is required");
  });

  it("uses the declared positive, negative, and neutral distribution across a full news cycle", () => {
    const counts = Array.from({ length: BLUE_NEWS_CYCLE_EVENTS }, (_, tick) => getBlueNewsCycleDirection(tick)).reduce(
      (summary, direction) => ({ ...summary, [direction]: summary[direction] + 1 }),
      { positive: 0, negative: 0, neutral: 0 },
    );
    expect(counts).toEqual(BLUE_NEWS_CYCLE_DISTRIBUTION);
    expect(getBlueNewsCycleDirection(BLUE_NEWS_CYCLE_EVENTS + 4)).toBe(getBlueNewsCycleDirection(4));
  });

  it("selects templates from the direction required by each scheduled cycle slot", () => {
    const templates = [
      { id: "positive", probabilityWeight: 1, impactRanges: { broadMarketPct: [0.01, 0.01] } },
      { id: "negative", probabilityWeight: 1, impactRanges: { broadMarketPct: [-0.01, -0.01] } },
      { id: "neutral", probabilityWeight: 1, impactRanges: { broadMarketPct: [0, 0] } },
    ];
    for (let tick = 0; tick < BLUE_NEWS_CYCLE_EVENTS; tick += 1) {
      const selected = chooseCalibratedBlueNewsTemplate(templates, tick, () => 0.5);
      expect(getBlueNewsImpactDirection(selected)).toBe(getBlueNewsCycleDirection(tick));
    }
  });

  it("keeps the weighted event-bank impact bounded so the BBX baseline can offset it deterministically", () => {
    const projected = projectedBlueNewsCycleLogReturn(bbxEventBank);
    expect(Number.isFinite(projected)).toBe(true);
    expect(Math.abs(projected)).toBeLessThan(0.001);
  });

  it("uses a strict four-day retention cutoff so only older articles are removed", () => {
    const now = new Date("2026-08-17T12:00:00.000Z");
    expect(blueNewsRetentionCutoff(now).toISOString()).toBe("2026-08-13T12:00:00.000Z");
    expect(BLUE_NEWS_RETENTION_MS).toBe(4 * 24 * 60 * 60 * 1000);
  });
});
