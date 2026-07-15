import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Send, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function BankingDashboard() {
  const { user } = useAuth();
  const creditScoreQuery = trpc.banking.getCreditScore.useQuery();
  const bankAccountQuery = trpc.banking.getBankAccount.useQuery();
  const transferMutation = trpc.banking.transferFunds.useMutation();
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromAccount: "checking",
    toAccount: "savings",
    amount: "",
  });

  if (!user) return <div>Loading...</div>;

  const creditScore = creditScoreQuery.data?.score || 500;
  const creditDetails = creditScoreQuery.data?.details;
  const bankAccount = bankAccountQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 750) return "text-green-500";
    if (score >= 650) return "text-blue-500";
    if (score >= 550) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 750) return "bg-green-500/10 border-green-500/30";
    if (score >= 650) return "bg-blue-500/10 border-blue-500/30";
    if (score >= 550) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  // Credit score breakdown data for pie chart
  const creditScoreBreakdown = creditDetails ? [
    { name: "Payment Reliability", value: Number(creditDetails.paymentReliabilityScore) },
    { name: "Account History", value: Number(creditDetails.accountHistoryScore) },
    { name: "Practice Consistency", value: Number(creditDetails.practiceConsistencyScore) },
    { name: "Net Worth", value: Number(creditDetails.netWorthScore) },
    { name: "Spending Behavior", value: Number(creditDetails.spendingBehaviorScore) },
  ] : [];

  // Account balances data for bar chart
  const accountBalances = bankAccount ? [
    { name: "Checking", balance: typeof bankAccount.checkingBalance === 'string' ? parseFloat(bankAccount.checkingBalance) : bankAccount.checkingBalance },
    { name: "Savings", balance: typeof bankAccount.savingsBalance === 'string' ? parseFloat(bankAccount.savingsBalance) : bankAccount.savingsBalance },
    { name: "Investment", balance: typeof bankAccount.investmentBalance === 'string' ? parseFloat(bankAccount.investmentBalance) : bankAccount.investmentBalance },
  ] : [];

  const totalBalance = bankAccount ? 
    (typeof bankAccount.checkingBalance === 'string' ? parseFloat(bankAccount.checkingBalance) : bankAccount.checkingBalance) + 
    (typeof bankAccount.savingsBalance === 'string' ? parseFloat(bankAccount.savingsBalance) : bankAccount.savingsBalance) + 
    (typeof bankAccount.investmentBalance === 'string' ? parseFloat(bankAccount.investmentBalance) : bankAccount.investmentBalance)
    : 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleTransfer = async () => {
    if (!transferData.amount || Number(transferData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    try {
      await transferMutation.mutateAsync({
        fromAccount: transferData.fromAccount as "checking" | "savings" | "investment",
        toAccount: transferData.toAccount as "checking" | "savings" | "investment",
        amount: Number(transferData.amount),
      });
      setShowTransferModal(false);
      setTransferData({ fromAccount: "checking", toAccount: "savings", amount: "" });
      bankAccountQuery.refetch();
    } catch (error) {
      alert("Transfer failed: " + (error as any).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Banking Dashboard</h1>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Credit Score Card */}
          <Card className={`border-2 p-6 ${getScoreBgColor(creditScore)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Credit Score</h2>
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div className={`text-5xl font-bold ${getScoreColor(creditScore)} mb-2`}>
              {creditScore}
            </div>
            <p className="text-slate-400 text-sm">Range: 300-850</p>
          </Card>

          {/* Total Balance Card */}
          <Card className="bg-slate-800 border-slate-700 border-2 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Total Balance</h2>
            <div className="text-5xl font-bold text-green-400 mb-2">
              ${totalBalance.toFixed(2)}
            </div>
            <p className="text-slate-400 text-sm">Across all accounts</p>
          </Card>

          {/* Total Debt Card */}
          <Card className="bg-slate-800 border-slate-700 border-2 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Total Debt</h2>
            <div className="text-5xl font-bold text-red-400 mb-2">
              ${(typeof bankAccount?.totalDebt === 'string' ? parseFloat(bankAccount.totalDebt) : (bankAccount?.totalDebt || 0)).toFixed(2)}
            </div>
            <p className="text-slate-400 text-sm">Outstanding balances</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Credit Score Breakdown Pie Chart */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Credit Score Breakdown</h2>
            {creditScoreBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={creditScoreBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {creditScoreBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(typeof value === 'number' ? value : parseFloat(value as string)).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">Loading credit score data...</p>
            )}
          </Card>

          {/* Account Balances Bar Chart */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Balances</h2>
            {accountBalances.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accountBalances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Bar dataKey="balance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">Loading account data...</p>
            )}
          </Card>
        </div>

        {/* Account Details and Transfer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Details */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">Checking Account</span>
                </div>
                <span className="text-white font-semibold">${(typeof bankAccount?.checkingBalance === 'string' ? parseFloat(bankAccount.checkingBalance) : (bankAccount?.checkingBalance || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">Savings Account</span>
                </div>
                <span className="text-white font-semibold">${(typeof bankAccount?.savingsBalance === 'string' ? parseFloat(bankAccount.savingsBalance) : (bankAccount?.savingsBalance || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300">Investment Account</span>
                </div>
                <span className="text-white font-semibold">${(typeof bankAccount?.investmentBalance === 'string' ? parseFloat(bankAccount.investmentBalance) : (bankAccount?.investmentBalance || 0)).toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Transfer Funds */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Transfer Funds
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">From Account</label>
                <select
                  value={transferData.fromAccount}
                  onChange={(e) => setTransferData({ ...transferData, fromAccount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">To Account</label>
                <select
                  value={transferData.toAccount}
                  onChange={(e) => setTransferData({ ...transferData, toAccount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <Button
                onClick={handleTransfer}
                disabled={transferMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                {transferMutation.isPending ? "Processing..." : "Transfer"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
