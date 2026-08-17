import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowDownRight, ArrowUpRight, BookOpen, Landmark, Loader2, Newspaper, ShieldCheck, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BbxPerformanceGraphs } from "@/components/BbxPerformanceGraphs";

const bb = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BB`;
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}><Icon className="h-3.5 w-3.5" />{pct(value)}</span>;
}

export default function BlueMarket() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const canAdmin = user?.role === "super_admin";
  const { data, isLoading, error } = trpc.bbx.getOverview.useQuery(undefined, { refetchInterval: 20_000 });
  const order = trpc.bbx.placeMarketOrder.useMutation();
  const advance = trpc.bbx.advanceNow.useMutation({ onSuccess: () => void utils.bbx.getOverview.invalidate() });
  const adminOptions = trpc.bbx.getAdminOptions.useQuery(undefined, { enabled: canAdmin });
  const setRegime = trpc.bbx.setRegime.useMutation({ onSuccess: () => void utils.bbx.getOverview.invalidate() });
  const setMarketOpen = trpc.bbx.setMarketOpen.useMutation({ onSuccess: () => void utils.bbx.getOverview.invalidate() });
  const injectEvent = trpc.bbx.injectEvent.useMutation({ onSuccess: () => { void utils.bbx.getOverview.invalidate(); void utils.bbx.getNews.invalidate(); } });
  const [trade, setTrade] = useState<{ ticker: string; side: "buy" | "sell"; price: number } | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [eventTemplate, setEventTemplate] = useState("");
  const [eventTicker, setEventTicker] = useState("");
  const benchmarkChange = data?.state.benchmarkChangePercent ?? 0;
  const news = data?.news ?? [];
  const companies = data?.companies ?? [];
  const selectedCompany = useMemo(() => companies.find((company) => company.ticker === trade?.ticker), [companies, trade?.ticker]);

  const submitOrder = async () => {
    if (!trade) return;
    try {
      const result = await order.mutateAsync({ ticker: trade.ticker, side: trade.side, quantity, idempotencyKey: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` });
      toast.success(`${trade.side === "buy" ? "Purchase" : "Sale"} filled at ${bb(result.fillPrice)} per share.`);
      setTrade(null); setQuantity("1");
      await Promise.all([utils.bbx.getOverview.invalidate(), utils.bbx.getPortfolio.invalidate(), utils.bbx.getTransactions.invalidate()]);
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to place this simulated order."); }
  };

  if (isLoading) return <main className="page-shell"><div className="page-content"><div className="loading-state min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div></div></main>;
  if (error || !data) return <main className="page-shell"><div className="page-content"><div className="empty-state min-h-64 px-6">Unable to load the BBX simulation. {error?.message ?? "Please try again."}</div></div></main>;

  return <main className="page-shell">
    <div className="page-content max-w-7xl">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p className="page-eyebrow">Financial learning lab · fictional market</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="page-title">BlueBlazer Exchange</h1><span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-200">SIMULATED</span></div><p className="page-intro mt-3 max-w-2xl">Practice reading company news, risk, diversification, and execution costs with fictional BBX companies. BBX BlueBucks are isolated from your chapter balance and have no cash value.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setLocation("/market/portfolio")}>Portfolio</Button><Button variant="outline" onClick={() => setLocation("/market/news")}>News feed</Button><Button variant="outline" onClick={() => setLocation("/market/learn")}><BookOpen className="mr-2 h-4 w-4" />Learn</Button>{canAdmin && <Button variant="outline" onClick={() => void advance.mutateAsync()} disabled={advance.isPending}>{advance.isPending ? "Advancing…" : "Advance BBX"}</Button>}</div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="editorial-panel p-5"><p className="data-label">BBX BlueBucks available</p><p className="mt-3 text-2xl font-semibold text-blue-300">{bb(data.cash)}</p><p className="mt-1 text-xs text-foreground/55">Ring-fenced simulation balance</p></Card>
        <Card className="editorial-panel p-5"><p className="data-label">Exchange benchmark</p><p className="mt-3 text-2xl font-semibold text-foreground">{data.state.benchmarkLevel.toFixed(2)}</p><div className="mt-1"><Change value={benchmarkChange} /></div></Card>
        <Card className="editorial-panel p-5"><p className="data-label">Market regime</p><p className="mt-3 text-2xl font-semibold capitalize text-foreground">{data.state.marketRegime.replace("_", " ")}</p><p className="mt-1 text-xs text-foreground/55">Structured events drive the largest moves</p></Card>
        <Card className="editorial-panel p-5"><p className="data-label">Simulation state</p><p className={`mt-3 text-2xl font-semibold ${data.state.marketOpen ? "text-emerald-300" : "text-amber-300"}`}>{data.state.marketOpen ? "Open" : "Paused"}</p><p className="mt-1 text-xs text-foreground/55">Tick {data.state.tickNumber} · server-authoritative</p></Card>
      </section>

      <BbxPerformanceGraphs performance={data.performance} />

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="editorial-panel overflow-hidden p-0"><div className="border-b border-white/10 px-6 py-5"><h2 className="section-heading">Fictional company listings</h2><p className="mt-1 text-sm text-foreground/60">Displayed prices are BBX simulation marks. Final fills include a small, disclosed simulated spread and slippage.</p></div><div className="divide-y divide-white/8">{companies.map((company) => <div key={company.ticker} className="grid gap-3 px-6 py-4 sm:grid-cols-[1.2fr_0.65fr_0.75fr_auto] sm:items-center"><button className="min-w-0 text-left" onClick={() => setLocation(`/market/${company.ticker}`)}><p className="font-semibold text-foreground">{company.ticker}</p><p className="truncate text-sm text-foreground/60">{company.companyName} · {company.sector}</p></button><div><p className="font-semibold text-foreground">{bb(company.price)}</p><Change value={company.changePercent} /></div><span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-xs text-foreground/65">{company.status}</span><div className="flex gap-2"><Button size="sm" onClick={() => { setTrade({ ticker: company.ticker, side: "buy", price: company.price }); setQuantity("1"); }}>Buy</Button><Button size="sm" variant="outline" onClick={() => { setTrade({ ticker: company.ticker, side: "sell", price: company.price }); setQuantity("1"); }}>Sell</Button></div></div>)}</div></Card>
        <div className="space-y-6"><Card className="editorial-panel p-6"><div className="flex items-center justify-between"><h2 className="section-heading">Market movers</h2><TrendingUp className="h-5 w-5 text-blue-300" /></div><div className="mt-4 grid grid-cols-2 gap-5"><div><p className="data-label">Gainers</p><div className="mt-2 space-y-2">{data.movers.gainers.slice(0, 3).map((company) => <button key={company.ticker} className="flex w-full justify-between text-left text-sm" onClick={() => setLocation(`/market/${company.ticker}`)}><span className="text-foreground">{company.symbol}</span><Change value={company.changePercent} /></button>)}</div></div><div><p className="data-label">Losers</p><div className="mt-2 space-y-2">{data.movers.losers.slice(0, 3).map((company) => <button key={company.ticker} className="flex w-full justify-between text-left text-sm" onClick={() => setLocation(`/market/${company.ticker}`)}><span className="text-foreground">{company.symbol}</span><Change value={company.changePercent} /></button>)}</div></div></div></Card>
          <Card className="editorial-panel p-6"><h2 className="section-heading">Sector performance</h2><div className="mt-4 space-y-3">{data.sectors.map((sector) => <div key={sector.sector} className="flex items-center justify-between"><span className="text-sm text-foreground/75">{sector.sector}</span><Change value={sector.changePercent} /></div>)}</div></Card></div>
      </section>

      {canAdmin && <Card className="editorial-panel mt-8 p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="page-eyebrow">Super-admin only</p><h2 className="section-heading mt-2">BBX simulation controls</h2><p className="mt-1 text-sm text-foreground/60">Controls operate only on fictional BBX data. Event magnitudes remain server-defined by reviewed templates.</p></div><Button variant="outline" onClick={() => void setMarketOpen.mutateAsync({ open: !data.state.marketOpen })} disabled={setMarketOpen.isPending}>{data.state.marketOpen ? "Pause exchange" : "Resume exchange"}</Button></div><div className="mt-5 grid gap-4 lg:grid-cols-3"><label className="text-sm text-foreground/70">Market regime<select className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground" value={data.state.marketRegime} onChange={(event) => void setRegime.mutateAsync({ regime: event.target.value as "bull" | "neutral" | "bear" | "high_volatility" })} disabled={setRegime.isPending}><option value="bull">Bull</option><option value="neutral">Neutral</option><option value="bear">Bear</option><option value="high_volatility">High volatility</option></select></label><label className="text-sm text-foreground/70">Event template<select className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground" value={eventTemplate} onChange={(event) => setEventTemplate(event.target.value)}><option value="">Choose reviewed event</option>{adminOptions.data?.templates.map((template) => <option key={template.id} value={template.id}>{template.id} · {template.severity} · {template.headline}</option>)}</select></label><label className="text-sm text-foreground/70">Company target (optional)<select className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground" value={eventTicker} onChange={(event) => setEventTicker(event.target.value)}><option value="">Use event scope</option>{adminOptions.data?.companies.map((company) => <option key={company.ticker} value={company.ticker}>{company.ticker} · {company.companyName}</option>)}</select></label></div><div className="mt-4"><Button disabled={!eventTemplate || injectEvent.isPending} onClick={() => void injectEvent.mutateAsync({ templateId: eventTemplate, ticker: eventTicker || undefined }).then((result) => { toast.success(`Queued ${result.templateId} for the next BBX tick.`); setEventTemplate(""); })}>{injectEvent.isPending ? "Queueing…" : "Inject fictional event"}</Button></div></Card>}

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]"><Card className="editorial-panel p-6"><div className="flex items-center justify-between"><h2 className="section-heading">Latest simulated news</h2><Button size="sm" variant="ghost" onClick={() => setLocation("/market/news")}>View all</Button></div><div className="mt-4 space-y-3">{news.length === 0 ? <p className="empty-state px-4 py-7 text-sm">The first structured BBX event will appear here as the simulation advances.</p> : news.slice(0, 4).map((article) => <article key={article.id} className="editorial-panel-muted p-4"><div className="flex items-start gap-3"><Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><div><p className="text-xs font-semibold tracking-wide text-blue-200">SIMULATED · {article.scopeLabel}</p><p className="mt-1 font-medium text-foreground">{article.headline}</p><p className="mt-1 line-clamp-2 text-sm text-foreground/60">{article.whyItMatters}</p></div></div></article>)}</div></Card><Card className="editorial-panel p-6"><Landmark className="h-5 w-5 text-blue-300" /><h2 className="section-heading mt-4">Before you trade</h2><ul className="mt-3 space-y-3 text-sm leading-6 text-foreground/65"><li className="flex gap-2"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />Prices, companies, and news are fictional educational content.</li><li>System-generated events—not headlines or other users—are the primary source of BBX price movement.</li><li>Spreads and slippage illustrate execution costs. They are shown before your final simulated fill.</li></ul></Card></section>
    </div>

    {trade && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"><Card className="w-full max-w-md border border-white/15 bg-slate-950 p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="data-label">SIMULATED MARKET ORDER</p><h2 className="mt-1 text-xl font-semibold text-foreground">{trade.side === "buy" ? "Buy" : "Sell"} {trade.ticker}</h2></div><button aria-label="Close order dialog" className="rounded p-1 text-foreground/60 hover:bg-white/10 hover:text-foreground" onClick={() => setTrade(null)}><X className="h-5 w-5" /></button></div><p className="mt-3 text-sm text-foreground/65">Midpoint: {bb(selectedCompany?.price ?? trade.price)}. Your final fill is determined on the server and may include simulated spread and slippage.</p><label className="mt-5 block text-sm text-foreground/70">Fractional shares<input aria-label="Quantity" type="number" min="0.000001" step="0.000001" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-foreground outline-none focus:border-blue-400" /></label><p className="mt-3 text-sm text-foreground/60">Estimated midpoint total: {bb((Number(quantity) || 0) * (selectedCompany?.price ?? trade.price))}</p><div className="mt-6 flex gap-3"><Button className="flex-1" disabled={order.isPending || !(Number(quantity) > 0)} onClick={() => void submitOrder()}>{order.isPending ? "Filling…" : `Confirm ${trade.side === "buy" ? "buy" : "sale"}`}</Button><Button className="flex-1" variant="outline" onClick={() => setTrade(null)}>Cancel</Button></div></Card></div>}
  </main>;
}
