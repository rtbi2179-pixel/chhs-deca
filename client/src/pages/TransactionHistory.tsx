import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";

export default function TransactionHistory() {
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: transactions, isLoading } = trpc.market.getTransactionHistory.useQuery({
    limit,
    offset,
  });

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `$${num.toFixed(2)}`;
  };

  const formatShares = (shares: string | number) => {
    const num = typeof shares === "string" ? parseFloat(shares) : shares;
    return num.toFixed(6).replace(/\.?0+$/, "");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Transaction History</h1>
          <p className="text-foreground/70">View all your past trades with execution prices and timestamps</p>
        </div>

        {/* Transactions Table */}
        <Card className="border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-foreground/70">Loading transactions...</span>
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-foreground/70">No transactions yet. Start trading to see your history!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Stock</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Shares</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Price/Share</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Total Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Executed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {tx.type === "buy" ? (
                            <>
                              <ArrowDownLeft className="w-5 h-5 text-green-500" />
                              <span className="text-sm font-medium text-green-500">Buy</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-5 h-5 text-red-500" />
                              <span className="text-sm font-medium text-red-500">Sell</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">{tx.ticker}</p>
                          <p className="text-sm text-foreground/60">{tx.stockName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-foreground">{formatShares(tx.shares)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-foreground">{formatCurrency(tx.pricePerShare)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-foreground">{formatCurrency(tx.totalAmount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground/70">{formatDate(tx.executedAt)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {transactions && transactions.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-foreground/70">
              Showing {offset + 1} to {offset + transactions.length} transactions
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setOffset(offset + limit)}
                disabled={transactions.length < limit}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
