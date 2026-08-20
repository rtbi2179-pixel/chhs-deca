import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowDownLeft, ArrowUpRight, CreditCard, ReceiptText, Send, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { CreditScoreChart } from "@/components/CreditScoreChart";
import { CREDIT_SCORE_STAGES, getCreditScoreStage } from "@shared/creditScoreStages";

const CREDIT_SCORE_FACTOR_GUIDANCE: Record<string, { action: string; tip: string }> = {
  "Payment Reliability": {
    action: "Affected when you use Make Payment on an issued Banking Study Card and keep payments on time.",
    tip: "Pay a card balance before adding more purchases to build a dependable payment record.",
  },
  "Account History": {
    action: "Affected by the age of your active banking relationship and continued responsible card activity.",
    tip: "Keep an established Study Card active and make steady, on-time payments instead of repeatedly starting over.",
  },
  "Practice Consistency": {
    action: "Affected by regular Practice Questions, PI Study, and Mock Exam activity across the site.",
    tip: "Practice on several days each week to protect your study streak and avoid long inactive gaps.",
  },
  "Savings Discipline": {
    action: "Affected when you transfer funds into Savings and maintain a healthy savings balance.",
    tip: "Move a small portion of checking or earned Blue Bucks into Savings consistently before spending the rest.",
  },
  "Credit Utilization": {
    action: "Affected by the portion of your issued Banking Study Card limit currently used by purchases.",
    tip: "Keep balances low and make a payment before your card gets close to its limit.",
  },
};

type CreditScoreTooltipEntry = {
  name?: string;
  value?: number | string;
};

function CreditScoreBreakdownTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: CreditScoreTooltipEntry; name?: string; value?: number | string }> }) {
  const entry = payload?.[0];
  const factorName = entry?.payload?.name ?? entry?.name;
  if (!active || !factorName) return null;

  const value = Number(entry?.payload?.value ?? entry?.value ?? 0);
  const guidance = CREDIT_SCORE_FACTOR_GUIDANCE[factorName] ?? {
    action: "This factor contributes to your Blue Blazer credit score composition.",
    tip: "Use the Banking and Practice tools consistently to improve your overall credit-building habits.",
  };

  return (
    <div className="max-w-xs rounded-xl border border-blue-300/30 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-white">{factorName} · {value.toFixed(1)}%</p>
      <div className="mt-2 space-y-2 text-xs leading-5">
        <p className="text-blue-100"><span className="font-semibold text-blue-300">Website action:</span> {guidance.action}</p>
        <p className="text-emerald-100"><span className="font-semibold text-emerald-300">Improvement tip:</span> {guidance.tip}</p>
      </div>
    </div>
  );
}

