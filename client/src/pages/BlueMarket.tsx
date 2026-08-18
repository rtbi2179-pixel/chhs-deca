import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Landmark, Loader2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BbxMarketNavigation } from "@/components/BbxMarketNavigation";
import { BbxPerformanceGraphs } from "@/components/BbxPerformanceGraphs";
import { trpc } from "@/lib/trpc";

const bb = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BB`;
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const MARKET_REFRESH_MS = 20_000;

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}><Icon className="h-3.5 w-3.5" />{pct(value)}</span>;
}

export default function BlueMarket() {
  const overview = trpc.bbx.getOverview.useQuery(undefined, { refetchInterval: MARKET_REFRESH_MS });
  const [clockNow, setClockNow] = useState(() => Date.now());
  const data = overview.data;
  const refreshRemaining = Math.max(0, Math.ceil((MARKET_REFRESH_MS - (clockNow - overview.dataUpdatedAt)) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  if (overview.isLoading) return <main className="page-shell"><div className="page-content"><div className="loading-state min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div></div></main>;
  if (overview.error || !data) return <main className="page-shell"><div className="page-content"><div className="empty-state min-h-64 px-6">Unable to load the BBX simulation. {overview.error?.message ?? "Please try again."}</div></div></main>;

  return <main className="page-shell"><div className="page-content max-w-7xl"><BbxMarketNavigation /><header className="market-dashboard-hero mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="page-eyebrow">Financial learning lab · fictional market</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="page-title">BlueBlazer Exchange</h1><span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-200">SIMULATED</span></div><p className="page-intro mt-3 max-w-2xl">Practice reading company news, risk, diversification, and execution costs with fictional BBX companies. BBX BlueBucks are isolated from your chapter balance and have no cash value.</p></div><span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 font-mono text-xs text-blue-100">Refresh in {refreshRemaining}s</span></header><section aria-label="BBX market summary" className="market-dashboard-stats grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card className="editorial-panel p-5"><p className="data-label">BBX BlueBucks available</p><p className="mt-3 text-2xl font-semibold text-blue-300">{bb(data.cash)}</p><p className="mt-1 text-xs text-foreground/55">Ring-fenced simulation balance</p></Card><Card className="editorial-panel p-5"><p className="data-label">Exchange benchmark</p><p className="mt-3 text-2xl font-semibold text-foreground">{data.state.benchmarkLevel.toFixed(2)}</p><div className="mt-1"><Change value={data.state.benchmarkChangePercent} /></div></Card><Card className="editorial-panel p-5"><p className="data-label">Market regime</p><p className="mt-3 text-2xl font-semibold capitalize text-foreground">{data.state.marketRegime.replace("_", " ")}</p><p className="mt-1 text-xs text-foreground/55">Structured events drive the largest moves</p></Card><Card className="editorial-panel p-5"><p className="data-label">Simulation state</p><p className={`mt-3 text-2xl font-semibold ${data.state.marketOpen ? "text-emerald-300" : "text-amber-300"}`}>{data.state.marketOpen ? "Open" : "Paused"}</p><p className="mt-1 text-xs text-foreground/55">Tick {data.state.tickNumber} · server-authoritative</p><p className="mt-2 font-mono text-xs text-blue-200">Auto-refresh in {refreshRemaining}s</p></Card></section><BbxPerformanceGraphs performance={data.performance} /><section className="mt-8"><Card className="editorial-panel p-6"><Landmark className="h-5 w-5 text-blue-300" /><h2 className="section-heading mt-4">Before you trade</h2><ul className="mt-3 space-y-3 text-sm leading-6 text-foreground/65"><li className="flex gap-2"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />Prices, companies, and news are fictional educational content.</li><li>System-generated events—not headlines or other users—are the primary source of BBX price movement.</li><li>Spreads and slippage illustrate execution costs. They are shown before your final simulated fill.</li></ul></Card></section></div></main>;
}
