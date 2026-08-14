import { useMemo } from "react";
import { Link } from "wouter";
import { Award, BarChart3, BookOpenCheck, BriefcaseBusiness, Crown, Gem, Landmark, MessageCircleHeart, RefreshCw, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const CARD_ICONS = {
  scholar: BookOpenCheck,
  scholar_pro: Award,
  investor: Landmark,
  entrepreneur: BriefcaseBusiness,
  social: MessageCircleHeart,
  leader: Crown,
  collector: Gem,
  competitor: Trophy,
  blazer: ShieldCheck,
  maverick: RefreshCw,
} as const;

export default function StudyCards() {
  const { user } = useAuth();
  const catalogQuery = trpc.studyCards.catalog.useQuery(undefined, { enabled: Boolean(user) });
  const mineQuery = trpc.studyCards.mine.useQuery(undefined, { enabled: Boolean(user) });
  const utils = trpc.useUtils();
  const selectCard = trpc.studyCards.select.useMutation({
    onSuccess: () => utils.studyCards.mine.invalidate(),
  });
  const activeCard = mineQuery.data?.cardKey ?? "blazer";
  const activeProfile = useMemo(() => catalogQuery.data?.cards.find((card) => card.key === activeCard), [catalogQuery.data?.cards, activeCard]);

  if (!user) {
    return <main className="page-shell pt-28"><div className="page-container max-w-2xl"><div className="empty-state p-8 text-center"><ShieldCheck className="mx-auto mb-4 h-8 w-8 text-blue-300" /><h1 className="font-display text-3xl text-white">Study Cards</h1><p className="mt-3 text-slate-400">Sign in to choose a virtual learning specialization.</p><Link href="/login" className="mt-5 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Sign in</Link></div></div></main>;
  }

  return (
    <main className="page-shell pt-24 pb-16">
      <div className="page-container">
        <header className="page-heading max-w-3xl">
          <div className="section-kicker"><Sparkles className="h-4 w-4" /> Virtual learning profiles</div>
          <h1>Choose your <span className="text-blue-400">Study Card</span></h1>
          <p className="page-intro">Study Cards help you focus your Blue Bucks progress around how you learn. You can change cards at any time. Blue Bucks and all card rewards are virtual, have no cash value, and cannot be bought, wagered, or withdrawn.</p>
        </header>

        <section className="editorial-panel mt-8 grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="data-label">Active specialization</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{activeProfile?.name ?? "Balanced Card"} <span className="text-slate-500">— {activeProfile?.title ?? "The Blazer"}</span></h2>
            <p className="mt-2 text-sm text-slate-400">Level {mineQuery.data?.level ?? 1} · {mineQuery.data?.practiceProgress ?? 0} first-time correct practice answers · {mineQuery.data?.bonusBlueBucks ?? 0} bonus Blue Bucks earned</p>
          </div>
          <div className="rounded-md border border-blue-400/15 bg-blue-500/[0.06] px-4 py-3 text-sm text-blue-100"><BarChart3 className="mr-2 inline h-4 w-4 text-blue-300" />Level increases every 250 qualifying practice answers, up to level 5.</div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="data-label">Card catalog</p><h2 className="mt-1 text-2xl font-semibold text-white">Pick a focus, not a permanent lock</h2></div><p className="text-sm text-slate-500">{catalogQuery.data?.maverickDailyFocus ? `Maverick focus today: ${catalogQuery.data.maverickDailyFocus}` : "Loading card catalog…"}</p></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalogQuery.data?.cards.map((card) => {
              const Icon = CARD_ICONS[card.key];
              const selected = card.key === activeCard;
              return <article key={card.key} className={`editorial-panel flex min-h-[246px] flex-col p-5 transition ${selected ? "border-blue-400/50 bg-blue-500/[0.07]" : "hover:border-white/20"}`}>
                <div className="flex items-start justify-between gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]"><Icon className="h-5 w-5 text-blue-300" /></div>{selected && <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-200">Active</span>}</div>
                <div className="mt-4"><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{card.title}</p><h3 className="mt-1 text-lg font-semibold text-white">{card.name}</h3><p className="mt-2 text-sm text-slate-400">{card.focus}</p></div>
                <div className="mt-4 space-y-2 border-t border-white/[0.07] pt-3 text-sm"><p className={card.supportedNow ? "text-emerald-200" : "text-slate-300"}>{card.liveBenefit}</p><p className="text-xs text-slate-500">Tradeoff: {card.tradeoff}</p></div>
                <button type="button" onClick={() => selectCard.mutate({ cardKey: card.key })} disabled={selected || selectCard.isPending} className={`mt-auto pt-5 text-left text-sm font-semibold ${selected ? "cursor-default text-blue-200" : "text-white hover:text-blue-200"}`}>{selected ? "Selected" : `Use ${card.name}`} <Target className="ml-1 inline h-3.5 w-3.5" /></button>
              </article>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
