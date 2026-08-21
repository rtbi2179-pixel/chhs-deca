import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, CalendarClock, Check, ChevronRight, Clock3, Flag, ListChecks, Pencil, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const priorityStyles: Record<string, string> = {
  low: "border-slate-400/20 bg-slate-400/[0.07] text-slate-200",
  normal: "border-blue-400/25 bg-blue-500/[0.08] text-blue-100",
  high: "border-amber-400/30 bg-amber-400/[0.09] text-amber-100",
  critical: "border-rose-400/35 bg-rose-400/[0.09] text-rose-100",
};

const eventTypes = ["meeting", "mock_competition", "testing", "written_deadline", "pitchdeck_deadline", "district_conference", "state_conference", "campaign_deadline", "leadership_conference", "other"] as const;

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "TBD";
}

function taskState(item: { status: string; dueDate?: string | null }) {
  if (item.status === "completed") return "completed";
  if (item.dueDate && new Date(`${item.dueDate}T23:59:59`) < new Date()) return "overdue";
  return item.status;
}

export default function CompetitionTimeline() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const timeline = trpc.timeline.getMine.useQuery();
  const calendar = trpc.timeline.getCalendar.useQuery(undefined, { enabled: Boolean(user) });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeadlineManager, setShowDeadlineManager] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<any>(null);
  const [newDeadline, setNewDeadline] = useState({ title: "", eventType: "other" as (typeof eventTypes)[number], startDate: "", isTbd: false, priority: "normal" as "low" | "normal" | "high" | "critical", hardDeadline: false });
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const refresh = async () => Promise.all([utils.timeline.getMine.invalidate(), utils.timeline.getCalendar.invalidate()]);
  const updateTask = trpc.timeline.updateItem.useMutation({ onSuccess: () => void refresh(), onError: (error) => toast.error(error.message) });
  const saveDeadline = trpc.timeline.saveCalendarEvent.useMutation({ onSuccess: () => { toast.success("Competition date saved."); setEditingDeadline(null); setNewDeadline({ title: "", eventType: "other", startDate: "", isTbd: false, priority: "normal", hardDeadline: false }); void refresh(); }, onError: (error) => toast.error(error.message) });
  const deleteDeadline = trpc.timeline.deleteCalendarEvent.useMutation({ onSuccess: () => { toast.success("Competition date removed."); void refresh(); }, onError: (error) => toast.error(error.message) });

  const groupedItems = useMemo(() => {
    const groups = new Map<string, any[]>();
    (timeline.data?.items ?? []).forEach((item) => {
      const label = item.dueDate ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(`${item.dueDate}T12:00:00`)) : "Preparation";
      groups.set(label, [...(groups.get(label) ?? []), item]);
    });
    return Array.from(groups.entries());
  }, [timeline.data?.items]);

  if (timeline.isLoading) return <main className="page-shell"><div className="page-content"><div className="loading-state min-h-[55vh]"><CalendarClock className="h-8 w-8 animate-pulse text-blue-300" /></div></div></main>;
  if (!timeline.data?.timeline) return <main className="page-shell"><div className="page-content max-w-4xl"><section className="editorial-panel px-6 py-14 text-center sm:px-10"><Target className="mx-auto h-9 w-9 text-blue-300" /><p className="data-label mt-5">Personal competition preparation</p><h1 className="page-title mt-3">Build Your Competition Roadmap</h1><p className="mx-auto mt-4 max-w-2xl leading-7 text-foreground/70">Choose your DECA event and Blue Blazer will create an event-aware preparation timeline using your chapter dates and recorded study progress.</p><Link href="/events" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">Choose My Event <ArrowUpRight className="h-4 w-4" /></Link></section></div></main>;

  const data = timeline.data;
  const nextTask = data.preview?.nextTask;
  const hardDeadlines = (calendar.data ?? []).filter((event) => event.hardDeadline && !event.isTbd);

  return <main className="page-shell"><div className="page-content max-w-7xl pb-28">
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <p className="page-eyebrow">Personalized competition GPS</p>
        <h1 className="page-title mt-2">My Competition Timeline</h1>
        <p className="page-intro mt-3 max-w-3xl">Your {data.timeline.eventCode} preparation plan connects your selected event, chapter milestones, and real Blue Blazer study history.</p>
      </div>
      <div className="flex flex-wrap gap-2"><Link href="/events" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-white/[0.06]">Event resources <ArrowUpRight className="h-4 w-4" /></Link>{isAdmin && <Button variant="outline" onClick={() => setShowDeadlineManager((value) => !value)}><Pencil className="mr-2 h-4 w-4" />Manage dates</Button>}</div>
    </header>

    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="editorial-panel p-5"><p className="data-label">Competition readiness</p><p className="mt-3 text-3xl font-semibold text-foreground">{data.timeline.readinessScore}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{ width: `${data.timeline.readinessScore}%` }} /></div></div>
      <div className="editorial-panel p-5"><p className="data-label">Current phase</p><p className="mt-3 font-semibold text-foreground">{data.timeline.strategyLabel}</p><p className="mt-2 text-sm text-foreground/60">{data.timeline.timelineMode === "emergency" ? "Accelerated priorities only" : data.timeline.timelineMode === "accelerated" ? "Compressed preparation plan" : "Full preparation path"}</p></div>
      <div className="editorial-panel p-5"><p className="data-label">Next major deadline</p><p className="mt-3 font-semibold text-foreground">{hardDeadlines[0]?.title ?? "District preparation"}</p><p className="mt-2 text-sm text-foreground/60">{hardDeadlines[0] ? formatDate(hardDeadlines[0].startDate) : `${data.timeline.daysRemaining} days remaining`}</p></div>
      <div className="editorial-panel p-5"><p className="data-label">Timeline progress</p><p className="mt-3 text-3xl font-semibold text-foreground">{data.timeline.progressPercent}%</p><p className="mt-2 text-sm text-foreground/60">{data.items.filter((item: any) => item.status === "completed").length} of {data.items.length} tasks complete</p></div>
    </section>

    {nextTask && <section className="sticky top-3 z-20 mt-6 rounded-2xl border border-blue-300/30 bg-slate-950/90 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:flex sm:items-center sm:justify-between sm:gap-5"><div className="flex min-w-0 gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" /><div><p className="data-label">Recommended next task</p><p className="mt-1 font-semibold text-foreground">{nextTask.title}</p><p className="mt-1 text-sm text-foreground/60">Due {formatDate(nextTask.dueDate)} · about {nextTask.estimatedMinutes} minutes</p></div></div><div className="mt-3 flex gap-2 sm:mt-0"><Button variant="outline" onClick={() => setSelectedItem(nextTask)}>Why this task?</Button>{nextTask.deepLink && <Link href={nextTask.deepLink} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-500">Start task <ArrowUpRight className="h-4 w-4" /></Link>}</div></section>}

    {showDeadlineManager && isAdmin && <section className="editorial-panel mt-6 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="data-label">Chapter deadline management</p><h2 className="section-heading mt-1">Official competition calendar</h2></div><button type="button" onClick={() => setEditingDeadline({ ...newDeadline, id: undefined, description: "", color: "blue", applicableEventTypes: [] })} className="inline-flex items-center gap-2 rounded-lg border border-blue-300/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-100"><Plus className="h-4 w-4" />Add date</button></div>
      <div className="mt-4 space-y-2">{(calendar.data ?? []).map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/8 px-3 py-3"><div><p className="text-sm font-medium text-foreground">{event.title}</p><p className="mt-0.5 text-xs text-foreground/55">{event.isTbd ? "TBD" : formatDate(event.startDate)} · {event.eventType.replaceAll("_", " ")}</p></div><div className="flex gap-2"><button type="button" className="rounded p-2 text-foreground/55 hover:bg-white/[0.07] hover:text-white" aria-label={`Edit ${event.title}`} onClick={() => setEditingDeadline(event)}><Pencil className="h-4 w-4" /></button><button type="button" className="rounded p-2 text-rose-300/80 hover:bg-rose-400/10 hover:text-rose-100" aria-label={`Delete ${event.title}`} onClick={() => { if (window.confirm(`Remove ${event.title}?`)) deleteDeadline.mutate({ id: event.id }); }}><Trash2 className="h-4 w-4" /></button></div></div>)}</div>
      {editingDeadline && <form className="mt-5 grid gap-3 rounded-xl border border-blue-400/20 bg-blue-500/[0.05] p-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); saveDeadline.mutate({ ...editingDeadline, startDate: editingDeadline.startDate || null, endDate: editingDeadline.endDate || null }); }}><label className="text-sm text-foreground/75">Title<input required value={editingDeadline.title} onChange={(event) => setEditingDeadline({ ...editingDeadline, title: event.target.value })} className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-foreground" /></label><label className="text-sm text-foreground/75">Type<select value={editingDeadline.eventType} onChange={(event) => setEditingDeadline({ ...editingDeadline, eventType: event.target.value })} className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-foreground">{eventTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label><label className="text-sm text-foreground/75">Date<input type="date" disabled={editingDeadline.isTbd} value={editingDeadline.startDate ?? ""} onChange={(event) => setEditingDeadline({ ...editingDeadline, startDate: event.target.value })} className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-foreground disabled:opacity-45" /></label><label className="mt-7 inline-flex items-center gap-2 text-sm text-foreground/75"><input type="checkbox" checked={Boolean(editingDeadline.isTbd)} onChange={(event) => setEditingDeadline({ ...editingDeadline, isTbd: event.target.checked })} />Keep as TBD</label><label className="inline-flex items-center gap-2 text-sm text-foreground/75"><input type="checkbox" checked={Boolean(editingDeadline.hardDeadline)} onChange={(event) => setEditingDeadline({ ...editingDeadline, hardDeadline: event.target.checked })} />Hard deadline</label><div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={saveDeadline.isPending}>{saveDeadline.isPending ? "Saving…" : "Save competition date"}</Button><Button type="button" variant="outline" onClick={() => setEditingDeadline(null)}>Cancel</Button></div></form>}
    </section>}

    <section className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8" aria-label="Personal preparation timeline">{groupedItems.map(([month, items]) => <section key={month}><div className="mb-4 flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /><h2 className="section-heading">{month}</h2></div><div className="space-y-3 border-l border-blue-400/20 pl-5 sm:pl-7">{items.map((item) => { const state = taskState(item); return <article key={item.id} className={`relative rounded-xl border p-4 transition ${state === "completed" ? "border-emerald-400/20 bg-emerald-400/[0.055]" : state === "overdue" ? "border-rose-400/30 bg-rose-400/[0.055]" : priorityStyles[item.priority]}`}><span className={`absolute -left-[1.9rem] top-5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${state === "completed" ? "bg-emerald-400" : state === "overdue" ? "bg-rose-400" : "bg-blue-400"}`} /><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-foreground">{item.title}</span><span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">{state}</span></div><p className="mt-2 text-sm leading-6 text-foreground/65">{item.description}</p><p className="mt-2 text-xs text-foreground/50">Due {formatDate(item.dueDate)} · {item.estimatedMinutes} min</p></div><div className="flex shrink-0 gap-2"><button type="button" className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-foreground/70 hover:bg-white/[0.06]" onClick={() => setSelectedItem(item)}>Details</button>{item.status !== "completed" && <button type="button" className="rounded-md bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/25" onClick={() => updateTask.mutate({ itemId: item.id, status: "completed" })}><Check className="mr-1 inline h-3.5 w-3.5" />Complete</button>}</div></div></article>; })}</div></section>)}</div>
      <aside className="space-y-4"><section className="editorial-panel p-5"><p className="data-label">Competition milestones</p><div className="mt-4 space-y-4">{hardDeadlines.map((event) => <div key={event.id} className="border-l-2 border-blue-400 pl-3"><p className="text-sm font-semibold text-foreground">{event.title}</p><p className="mt-1 text-xs text-foreground/55">{formatDate(event.startDate)}</p></div>)}</div></section><section className="editorial-panel p-5"><Flag className="h-5 w-5 text-blue-300" /><h2 className="section-heading mt-3">Why this plan adapts</h2><p className="mt-3 text-sm leading-6 text-foreground/65">Tasks are generated from your selected event, start date, chapter deadlines, PI mastery, accuracy, and practice streak. Hard deadlines stay fixed even when normal study work changes.</p></section></aside>
    </section>
  </div>
  {selectedItem && <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/75 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Timeline task details"><div className="w-full max-w-xl rounded-2xl border border-white/15 bg-slate-950 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="data-label">Timeline task</p><h2 className="section-heading mt-2">{selectedItem.title}</h2></div><button type="button" className="rounded-md p-2 text-foreground/55 hover:bg-white/[0.08] hover:text-white" onClick={() => setSelectedItem(null)} aria-label="Close task details">×</button></div><p className="mt-4 leading-7 text-foreground/70">{selectedItem.description}</p><div className="mt-5 grid gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 sm:grid-cols-2"><div><p className="data-label">Why this matters</p><p className="mt-1 text-sm leading-6 text-foreground/70">{selectedItem.generatedReason}</p></div><div><p className="data-label">Due / estimate</p><p className="mt-1 text-sm leading-6 text-foreground/70">{formatDate(selectedItem.dueDate)} · {selectedItem.estimatedMinutes} minutes</p></div></div><div className="mt-6 flex flex-wrap gap-2">{selectedItem.deepLink && <Link href={selectedItem.deepLink} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-500">Start task <ArrowUpRight className="h-4 w-4" /></Link>}{selectedItem.status !== "completed" && <Button onClick={() => { updateTask.mutate({ itemId: selectedItem.id, status: "completed" }); setSelectedItem(null); }}><Check className="mr-2 h-4 w-4" />Mark complete</Button>} {!selectedItem.hardDeadline && <Button variant="outline" onClick={() => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); updateTask.mutate({ itemId: selectedItem.id, status: "rescheduled", dueDate: tomorrow.toISOString().slice(0, 10) }); setSelectedItem(null); }}>Reschedule to tomorrow</Button>}</div></div></div>}
  </main>;
}
