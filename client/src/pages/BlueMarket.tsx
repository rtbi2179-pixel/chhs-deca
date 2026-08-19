import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Info, Landmark, Loader2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BbxMarketNavigation } from "@/components/BbxMarketNavigation";
import { BbxPerformanceGraphs } from "@/components/BbxPerformanceGraphs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

const bb = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BB`;
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const MARKET_REFRESH_MS = 20_000;

const MARKET_CONDITION_RANGES = [
  { range: "−10% or lower", label: "Recessionary decline", description: "A sharp, broad BBX downturn. This represents a simulated recessionary condition within the learning market.", tone: "border-rose-400/30 bg-rose-400/10 text-rose-100" },
  { range: "−5% to −9.99%", label: "Contraction", description: "The simulated economy is weakening across much of the exchange, with sustained downward pressure.", tone: "border-orange-300/30 bg-orange-300/10 text-orange-100" },
  { range: "−1% to −4.99%", label: "Cooling", description: "The exchange is softening, but the movement is less severe than a broad contraction.", tone: "border-amber-300/30 bg-amber-300/10 text-amber-100" },
  { range: "−0.99% to +0.99%", label: "Stable / mixed", description: "The simulated market is broadly balanced, with gains and losses not signaling a clear direction.", tone: "border-slate-300/25 bg-slate-300/10 text-slate-100" },
  { range: "+1% to +4.99%", label: "Early expansion", description: "The exchange is growing at a measured pace, representing a simulated improving economic backdrop.", tone: "border-sky-300/30 bg-sky-300/10 text-sky-100" },
  { range: "+5% to +9.99%", label: "Broad expansion", description: "Stronger, widespread simulated growth is supporting the exchange across the selected chart period.", tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" },
  { range: "+10% or higher", label: "Strong expansion", description: "Very rapid BBX growth. Treat this as a learning signal to consider both opportunity and the risk of an overheated market.", tone: "border-blue-300/35 bg-blue-300/10 text-blue-100" },
] as const;

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}>
      <Icon className="h-3.5 w-3.5" />
      {pct(value)}
    </span>
  );
}

function MarketConditionExplainer() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open BBX economic condition range guide"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-300/25 bg-blue-400/10 text-blue-200 transition duration-150 hover:border-blue-300/50 hover:bg-blue-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-95"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl border border-blue-300/20 bg-slate-950 p-0 text-slate-100 shadow-2xl">
        <DialogHeader className="border-b border-white/10 px-6 pb-5 pt-6">
          <p className="data-label text-blue-200">BBX learning guide</p>
          <DialogTitle className="mt-1 text-xl text-white">Reading simulated economic conditions</DialogTitle>
          <DialogDescription className="mt-2 max-w-lg leading-6 text-slate-300">
            Use the benchmark change over the chart range you are viewing to interpret BBX’s fictional economic setting. These educational labels describe only the BlueBlazer Exchange simulation; they are not real-world economic forecasts or investment guidance.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[58vh] space-y-2 overflow-y-auto px-6 py-5">
          {MARKET_CONDITION_RANGES.map((condition) => (
            <article key={condition.range} className={`rounded-xl border p-4 ${condition.tone}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{condition.label}</h3>
                <span className="rounded-full border border-current/25 bg-black/10 px-2.5 py-1 font-mono text-xs">{condition.range}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-current/80">{condition.description}</p>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
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

  if (overview.isLoading) {
    return <main className="page-shell"><div className="page-content"><div className="loading-state min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div></div></main>;
  }
  if (overview.error || !data) {
    return <main className="page-shell"><div className="page-content"><div className="empty-state min-h-64 px-6">Unable to load the BBX simulation. {overview.error?.message ?? "Please try again."}</div></div></main>;
  }

  return (
    <main className="page-shell">
      <div className="page-content max-w-7xl">
        <BbxMarketNavigation />
        <header className="market-dashboard-hero mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="page-eyebrow">Financial learning lab · fictional market</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="page-title">BlueBlazer Exchange</h1>
              <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-200">SIMULATED</span>
              <MarketConditionExplainer />
            </div>
            <p className="page-intro mt-3 max-w-2xl">Practice reading company news, risk, diversification, and execution costs with fictional BBX companies. Available BBX buying power matches your Banking Investment Account and has no cash value.</p>
          </div>
          <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 font-mono text-xs text-blue-100">Refresh in {refreshRemaining}s</span>
        </header>

        <section aria-label="BBX market summary" className="market-dashboard-stats grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="editorial-panel p-5">
            <p className="data-label">Investment Account available</p>
            <p className="mt-3 text-2xl font-semibold text-blue-300">{bb(data.cash)}</p>
            <p className="mt-1 text-xs text-foreground/55">Banking-backed BBX buying power</p>
          </Card>
          <Card className="editorial-panel p-5">
            <p className="data-label">Exchange benchmark</p>
            <p className="mt-3 text-2xl font-semibold text-foreground">{data.state.benchmarkLevel.toFixed(2)}</p>
            <div className="mt-1"><Change value={data.state.benchmarkChangePercent} /></div>
          </Card>
          <Card className="editorial-panel p-5">
            <p className="data-label">Market regime</p>
            <p className="mt-3 text-2xl font-semibold capitalize text-foreground">{data.state.marketRegime.replace("_", " ")}</p>
            <p className="mt-1 text-xs text-foreground/55">Structured events drive the largest moves</p>
          </Card>
          <Card className="editorial-panel p-5">
            <p className="data-label">Simulation state</p>
            <p className={`mt-3 text-2xl font-semibold ${data.state.marketOpen ? "text-emerald-300" : "text-amber-300"}`}>{data.state.marketOpen ? "Open" : "Paused"}</p>
            <p className="mt-1 text-xs text-foreground/55">Tick {data.state.tickNumber} · server-authoritative</p>
            <p className="mt-2 font-mono text-xs text-blue-200">Auto-refresh in {refreshRemaining}s</p>
          </Card>
        </section>

        <BbxPerformanceGraphs performance={data.performance} />

        <section className="mt-8">
          <Card className="editorial-panel p-6">
            <Landmark className="h-5 w-5 text-blue-300" />
            <h2 className="section-heading mt-4">Before you trade</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-foreground/65">
              <li className="flex gap-2"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />Prices, companies, and news are fictional educational content.</li>
              <li>System-generated events—not headlines or other users—are the primary source of BBX price movement.</li>
              <li>Spreads and slippage illustrate execution costs. They are shown before your final simulated fill.</li>
            </ul>
          </Card>
        </section>
      </div>
    </main>
  );
}
