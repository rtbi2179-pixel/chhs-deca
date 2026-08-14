import { and, asc, eq, inArray, sql } from "drizzle-orm";
import bbxEventBank from "./bbxEventBank.json";
import { ensureBbxSeeded, getDb } from "./db";
import { SeededRng, benchmarkLogReturn, constrainedFacts, cumulativeEventTickLogReturn, fallbackNews, priceTick, sampleMagnitude, sampleRange, sectorResidualLogReturn, sectorTargetReturn, type BbxSeverity } from "./bbxEngine";

type EventTemplate = (typeof bbxEventBank)[number];

const secondsPerSimulatedDay = 78; // 6.5 simulated hours at 5x real time.
const dtYears = 1 / (252 * (secondsPerSimulatedDay / 15));
export async function createBbxEvent(params: { templateId: string; companyId?: number; sector?: string; createdBy: "system" | "admin"; tickNumber?: number }) {
  await ensureBbxSeeded();
  const db = await getDb();
  if (!db) throw new Error("BBX storage is unavailable");
  const { bbxCompanies, bbxEvents, bbxNews } = await import("../drizzle/schema");
  const template = (bbxEventBank as EventTemplate[]).find((entry) => entry.id === params.templateId);
  if (!template) throw new Error("Unknown BBX event template");
  const [firstCompany] = await db.select().from(bbxCompanies).orderBy(asc(bbxCompanies.id)).limit(1);
  const tick = params.tickNumber ?? (await (async () => {
    const { bbxMarketState } = await import("../drizzle/schema");
    const [state] = await db.select().from(bbxMarketState).where(eq(bbxMarketState.id, 1)).limit(1);
    return state?.tickNumber ?? 0;
  })());
  const rng = new SeededRng(tick * 991 + template.id.charCodeAt(template.id.length - 1));
  const targetCompanyId = template.scope === "company" ? (params.companyId ?? firstCompany?.id) : null;
  let resolvedSector = template.scope === "sector" ? params.sector : null;
  if (template.scope === "company" && targetCompanyId) {
    const [company] = await db.select().from(bbxCompanies).where(eq(bbxCompanies.id, targetCompanyId)).limit(1);
    resolvedSector = company?.sector ?? null;
  }
  const facts = constrainedFacts(template.subType, rng);
  const sectorTargetMagnitude = template.sectorBias
    ? sampleMagnitude(template.impactRanges.targetSectorPct, rng)
    : sampleRange(template.impactRanges.targetSectorPct, rng);
  const inserted = await db.insert(bbxEvents).values({
    templateId: template.id,
    category: template.category,
    subtype: template.subType,
    scope: template.scope,
    companyId: targetCompanyId,
    sector: resolvedSector,
    severity: template.severity,
    directCompanyTargetReturn: String(sampleRange(template.impactRanges.directCompanyPct, rng)),
    sectorTargetMagnitude: String(sectorTargetMagnitude),
    marketTargetReturn: String(sampleRange(template.impactRanges.broadMarketPct, rng)),
    fundamentalTargetChange: String(sampleRange(template.impactRanges.fundamentalValuePct, rng)),
    sentimentImpact: String(sampleRange(template.impactRanges.sentimentDelta, rng)),
    volatilityMultiplier: String(sampleRange(template.impactRanges.volatilityMultiplier, rng)),
    durationTicks: template.durationTicks,
    decayRate: String(template.decayRate),
    sectorBias: template.sectorBias ?? {},
    facts: facts.facts,
    expectedValue: facts.expectedValue === null ? null : String(facts.expectedValue),
    actualValue: facts.actualValue === null ? null : String(facts.actualValue),
    surprisePercent: facts.surprisePercent === null ? null : String(facts.surprisePercent),
    startTick: tick + 1,
    createdBy: params.createdBy,
  } as any);
  const eventId = Number((inserted as any)[0]?.insertId);
  const [company] = targetCompanyId ? await db.select().from(bbxCompanies).where(eq(bbxCompanies.id, targetCompanyId)).limit(1) : [];
  const news = fallbackNews({ companyName: company?.companyName, ticker: company?.ticker, sector: resolvedSector, scope: template.scope, headlineTemplate: template.headlineTemplate, explanationTemplate: template.explanationTemplate, facts: facts.facts });
  await db.insert(bbxNews).values({ eventId, ...news, isSimulated: true });
  return { eventId, templateId: template.id, headline: news.headline };
}

