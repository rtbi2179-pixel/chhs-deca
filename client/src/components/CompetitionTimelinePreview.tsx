import { ArrowUpRight, CalendarClock, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`)) : "TBD";
}

export function CompetitionTimelinePreview() {
  const timeline = trpc.timeline.getMine.useQuery();
  if (timeline.isLoading) return <section className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)]"><div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" /></section>;
  if (!timeline.data?.timeline) return <section className="rounded-2xl border border-blue-300/20 bg-blue-400/[0.06] p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)]"><CalendarClock className="h-5 w-5 text-blue-300" /><p className="data-label mt-3">My DECA timeline</p><h3 className="mt-1 text-lg font-semibold text-white">Build your competition roadmap</h3><p className="mt-2 text-sm leading-6 text-white/65">Choose an event to receive an event-aware preparation plan based on chapter dates and your study history.</p><Link href="/events" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white">Choose my event <ArrowUpRight className="h-4 w-4" /></Link></section>;
  const preview = timeline.data.preview;
  return <section className="rounded-2xl border border-blue-300/20 bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(15,23,42,0.65))] p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)]"><div className="flex items-start justify-between gap-4"><div><p className="data-label text-blue-200/70">My competition timeline</p><h3 className="mt-1 text-lg font-semibold text-white">{preview?.eventCode} · {timeline.data.timeline.currentPhase}</h3></div><span className="rounded-full border border-blue-300/25 bg-slate-950/35 px-3 py-1.5 text-xs font-semibold text-blue-100">{timeline.data.timeline.readinessScore}% ready</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-slate-950/30 p-3"><p className="data-label">Next task</p><p className="mt-1 text-sm font-medium text-white">{preview?.nextTask?.title ?? "Plan complete"}</p></div><div className="rounded-xl border border-white/10 bg-slate-950/30 p-3"><p className="data-label">Due</p><p className="mt-1 text-sm font-medium text-white">{formatDate(preview?.nextTask?.dueDate)}</p></div><div className="rounded-xl border border-white/10 bg-slate-950/30 p-3"><p className="data-label">District runway</p><p className="mt-1 text-sm font-medium text-white">{preview?.daysRemaining ?? 0} days</p></div></div><Link href="/timeline" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white"><Sparkles className="h-4 w-4" />View full timeline <ArrowUpRight className="h-4 w-4" /></Link></section>;
}
