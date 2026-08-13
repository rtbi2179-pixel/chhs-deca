export const GACHA_RARITY_CONFIG = [
  { rarity: "common", probability: 0.6, cost: 100 },
  { rarity: "rare", probability: 0.25, cost: 250 },
  { rarity: "epic", probability: 0.1, cost: 500 },
  { rarity: "legendary", probability: 0.05, cost: 1000 },
] as const;

export type GachaRarity = (typeof GACHA_RARITY_CONFIG)[number]["rarity"];

export function selectGachaRarity(randomValue: number): GachaRarity {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("Gacha rarity selection requires a random value from 0 (inclusive) to 1 (exclusive).");
  }

  let threshold = 0;
  for (const config of GACHA_RARITY_CONFIG) {
    threshold += config.probability;
    if (randomValue < threshold) return config.rarity;
  }

  return "legendary";
}

export function getGachaRarityCost(rarity: GachaRarity): number {
  return GACHA_RARITY_CONFIG.find((config) => config.rarity === rarity)!.cost;
}
