import { useState } from 'react';
import { trpc } from '@/lib/trpc';
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

  // Fetch portfolio snapshots for chart
  const { data: snapshots = [] } = trpc.market.getPortfolioSnapshots.useQuery(
    { limit: 30 },
    { enabled: !!user?.id }
  );

  // Fetch leaderboard for comparison
  const { data: leaderboard = [] } = trpc.market.getLeaderboard.useQuery(undefined, {
    enabled: !!user?.id,
  });

  // Calculate portfolio stats
  const portfolioValue = portfolio && Array.isArray(portfolio) && portfolio.length > 0
    ? portfolio.reduce((sum: number, p: any) => sum + parseFloat(p.currentValue || '0'), 0)
    : 0;
  const portfolioGain = portfolio && Array.isArray(portfolio) && portfolio.length > 0
    ? portfolio.reduce((sum: number, p: any) => sum + parseFloat(p.gain || '0'), 0)
    : 0;
  const gainPercentage = portfolioValue > 0 ? (portfolioGain / (portfolioValue - portfolioGain)) * 100 : 0;

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
            <p className="text-xs text-foreground/60 mt-2">Total invested capital</p>
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
          <div className="h-64 bg-foreground/5 rounded-lg flex items-center justify-center">
            <p className="text-foreground/60">
              {snapshots.length > 0
                ? `${snapshots.length} data points available`
                : 'No historical data yet'}
            </p>
          </div>
          <div className="mt-4 text-xs text-foreground/60">
            Chart visualization would be rendered here using a charting library
          </div>
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
                <span className="text-foreground/70">Win Rate</span>
                <span className="font-bold text-foreground">--</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-foreground/5 rounded">
                <span className="text-foreground/70">Avg Trade Return</span>
                <span className="font-bold text-foreground">--</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-foreground/5 rounded">
                <span className="text-foreground/70">Largest Win</span>
                <span className="font-bold text-green-500">--</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-foreground/5 rounded">
                <span className="text-foreground/70">Largest Loss</span>
                <span className="font-bold text-red-500">--</span>
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
