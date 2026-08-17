import { describe, expect, it } from "vitest";
import { getChapterExamAvailability, getChapterExamBaseMinutes, getChapterExamExpiresAt, isRapidChapterExamAnswer } from "./chapterExam";

describe("chapter exam controls", () => {
  it("only permits an enabled exam within its configured availability window", () => {
    const now = new Date("2026-08-17T12:00:00.000Z");
    expect(getChapterExamAvailability(null, now).isAvailable).toBe(false);
    expect(getChapterExamAvailability({ isEnabled: true, availableFrom: new Date("2026-08-17T11:00:00.000Z"), availableUntil: new Date("2026-08-17T13:00:00.000Z") }, now).isAvailable).toBe(true);
    expect(getChapterExamAvailability({ isEnabled: true, availableFrom: new Date("2026-08-17T13:00:00.000Z"), availableUntil: null }, now).isAvailable).toBe(false);
  });

  it("adds configured time and flags only rapid answers", () => {
    const startedAt = new Date("2026-08-17T12:00:00.000Z");
    expect(getChapterExamBaseMinutes(25)).toBeGreaterThanOrEqual(20);
    expect(getChapterExamExpiresAt(startedAt, 25, 10).getTime()).toBeGreaterThan(startedAt.getTime());
    expect(isRapidChapterExamAnswer(8)).toBe(true);
    expect(isRapidChapterExamAnswer(9)).toBe(false);
  });
});
