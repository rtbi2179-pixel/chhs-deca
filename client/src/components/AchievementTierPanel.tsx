import { BadgeCheck, BookOpen, BriefcaseBusiness, CheckCircle2, Flame, Loader2, Medal, Target, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";

const ICONS = {
  "first-step": BookOpen,
  "practice-builder": Target,
  "precision-practice": CheckCircle2,
  consistency: Flame,
  "knowledge-keeper": Medal,
  "event-ready": BriefcaseBusiness,
  "portfolio-starter": Trophy,
} as const;

const TIER_TONES = {
  bronze: "border-amber-600/35 bg-amber-700/10 text-amber-100",
  silver: "border-slate-200/25 bg-slate-200/[0.08] text-slate-100",
  gold: "border-yellow-300/35 bg-yellow-300/10 text-yellow-50",
} as const;

const TIER_BAR_TONES = {
  bronze: "bg-amber-500",
  silver: "bg-slate-300",
  gold: "bg-yellow-300",
} as const;

export function AchievementTierPanel() {
  const summary = trpc.achievements.getSummary.useQuery();

  if (summary.isLoading) {
    return <section id="achievements" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-10 text-center shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-300" /><p className="mt-3 text-sm text-white/60">Loading your achievement progress…</p></section>;
  }

  if (!summary.data) {
    return <section id="achievements" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-8 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl"><h2 className="text-2xl font-semibold text-white">Achievements</h2><p className="mt-2 text-sm text-white/60">Achievement progress is temporarily unavailable. Please try again shortly.</p></section>;
  }

  const { achievements, earnedCount, tierCount, nextUnlock } = summary.data;
  return <section id="achievements" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-3"><Medal className="h-6 w-6 text-yellow-300" /><h2 className="text-2xl font-semibold text-white">Achievements</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Every Bronze, Silver, and Gold tier is checked against your recorded Blue Blazer activity. New tiers celebrate once when they are first verified.</p></div><div className="w-fit rounded-xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-left"><p className="data-label text-yellow-100/70">Tiers earned</p><p className="mt-1 text-2xl font-semibold text-yellow-50">{earnedCount} <span className="text-sm font-medium text-yellow-50/60">/ {tierCount}</span></p></div></div>
    {nextUnlock && <div className="mt-6 rounded-2xl border border-blue-300/20 bg-blue-400/[0.08] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><p className="data-label text-blue-200/75">Next tier</p><h3 className="mt-1 text-base font-semibold text-white">{nextUnlock.achievementTitle} · {nextUnlock.tierLabel}</h3><p className="mt-1 text-sm text-blue-100/70">{nextUnlock.criteria}</p></div><span className="mt-3 inline-flex rounded-full border border-blue-300/25 bg-slate-950/35 px-3 py-1.5 text-xs font-medium text-blue-100 sm:mt-0">{nextUnlock.progressPercent}% complete</span></div>}
    <div className="mt-6 grid gap-4 xl:grid-cols-2">{achievements.map((achievement) => { const Icon = ICONS[achievement.id as keyof typeof ICONS] ?? Medal; return <article key={achievement.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="flex items-start gap-3"><span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-400/[0.08] text-blue-200"><Icon className="h-5 w-5" /></span><div><h3 className="font-semibold text-white">{achievement.title}</h3><p className="mt-1 text-sm leading-5 text-white/60">{achievement.description}</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-3">{achievement.tiers.map((tier) => <div key={tier.tier} aria-label={`${achievement.title} ${tier.label}: ${tier.earned ? "earned" : "in progress"}`} className={`rounded-xl border p-3 ${tier.earned ? TIER_TONES[tier.tier] : "border-white/10 bg-slate-950/45 text-white/55"}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-mono uppercase tracking-[0.14em]">{tier.label}</span>{tier.earned && <BadgeCheck className="h-4 w-4" aria-label="Earned" />}</div><p className="mt-2 min-h-10 text-xs leading-5">{tier.criteria}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/25"><div className={`h-full rounded-full ${tier.earned ? TIER_BAR_TONES[tier.tier] : "bg-white/25"}`} style={{ width: `${tier.progressPercent}%` }} /></div><p className="mt-2 text-[11px] opacity-75">{tier.earned ? "Earned" : `${tier.progressPercent}% complete`}</p></div>)}</div></article> })}</div>
  </section>;
}
