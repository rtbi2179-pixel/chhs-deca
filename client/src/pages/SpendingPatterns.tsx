import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

export default function SpendingPatterns() {
  const { user, loading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getFullYear() * 100 + (new Date().getMonth() + 1));

  const { data: spendingData, isLoading } = trpc.banking.getSpendingPatterns.useQuery({ month: selectedMonth });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Please log in to view spending patterns.</div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    'grocery': '#3b82f6',
    'gas': '#ef4444',
    'dining': '#f59e0b',
    'entertainment': '#8b5cf6',
    'shopping': '#ec4899',
    'utilities': '#06b6d4',
    'other': '#6b7280',
  };

  const chartData = spendingData?.map((pattern: any) => ({
    name: pattern.merchantCategory,
    value: parseFloat(pattern.monthlySpending),
    count: pattern.transactionCount,
    average: parseFloat(pattern.averageTransactionAmount),
  })) || [];

  const totalSpending = chartData.reduce((sum: number, item: any) => sum + item.value, 0);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Spending Patterns</h1>
          <p className="text-foreground/70">Analyze your spending by category</p>
        </div>

        {/* Month Selector */}
        <Card className="border border-border p-6 mb-8 bg-card">
          <div className="flex items-center gap-4">
            <label className="text-foreground font-semibold">Select Month:</label>
            <input
              type="month"
              value={`${Math.floor(selectedMonth / 100)}-${String(selectedMonth % 100).padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setSelectedMonth(parseInt(year) * 100 + parseInt(month));
              }}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-foreground/70">Loading spending patterns...</div>
          </div>
        ) : chartData.length === 0 ? (
          <Card className="border border-border p-8 bg-card text-center">
            <p className="text-foreground/70">No spending data available for this month</p>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border border-border p-6 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground/70 text-sm font-semibold mb-1">Total Spending</p>
                    <p className="text-3xl font-bold text-blue-400">${totalSpending.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-blue-400/30" />
                </div>
              </Card>

              <Card className="border border-border p-6 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground/70 text-sm font-semibold mb-1">Categories</p>
                    <p className="text-3xl font-bold text-purple-400">{chartData.length}</p>
                  </div>
                  <ShoppingCart className="w-12 h-12 text-purple-400/30" />
                </div>
              </Card>

              <Card className="border border-border p-6 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground/70 text-sm font-semibold mb-1">Total Transactions</p>
                    <p className="text-3xl font-bold text-cyan-400">{chartData.reduce((sum: number, item: any) => sum + item.count, 0)}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-cyan-400/30" />
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Bar Chart */}
              <Card className="border border-border p-6 bg-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Spending by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Pie Chart */}
              <Card className="border border-border p-6 bg-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Spending Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card className="border border-border overflow-hidden bg-card">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Category Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-foreground/5 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Category</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Total Spending</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Transactions</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Average</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-border hover:bg-foreground/5 transition">
                        <td className="px-6 py-4 text-foreground capitalize">{item.name}</td>
                        <td className="px-6 py-4 text-foreground font-semibold">${item.value.toFixed(2)}</td>
                        <td className="px-6 py-4 text-foreground">{item.count}</td>
                        <td className="px-6 py-4 text-foreground">${item.average.toFixed(2)}</td>
                        <td className="px-6 py-4 text-foreground">{((item.value / totalSpending) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
