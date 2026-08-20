import { useLocation, useRoute } from "wouter";
import { useState } from "react";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BbxMarketNavigation } from "@/components/BbxMarketNavigation";

type PricePoint = { tickNumber: number; timestamp: Date | string; price: number };

const bb = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BB`;

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}><Icon className="h-4 w-4" />{positive ? "+" : ""}{value.toFixed(2)}%</span>;
}

function PageLoader() {
  return <main className="page-shell"><div className="page-content"><div className="loading-state min-h-[55vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div></div></main>;
}

function BbxStockPriceChart({ ticker, points }: { ticker: string; points: PricePoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const min = Math.min(...points.map((point) => point.price));
  const max = Math.max(...points.map((point) => point.price));
  const range = Math.max(max - min, 0.01);
  const pointX = (index: number) => points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
  const pointY = (point: PricePoint) => points.length === 1 ? 50 : 92 - ((point.price - min) / range) * 84;
  const chartPoints = points.length > 1
    ? points.map((point, index) => `${pointX(index)},${pointY(point)}`).join(" ")
    : "0,50 100,50";
  const activeIndex = hoverIndex ?? points.length - 1;
  const activePoint = points[activeIndex];
  const activeX = pointX(activeIndex);
  const activeY = pointY(activePoint);
  const activeTimestamp = new Date(activePoint.timestamp);
  const timestampLabel = Number.isNaN(activeTimestamp.getTime())
    ? "Recorded simulation mark"
    : activeTimestamp.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
  const liveLabel = `${ticker} simulated price ${bb(activePoint.price)} at ${timestampLabel}, tick ${activePoint.tickNumber}.`;

  const inspectAtClientX = (clientX: number, element: HTMLElement) => {
    const bounds = element.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
    setHoverIndex(Math.round(fraction * (points.length - 1)));
  };

  return (
    <div className="mt-6">
      <div
        className="relative h-64 touch-pan-y select-none rounded-xl border border-white/8 bg-slate-950/45 p-4 outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        role="img"
        tabIndex={0}
        aria-label={`${ticker} simulated price chart. Hover, tap, or use the left and right arrow keys to inspect each recorded price mark.`}
        onFocus={() => setHoverIndex((current) => current ?? points.length - 1)}
        onBlur={() => setHoverIndex(null)}
        onPointerMove={(event) => inspectAtClientX(event.clientX, event.currentTarget)}
        onPointerDown={(event) => inspectAtClientX(event.clientX, event.currentTarget)}
        onPointerLeave={() => setHoverIndex(null)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const step = event.key === "ArrowRight" ? 1 : -1;
          setHoverIndex((current) => Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + step)));
        }}
      >
        <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline fill="none" stroke="currentColor" strokeWidth="1.7" className="text-blue-400" points={chartPoints} vectorEffect="non-scaling-stroke" />
        </svg>
        {hoverIndex !== null && <>
          <div className="pointer-events-none absolute inset-y-4 w-px bg-gradient-to-b from-transparent via-blue-100/85 to-transparent" style={{ left: `${activeX}%` }} />
          <div className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 bg-slate-950 shadow-[0_0_0_4px_rgba(15,23,42,.8),0_0_18px_rgba(96,165,250,.9)] transition-transform duration-150 ease-out" style={{ left: `${activeX}%`, top: `${activeY}%` }} />
          <div className={`pointer-events-none absolute top-4 z-10 w-52 rounded-lg border border-blue-200/25 bg-slate-950/95 px-3 py-2 shadow-xl ${activeX > 68 ? "right-4" : "left-4"}`}>
            <p className="font-mono text-sm font-semibold text-blue-100">{bb(activePoint.price)}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{timestampLabel}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-blue-200/70">Tick {activePoint.tickNumber}</p>
          </div>
        </>}
        <span className="sr-only" aria-live="polite">{hoverIndex !== null ? liveLabel : `Latest recorded price ${bb(points[points.length - 1].price)}. Hover or tap the chart to inspect earlier marks.`}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/55">
        <span>{hoverIndex === null ? "Hover or tap the line to inspect a recorded mark." : "Inspecting recorded mark"}</span>
        <span className="font-mono">{hoverIndex === null ? `${points.length} recorded marks` : `${bb(activePoint.price)} · ${timestampLabel}`}</span>
      </div>
    </div>
  );
}

export function BbxCompanyPage() {
  const [, params] = useRoute("/market/:ticker");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const ticker = params?.ticker ?? "";
  const [range, setRange] = useState<"1D" | "1W" | "1M" | "ALL">("1D");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("1");
  const quote = trpc.bbx.getQuote.useQuery({ ticker }, { enabled: Boolean(ticker), refetchInterval: 20_000 });
  const chart = trpc.bbx.getChart.useQuery({ ticker, range }, { enabled: Boolean(ticker), refetchInterval: 20_000 });
  const order = trpc.bbx.placeMarketOrder.useMutation();

  if (quote.isLoading) return <PageLoader />;
  if (!quote.data) return <main className="page-shell"><div className="page-content"><div className="empty-state px-6 py-12">This fictional BBX listing is unavailable.</div></div></main>;

  const points = chart.data ?? [];
  const submit = async () => {
    try {
      const fill = await order.mutateAsync({ ticker, side, quantity, idempotencyKey: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` });
      toast.success(`Simulated ${side} filled at ${bb(fill.fillPrice)}.`);
      await Promise.all([utils.bbx.getQuote.invalidate({ ticker }), utils.bbx.getPortfolio.invalidate(), utils.bbx.getOverview.invalidate()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fill this simulated order.");
    }
  };

  return <main className="page-shell"><div className="page-content max-w-7xl">
    <button className="mb-5 inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground" onClick={() => setLocation("/market")}><ArrowLeft className="h-4 w-4" />Back to BBX</button>
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="page-eyebrow">Fictional BBX company · {quote.data.sector}</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="page-title">{quote.data.ticker}</h1><span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold text-blue-200">SIMULATED</span></div><p className="page-intro mt-3 max-w-2xl">{quote.data.companyName} · {quote.data.description}</p></div><div className="text-left md:text-right"><p className="text-3xl font-semibold text-foreground">{bb(quote.data.price)}</p><div className="mt-1"><Change value={quote.data.changePercent} /></div></div></header>
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
      <Card className="editorial-panel p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="section-heading">Price history</h2><p className="mt-1 text-sm text-foreground/60">Server-recorded simulation marks. Hover, tap, or use the arrow keys to inspect the exact price and time.</p></div><div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">{(["1D", "1W", "1M", "ALL"] as const).map((option) => <button key={option} aria-label={`Show ${option} history`} className={`rounded px-2.5 py-1 text-xs ${range === option ? "bg-blue-500/20 text-blue-100" : "text-foreground/60 hover:text-foreground"}`} onClick={() => setRange(option)}>{option}</button>)}</div></div>{points.length ? <BbxStockPriceChart ticker={ticker} points={points} /> : <div className="empty-state mt-6 px-5 py-16 text-sm">Price marks will appear after the first BBX simulation tick.</div>}<div className="mt-5 grid gap-3 sm:grid-cols-3">{quote.data.contributors.length === 0 ? <p className="text-sm text-foreground/60">Price attribution appears after the first simulation tick.</p> : quote.data.contributors.map((item) => <div key={item.label} className="editorial-panel-muted p-3"><p className="data-label">{item.label}</p><p className={`mt-1 font-semibold ${item.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{item.value >= 0 ? "+" : ""}{(item.value * 100).toFixed(2)}%</p></div>)}</div></Card>
      <Card className="editorial-panel p-6"><p className="data-label">SIMULATED MARKET ORDER</p><h2 className="section-heading mt-2">Trade {quote.data.symbol}</h2><div className="mt-5 flex rounded-lg border border-white/10 p-1"><button className={`flex-1 rounded px-3 py-2 text-sm ${side === "buy" ? "bg-blue-600 text-white" : "text-foreground/65"}`} onClick={() => setSide("buy")}>Buy</button><button className={`flex-1 rounded px-3 py-2 text-sm ${side === "sell" ? "bg-blue-600 text-white" : "text-foreground/65"}`} onClick={() => setSide("sell")}>Sell</button></div><label className="mt-5 block text-sm text-foreground/70">Fractional shares<input className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-foreground" type="number" min="0.000001" step="0.000001" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><span className="text-foreground/60">Bid / ask</span><span>{bb(quote.data.bid)} / {bb(quote.data.ask)}</span></div><div className="flex justify-between"><span className="text-foreground/60">Simulated spread</span><span>{quote.data.spreadPercent.toFixed(2)}%</span></div><div className="flex justify-between"><span className="text-foreground/60">Estimated midpoint total</span><span>{bb((Number(quantity) || 0) * quote.data.price)}</span></div></div><Button className="mt-6 w-full" disabled={order.isPending || !(Number(quantity) > 0) || quote.data.status !== "active"} onClick={() => void submit()}>{order.isPending ? "Filling…" : `Confirm simulated ${side}`}</Button><p className="mt-3 text-xs leading-5 text-foreground/55">The server determines the final fill. Spreads and slippage are educational execution costs, not real fees.</p></Card>
    </section>
    <section className="mt-6 grid gap-4 sm:grid-cols-3">{[["What this company does", quote.data.description], ["Key fundamentals", `${(quote.data.revenueGrowth * 100).toFixed(1)}% revenue growth · ${(quote.data.profitMargin * 100).toFixed(1)}% margin`], ["Risk level", `Beta ${quote.data.beta.toFixed(2)} · annualized volatility ${(quote.data.baseVolatility * 100).toFixed(0)}%`]].map(([label, content]) => <Card key={label} className="editorial-panel p-5"><p className="data-label">{label}</p><p className="mt-2 text-sm leading-6 text-foreground/70">{content}</p></Card>)}</section>
  </div></main>;
}
