import { describe, expect, it } from "vitest";
import { BLUE_NEWS_RETENTION_MS, blueNewsRetentionCutoff, blueNewsScheduleKey, chooseBlueNewsTemplate } from "./bbxScheduledNews";

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

  it("uses a strict four-day retention cutoff so only older articles are removed", () => {
    const now = new Date("2026-08-17T12:00:00.000Z");
    expect(blueNewsRetentionCutoff(now).toISOString()).toBe("2026-08-13T12:00:00.000Z");
    expect(BLUE_NEWS_RETENTION_MS).toBe(4 * 24 * 60 * 60 * 1000);
  });
});
