import { describe, expect, it } from "vitest";
import { BBX_EXPECTED_NEWS_LOG_RETURN_PER_TICK, BBX_SCHEDULED_ADVANCES_PER_MONTH, BBX_TARGET_MONTHLY_GROWTH, BBX_TARGET_MONTHLY_LOG_DRIFT, BBX_TARGET_TICK_LOG_DRIFT, SeededRng, cumulativeEventTickLogReturn, executionPrice, fallbackNews, priceTick, regimeParams, slippagePct, spreadPct } from "./bbxEngine";

describe("BBX deterministic market engine", () => {
  it("distributes an event target cumulatively instead of compounding it each tick", () => {
    const target = 0.12;
    const parts = Array.from({ length: 100 }, (_, age) => cumulativeEventTickLogReturn(target, age, 100, 0.03, "high"));
    const compounded = Math.expm1(parts.reduce((sum, value) => sum + value, 0));
    expect(compounded).toBeCloseTo(target, 10);
  });

  it("is deterministic for the same seed and state", () => {
    const input = (normalSample: number) => ({ price: 84, fundamentalValue: 84, annualAlphaDrift: 0.01, baseVolatility: 0.32, beta: 1.2, marketLogReturn: 0.003, sectorLogReturn: -0.001, eventLogReturn: 0, userImpactLogReturn: 0, dtYears: 1 / 6552, regime: "neutral" as const, normalSample });
    const first = new SeededRng(42); const second = new SeededRng(42);
    expect(priceTick(input(first.normal()))).toEqual(priceTick(input(second.normal())));
  });

  it("keeps normal prices finite and positive across a long deterministic path", () => {
    const rng = new SeededRng(7); let price = 60;
    for (let index = 0; index < 5000; index += 1) {
      price = priceTick({ price, fundamentalValue: 62, annualAlphaDrift: 0.015, baseVolatility: 0.34, beta: 1.1, marketLogReturn: rng.normal() * 0.002, sectorLogReturn: rng.normal() * 0.001, eventLogReturn: 0, userImpactLogReturn: 0, dtYears: 1 / 6552, regime: "neutral", normalSample: rng.normal() }).newPrice;
      expect(Number.isFinite(price)).toBe(true); expect(price).toBeGreaterThan(0);
    }
  });

  it("applies bid-ask and slippage in the correct direction without a negative cost", () => {
    const spread = spreadPct(0.6, 1.2); const slippage = slippagePct(5000, 200000);
    expect(spread).toBeGreaterThan(0); expect(slippage).toBeGreaterThanOrEqual(0);
    expect(executionPrice("buy", 100, spread, slippage)).toBeGreaterThan(100);
    expect(executionPrice("sell", 100, spread, slippage)).toBeLessThan(100);
  });

  it("labels fallback financial news as simulated and fictional", () => {
    const news = fallbackNews({ companyName: "NovaGrid Systems", ticker: "BBX:NVG1", sector: "Technology", scope: "company", headlineTemplate: "{company} reports fictional update", explanationTemplate: "The simulated update affects expectations.", facts: ["Simulated EPS beat the fictional expectation."] });
    expect(news.headline).toMatch(/^SIMULATED:/); expect(news.body).toContain("fictional BBX event");
  });

  it("uses a neutral fictional benchmark drift calibrated to the stated 10% monthly target", () => {
    expect(BBX_TARGET_MONTHLY_GROWTH).toBe(0.10);
    expect(Math.expm1(BBX_TARGET_MONTHLY_LOG_DRIFT)).toBeCloseTo(0.10, 10);
    expect(regimeParams("neutral").marketDrift).toBe(BBX_TARGET_TICK_LOG_DRIFT);
    expect(Math.expm1((BBX_TARGET_TICK_LOG_DRIFT + BBX_EXPECTED_NEWS_LOG_RETURN_PER_TICK) * BBX_SCHEDULED_ADVANCES_PER_MONTH)).toBeCloseTo(0.10, 10);
  });
});
