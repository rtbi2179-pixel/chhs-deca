import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export default function BlueMarket() {
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellShares, setSellShares] = useState("");
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [stockPrices, setStockPrices] = useState<Record<string, any>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Fetch data
  const { data: stocks = [], isLoading: stocksLoading } = trpc.market.getStocks.useQuery();
  const { data: cashBalance = "0" } = trpc.market.getCashBalance.useQuery();
  const { data: portfolio = [] } = trpc.market.getPortfolio.useQuery();
  const { data: leaderboard = [] } = trpc.market.getLeaderboard.useQuery();

  // Mutations
  const buyStockMutation = trpc.market.buyStock.useMutation();
  const sellStockMutation = trpc.market.sellStock.useMutation();
  const initializeStocksMutation = trpc.market.initializeDefaultStocks.useMutation();

  // Fetch stock prices using tRPC client
  const fetchStockPrices = useCallback(async () => {
    if (stocks.length === 0) return;
    
    setLoadingPrices(true);
    try {
      const newPrices: Record<string, any> = {};
      
      // Fetch all prices in parallel using tRPC
      const pricePromises = stocks.map(async (stock) => {
        try {
          const priceData = await fetch(`/api/trpc/market.getStockPriceData?input=${encodeURIComponent(JSON.stringify({ ticker: stock.ticker }))}`, { credentials: "include" }).then(r => r.json()).then(d => d.result?.data);
          
          if (priceData) {
            newPrices[stock.ticker] = {
              price: priceData.price || 0,
              changePercent: priceData.changePercent || 0,
              timestamp: new Date(),
            };
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${stock.ticker}:`, error);
        }
      });

      await Promise.all(pricePromises);
      setStockPrices(newPrices);
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      toast.error("Failed to fetch stock prices");
    } finally {
      setLoadingPrices(false);
    }
  }, [stocks]);

  useEffect(() => {
    if (stocks.length > 0) {
      fetchStockPrices();
    }
    // Refresh prices every 5 minutes (server caches for 5 minutes)
    // This respects Alpha Vantage rate limits (5 requests/minute)
    const interval = setInterval(() => {
      fetchStockPrices();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [stocks, fetchStockPrices]);

  const handleBuyStock = async () => {
    if (!selectedStock || !buyAmount) {
      toast.error("Please select a stock and enter an amount");
      return;
    }

    try {
      const stockPrice = stockPrices[selectedStock.ticker];
      const pricePerShare = (stockPrice?.price || 100).toString();
      await buyStockMutation.mutateAsync({
        stockId: selectedStock.id,
        blueBucksAmount: buyAmount,
        pricePerShare,
        ticker: selectedStock.ticker,
      });
      toast.success(`Bought ${selectedStock.ticker}!`);
      setBuyAmount("");
      setShowBuyDialog(false);
      setSelectedStock(null);
      // Refetch portfolio and cash balance
      const utils = trpc.useUtils();
      utils.market.getPortfolio.invalidate();
      utils.market.getCashBalance.invalidate();
    } catch (error) {
      toast.error("Failed to buy stock");
    }
  };

  const handleSellStock = async () => {
    if (!selectedStock || !sellShares) {
      toast.error("Please select a stock and enter shares");
      return;
    }

    try {
      const stockPrice = stockPrices[selectedStock.ticker];
      const pricePerShare = (stockPrice?.price || 100).toString();
      await sellStockMutation.mutateAsync({
        stockId: selectedStock.id,
        shares: sellShares,
        pricePerShare,
        ticker: selectedStock.ticker,
      });
      toast.success(`Sold ${selectedStock.ticker}!`);
      setSellShares("");
      setShowSellDialog(false);
      setSelectedStock(null);
      // Refetch portfolio and cash balance
      const utils = trpc.useUtils();
      utils.market.getPortfolio.invalidate();
      utils.market.getCashBalance.invalidate();
    } catch (error) {
      toast.error("Failed to sell stock");
    }
  };

  const handleInitializeStocks = async () => {
    try {
      await initializeStocksMutation.mutateAsync();
      toast.success("Stocks initialized!");
      // Refetch stocks
      const utils = trpc.useUtils();
      utils.market.getStocks.invalidate();
    } catch (error) {
      toast.error("Failed to initialize stocks");
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `$${num.toFixed(2)}`;
  };

  const formatShares = (shares: number | string) => {
    const num = typeof shares === "string" ? parseFloat(shares) : shares;
    return num.toFixed(6).replace(/\.?0+$/, "");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Blue Blazer Market</h1>
          <p className="text-foreground/70">Trade stocks using Blue Bucks. Real-time prices from Alpha Vantage (15-min delayed).</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border border-border">
            <div className="text-foreground/70 text-sm mb-2">Cash Balance</div>
            <div className="text-3xl font-bold text-blue-500">{formatCurrency(cashBalance)}</div>
          </Card>
          <Card className="p-6 border border-border">
            <div className="text-foreground/70 text-sm mb-2">Holdings</div>
            <div className="text-3xl font-bold text-green-500">{portfolio.length}</div>
          </Card>
          <Card className="p-6 border border-border">
            <div className="text-foreground/70 text-sm mb-2">Market Status</div>
            <div className="text-lg font-semibold text-yellow-500">15-min Delayed</div>
            <div className="text-xs text-foreground/60">US Market Hours</div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-8">
          <Button onClick={handleInitializeStocks} variant="default">
            Initialize Stocks
          </Button>
          <Button onClick={() => setShowLeaderboard(!showLeaderboard)} variant="outline">
            Show Leaderboard
          </Button>
          {loadingPrices && (
            <div className="flex items-center gap-2 text-foreground/70">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Fetching prices...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Available Stocks */}
          <div className="col-span-2">
            <Card className="border border-border p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Available Stocks</h2>
              
              {stocksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : stocks.length === 0 ? (
                <div className="py-12 text-center text-foreground/70">
                  <p>No stocks available. Click "Initialize Stocks" to add default stocks.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stocks.map((stock) => {
                    const priceData = stockPrices[stock.ticker];
                    const price = priceData?.price || 0;
                    const changePercent = priceData?.changePercent || 0;
                    const isPositive = changePercent >= 0;

                    return (
                      <div
                        key={stock.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{stock.ticker}</div>
                          <div className="text-sm text-foreground/60">{stock.companyName}</div>
                        </div>
                        <div className="text-right mr-6">
                          {price > 0 ? (
                            <>
                              <div className="font-bold text-foreground">{formatCurrency(price)}</div>
                              <div className={`text-sm flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {Math.abs(changePercent).toFixed(2)}%
                              </div>
                            </>
                          ) : (
                            <div className="text-foreground/50">Loading...</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStock(stock);
                              setShowBuyDialog(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Buy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStock(stock);
                              setShowSellDialog(true);
                            }}
                            variant="outline"
                          >
                            Sell
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Your Holdings */}
          <div>
            <Card className="border border-border p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Your Holdings</h2>
              
              {portfolio.length === 0 ? (
                <div className="py-8 text-center text-foreground/70">
                  <p className="text-sm">No holdings yet. Buy stocks to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portfolio.map((holding: any) => (
                    <div key={holding.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-semibold text-foreground">{holding.ticker}</div>
                      <div className="text-sm text-foreground/60">
                        {formatShares(holding.shares)} shares
                      </div>
                      <div className="text-sm font-medium text-blue-500 mt-1">
                        {formatCurrency(holding.totalValue || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <Card className="border border-border p-6 mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Market Leaderboard</h2>
            
            {leaderboard.length === 0 ? (
              <div className="py-8 text-center text-foreground/70">
                <p>No leaderboard data available yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">Rank</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">User</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-foreground">Portfolio Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaderboard.map((entry: any, idx: number) => (
                      <tr key={entry.userId} className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-foreground">#{idx + 1}</td>
                        <td className="px-4 py-2 text-foreground">{entry.userName || "User"}</td>
                        <td className="px-4 py-2 text-right font-semibold text-foreground">
                          {formatCurrency(entry.totalPortfolioValue || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Buy Dialog */}
        {showBuyDialog && selectedStock && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="border border-border p-6 w-96">
              <h3 className="text-xl font-bold text-foreground mb-4">Buy {selectedStock.ticker}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground/70">Price: {formatCurrency(stockPrices[selectedStock.ticker]?.price || 0)}</label>
                </div>
                <div>
                  <label className="text-sm text-foreground/70">Blue Bucks Amount</label>
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBuyStock} className="flex-1 bg-green-600 hover:bg-green-700">
                    Buy
                  </Button>
                  <Button onClick={() => setShowBuyDialog(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Sell Dialog */}
        {showSellDialog && selectedStock && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="border border-border p-6 w-96">
              <h3 className="text-xl font-bold text-foreground mb-4">Sell {selectedStock.ticker}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground/70">Price: {formatCurrency(stockPrices[selectedStock.ticker]?.price || 0)}</label>
                </div>
                <div>
                  <label className="text-sm text-foreground/70">Shares to Sell</label>
                  <input
                    type="number"
                    value={sellShares}
                    onChange={(e) => setSellShares(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground"
                    placeholder="Enter shares"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSellStock} className="flex-1 bg-red-600 hover:bg-red-700">
                    Sell
                  </Button>
                  <Button onClick={() => setShowSellDialog(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
