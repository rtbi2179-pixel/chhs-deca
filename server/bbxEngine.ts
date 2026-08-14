export type BbxRegime = "bull" | "neutral" | "bear" | "high_volatility";
export type BbxSeverity = "low" | "medium" | "high" | "severe";

export class SeededRng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0 || 0x6d2b79f5; }
  next() {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  normal() {
    const u = Math.max(this.next(), 1e-12);
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
}

export const clamp = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value));
export const sampleRange = (range: readonly number[], rng: SeededRng) => {
  const first = range[0] ?? 0;
  const second = range[1] ?? first;
  return first + (second - first) * rng.next();
};
export const sampleMagnitude = (range: readonly number[], rng: SeededRng) => {
  const first = range[0] ?? 0;
  const second = range[1] ?? first;
  return sampleRange([Math.min(Math.abs(first), Math.abs(second)), Math.max(Math.abs(first), Math.abs(second))], rng);
};

export function regimeParams(regime: BbxRegime) {
  if (regime === "bull") return { marketDrift: 0.1, marketVolatility: 0.14, correlationBoost: 0.95, meanReversion: 1.5 };
  if (regime === "bear") return { marketDrift: -0.1, marketVolatility: 0.24, correlationBoost: 1.15, meanReversion: 1.1 };
  if (regime === "high_volatility") return { marketDrift: 0, marketVolatility: 0.34, correlationBoost: 1.3, meanReversion: 0.75 };
  return { marketDrift: 0.06, marketVolatility: 0.18, correlationBoost: 1, meanReversion: 1.5 };
}

export function benchmarkLogReturn(regime: BbxRegime, dtYears: number, rng: SeededRng) {
  const params = regimeParams(regime);
  return params.marketDrift * dtYears + params.marketVolatility * Math.sqrt(dtYears) * rng.normal();
}

export function sectorResidualLogReturn(regime: BbxRegime, dtYears: number, rng: SeededRng) {
  return 0.12 * regimeParams(regime).correlationBoost * Math.sqrt(dtYears) * rng.normal();
}

export function immediateFraction(severity: BbxSeverity) {
  return severity === "low" ? 0.55 : severity === "medium" ? 0.65 : severity === "high" ? 0.75 : 0.82;
}

/** Distributes a target cumulative event return across its full reaction window. */
export function cumulativeEventTickLogReturn(targetSimpleReturn: number, ageTicks: number, durationTicks: number, decayRate: number, severity: BbxSeverity) {
  if (ageTicks < 0 || ageTicks >= durationTicks || durationTicks <= 0) return 0;
  const total = Math.log1p(clamp(-0.95, 5, targetSimpleReturn));
  const front = immediateFraction(severity);
  let normalizer = 0;
  for (let i = 0; i < durationTicks; i += 1) normalizer += Math.exp(-decayRate * i);
  const tail = total * (1 - front) * Math.exp(-decayRate * ageTicks) / Math.max(normalizer, 1e-12);
  return (ageTicks === 0 ? total * front : 0) + tail;
}

export function sectorTargetReturn(sampledMagnitude: number, sectorBias: Record<string, number>, stockSector: string, scope: string, sameSector: boolean) {
  if (Object.keys(sectorBias).length > 0) return sampledMagnitude * (sectorBias[stockSector] ?? 0);
  return (scope === "company" || scope === "sector") && sameSector ? sampledMagnitude : 0;
}

export function priceTick(input: { price: number; fundamentalValue: number; annualAlphaDrift: number; baseVolatility: number; beta: number; marketLogReturn: number; sectorLogReturn: number; eventLogReturn: number; userImpactLogReturn: number; dtYears: number; regime: BbxRegime; normalSample: number; maxAbsTickLogReturn?: number }) {
  const drift = input.annualAlphaDrift * input.dtYears;
  const market = input.beta * input.marketLogReturn;
  const sector = input.sectorLogReturn;
  const meanReversion = -regimeParams(input.regime).meanReversion * Math.log(Math.max(input.price, 0.25) / Math.max(input.fundamentalValue, 0.25)) * input.dtYears;
  const regimeVolatility = input.regime === "bull" ? 0.9 : input.regime === "bear" ? 1.25 : input.regime === "high_volatility" ? 1.65 : 1;
  const noise = input.baseVolatility * regimeVolatility * Math.sqrt(input.dtYears) * input.normalSample;
  const cap = clamp(0.02, 0.5, input.maxAbsTickLogReturn ?? 0.12);
  const logReturn = clamp(-cap, cap, drift + market + sector + input.eventLogReturn + input.userImpactLogReturn + meanReversion + noise);
  return { newPrice: Math.max(0.25, input.price * Math.exp(logReturn)), logReturn, components: { drift, market, sector, event: input.eventLogReturn, userImpact: input.userImpactLogReturn, meanReversion, noise } };
}