export function BankingDashboard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const creditScoreQuery = trpc.banking.getCreditScore.useQuery();
  const creditHistoryQuery = trpc.banking.getCreditScoreHistory.useQuery({ limit: 30 });
  const bankAccountQuery = trpc.banking.getBankAccount.useQuery();
  const transferMutation = trpc.banking.transferFunds.useMutation();
  const userCardsQuery = trpc.banking.getUserCards.useQuery();
  const chargeCardMutation = trpc.banking.chargeCard.useMutation();
  const makePaymentMutation = trpc.banking.makePayment.useMutation();
  const savingsInterestQuery = trpc.banking.getSavingsInterest.useQuery();
  const studyCardCatalogQuery = trpc.studyCards.catalog.useQuery(undefined, { enabled: Boolean(user) });
  const studyCardMineQuery = trpc.studyCards.mine.useQuery(undefined, { enabled: Boolean(user) });
  const selectStudyCardMutation = trpc.studyCards.select.useMutation({
    onSuccess: (data) => {
      utils.studyCards.mine.invalidate();
      toast.success(`Switched active Study Card to ${data.cardKey}!`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to switch Study Card");
    }
  });
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromAccount: "checking",
    toAccount: "savings",
    amount: "",
  });
  const [cardAction, setCardAction] = useState<{ cardId: number; mode: "charge" | "payment" } | null>(null);
  const [cardActionAmount, setCardActionAmount] = useState("");
  const [merchantCategory, setMerchantCategory] = useState("General");
  const [selectedStatementCard, setSelectedStatementCard] = useState<number | null>(null);
  const [activeBankingCardId, setActiveBankingCardId] = useState<number | null>(null);
  const cardStatementQuery = trpc.banking.getCardStatement.useQuery(
    { cardId: selectedStatementCard ?? 1 },
    { enabled: selectedStatementCard !== null },
  );

  if (!user) return <div className="page-shell"><div className="page-content"><div className="loading-state">Loading your banking dashboard…</div></div></div>;

  const creditScore = creditScoreQuery.data?.score || 500;
  const creditScoreComposition = creditScoreQuery.data?.composition ?? [];
  const creditStage = getCreditScoreStage(creditScore);
  const bankAccount = bankAccountQuery.data;
  const issuedBankingCards = userCardsQuery.data ?? [];
  const activeBankingCard = issuedBankingCards.find((card: any) => card.id === activeBankingCardId) ?? issuedBankingCards[0] ?? null;
  const activeStudyCard = studyCardCatalogQuery.data?.cards.find((card) => card.key === studyCardMineQuery.data?.cardKey) ?? studyCardCatalogQuery.data?.cards[0] ?? null;

  useEffect(() => {
    setActiveBankingCardId((current) => {
      if (current && issuedBankingCards.some((card: any) => card.id === current)) return current;
      return issuedBankingCards[0]?.id ?? null;
    });
  }, [issuedBankingCards]);

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

  // Configuration weights are normalized by the server so the pie chart always totals 100%.
  const creditScoreBreakdown = creditScoreComposition;

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

  const handleCardAction = async () => {
    if (!cardAction || !cardActionAmount || Number(cardActionAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      if (cardAction?.mode === "charge") {
        await chargeCardMutation.mutateAsync({
          cardId: cardAction.cardId,
          amount: Number(cardActionAmount),
          merchantCategory,
        });
      } else {
        await makePaymentMutation.mutateAsync({
          cardId: cardAction.cardId,
          amount: Number(cardActionAmount),
        });
      }
      setCardAction(null);
      setCardActionAmount("");
      userCardsQuery.refetch();
      bankAccountQuery.refetch();
    } catch (error) {
      alert(`${cardAction?.mode === "charge" ? "Purchase" : "Payment"} failed: ${(error as Error).message}`);
    }
  };

  return (
    <div className="page-shell banking-dashboard mt-16">
      <div className="page-content max-w-7xl">
        <div className="banking-hero"><div><p className="page-eyebrow">Financial systems</p><h1 className="page-title mt-2">Banking Dashboard</h1><p className="page-intro mt-3">Track virtual accounts, credit-building habits, and active study rewards in one clear workspace.</p></div><div className="banking-hero-status"><p className="data-label">Current credit stage</p><p className="mt-1 text-lg font-semibold text-white">{creditStage.name}</p><p className="mt-1 font-mono-data text-xs text-blue-200">{creditScore} / 850</p></div></div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Credit Score Card */}
          <Card className={`editorial-panel banking-metric border p-6 ${getScoreBgColor(creditScore)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="data-label text-blue-200">Credit Score</h2>
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div className={`banking-metric-value ${getScoreColor(creditScore)} mb-2`}>
              {creditScore}
            </div>
            <p className="text-slate-400 text-sm">Range: 300-850 · {creditStage.name} stage</p>
            <p className="mt-2 text-xs leading-5 text-blue-100/75">{creditStage.description}</p>
          </Card>

          {/* Total Balance Card */}
          <Card className="editorial-panel banking-metric p-6">
            <h2 className="data-label text-emerald-200 mb-4">Total Balance</h2>
            <div className="banking-metric-value text-green-400 mb-2">
              ${totalBalance.toFixed(2)}
            </div>
            <p className="text-slate-400 text-sm">Across all accounts</p>
          </Card>

          {/* Total Debt Card */}
          <Card className="editorial-panel banking-metric p-6">
            <h2 className="data-label text-red-200 mb-4">Total Debt</h2>
            <div className="banking-metric-value text-red-400 mb-2">
              ${(typeof bankAccount?.totalDebt === 'string' ? parseFloat(bankAccount.totalDebt) : (bankAccount?.totalDebt || 0)).toFixed(2)}
            </div>
            <p className="text-slate-400 text-sm">Outstanding balances</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Credit Score Breakdown Pie Chart */}
          <Card className="editorial-panel banking-section-card p-6">
            <div className="mb-4 flex items-start justify-between gap-4"><h2 className="text-xl font-semibold text-white">Credit Score Breakdown</h2><span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-mono-data uppercase tracking-[0.12em] text-blue-100">100% total</span></div>
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
                  <Tooltip content={<CreditScoreBreakdownTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">Loading credit score composition...</p>
            )}
            <p className="-mt-2 text-center text-xs text-slate-400">Hover over a factor to see the Blue Blazer action that affects it and an improvement tip.</p>
            <div className="mt-3 border-t border-white/10 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-white">Blue Bucks reward stages</p><span className="text-xs text-slate-400">First-time correct answers</span></div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {CREDIT_SCORE_STAGES.map((stage) => <div key={stage.key} className={`rounded-lg border px-2.5 py-2 text-xs ${stage.key === creditStage.key ? "border-blue-300/55 bg-blue-500/15 text-blue-100" : "border-white/10 bg-white/[0.03] text-slate-400"}`}><p className="font-semibold">{stage.name}</p><p className="mt-0.5">{stage.minScore}–{stage.maxScore}</p><p className="mt-1 text-[11px]">{stage.multiplier === 1 ? "Standard" : `+${Math.round((stage.multiplier - 1) * 100)}%`} Blue Bucks</p></div>)}
              </div>
            </div>
          </Card>

          {/* Account Balances Bar Chart */}
          <Card className="editorial-panel banking-section-card p-6">
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

        <div className="mb-8">
          <CreditScoreChart data={creditHistoryQuery.data ?? []} isLoading={creditHistoryQuery.isLoading} currentScore={creditScore} />
        </div>

        {/* Active Study Card with existing banking-card capabilities. */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Banking Study Cards</h2>
          <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-400">Your active Study Card is now your Banking card interface. It keeps your selected learning focus and progress while using the same issued-card purchase, payment, statement, and spending functions.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Functional active Study Card, backed by an existing issued banking card. */}
            <Card className="editorial-panel banking-section-card p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="data-label">Active banking card</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{activeStudyCard?.name ?? "Study Card"}</h3>
                  <p className="mt-1 text-xs text-slate-400">{activeStudyCard ? `${activeStudyCard.title} · ${activeStudyCard.focus}` : "Loading your selected study specialization…"}</p>
                </div>
                <span className="rounded border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-200">Study + banking</span>
              </div>
              {userCardsQuery.isLoading || studyCardCatalogQuery.isLoading || studyCardMineQuery.isLoading ? (
                <p className="text-slate-400">Loading cards...</p>
              ) : activeBankingCard ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-400/35 bg-[linear-gradient(135deg,rgba(30,64,175,.52),rgba(15,23,42,.96)_58%,rgba(14,116,144,.38))] p-5 shadow-[0_18px_44px_rgba(0,0,0,.2)]">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-white">{activeStudyCard?.name ?? "Study Card"}</p><p className="mt-1 text-xs text-blue-100/75">Level {studyCardMineQuery.data?.level ?? 1} · {studyCardMineQuery.data?.practiceProgress ?? 0} study progress</p></div><p className="text-right text-xs text-blue-100/75">{activeBankingCard.cardDetails?.tier ?? "standard"} banking account<br />•••• {String(activeBankingCard.id).padStart(4, "0")}</p></div>
                    <p className="mt-5 text-xs leading-5 text-blue-50/85">{activeStudyCard?.liveBenefit ?? "Your selected study benefit appears here."}</p>
                    <p className="mt-2 text-[11px] leading-5 text-blue-100/60">{activeStudyCard?.tradeoff}</p>
                  </div>
                  {issuedBankingCards.length > 1 && <label className="block text-xs text-slate-400">Banking account connected to this Study Card<select value={activeBankingCard.id} onChange={(event) => setActiveBankingCardId(Number(event.target.value))} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-900 px-2.5 py-2 text-sm text-white"><>{issuedBankingCards.map((card: any) => <option key={card.id} value={card.id}>{card.cardDetails?.name ?? "Credit Card"} · ${parseFloat(card.availableCredit).toFixed(2)} available</option>)}</></select></label>}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-slate-400 text-xs">Limit</p><p className="text-blue-400 font-semibold">${parseFloat(activeBankingCard.creditLimit).toFixed(2)}</p></div>
                    <div><p className="text-slate-400 text-xs">Available</p><p className="text-green-400 font-semibold">${parseFloat(activeBankingCard.availableCredit).toFixed(2)}</p></div>
                    <div><p className="text-slate-400 text-xs">Balance</p><p className="text-amber-300 font-semibold">${parseFloat(activeBankingCard.currentBalance).toFixed(2)}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setCardAction({ cardId: activeBankingCard.id, mode: "charge" })} className="border-blue-400/50 text-blue-200 hover:bg-blue-500/10"><ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Record Purchase</Button>
                    <Button size="sm" variant="outline" onClick={() => setCardAction({ cardId: activeBankingCard.id, mode: "payment" })} className="border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/10"><CreditCard className="mr-1.5 h-3.5 w-3.5" /> Make Payment</Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedStatementCard(activeBankingCard.id)} className="border-slate-500 text-slate-200 hover:bg-slate-600"><ReceiptText className="mr-1.5 h-3.5 w-3.5" /> Statement</Button>
                  </div>
                  {cardAction?.cardId === activeBankingCard.id && <div className="space-y-2 rounded-md border border-slate-600 bg-slate-800 p-3"><p className="text-xs font-medium text-slate-200">{cardAction?.mode === "charge" ? "Record a card purchase" : "Pay this card from checking"}</p><input type="number" min="0.01" step="0.01" value={cardActionAmount} onChange={(event) => setCardActionAmount(event.target.value)} placeholder="Amount" className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white" />{cardAction?.mode === "charge" && <input value={merchantCategory} onChange={(event) => setMerchantCategory(event.target.value)} placeholder="Category, such as Books or Dining" className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white" />}<div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setCardAction(null)}>Cancel</Button><Button size="sm" onClick={handleCardAction} disabled={chargeCardMutation.isPending || makePaymentMutation.isPending}>{chargeCardMutation.isPending || makePaymentMutation.isPending ? "Saving..." : "Confirm"}</Button></div></div>}
                </div>
              ) : (
                <p className="text-slate-400">Your selected Study Card is ready. Issue or connect a banking card account to use purchase, payment, and statement functions.</p>
              )}
            </Card>

            {/* Study Card selection now changes the active banking-card identity. */}
            <Card className="editorial-panel banking-section-card p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Choose your Banking Study Card</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Choose the learning profile shown on your functional Banking card. Your specialization, progress, and Blue Bucks study benefits remain saved server-side.</p>
                </div>
                {studyCardMineQuery.data && (
                  <span className="shrink-0 rounded border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-300">
                    Active: {studyCardMineQuery.data.cardKey}
                  </span>
                )}
              </div>
              {studyCardCatalogQuery.isLoading ? (
                <p className="text-sm text-slate-400">Loading Study Cards...</p>
              ) : studyCardCatalogQuery.data?.cards ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {studyCardCatalogQuery.data.cards.map((sc) => {
                    const isActive = studyCardMineQuery.data?.cardKey === sc.key;
                    return (
                      <div key={sc.key} className={`rounded-lg border p-4 transition ${isActive ? "border-blue-400/50 bg-blue-600/15" : "border-slate-700 bg-slate-800/80 hover:border-slate-600"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                              {sc.name}
                              {isActive && <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Active</span>}
                            </p>
                            <p className="mt-1 text-xs text-slate-300">{sc.title} · <span className="text-blue-300">{sc.focus}</span></p>
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Virtual</span>
                        </div>
                        <p className="mt-2 text-xs italic text-slate-400">{sc.liveBenefit}</p>
                        <Button
                          onClick={() => selectStudyCardMutation.mutate({ cardKey: sc.key })}
                          disabled={isActive || selectStudyCardMutation.isPending}
                          size="sm"
                          variant={isActive ? "outline" : "default"}
                          className={`mt-3 w-full text-xs ${isActive ? "border-blue-400/30 bg-transparent text-blue-300" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                        >
                          {isActive ? "Active Banking Study Card" : selectStudyCardMutation.isPending ? "Switching..." : "Use as my Banking Card"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Study Cards catalog unavailable.</p>
              )}
            </Card>
          </div>

          {selectedStatementCard !== null && (
            <Card className="editorial-panel banking-section-card mt-6 p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <ReceiptText className="h-5 w-5 text-blue-400" /> Card Statement
                  </h3>
                  <p className="text-xs text-slate-400">Current statement activity for the selected issued card.</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedStatementCard(null)}>Close</Button>
              </div>
              {cardStatementQuery.isLoading ? (
                <p className="text-sm text-slate-400">Loading statement...</p>
              ) : cardStatementQuery.data ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-md bg-slate-700 p-3">
                    <p className="text-xs text-slate-400">Purchases</p>
                    <p className="font-semibold text-white">${cardStatementQuery.data.summary.charges.toFixed(2)}</p>
                  </div>
                  <div className="rounded-md bg-slate-700 p-3">
                    <p className="text-xs text-slate-400">Payments</p>
                    <p className="font-semibold text-emerald-300">${cardStatementQuery.data.summary.payments.toFixed(2)}</p>
                  </div>
                  <div className="rounded-md bg-slate-700 p-3">
                    <p className="text-xs text-slate-400">Cashback</p>
                    <p className="font-semibold text-amber-300">${cardStatementQuery.data.summary.cashback.toFixed(2)}</p>
                  </div>
                  <div className="rounded-md bg-slate-700 p-3">
                    <p className="text-xs text-slate-400">Closing Balance</p>
                    <p className="font-semibold text-red-300">${cardStatementQuery.data.summary.closingBalance.toFixed(2)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No statement data is available for this card.</p>
              )}
            </Card>
          )}
        </div>

        {/* Account Details and Transfer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Details */}
          <Card className="editorial-panel banking-section-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Details</h2>
            <div className="space-y-4">
              <div className="banking-account-row flex justify-between items-center p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">Checking Account</span>
                </div>
                <span className="text-white font-semibold">${(typeof bankAccount?.checkingBalance === 'string' ? parseFloat(bankAccount.checkingBalance) : (bankAccount?.checkingBalance || 0)).toFixed(2)}</span>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                <p className="text-sm font-medium text-blue-100">Blue Bucks reward destination</p>
                <p className="mt-1 text-xs text-slate-400">Every Blue Bucks reward is credited directly to checking. Use transfers below to move funds into Savings or the BBX investment account.</p>
              </div>
              <div className="banking-account-row flex justify-between items-center p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">Savings Account</span>
                </div>
                <span className="text-white font-semibold">${(typeof bankAccount?.savingsBalance === 'string' ? parseFloat(bankAccount.savingsBalance) : (bankAccount?.savingsBalance || 0)).toFixed(2)}</span>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center justify-between gap-3"><span className="text-sm text-emerald-200">Simulated savings return</span><span className="text-sm font-semibold text-emerald-300">{savingsInterestQuery.data?.monthlyRate ?? '7'}% monthly</span></div>
                <p className="mt-1 text-xs text-slate-400">Projected monthly credit: ${Number(savingsInterestQuery.data?.interestEarned ?? 0).toFixed(2)}. The first scheduled run each month credits this simulation return automatically.</p>
              </div>
              <div className="banking-account-row flex justify-between items-center p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300">Investment Account</span>
                </div>
                <span className="text-white font-semibold">${(typeof bankAccount?.investmentBalance === 'string' ? parseFloat(bankAccount.investmentBalance) : (bankAccount?.investmentBalance || 0)).toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400">Your Investment Account is the available cash balance for BBX simulated orders.</p>
            </div>
          </Card>

          {/* Transfer Funds */}
          <Card className="editorial-panel banking-section-card p-6">
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
