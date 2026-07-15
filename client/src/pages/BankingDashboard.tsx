import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CreditCard, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { useState } from "react";

export function BankingDashboard() {
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const creditScoreQuery = trpc.banking.getCreditScore.useQuery();
  const bankAccountQuery = trpc.banking.getBankAccount.useQuery();
  const availableCardsQuery = trpc.banking.getAvailableCards.useQuery();
  const userCardsQuery = trpc.banking.getUserCards.useQuery();
  const applyCreditCardMutation = trpc.banking.applyCreditCard.useMutation();

  const handleApplyCard = async (cardId: number) => {
    try {
      await applyCreditCardMutation.mutateAsync({ creditCardId: cardId });
      userCardsQuery.refetch();
      availableCardsQuery.refetch();
    } catch (error) {
      console.error("Failed to apply for card:", error);
    }
  };

  if (!user) return <div>Loading...</div>;

  const creditScore = creditScoreQuery.data?.score || 500;
  const creditDetails = creditScoreQuery.data?.details;
  const bankAccount = bankAccountQuery.data;
  const availableCards = availableCardsQuery.data || [];
  const userCards = userCardsQuery.data || [];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Credit Score</h2>
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div className={`text-5xl font-bold ${getScoreColor(creditScore)} mb-2`}>
              {creditScore}
            </div>
            <p className="text-slate-400 text-sm">Range: 300-850</p>
            {creditDetails && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Reliability:</span>
                  <span className="text-white">{Number(creditDetails.paymentReliabilityScore).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account History:</span>
                  <span className="text-white">{Number(creditDetails.accountHistoryScore).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Practice Consistency:</span>
                  <span className="text-white">{Number(creditDetails.practiceConsistencyScore).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </Card>

          {/* Bank Account */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Bank Account</h2>
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
            {bankAccount ? (
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">Checking</p>
                  <p className="text-2xl font-bold text-white">${Number(bankAccount.checkingBalance).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Savings</p>
                  <p className="text-xl font-bold text-white">${Number(bankAccount.savingsBalance).toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">No account data</p>
            )}
          </Card>

          {/* Cards Count */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Credit Cards</h2>
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-5xl font-bold text-purple-400 mb-2">{userCards.length}</div>
            <p className="text-slate-400 text-sm">Active cards</p>
            <p className="text-slate-400 text-sm mt-4">
              {availableCards.length - userCards.length} cards available
            </p>
          </Card>
        </div>

        {/* Your Credit Cards */}
        {userCards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Credit Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userCards.map((uc: any) => (
                <Card key={uc.id} className="bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{uc.cardDetails?.bankName}</h3>
                      <p className="text-slate-400 text-sm">{uc.cardDetails?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      uc.cardDetails?.tier === 'elite' ? 'bg-yellow-900 text-yellow-200' :
                      uc.cardDetails?.tier === 'rewards' ? 'bg-blue-900 text-blue-200' :
                      'bg-slate-700 text-slate-200'
                    }`}>
                      {uc.cardDetails?.tier?.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-400 text-sm">Credit Limit</p>
                      <p className="text-xl font-bold text-white">${Number(uc.creditLimit).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Available Credit</p>
                      <p className="text-lg font-bold text-green-400">${Number(uc.availableCredit).toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Cards to Apply */}
        {availableCards.filter((c: any) => !userCards.some((uc: any) => uc.creditCardId === c.id)).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Available Credit Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCards
                .filter((c: any) => !userCards.some((uc: any) => uc.creditCardId === c.id))
                .map((card: any) => (
                  <Card key={card.id} className="bg-slate-800 border-slate-700 p-6 hover:border-slate-500 transition">
                    <h3 className="text-lg font-bold text-white mb-2">{card.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{card.bankName}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Min. Credit Score:</span>
                        <span className="text-white font-semibold">{card.creditScoreRequired}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">APR:</span>
                        <span className="text-white font-semibold">{Number(card.apr).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Rewards:</span>
                        <span className="text-white font-semibold">{Number(card.rewardsRate).toFixed(2)}%</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleApplyCard(card.id)}
                      disabled={creditScore < card.creditScoreRequired || applyCreditCardMutation.isPending}
                      className="w-full"
                    >
                      {creditScore < card.creditScoreRequired ? 'Score Too Low' : 'Apply Now'}
                    </Button>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {availableCards.length === 0 && (
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">No Cards Available</h3>
                <p className="text-slate-400">
                  You've already applied for all available credit cards. Check back later for new offerings!
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