export function spreadPct(liquidityScore: number, volatilityMultiplier: number) {
  return clamp(0.0004, 0.02, 0.0008 * (1 / clamp(0.15, 1, liquidityScore)) * volatilityMultiplier);
}

export function slippagePct(orderValue: number, simulatedAdvDollars: number) {
  if (orderValue <= 0 || simulatedAdvDollars <= 0) return 0;
  return clamp(0, 0.025, 0.006 * Math.pow(orderValue / simulatedAdvDollars, 0.6));
}

export function executionPrice(side: "buy" | "sell", midPrice: number, spread: number, slippage: number) {
  return midPrice * (1 + (side === "buy" ? 1 : -1) * (spread / 2 + slippage));
}

export function constrainedFacts(subtype: string, rng: SeededRng) {
  const round = (value: number, digits = 2) => Number(value.toFixed(digits));
  if (subtype === "earnings_beat" || subtype === "earnings_miss") {
    const expected = round(sampleRange([0.5, 4.5], rng));
    const delta = round(sampleRange([0.05, 0.65], rng));
    const actual = subtype === "earnings_beat" ? round(expected + delta) : round(Math.max(-0.5, expected - delta));
    return { expectedValue: expected, actualValue: actual, surprisePercent: round((actual - expected) / Math.max(Math.abs(expected), 0.01), 4), facts: [`Simulated EPS was ${actual} BB per share versus ${expected} expected.`] };
  }
  if (subtype === "rate_hike" || subtype === "rate_cut") {
    const oldRate = round(sampleRange([1.5, 6.5], rng));
    const change = round(sampleRange([0.25, 1.25], rng));
    const newRate = subtype === "rate_hike" ? round(oldRate + change) : round(Math.max(0.25, oldRate - change));
    return { expectedValue: oldRate, actualValue: newRate, surprisePercent: round((newRate - oldRate) / Math.max(oldRate, 0.01), 4), facts: [`The simulated policy rate moved from ${oldRate}% to ${newRate}%.`] };
  }
  if (subtype === "inflation_hot" || subtype === "inflation_cools") {
    const expected = round(sampleRange([1.5, 7], rng));
    const delta = round(sampleRange([0.1, 1.5], rng));
    const actual = subtype === "inflation_hot" ? round(expected + delta) : round(Math.max(0.1, expected - delta));
    return { expectedValue: expected, actualValue: actual, surprisePercent: round((actual - expected) / Math.max(expected, 0.01), 4), facts: [`Simulated inflation was ${actual}% versus ${expected}% expected.`] };
  }
  const magnitude = round(sampleRange([3, 24], rng));
  const direction = /miss|cut|drop|lost|recall|concern|tension|disruption|out|tighten|fear|risk_off|loss/.test(subtype) ? "lower" : "higher";
  return { expectedValue: null, actualValue: null, surprisePercent: null, facts: [`The structured simulated event points to ${direction} near-term expectations, with a sampled magnitude of ${magnitude}%.`] };
}

export function fallbackNews(input: { companyName?: string | null; ticker?: string | null; sector?: string | null; scope: string; headlineTemplate: string; explanationTemplate: string; facts: string[] }) {
  const headline = input.headlineTemplate.replace("{company}", input.companyName ?? "BBX markets").replace("{sector}", input.sector ?? "BBX");
  const subject = input.companyName ? `${input.companyName}${input.ticker ? ` (${input.ticker})` : ""}` : input.sector ? `${input.sector} shares` : "the BlueBlazer Exchange";
  return { headline: `SIMULATED: ${headline}`, body: `${subject} is affected by a fictional BBX event. ${input.facts.join(" ")}`, whyItMatters: input.explanationTemplate, scopeLabel: input.scope === "company" ? "Company" : input.scope === "sector" ? "Sector" : "Market" };
}
