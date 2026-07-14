'use client';

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

export default function BlueMarket() {
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellShares, setSellShares] = useState("");
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [stockPrices, setStockPrices] = useState<Record<string, any>>({});

  // Fetch data
  const { data: stocks = [], isLoading: stocksLoading } = trpc.market.getStocks.useQuery();
  const { data: cashBalance = "0" } = trpc.market.getCashBalance.useQuery();
  const { data: portfolio = [] } = trpc.market.getPortfolio.useQuery();
  const { data: leaderboard = [] } = trpc.market.getLeaderboard.useQuery();

  // Mutations
  const buyStockMutation = trpc.market.buyStock.useMutation();
  const sellStockMutation = trpc.market.sellStock.useMutation();
  const initializeStocksMutation = trpc.market.initializeDefaultStocks.useMutation();

  // Mock stock prices - replace with real API when tRPC query parsing is fixed
  const mockPrices: Record<string, { price: number; change: number }> = {
    'AAPL': { price: 150.25, change: 2.5 },
    'MSFT': { price: 380.50, change: 1.8 },
    'GOOGL': { price: 140.75, change: -0.5 },
    'AMZN': { price: 185.30, change: 3.2 },
    'TSLA': { price: 245.60, change: -1.2 },
    'META': { price: 320.40, change: 2.1 },
    'NVDA': { price: 875.20, change: 4.5 },
    'JPM': { price: 195.80, change: 0.8 },
    'V': { price: 280.15, change: 1.3 },
    'WMT': { price: 92.50, change: -0.3 },
  };

  // Fetch stock prices when stocks load
  const fetchStockPrices = useCallback(async () => {
    if (stocks.length === 0) return;

    for (const stock of stocks) {
      try {
        // Use mock prices for now - real API integration coming soon
        const mockData = mockPrices[stock.ticker] || { price: 100, change: 0 };
        setStockPrices(prev => ({
          ...prev,
          [stock.ticker]: {
            price: mockData.price,
            changePercent: mockData.change,
          },
        }));
      } catch (error) {
        console.error(`Failed to fetch price for ${stock.ticker}:`, error);
      }
    }
  }, [stocks]);

  useEffect(() => {
    if (stocks.length > 0) {
      fetchStockPrices();
    }
    // Refresh prices every 30 seconds
    const interval = setInterval(() => {
      fetchStockPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, [stocks, fetchStockPrices]);

  const handleBuyStock = async () => {
    if (!selectedStock || !buyAmount) {
      toast.error("Please select a stock and enter an amount");
      return;
    }

    try {
      const stockPrice = stockPrices[selectedStock.ticker];
      const pricePerShare = (typeof stockPrice === 'object' ? stockPrice?.price?.toString() : stockPrice) || "100";
      await buyStockMutation.mutateAsync({
        stockId: selectedStock.id,
        blueBucksAmount: buyAmount,
        pricePerShare,
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
      const pricePerShare = (typeof stockPrice === 'object' ? stockPrice?.price?.toString() : stockPrice) || "100";
      await sellStockMutation.mutateAsync({
        stockId: selectedStock.id,
        shares: sellShares,
        pricePerShare,
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
      const result = await initializeStocksMutation.mutateAsync();
      toast.success(`Initialized ${result.count} stocks!`);
    } catch (error) {
      console.error('Initialize stocks error:', error);
      toast.error("Failed to initialize stocks");
    }
  };

  if (stocksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-foreground">Loading Blue Market...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Blue Blazer Market</h1>
          <p className="text-foreground/70">Invest your Blue Bucks in real stocks. Educational simulation with 15-minute delayed data from Alpha Vantage.</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Cash Balance</p>
                <p className="text-3xl font-bold text-blue-500">{parseFloat(cashBalance).toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-500/30" />
            </div>
          </Card>

          <Card className="p-6 border border-border">
            <div>
              <p className="text-sm text-foreground/70 mb-1">Holdings</p>
              <p className="text-3xl font-bold text-green-500">{portfolio.length}</p>
            </div>
          </Card>

          <Card className="p-6 border border-border">
            <div>
              <p className="text-sm text-foreground/70 mb-1">Market Status</p>
              <p className="text-lg font-semibold text-yellow-500">15-min Delayed</p>
              <p className="text-xs text-foreground/60 mt-1">US Market Hours</p>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stocks List */}
          <div className="lg:col-span-2">
            <Card className="p-6 border border-border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Available Stocks</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={handleInitializeStocks}
                    variant="outline"
                    size="sm"
                    disabled={initializeStocksMutation.isPending}
                  >
                    {initializeStocksMutation.isPending ? "Initializing..." : "Initialize Stocks"}
                  </Button>
                  <Button
                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                    variant="outline"
                  >
                    {showLeaderboard ? "Hide" : "Show"} Leaderboard
                  </Button>
                </div>
              </div>

              {stocks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-foreground/60">No stocks available</p>
                  <p className="text-sm text-foreground/50 mt-2">Click "Initialize Stocks" to add default stocks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stocks.map((stock: any) => {
                    const priceData = stockPrices[stock.ticker];
                    return (
                      <div
                        key={stock.id}
                        className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50 hover:border-border cursor-pointer transition-all"
                        onClick={() => setSelectedStock(stock)}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{stock.ticker}</p>
                          <p className="text-sm text-foreground/60">{stock.companyName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {priceData ? (
                              <>
                                <p className="text-lg font-bold text-foreground">${typeof priceData === 'object' && priceData.price ? priceData.price.toFixed(2) : priceData}</p>
                                {typeof priceData === 'object' && priceData.changePercent !== undefined && (
                                  <p className={`text-xs flex items-center gap-1 ${
                                    priceData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    <TrendingUp className="w-3 h-3" /> {priceData.changePercent.toFixed(2)}%
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="text-lg font-bold text-foreground/50">Loading...</p>
                                <p className="text-xs text-foreground/30">Fetching price</p>
                              </>
                            )}
                          </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStock(stock);
                      setShowBuyDialog(true);
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!priceData}
                  >
                    Buy
                  </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Portfolio Holdings */}
          <div>
            <Card className="p-6 border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-6">Your Holdings</h2>

              {portfolio.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-foreground/60">No holdings yet</p>
                  <p className="text-sm text-foreground/50 mt-2">Buy stocks to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portfolio.map((holding: any) => (
                    <div key={holding.id} className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{holding.stocks?.ticker}</p>
                          <p className="text-xs text-foreground/60">{holding.shares} shares</p>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedStock(holding.stocks);
                            setShowSellDialog(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-600"
                        >
                          Sell
                        </Button>
                      </div>
                                <p className="text-sm text-foreground/70">
                        Value: {(parseFloat(holding.shares) * (typeof stockPrices[holding.stocks?.ticker] === 'object' ? stockPrices[holding.stocks?.ticker]?.price || 100 : 100)).toLocaleString()} BB
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <Card className="p-6 border border-border mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Market Leaderboard</h2>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-500">#{index + 1}</span>
                    <span className="text-foreground">{entry.userName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{parseFloat(entry.totalValue).toLocaleString()} BB</p>
                    <p className="text-sm text-green-500">+{parseFloat(entry.percentageReturn).toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Buy Dialog */}
        {showBuyDialog && selectedStock && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-8 border border-border max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-foreground mb-4">Buy {selectedStock.ticker}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Blue Bucks Amount</label>
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-sm text-foreground/70">
                  Current Price: ${stockPrices[selectedStock.ticker]?.price?.toFixed(2) || "Loading..."}
                </div>
                <div className="text-sm text-foreground/70">
                  Estimated shares: {buyAmount ? (parseFloat(buyAmount) / (stockPrices[selectedStock.ticker]?.price || 100)).toFixed(2) : "0"}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBuyStock}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={buyStockMutation.isPending}
                  >
                    {buyStockMutation.isPending ? "Buying..." : "Buy"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowBuyDialog(false);
                      setBuyAmount("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
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
            <Card className="p-8 border border-border max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-foreground mb-4">Sell {selectedStock.ticker}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Shares to Sell</label>
                  <input
                    type="number"
                    value={sellShares}
                    onChange={(e) => setSellShares(e.target.value)}
                    placeholder="Enter shares"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="text-sm text-foreground/70">
                  Current Price: ${stockPrices[selectedStock.ticker]?.price?.toFixed(2) || "Loading..."}
                </div>
                <div className="text-sm text-foreground/70">
                  Estimated proceeds: {sellShares ? (parseFloat(sellShares) * (stockPrices[selectedStock.ticker]?.price || 100)).toFixed(2) : "0"} BB
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSellStock}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={sellStockMutation.isPending}
                  >
                    {sellStockMutation.isPending ? "Selling..." : "Sell"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSellDialog(false);
                      setSellShares("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
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
