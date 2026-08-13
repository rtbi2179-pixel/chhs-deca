import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Quote = { price: number; changePercent: number; timestamp: Date };

export default function BlueMarket() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellShares, setSellShares] = useState("");
  const [tradeMode, setTradeMode] = useState<"buy" | "sell" | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [stockPrices, setStockPrices] = useState<Record<string, Quote>>({});
  const [loadingQuoteTicker, setLoadingQuoteTicker] = useState<string | null>(null);

  const { data: stocks = [], isLoading: stocksLoading } = trpc.market.getStocks.useQuery();
  const { data: cashBalance = "0" } = trpc.market.getCashBalance.useQuery();
  const { data: portfolio = [] } = trpc.market.getPortfolio.useQuery();
  const { data: leaderboard = [] } = trpc.market.getLeaderboard.useQuery();
  const buyStockMutation = trpc.market.buyStock.useMutation();
  const sellStockMutation = trpc.market.sellStock.useMutation();
  const initializeStocksMutation = trpc.market.initializeDefaultStocks.useMutation();

  const formatCurrency = (value: number | string) => {
    const parsed = Number(value);
    return `${Number.isFinite(parsed) ? parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} BB`;
  };

  const formatShares = (shares: number | string) => Number(shares).toFixed(6).replace(/\.?0+$/, "");

  const loadQuote = async (stock: any) => {
    setLoadingQuoteTicker(stock.ticker);
    try {
      const priceData = await utils.market.getStockPriceData.fetch({ ticker: stock.ticker });
      const price = Number(priceData?.price);
      if (!Number.isFinite(price) || price <= 0) {
        toast.error(`A current quote for ${stock.ticker} is unavailable. Please try again shortly.`);
        return null;
      }
      const quote = { price, changePercent: Number(priceData?.changePercent ?? 0), timestamp: new Date() };
      setStockPrices((current) => ({ ...current, [stock.ticker]: quote }));
      return quote;
    } catch {
      toast.error(`Unable to load the ${stock.ticker} quote.`);
      return null;
    } finally {
      setLoadingQuoteTicker(null);
    }
  };

  const openTradeDialog = async (stock: any, mode: "buy" | "sell") => {
    const quote = stockPrices[stock.ticker] ?? await loadQuote(stock);
    if (!quote) return;
    setSelectedStock(stock);
    setTradeMode(mode);
  };

  const refreshPortfolio = async () => {
    await Promise.all([
      utils.market.getPortfolio.invalidate(),
      utils.market.getCashBalance.invalidate(),
      utils.market.getPortfolioSnapshots.invalidate(),
      utils.market.getTransactionHistory.invalidate(),
      utils.market.getLeaderboard.invalidate(),
    ]);
  };

  const submitBuy = async () => {
    const quote = selectedStock ? stockPrices[selectedStock.ticker] : null;
    if (!selectedStock || !buyAmount || !quote?.price) {
      toast.error("Enter an amount after a valid market quote loads.");
      return;
    }
    try {
      await buyStockMutation.mutateAsync({ stockId: selectedStock.id, ticker: selectedStock.ticker, blueBucksAmount: buyAmount, pricePerShare: String(quote.price) });
      toast.success(`${selectedStock.ticker} purchase recorded.`);
      setBuyAmount("");
      setTradeMode(null);
      setSelectedStock(null);
      await refreshPortfolio();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to buy this stock.");
    }
  };

  const submitSell = async () => {
    const quote = selectedStock ? stockPrices[selectedStock.ticker] : null;
    if (!selectedStock || !sellShares || !quote?.price) {
      toast.error("Enter shares after a valid market quote loads.");
      return;
    }
    try {
      await sellStockMutation.mutateAsync({ stockId: selectedStock.id, ticker: selectedStock.ticker, shares: sellShares, pricePerShare: String(quote.price) });
      toast.success(`${selectedStock.ticker} sale recorded.`);
      setSellShares("");
      setTradeMode(null);
      setSelectedStock(null);
      await refreshPortfolio();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sell this stock.");
    }
  };

  const initializeStocks = async () => {
    try {
      await initializeStocksMutation.mutateAsync();
      await utils.market.getStocks.invalidate();
      toast.success("Default stock listings are ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to initialize market listings.");
    }
  };

  return (
    <main className="page-shell">
      <div className="page-content max-w-7xl">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="page-eyebrow">Financial learning lab</p><h1 className="page-title mt-2">Blue Blazer Market</h1><p className="page-intro mt-3">Trade with Blue Bucks using a required on-demand market quote.</p></div>
          <Button variant="outline" onClick={() => setLocation("/market-analytics")}>View Analytics</Button>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="editorial-panel p-6"><p className="data-label">Cash Balance</p><p className="mt-3 text-3xl font-bold text-blue-400">{formatCurrency(cashBalance)}</p></Card>
          <Card className="editorial-panel p-6"><p className="data-label">Open Holdings</p><p className="mt-3 text-3xl font-bold text-emerald-400">{portfolio.length}</p></Card>
          <Card className="editorial-panel p-6"><p className="data-label">Quote Policy</p><p className="mt-3 text-lg font-semibold text-foreground">On demand · cached 5 min</p></Card>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={initializeStocks} disabled={initializeStocksMutation.isPending}>{initializeStocksMutation.isPending ? "Initializing…" : "Initialize Stocks"}</Button>
          <Button variant="outline" onClick={() => setShowLeaderboard((open) => !open)}>{showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}</Button>
          {loadingQuoteTicker && <span className="inline-flex items-center gap-2 self-center text-sm text-foreground/70"><Loader2 className="h-4 w-4 animate-spin" /> Fetching {loadingQuoteTicker} quote…</span>}
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          <Card className="editorial-panel p-6 lg:col-span-2">
            <h2 className="section-heading">Available Stocks</h2>
            <p className="mt-1 text-sm text-foreground/60">Select Buy or Sell to request a live quote for that listing. A trade cannot be submitted without it.</p>
            <div className="mt-5 space-y-3">
              {stocksLoading ? <div className="loading-state min-h-36"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div> : stocks.length === 0 ? <p className="empty-state min-h-36 px-5 text-sm">No active stocks are configured for this chapter.</p> : stocks.map((stock) => {
                const quote = stockPrices[stock.ticker];
                const isLoadingQuote = loadingQuoteTicker === stock.ticker;
                return <div key={stock.id} className="editorial-panel-muted flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-semibold text-foreground">{stock.ticker}</p><p className="text-sm text-foreground/60">{stock.companyName}</p></div>
                  <div className="sm:text-right">{quote ? <><p className="font-semibold text-foreground">{formatCurrency(quote.price)}</p><p className={`text-xs ${quote.changePercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>{quote.changePercent >= 0 ? <TrendingUp className="mr-1 inline h-3 w-3" /> : <TrendingDown className="mr-1 inline h-3 w-3" />}{Math.abs(quote.changePercent).toFixed(2)}%</p></> : <p className="text-sm text-foreground/50">Quote on demand</p>}</div>
                  <div className="flex gap-2"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoadingQuote} onClick={() => void openTradeDialog(stock, "buy")}>{isLoadingQuote ? "Loading…" : "Buy"}</Button><Button size="sm" variant="outline" disabled={isLoadingQuote} onClick={() => void openTradeDialog(stock, "sell")}>Sell</Button></div>
                </div>;
              })}
            </div>
          </Card>

          <Card className="editorial-panel p-6"><h2 className="section-heading">Your Holdings</h2><div className="mt-5 space-y-3">{portfolio.length === 0 ? <p className="empty-state min-h-36 px-5 text-sm">No holdings yet. Your portfolio starts with 10,000 Blue Bucks.</p> : portfolio.map((holding: any) => <div key={holding.id} className="editorial-panel-muted p-3"><p className="font-semibold text-foreground">{holding.ticker}</p><p className="text-sm text-foreground/60">{formatShares(holding.shares)} shares</p><p className="mt-1 text-sm text-blue-400">Cost basis: {formatCurrency(holding.totalInvested ?? 0)}</p></div>)}</div></Card>
        </section>

        {showLeaderboard && <Card className="editorial-panel mt-8 p-6"><h2 className="section-heading">Market Leaderboard</h2>{leaderboard.length === 0 ? <p className="mt-4 text-foreground/60">No portfolio snapshots are available yet.</p> : <div className="mt-4 divide-y divide-border">{leaderboard.map((entry: any, index: number) => <div key={`${entry.userId}-${index}`} className="flex justify-between py-3 text-sm"><span className="text-foreground">#{index + 1} · {entry.userName ?? "Member"}</span><span className="font-semibold text-foreground">{formatCurrency(entry.totalPortfolioValue ?? entry.totalValue ?? 0)}</span></div>)}</div>}</Card>}
      </div>

      {tradeMode && selectedStock && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><Card className="w-full max-w-md border border-border p-6"><h2 className="text-xl font-bold text-foreground">{tradeMode === "buy" ? "Buy" : "Sell"} {selectedStock.ticker}</h2><p className="mt-2 text-sm text-foreground/70">Quoted at {formatCurrency(stockPrices[selectedStock.ticker]?.price ?? 0)}.</p><label className="mt-5 block text-sm text-foreground/70">{tradeMode === "buy" ? "Blue Bucks amount" : "Shares to sell"}<input type="number" min="0" step={tradeMode === "buy" ? "0.01" : "0.000001"} value={tradeMode === "buy" ? buyAmount : sellShares} onChange={(event) => tradeMode === "buy" ? setBuyAmount(event.target.value) : setSellShares(event.target.value)} className="mt-2 w-full rounded border border-border bg-muted px-3 py-2 text-foreground" /></label><div className="mt-6 flex gap-3"><Button className="flex-1" disabled={buyStockMutation.isPending || sellStockMutation.isPending} onClick={tradeMode === "buy" ? submitBuy : submitSell}>{tradeMode === "buy" ? "Confirm Buy" : "Confirm Sale"}</Button><Button className="flex-1" variant="outline" onClick={() => { setTradeMode(null); setSelectedStock(null); }}>Cancel</Button></div></Card></div>}
    </main>
  );
}