export async function advanceBbxSimulation() {
  await ensureBbxSeeded();
  const db = await getDb();
  if (!db) throw new Error("BBX storage is unavailable");
  const { bbxCompanies, bbxEvents, bbxMarketState, bbxPriceHistory } = await import("../drizzle/schema");
  return db.transaction(async (tx) => {
    const [state] = await tx.select().from(bbxMarketState).where(eq(bbxMarketState.id, 1)).limit(1);
    if (!state) throw new Error("BBX market state is unavailable");
    if (!state.marketOpen) return { skipped: "market_paused", tickNumber: state.tickNumber };
    const nextTick = state.tickNumber + 1;
    const rng = new SeededRng(nextTick * 7919 + 17);
    const companies = await tx.select().from(bbxCompanies).where(eq(bbxCompanies.status, "active")).orderBy(asc(bbxCompanies.id));
    const events = await tx.select().from(bbxEvents).where(eq(bbxEvents.status, "active"));
    const sectorReturns = new Map<string, number>();
    const sectorNames = companies.map((company) => company.sector).filter((sector, index, all) => all.indexOf(sector) === index);
    sectorNames.forEach((sector) => sectorReturns.set(sector, sectorResidualLogReturn(state.marketRegime, dtYears, rng)));

    const benchmarkFactor = benchmarkLogReturn(state.marketRegime, dtYears, rng);
    let marketEventFactor = 0;
    for (const event of events) {
      const age = nextTick - event.startTick;
      if (age >= event.durationTicks) {
        await tx.update(bbxEvents).set({ status: "expired" }).where(eq(bbxEvents.id, event.id));
        continue;
      }
      marketEventFactor += cumulativeEventTickLogReturn(Number(event.marketTargetReturn), age, event.durationTicks, Number(event.decayRate), event.severity as BbxSeverity);
    }

    for (const company of companies) {
      let eventFactor = marketEventFactor;
      let fundamental = Number(company.fundamentalValue);
      let sentiment = Number(company.sentiment);
      for (const event of events) {
        const age = nextTick - event.startTick;
        if (age < 0 || age >= event.durationTicks) continue;
        const bias = (event.sectorBias ?? {}) as Record<string, number>;
        const sameSector = Boolean(event.sector && event.sector === company.sector);
        const direct = event.companyId === company.id
          ? cumulativeEventTickLogReturn(Number(event.directCompanyTargetReturn), age, event.durationTicks, Number(event.decayRate), event.severity as BbxSeverity)
          : 0;
        const sectorTarget = sectorTargetReturn(Number(event.sectorTargetMagnitude), bias, company.sector, event.scope, sameSector);
        const sectorImpact = cumulativeEventTickLogReturn(sectorTarget, age, event.durationTicks, Number(event.decayRate), event.severity as BbxSeverity);
        eventFactor += direct + sectorImpact;
        if (age === 0) {
          if (event.companyId === company.id || sameSector || event.scope === "market") {
            fundamental *= 1 + Number(event.fundamentalTargetChange) * (event.companyId === company.id ? 1 : sameSector ? 0.45 : 0.2);
            sentiment = Math.max(-1, Math.min(1, sentiment + Number(event.sentimentImpact) * (event.companyId === company.id ? 1 : sameSector ? 0.45 : 0.2)));
          }
        }
      }
      const calculated = priceTick({
        price: Number(company.currentPrice), fundamentalValue: fundamental, annualAlphaDrift: Number(company.revenueGrowth) * 0.05,
        baseVolatility: Number(company.baseVolatility), beta: Number(company.beta), marketLogReturn: benchmarkFactor,
        sectorLogReturn: sectorReturns.get(company.sector) ?? 0, eventLogReturn: eventFactor,
        userImpactLogReturn: Number(company.temporaryOrderImpact), dtYears, regime: state.marketRegime,
        normalSample: rng.normal(), maxAbsTickLogReturn: Math.abs(eventFactor) > 0.08 ? 0.45 : 0.12,
      });
      const volume = Math.max(1, Math.round(Number(company.liquidityScore) * 10000 * (1 + Math.abs(calculated.logReturn) * 10)));
      await tx.update(bbxCompanies).set({ previousClose: company.currentPrice, currentPrice: calculated.newPrice.toFixed(6), fundamentalValue: fundamental.toFixed(6), sentiment: (sentiment * Math.exp(-5 * dtYears)).toFixed(6), temporaryOrderImpact: (Number(company.temporaryOrderImpact) * 0.6).toFixed(8) }).where(eq(bbxCompanies.id, company.id));
      await tx.insert(bbxPriceHistory).values({ companyId: company.id, tickNumber: nextTick, simulationTimestamp: new Date(Date.now() + 15_000), price: calculated.newPrice.toFixed(6), benchmarkFactor: calculated.components.market.toFixed(8), sectorFactor: calculated.components.sector.toFixed(8), eventFactor: calculated.components.event.toFixed(8), userImpactFactor: calculated.components.userImpact.toFixed(8), meanReversionFactor: calculated.components.meanReversion.toFixed(8), noiseFactor: calculated.components.noise.toFixed(8), volume });
    }
    const newBenchmark = Number(state.benchmarkLevel) * Math.exp(benchmarkFactor + marketEventFactor);
    await tx.update(bbxMarketState).set({ previousBenchmarkLevel: state.benchmarkLevel, benchmarkLevel: newBenchmark.toFixed(6), tickNumber: nextTick, simulationTimestamp: new Date(Date.now() + 15_000), lastTickAt: new Date() }).where(eq(bbxMarketState.id, 1));
    return { tickNumber: nextTick, companiesUpdated: companies.length };
  });
}
