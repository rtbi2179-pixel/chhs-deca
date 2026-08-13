import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CardDraft = { creditScoreRequired: string; rewardsPercentage: string; interestRate: string; annualFee: string };
type Mode = "rules" | "cards" | "rewards";

function numberOrNaN(value: string) {
  return Number(value);
}

export function CreditScoreAnalytics() {
  const analytics = trpc.superAdmin.getCreditScoreAnalytics.useQuery();
  const values = [
    ["Scored members", analytics.data?.scoredMembers ?? "—"],
    ["Average score", analytics.data ? Math.round(analytics.data.averageScore) : "—"],
    ["Score range", analytics.data?.scoredMembers ? `${analytics.data.minScore}–${analytics.data.maxScore}` : "—"],
    ["Issued cards", analytics.data?.issuedCards ?? "—"],
    ["Outstanding balance", analytics.data ? `${analytics.data.outstandingBalance.toFixed(2)} BB` : "—"],
    ["Card spending", analytics.data ? `${analytics.data.totalCardSpending.toFixed(2)} BB` : "—"],
  ];
  return <Card className="border border-border bg-card p-6"><h3 className="text-lg font-bold text-foreground">Credit Score Analytics</h3><p className="mt-1 text-sm text-foreground/60">Chapter-level score and credit-card activity for the selected school.</p><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">{values.map(([label, value]) => <div key={label} className="rounded-lg bg-foreground/[0.05] p-3"><p className="text-xs text-foreground/60">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>)}</div></Card>;
}

