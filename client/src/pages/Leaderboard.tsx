import { Crown, Globe2, Landmark, Loader2, TrendingUp, WalletCards } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const formatBlueBucks = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
type LeaderboardScope = "chapter" | "global";
type LeaderboardEntry = { userId: number; name: string; checking: number; savings: number; investment: number; netWorth: number; schoolCode?: string | null };

export default function Leaderboard() {
  const { user } = useAuth();
  const [scope, setScope] = useState<LeaderboardScope>("chapter");
  const selectedCluster = "net-worth";
  const cluster = { value: "net-worth", label: "Balance-based ranking" };
  const chapterQuery = trpc.banking.getNetWorthLeaderboard.useQuery({ limit: 100 }, { refetchInterval: 30_000, refetchOnWindowFocus: true });
  const globalQuery = trpc.banking.getGlobalNetWorthLeaderboard.useQuery({ limit: 100 }, { refetchInterval: 30_000, refetchOnWindowFocus: true });
  const entries = (scope === "chapter" ? chapterQuery.data : globalQuery.data) as LeaderboardEntry[] | undefined ?? [];
  const isLoading = scope === "chapter" ? chapterQuery.isLoading : globalQuery.isLoading;
  const yourIndex = entries.findIndex((entry) => entry.userId === user?.id);
  const yours = yourIndex >= 0 ? entries[yourIndex] : null;
  const leader = entries[0] ?? null;
  const isGlobal = scope === "global";

  if (isLoading) {
    return <main className="page-shell flex min-h-screen items-center justify-center"><div className="flex flex-col items-center gap-3 text-foreground/70"><Loader2 className="h-7 w-7 animate-spin text-blue-300" /><span>Loading {isGlobal ? "global" : "chapter"} net-worth board…</span></div></main>;
  }

  return <main className="page-shell leaderboard-page px-4 py-8 sm:px-7"><div className="mx-auto max-w-6xl">
    <header className="leaderboard-hero">
      <div><p className="page-eyebrow">Blue Bucks financial progress</p><h1 className="page-title mt-2">Blue Bucks Leaderboard</h1><p className="page-intro mt-3 max-w-2xl">Compare verified Blue Bucks net worth across your chapter or across the full Blue Blazer community. Rankings combine Checking, Savings, and the BBX Investment Account.</p></div>
      <div className="leaderboard-hero-status"><div className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-blue-200" /><p className="data-label">Live {isGlobal ? "global" : "chapter"} board</p></div><p className="mt-1 text-lg font-semibold text-white">{entries.length} {entries.length === 1 ? "member" : "members"}</p><p className="mt-1 text-xs text-slate-400">Refreshes when balances change.</p></div>
    </header>

    <div className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-2" role="tablist" aria-label="Leaderboard scope">
      {(["chapter", "global"] as const).map((option) => {
        const active = scope === option;
        return <button key={option} type="button" role="tab" aria-selected={active} onClick={() => setScope(option)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[.98] ${active ? "bg-blue-500/20 text-blue-100 shadow-[0_8px_24px_rgba(37,99,235,.14)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}><span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${active ? "bg-blue-400/15 text-blue-200" : "bg-white/[0.04] text-slate-500"}`}>{option === "chapter" ? <Landmark className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}</span>{option === "chapter" ? "Chapter leaderboard" : "Global leaderboard"}</button>;
      })}
    </div>

    {yours && <section className="mt-7 grid gap-4 md:grid-cols-[1.15fr_.85fr]">
      <Card className="editorial-panel overflow-hidden p-0"><div className="bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-transparent p-5 sm:p-6"><p className="data-label text-blue-200">Your {isGlobal ? "global" : "chapter"} standing</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><p className="text-4xl font-semibold text-white">#{yourIndex + 1}</p><p className="mt-1 text-sm text-slate-300">of {entries.length} {isGlobal ? "visible community members" : "chapter members"}</p></div><div className="text-right"><p className="data-label">Blue Bucks net worth</p><p className="mt-1 text-2xl font-semibold text-blue-200">{formatBlueBucks(yours.netWorth)} BB</p></div></div></div><div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10"><Metric label="Checking" value={yours.checking} /><Metric label="Savings" value={yours.savings} /><Metric label="Investment" value={yours.investment} /></div></Card>
      <Card className="editorial-panel p-6"><div className="flex items-center gap-3"><Crown className="h-6 w-6 text-amber-200" /><div><p className="data-label">Current {isGlobal ? "global" : "chapter"} leader</p><p className="mt-1 text-lg font-semibold text-white">{leader?.name ?? "No account data"}</p></div></div><p className="mt-5 text-3xl font-semibold text-amber-100">{leader ? `${formatBlueBucks(leader.netWorth)} BB` : "—"}</p><p className="mt-2 text-sm leading-6 text-slate-400">Net worth rewards sustained Blue Bucks earnings, saving, and intentional BBX portfolio decisions—not a one-time practice score.</p></Card>
    </section>}

    <Card className="editorial-panel leaderboard-table-shell mt-7 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="section-heading">{isGlobal ? "Global rankings" : "Chapter rankings"}</h2><p className="mt-1 text-sm text-foreground/60">Only financial account balances determine placement.</p></div><span data-active={selectedCluster === cluster.value} className="leaderboard-cluster-tab inline-flex w-fit items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-100"><TrendingUp className="h-3.5 w-3.5" />{cluster.label}</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px]"><thead className="bg-white/[0.025] text-left text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-4">Rank</th><th className="px-5 py-4">Member</th>{isGlobal && <th className="px-5 py-4">Chapter</th>}<th className="px-5 py-4 text-right">Checking</th><th className="px-5 py-4 text-right">Savings</th><th className="px-5 py-4 text-right">Investment</th><th className="px-5 py-4 text-right">Net worth</th></tr></thead><tbody>{entries.length ? entries.map((entry, index) => <tr key={`${entry.userId}-${entry.schoolCode ?? "chapter"}`} className={`border-t border-white/[0.07] transition-colors hover:bg-blue-400/[0.035] ${entry.userId === user?.id ? "bg-blue-400/[0.07]" : ""}`}><td className="px-5 py-4"><RankBadge rank={index + 1} /></td><td className="px-5 py-4 font-medium text-white">{entry.name}{entry.userId === user?.id ? <span className="ml-2 text-xs font-semibold text-blue-200">YOU</span> : null}</td>{isGlobal && <td className="px-5 py-4 text-sm text-slate-400">{entry.schoolCode || "Independent"}</td>}<td className="px-5 py-4 text-right text-slate-300">{formatBlueBucks(entry.checking)}</td><td className="px-5 py-4 text-right text-slate-300">{formatBlueBucks(entry.savings)}</td><td className="px-5 py-4 text-right text-slate-300">{formatBlueBucks(entry.investment)}</td><td className="px-5 py-4 text-right text-base font-semibold text-blue-100">{formatBlueBucks(entry.netWorth)} BB</td></tr>) : <tr><td colSpan={isGlobal ? 7 : 6} className="px-6 py-12 text-center text-slate-400">No {isGlobal ? "global" : "chapter"} banking accounts are available yet.</td></tr>}</tbody></table></div>
    </Card>

    {!isGlobal && !yours && <Card className="editorial-panel mt-6 p-5"><div className="flex gap-3"><Landmark className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" /><div><h3 className="font-semibold text-white">Chapter leaderboard is ready</h3><p className="mt-1 text-sm leading-6 text-slate-400">Your chapter board is available as soon as your chapter account is initialized. Switch to Global leaderboard to compare visible members across Blue Blazer.</p></div></div></Card>}
    <Card className="editorial-panel mt-6 p-5"><div className="flex gap-3"><Landmark className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" /><div><h3 className="font-semibold text-white">How this board works</h3><p className="mt-1 text-sm leading-6 text-slate-400">Net worth is calculated on the server as Checking + Savings + Investment. Card limits, debt, historical practice accuracy, and market return percentage do not affect rank. Members who disable leaderboard visibility are omitted from the global board.</p></div></div></Card>
  </div></main>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="p-4"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 font-semibold text-white">{formatBlueBucks(value)}</p></div>;
}

function RankBadge({ rank }: { rank: number }) {
  const tone = rank === 1 ? "bg-amber-300/15 text-amber-100" : rank === 2 ? "bg-slate-200/10 text-slate-100" : rank === 3 ? "bg-amber-700/15 text-amber-200" : "bg-white/[0.05] text-slate-300";
  return <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${tone}`}>{rank}</span>;
}
