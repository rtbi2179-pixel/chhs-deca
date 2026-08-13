import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { buildPortfolioPolyline, filterPortfolioSnapshots } from '@/lib/marketAnalytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

export default function MarketAnalytics() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'1w' | '1m' | '3m' | '1y'>('1m');

  // Fetch portfolio data
  const { data: portfolio } = trpc.market.getPortfolio.useQuery(undefined, {
    enabled: !!user?.id,
  });
  const { data: portfolioSummary } = trpc.market.getPortfolioSummary.useQuery(undefined, {
    enabled: !!user?.id,
  });

  // Fetch portfolio snapshots for chart
  const { data: snapshots = [] } = trpc.market.getPortfolioSnapshots.useQuery(
    { limit: 30 },
    { enabled: !!user?.id }
  );

  const { data: transactions = [] } = trpc.market.getTransactionHistory.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user?.id },
  );

  // Fetch leaderboard for comparison
  const { data: leaderboard = [] } = trpc.market.getLeaderboard.useQuery(undefined, {
    enabled: !!user?.id,
  });

  // Calculate portfolio stats
  const portfolioValue = portfolioSummary?.totalValue ?? 0;
  const portfolioGain = portfolioSummary?.totalProfit ?? 0;
  const gainPercentage = portfolioSummary?.percentageReturn ?? 0;

  // Find user's rank
  const userRank = leaderboard.findIndex((entry: any) => {
    if ('user' in entry) return entry.user.id === user?.id;
    if ('userId' in entry) return entry.userId === user?.id;
    return false;
  }) + 1;

  // Calculate performance metrics
  const bestPerformer = leaderboard[0] as any;
  const comparisonGain = bestPerformer?.totalProfit ? parseFloat(bestPerformer.totalProfit) : 0;
  const gainDifference = portfolioGain - comparisonGain;
  const visibleSnapshots = filterPortfolioSnapshots(snapshots, timeframe);
  const snapshotValues = visibleSnapshots.map((snapshot) => snapshot.value);
  const chartMin = snapshotValues.length ? Math.min(...snapshotValues) : 0;
  const chartMax = snapshotValues.length ? Math.max(...snapshotValues) : 0;
  const chartLine = buildPortfolioPolyline(visibleSnapshots);
  const executedTrades = transactions.filter((transaction: any) => transaction.status === 'executed');
  const sellReturns = executedTrades.filter((transaction: any) => transaction.type === 'sell').map((transaction: any) => Number(transaction.totalAmount ?? 0));
  const largestSale = sellReturns.length ? Math.max(...sellReturns) : null;
  const smallestSale = sellReturns.length ? Math.min(...sellReturns) : null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-foreground">Market Analytics</h1>
          </div>
          <p className="text-foreground/70">Track your portfolio performance and compare with other traders</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-8">
          {(['1w', '1m', '3m', '1y'] as const).map(tf => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'outline'}
              onClick={() => setTimeframe(tf)}
            >
              {tf === '1w' ? '1 Week' : tf === '1m' ? '1 Month' : tf === '3m' ? '3 Months' : '1 Year'}
            </Button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-border p-6 bg-card">
            <p className="text-foreground/70 text-sm mb-2">Portfolio Value</p>
            <p className="text-3xl font-bold text-foreground">${portfolioValue.toFixed(2)}</p>
            <p className="text-xs text-foreground/60 mt-2">Cash plus recorded cost basis</p>
          </Card>

          <Card className="border border-border p-6 bg-card">
            <p className="text-foreground/70 text-sm mb-2">Total Gain/Loss</p>
            <div className="flex items-center gap-2">
              {portfolioGain >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500" />
              )}
              <p className={`text-3xl font-bold ${portfolioGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${Math.abs(portfolioGain).toFixed(2)}
              </p>
            </div>
            <p className={`text-xs mt-2 ${gainPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {gainPercentage >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%
            </p>
          </Card>

          <Card className="border border-border p-6 bg-card">
            <p className="text-foreground/70 text-sm mb-2">Leaderboard Rank</p>
            <p className="text-3xl font-bold text-blue-500">#{userRank}</p>
            <p className="text-xs text-foreground/60 mt-2">Out of {leaderboard.length} traders</p>
          </Card>

          <Card className="border border-border p-6 bg-card">
            <p className="text-foreground/70 text-sm mb-2">vs Best Performer</p>
            <div className="flex items-center gap-2">
              {gainDifference >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500" />
              )}
              <p className={`text-3xl font-bold ${gainDifference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${Math.abs(gainDifference).toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-foreground/60 mt-2">
              {gainDifference >= 0 ? 'Ahead' : 'Behind'} of leader
            </p>
          </Card>
        </div>

        {/* Portfolio Performance Chart */}
        <Card className="border border-border p-6 bg-card mb-8">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Portfolio Value Over Time
          </h3>
          {visibleSnapshots.length >= 2 ? (
            <div className="rounded-lg border border-border bg-foreground/[0.03] p-4">
              <svg viewBox="0 0 600 220" className="h-64 w-full" role="img" aria-label={`Portfolio value from ${new Date(visibleSnapshots[0].snapshotDate).toLocaleDateString()} to ${new Date(visibleSnapshots.at(-1)?.snapshotDate ?? '').toLocaleDateString()}`}>
                <defs><linearGradient id="portfolio-line" x1="0" x2="1"><stop stopColor="#3b82f6" /><stop offset="1" stopColor="#60a5fa" /></linearGradient></defs>
                <line x1="0" y1="212" x2="600" y2="212" stroke="currentColor" className="text-foreground/15" />
                <polyline points={chartLine} fill="none" stroke="url(#portfolio-line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {visibleSnapshots.map((snapshot, index) => {
                  const range = chartMax - chartMin || 1;
                  const x = (index / (visibleSnapshots.length - 1)) * 600;
                  const y = 220 - ((snapshot.value - chartMin) / range) * 204 - 8;
                  return <circle key={`${snapshot.snapshotDate}-${index}`} cx={x} cy={y} r="4" className="fill-blue-400 stroke-background" strokeWidth="2"><title>{`${new Date(snapshot.snapshotDate).toLocaleDateString()}: ${snapshot.value.toFixed(2)} Blue Bucks`}</title></circle>;
                })}
              </svg>
              <div className="mt-3 flex justify-between text-xs text-foreground/60"><span>{new Date(visibleSnapshots[0].snapshotDate).toLocaleDateString()}</span><span>{new Date(visibleSnapshots.at(-1)?.snapshotDate ?? '').toLocaleDateString()}</span></div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-foreground/[0.03] px-6 text-center text-sm text-foreground/60">{snapshots.length ? 'Complete one more trade to build a historical performance line for this period.' : 'Your first executed trade will create a portfolio snapshot here.'}</div>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground/60"><span>Low: {chartMin.toFixed(2)} BB</span><span>High: {chartMax.toFixed(2)} BB</span><span>{visibleSnapshots.length} snapshot{visibleSnapshots.length === 1 ? '' : 's'} in range</span></div>
        </Card>

        {/* Holdings Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="border border-border p-6 bg-card">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Holdings Breakdown
            </h3>
            {portfolio && Array.isArray(portfolio) && portfolio.length > 0 ? (
              <div className="space-y-3">
                {portfolio.map((holding: any, idx: number) => {
                  const value = parseFloat(holding.currentValue || '0');
                  const percentage = portfolioValue > 0 ? (value / portfolioValue) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{holding.ticker}</p>
                        <div className="w-full bg-foreground/10 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-sm font-bold text-foreground ml-4">{percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-foreground/60">No holdings yet</p>
            )}
          </Card>

          <Card className="border border-border p-6 bg-card">
            <h3 className="text-lg font-bold text-foreground mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-foreground/5 rounded">
                <span className="text-foreground/70">Executed Trades</span>
                <span className="font-bold text-foreground">{executedTrades.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-foreground/5 rounded">
                <span className="text-foreground/70">Tracked Snapshots</span>
                <span className="font-bold text-foreground">{snapshots.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-foreground/5 rounded">
                <span className="text-foreground/70">Largest Sale</span>
                <span className="font-bold text-green-500">{largestSale === null ? '—' : `${largestSale.toFixed(2)} BB`}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-foreground/5 rounded">
                <span className="text-foreground/70">Smallest Sale</span>
                <span className="font-bold text-red-500">{smallestSale === null ? '—' : `${smallestSale.toFixed(2)} BB`}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="border border-border p-6 bg-card">
          <h3 className="text-lg font-bold text-foreground mb-4">Top Traders</h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry: any, idx: number) => {
              const userName = 'user' in entry ? entry.user.username : entry.username || 'Anonymous';
              const profit = parseFloat(entry.totalProfit || '0');
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-foreground/5 rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-500 w-6">#{idx + 1}</span>
                    <span className="text-foreground">{userName}</span>
                  </div>
                  <span className={`font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${profit.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
