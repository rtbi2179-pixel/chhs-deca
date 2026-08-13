import { describe, expect, it } from "vitest";
import { GACHA_RARITY_CONFIG, getGachaRarityCost, selectGachaRarity } from "./gachaRarity";

describe("gacha rarity rules", () => {
  it("defines the required rarity probabilities and costs", () => {
    expect(GACHA_RARITY_CONFIG).toEqual([
      { rarity: "common", probability: 0.6, cost: 100 },
      { rarity: "rare", probability: 0.25, cost: 250 },
      { rarity: "epic", probability: 0.1, cost: 500 },
      { rarity: "legendary", probability: 0.05, cost: 1000 },
    ]);
    expect(GACHA_RARITY_CONFIG.reduce((total, config) => total + config.probability, 0)).toBe(1);
  });

  it("selects each rarity at the correct threshold boundaries", () => {
    expect(selectGachaRarity(0)).toBe("common");
    expect(selectGachaRarity(0.599999)).toBe("common");
    expect(selectGachaRarity(0.6)).toBe("rare");
    expect(selectGachaRarity(0.849999)).toBe("rare");
    expect(selectGachaRarity(0.85)).toBe("epic");
    expect(selectGachaRarity(0.949999)).toBe("epic");
    expect(selectGachaRarity(0.95)).toBe("legendary");
  });

  it("returns the configured cost for every rarity and rejects invalid random values", () => {
    expect(getGachaRarityCost("common")).toBe(100);
    expect(getGachaRarityCost("rare")).toBe(250);
    expect(getGachaRarityCost("epic")).toBe(500);
    expect(getGachaRarityCost("legendary")).toBe(1000);
    expect(() => selectGachaRarity(-0.01)).toThrow(RangeError);
    expect(() => selectGachaRarity(1)).toThrow(RangeError);
  });
});