export default function BankingAdminControls({ mode }: { mode: Mode }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [rules, setRules] = useState({ onTimePaymentPoints: "2", missedPaymentPenalty: "15", savingsInterestRate: "0.5" });
  const [drafts, setDrafts] = useState<Record<number, CardDraft>>({});
  const configQuery = trpc.superAdmin.getEconomicConfig.useQuery(undefined, { enabled: mode === "rules" });
  const cardsQuery = trpc.superAdmin.getCardCatalog.useQuery(undefined, { enabled: mode !== "rules" });
  const utils = trpc.useUtils();
  const updateRules = trpc.superAdmin.updateEconomicCreditRules.useMutation({
    onSuccess: async () => { setNotice("Credit rules saved and recorded in the audit log."); await Promise.all([utils.superAdmin.getEconomicConfig.invalidate(), utils.superAdmin.getEconomicAuditLog.invalidate(), utils.superAdmin.getActivityLog.invalidate()]); },
    onError: (error) => setNotice(error.message),
  });
  const updateCard = trpc.superAdmin.updateCardProduct.useMutation({
    onSuccess: async () => { setNotice("Card product saved and recorded in the audit log."); await Promise.all([utils.superAdmin.getCardCatalog.invalidate(), utils.superAdmin.getEconomicAuditLog.invalidate(), utils.superAdmin.getActivityLog.invalidate(), utils.superAdmin.getCreditScoreAnalytics.invalidate()]); },
    onError: (error) => setNotice(error.message),
  });

  useEffect(() => {
    if (!configQuery.data) return;
    setRules({ onTimePaymentPoints: String(configQuery.data.onTimePaymentPoints), missedPaymentPenalty: String(configQuery.data.missedPaymentPenalty), savingsInterestRate: String(configQuery.data.savingsInterestRate) });
  }, [configQuery.data]);
  useEffect(() => {
    if (!cardsQuery.data) return;
    setDrafts(Object.fromEntries(cardsQuery.data.map((card) => [card.id, { creditScoreRequired: String(card.creditScoreRequired), rewardsPercentage: String(card.rewardsPercentage), interestRate: String(card.interestRate), annualFee: String(card.annualFee ?? 0) }])));
  }, [cardsQuery.data]);

  const saveRules = () => {
    const input = { onTimePaymentPoints: numberOrNaN(rules.onTimePaymentPoints), missedPaymentPenalty: numberOrNaN(rules.missedPaymentPenalty), savingsInterestRate: numberOrNaN(rules.savingsInterestRate) };
    if (Object.values(input).some((value) => !Number.isFinite(value))) return setNotice("Enter valid numeric credit-rule values.");
    updateRules.mutate(input);
  };
  const saveCard = (card: any) => {
    const draft = drafts[card.id];
    if (!draft) return;
    const input = { cardId: card.id, creditScoreRequired: numberOrNaN(draft.creditScoreRequired), rewardsPercentage: numberOrNaN(draft.rewardsPercentage), interestRate: numberOrNaN(draft.interestRate), annualFee: numberOrNaN(draft.annualFee) };
    if (Object.values(input).some((value) => typeof value === "number" && !Number.isFinite(value))) return setNotice("Enter valid numeric card terms.");
    updateCard.mutate(input);
  };

  if (mode === "rules") return <Card className="mt-6 border border-border bg-card p-6"><h3 className="text-lg font-bold text-foreground">Credit Rule Parameters</h3><p className="mt-1 text-sm text-foreground/60">These terms are used alongside the weighted score formula.</p><div className="mt-5 grid gap-4 md:grid-cols-3">{([['onTimePaymentPoints', 'On-time payment points'], ['missedPaymentPenalty', 'Missed payment penalty'], ['savingsInterestRate', 'Savings APY (%)']] as const).map(([key, label]) => <label key={key} className="text-sm text-foreground/70">{label}<input type="number" min="0" step={key === 'savingsInterestRate' ? '0.01' : '1'} value={rules[key]} onChange={(event) => setRules((current) => ({ ...current, [key]: event.target.value }))} className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-foreground" /></label>)}</div>{notice && <p className="mt-4 text-sm text-foreground/70">{notice}</p>}<Button className="mt-5" disabled={updateRules.isPending} onClick={saveRules}>{updateRules.isPending ? "Saving…" : "Save Credit Rules"}</Button></Card>;

  const rewardsOnly = mode === "rewards";
  return <div className="space-y-4">{rewardsOnly && <p className="text-sm text-foreground/60">Set the cashback reward percentage for each real card product. Changes remain chapter-scoped and are recorded in the audit log.</p>}{cardsQuery.isLoading ? <Card className="border border-border bg-card p-6 text-foreground/60">Loading card products…</Card> : cardsQuery.data?.length ? cardsQuery.data.map((card) => {
    const draft = drafts[card.id];
    if (!draft) return null;
    const setDraft = (key: keyof CardDraft, value: string) => setDrafts((current) => ({ ...current, [card.id]: { ...draft, [key]: value } }));
    return <Card key={card.id} className="border border-border bg-card p-6"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-lg font-bold text-foreground">{card.name}</h3><span className="text-sm capitalize text-foreground/60">{card.tier}</span></div><div className={`mt-5 grid gap-4 ${rewardsOnly ? 'md:grid-cols-1' : 'md:grid-cols-4'}`}>{!rewardsOnly && <><label className="text-sm text-foreground/70">Minimum score<input type="number" min="300" max="850" value={draft.creditScoreRequired} onChange={(event) => setDraft('creditScoreRequired', event.target.value)} className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-foreground" /></label></>}<label className="text-sm text-foreground/70">Rewards (%)<input type="number" min="0" max="100" step="0.01" value={draft.rewardsPercentage} onChange={(event) => setDraft('rewardsPercentage', event.target.value)} className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-foreground" /></label>{!rewardsOnly && <><label className="text-sm text-foreground/70">Interest rate (%)<input type="number" min="0" max="100" step="0.01" value={draft.interestRate} onChange={(event) => setDraft('interestRate', event.target.value)} className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-foreground" /></label><label className="text-sm text-foreground/70">Annual fee (BB)<input type="number" min="0" step="0.01" value={draft.annualFee} onChange={(event) => setDraft('annualFee', event.target.value)} className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-foreground" /></label></>}</div><Button className="mt-5" variant="outline" disabled={updateCard.isPending} onClick={() => saveCard(card)}>{updateCard.isPending ? "Saving…" : rewardsOnly ? "Save Rewards Percentage" : "Save Card Terms"}</Button></Card>;
  }) : <Card className="border border-border bg-card p-6 text-foreground/60">No card products are configured for the selected chapter.</Card>}{notice && <p className="text-sm text-foreground/70">{notice}</p>}</div>;
}
