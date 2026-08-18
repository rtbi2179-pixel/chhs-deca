import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BbxMarketNavigation } from "@/components/BbxMarketNavigation";
import { trpc } from "@/lib/trpc";

const bb = (value: number) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BB`;
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}><Icon className="h-3.5 w-3.5" />{pct(value)}</span>;
}

export function BbxMarketBoard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const overview = trpc.bbx.getOverview.useQuery(undefined, { refetchInterval: 20_000 });
  const order = trpc.bbx.placeMarketOrder.useMutation();
  const [trade, setTrade] = useState<{ ticker: string; side: "buy" | "sell"; price: number } | null>(null);
  const [quantity, setQuantity] = useState("1");
  const companies = overview.data?.companies ?? [];
  const selectedCompany = useMemo(() => companies.find((company) => company.ticker === trade?.ticker), [companies, trade?.ticker]);

  const submitOrder = async () => {
    if (!trade) return;
    try {
      const result = await order.mutateAsync({ ticker: trade.ticker, side: trade.side, quantity, idempotencyKey: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` });
      toast.success(`${trade.side === "buy" ? "Purchase" : "Sale"} filled at ${bb(result.fillPrice)} per share.`);
      setTrade(null);
      setQuantity("1");
      await Promise.all([utils.bbx.getOverview.invalidate(), utils.bbx.getPortfolio.invalidate(), utils.bbx.getTransactions.invalidate()]);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to place this simulated order.");
    }
  };

  if (overview.isLoading || !overview.data) return <main className="page-shell"><div className="page-content"><div className="loading-state min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div></div></main>;

  return <main className="page-shell"><div className="page-content max-w-7xl"><BbxMarketNavigation /><header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="page-eyebrow">BBX exchange workspace</p><h1 className="page-title mt-2">Market Board</h1><p className="page-intro mt-3 max-w-2xl">Browse fictional BBX listings, compare movers and sectors, then place a simulated market order.</p></div><span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 font-mono text-xs text-blue-100">Tick {overview.data.state.tickNumber} · server-authoritative</span></header><section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.85fr)]"><Card className="editorial-panel overflow-hidden p-0"><div className="border-b border-white/10 px-6 py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="data-label">Market board</p><h2 className="section-heading mt-1">Fictional company listings</h2><p className="mt-1 text-sm text-foreground/60">Displayed prices are BBX simulation marks. Final fills include a small, disclosed simulated spread and slippage.</p></div><span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-foreground/55">{companies.length} listings</span></div></div><div className="divide-y divide-white/8">{companies.map((company) => <div key={company.ticker} className="grid gap-3 px-6 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[1.2fr_0.65fr_0.75fr_auto] sm:items-center"><button className="min-w-0 text-left" onClick={() => setLocation(`/market/${company.ticker}`)}><p className="font-semibold text-foreground">{company.ticker}</p><p className="truncate text-sm text-foreground/60">{company.companyName} · {company.sector}</p></button><div><p className="font-semibold text-foreground">{bb(company.price)}</p><Change value={company.changePercent} /></div><span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-xs text-foreground/65">{company.status}</span><div className="flex gap-2"><Button size="sm" onClick={() => { setTrade({ ticker: company.ticker, side: "buy", price: company.price }); setQuantity("1"); }}>Buy</Button><Button size="sm" variant="outline" onClick={() => { setTrade({ ticker: company.ticker, side: "sell", price: company.price }); setQuantity("1"); }}>Sell</Button></div></div>)}</div></Card><div className="space-y-6"><Card className="editorial-panel p-6"><div className="flex items-center justify-between"><div><p className="data-label">Exchange activity</p><h2 className="section-heading mt-1">Market movers</h2></div><TrendingUp className="h-5 w-5 text-blue-300" /></div><div className="mt-4 grid grid-cols-2 gap-5"><div><p className="data-label">Gainers</p><div className="mt-2 space-y-2">{overview.data.movers.gainers.slice(0, 3).map((company) => <button key={company.ticker} className="flex w-full justify-between text-left text-sm" onClick={() => setLocation(`/market/${company.ticker}`)}><span className="text-foreground">{company.symbol}</span><Change value={company.changePercent} /></button>)}</div></div><div><p className="data-label">Losers</p><div className="mt-2 space-y-2">{overview.data.movers.losers.slice(0, 3).map((company) => <button key={company.ticker} className="flex w-full justify-between text-left text-sm" onClick={() => setLocation(`/market/${company.ticker}`)}><span className="text-foreground">{company.symbol}</span><Change value={company.changePercent} /></button>)}</div></div></div></Card><Card className="editorial-panel p-6"><p className="data-label">Sector view</p><h2 className="section-heading mt-1">Sector performance</h2><div className="mt-4 space-y-3">{overview.data.sectors.map((sector) => <div key={sector.sector} className="flex items-center justify-between"><span className="text-sm text-foreground/75">{sector.sector}</span><Change value={sector.changePercent} /></div>)}</div></Card></div></section>{trade && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"><Card className="w-full max-w-md border border-white/15 bg-slate-950 p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="data-label">SIMULATED MARKET ORDER</p><h2 className="mt-1 text-xl font-semibold text-foreground">{trade.side === "buy" ? "Buy" : "Sell"} {trade.ticker}</h2></div><button aria-label="Close order dialog" className="rounded p-1 text-foreground/60 hover:bg-white/10 hover:text-foreground" onClick={() => setTrade(null)}><X className="h-5 w-5" /></button></div><p className="mt-3 text-sm text-foreground/65">Midpoint: {bb(selectedCompany?.price ?? trade.price)}. Your final fill is determined on the server and may include simulated spread and slippage.</p><label className="mt-5 block text-sm text-foreground/70">Fractional shares<input aria-label="Quantity" type="number" min="0.000001" step="0.000001" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-foreground outline-none focus:border-blue-400" /></label><p className="mt-3 text-sm text-foreground/60">Estimated midpoint total: {bb((Number(quantity) || 0) * (selectedCompany?.price ?? trade.price))}</p><div className="mt-6 flex gap-3"><Button className="flex-1" disabled={order.isPending || !(Number(quantity) > 0)} onClick={() => void submitOrder()}>{order.isPending ? "Filling…" : `Confirm ${trade.side === "buy" ? "buy" : "sale"}`}</Button><Button className="flex-1" variant="outline" onClick={() => setTrade(null)}>Cancel</Button></div></Card></div>}</div></main>;
}
