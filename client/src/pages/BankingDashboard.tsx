import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp } from "lucide-react";

export function BankingDashboard() {
  const { user } = useAuth();
  const creditScoreQuery = trpc.banking.getCreditScore.useQuery();

  if (!user) return <div>Loading...</div>;

  const creditScore = creditScoreQuery.data?.score || 500;
  const creditDetails = creditScoreQuery.data?.details;

  const getScoreColor = (score: number) => {
    if (score >= 750) return "text-green-500";
    if (score >= 650) return "text-blue-500";
    if (score >= 550) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Banking Dashboard</h1>

        {/* Credit Score Section */}
        <Card className="bg-slate-800 border-slate-700 p-8 max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Credit Score</h2>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <div className={`text-6xl font-bold ${getScoreColor(creditScore)} mb-4`}>
            {creditScore}
          </div>
          <p className="text-slate-400 text-sm mb-6">Range: 300-850</p>
          
          {creditDetails && (
            <div className="space-y-3 bg-slate-700 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-3">Score Breakdown</h3>
              <div className="flex justify-between">
                <span className="text-slate-300">Payment Reliability:</span>
                <span className="text-white font-semibold">{Number(creditDetails.paymentReliabilityScore).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Account History:</span>
                <span className="text-white font-semibold">{Number(creditDetails.accountHistoryScore).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Practice Consistency:</span>
                <span className="text-white font-semibold">{Number(creditDetails.practiceConsistencyScore).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Net Worth:</span>
                <span className="text-white font-semibold">{Number(creditDetails.netWorthScore).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Spending Behavior:</span>
                <span className="text-white font-semibold">{Number(creditDetails.spendingBehaviorScore).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-8 p-6 bg-slate-800 border border-slate-700 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-3">Coming Soon</h2>
          <p className="text-slate-400">
            Bank accounts, credit card applications, and financial management features are coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
