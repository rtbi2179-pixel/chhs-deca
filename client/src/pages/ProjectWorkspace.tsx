import { ArrowUpRight, Check, ClipboardList, FileText, Target } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "TBD";
}

export default function ProjectWorkspace() {
  const timeline = trpc.timeline.getMine.useQuery();
  const utils = trpc.useUtils();
  const updateTask = trpc.timeline.updateItem.useMutation({
    onSuccess: () => void utils.timeline.getMine.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  if (timeline.isLoading) return <main className="page-shell"><div className="page-content"><div className="loading-state min-h-[55vh]"><FileText className="h-8 w-8 animate-pulse text-blue-300" /></div></div></main>;
  if (!timeline.data?.timeline) return <main className="page-shell"><div className="page-content max-w-4xl"><section className="editorial-panel px-6 py-14 text-center sm:px-10"><ClipboardList className="mx-auto h-9 w-9 text-blue-300" /><p className="data-label mt-5">Project preparation</p><h1 className="page-title mt-3">Start Your Competition Roadmap First</h1><p className="mx-auto mt-4 max-w-2xl leading-7 text-foreground/70">Choose an event and set your preparation start date. Blue Blazer will then organize the project work that applies to your event.</p><Link href="/timeline" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">Open roadmap <ArrowUpRight className="h-4 w-4" /></Link></section></div></main>;

  const projectItems = timeline.data.items.filter((item: any) => ["written_project", "pitch_deck", "presentation", "review"].includes(item.itemType));
  const completed = projectItems.filter((item: any) => item.status === "completed").length;
  const progress = projectItems.length ? Math.round((completed / projectItems.length) * 100) : 0;
  const nextItem = projectItems.find((item: any) => item.status !== "completed");
  const isProjectEvent = ["written", "pitch"].includes(timeline.data.timeline.strategy);

  return <main className="page-shell"><div className="page-content max-w-6xl pb-28">
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="page-eyebrow">Event-specific deliverables</p><h1 className="page-title mt-2">Competition Project Workspace</h1><p className="page-intro mt-3 max-w-3xl">{isProjectEvent ? `Complete the ${timeline.data.timeline.eventCode} deliverables in the order your saved roadmap requires.` : "Your selected event does not currently require a written or pitch-deck project workspace. Use your roadmap for the next practice action."}</p></div><Link href="/timeline" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-white/[0.06]">Back to roadmap <ArrowUpRight className="h-4 w-4" /></Link></header>
    {isProjectEvent && <>
      <section className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]"><div className="editorial-panel p-6"><div className="flex items-start justify-between gap-4"><div><p className="data-label">Project completion</p><p className="mt-3 text-4xl font-semibold text-foreground">{progress}%</p><p className="mt-2 text-sm text-foreground/60">{completed} of {projectItems.length} roadmap deliverables complete</p></div><Target className="h-7 w-7 text-blue-300" /></div><div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{ width: `${progress}%` }} /></div></div><section className="editorial-panel p-6"><p className="data-label">Next project action</p><p className="mt-3 font-semibold text-foreground">{nextItem?.title ?? "Project milestones complete"}</p><p className="mt-2 text-sm leading-6 text-foreground/60">{nextItem?.successCriteria ?? "Your remaining work is already reflected in the broader competition roadmap."}</p></section></section>
      <section className="mt-7 space-y-3" aria-label="Project deliverable checklist"><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /><h2 className="section-heading">Deliverable checklist</h2></div>{projectItems.map((item: any, index: number) => <article key={item.id} className={`rounded-xl border p-5 ${item.status === "completed" ? "border-emerald-400/20 bg-emerald-400/[0.055]" : "border-white/10 bg-white/[0.025]"}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/75">Step {index + 1} · Due {formatDate(item.dueDate)}</p><h2 className="mt-2 text-base font-semibold text-foreground">{item.title}</h2><p className="mt-2 text-sm leading-6 text-foreground/65">{item.description}</p>{item.successCriteria && <p className="mt-3 text-xs leading-5 text-blue-100/80"><span className="font-semibold text-blue-200">Done when:</span> {item.successCriteria}</p>}</div>{item.status === "completed" ? <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-200"><Check className="h-4 w-4" />Complete</span> : <Button onClick={() => updateTask.mutate({ itemId: item.id, status: "completed" })} disabled={updateTask.isPending}><Check className="mr-2 h-4 w-4" />Mark complete</Button>}</div></article>)}</section>
    </>}
  </div></main>;
}
