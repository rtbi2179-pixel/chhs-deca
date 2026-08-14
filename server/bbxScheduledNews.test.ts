import { describe, expect, it } from "vitest";
import { blueNewsScheduleKey, chooseBlueNewsTemplate } from "./bbxScheduledNews";

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
});
