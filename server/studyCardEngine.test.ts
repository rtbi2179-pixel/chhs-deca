import { describe, expect, it } from "vitest";
import { calculateStudyCardLevel, calculateStudyCardQuestionReward, getMaverickDailyFocus, STUDY_CARD_CATALOG } from "./studyCardEngine";

describe("virtual Study Card reward engine", () => {
  const stableDate = new Date("2026-08-14T12:00:00.000Z");

  it("defines ten specialization profiles with transparent tradeoffs and no cash mechanics", () => {
    expect(STUDY_CARD_CATALOG).toHaveLength(10);
    expect(new Set(STUDY_CARD_CATALOG.map((card) => card.key)).size).toBe(10);
    expect(STUDY_CARD_CATALOG.every((card) => card.tradeoff.length > 0)).toBe(true);
    expect(STUDY_CARD_CATALOG.every((card) => !/cash|wager|withdraw/i.test(card.liveBenefit))).toBe(true);
  });

  it("applies only the advertised eligible practice multipliers and preserves base rewards elsewhere", () => {
    expect(calculateStudyCardQuestionReward(100, "scholar", "Easy", 7, stableDate)).toEqual({ amount: 110, multiplier: 1.1, bonus: 10 });
    expect(calculateStudyCardQuestionReward(100, "entrepreneur", "Hard", 7, stableDate)).toEqual({ amount: 120, multiplier: 1.2, bonus: 20 });
    expect(calculateStudyCardQuestionReward(100, "entrepreneur", "Medium", 7, stableDate)).toEqual({ amount: 100, multiplier: 1, bonus: 0 });
    expect(calculateStudyCardQuestionReward(100, "investor", "Hard", 7, stableDate)).toEqual({ amount: 100, multiplier: 1, bonus: 0 });
  });

  it("uses a repeatable daily Maverick focus and bounded progression", () => {
    expect(getMaverickDailyFocus(7, stableDate)).toBe(getMaverickDailyFocus(7, stableDate));
    expect(calculateStudyCardLevel(0)).toBe(1);
    expect(calculateStudyCardLevel(500)).toBe(3);
    expect(calculateStudyCardLevel(5000)).toBe(5);
  });
});
