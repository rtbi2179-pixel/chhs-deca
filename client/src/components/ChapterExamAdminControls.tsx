import { useEffect, useState } from "react";
import { CalendarClock, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const clusters = ["Marketing", "Business Management & Administration", "Finance", "Hospitality & Tourism"] as const;

export function ChapterExamAdminControls() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.mockExams.getChapterConfig.useQuery();
  const [isEnabled, setIsEnabled] = useState(false);
  const [cluster, setCluster] = useState<(typeof clusters)[number]>("Marketing");
  const [questionCount, setQuestionCount] = useState(100);
  const [extraTimeMinutes, setExtraTimeMinutes] = useState(0);
  const [scoreVisible, setScoreVisible] = useState(true);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");

  useEffect(() => {
    if (!config) return;
    setIsEnabled(config.isEnabled); setCluster(config.cluster as (typeof clusters)[number]); setQuestionCount(config.questionCount); setExtraTimeMinutes(config.extraTimeMinutes); setScoreVisible(config.scoreVisible);
    setAvailableFrom(config.availableFrom ? new Date(config.availableFrom).toISOString().slice(0, 16) : "");
    setAvailableUntil(config.availableUntil ? new Date(config.availableUntil).toISOString().slice(0, 16) : "");
  }, [config]);

  const save = trpc.mockExams.updateChapterConfig.useMutation({ onSuccess: () => { utils.mockExams.getChapterConfig.invalidate(); utils.mockExams.getChapterAvailability.invalidate(); toast.success("Chapter mock exam settings saved"); }, onError: (error) => toast.error(error.message) });
  const submit = () => save.mutate({ isEnabled, cluster, questionCount: questionCount as 25 | 50 | 75 | 100, extraTimeMinutes, scoreVisible, availableFrom: availableFrom ? new Date(availableFrom) : null, availableUntil: availableUntil ? new Date(availableUntil) : null });

  return <section className="mb-6 rounded-xl border border-blue-400/20 bg-slate-900/60 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-mono uppercase tracking-[0.16em] text-blue-300">Assessment controls</p><h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-white"><ShieldCheck className="h-5 w-5 text-blue-300" />Chapter Mock Exam</h2><p className="mt-1 text-sm text-slate-400">Individual exams remain available at any time. These controls govern the chapter assessment for this chapter.</p></div><label className="inline-flex items-center gap-2 rounded-md border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-100"><input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} className="accent-blue-500" />Enabled</label></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="text-sm text-slate-300">Cluster<select value={cluster} onChange={(event) => setCluster(event.target.value as (typeof clusters)[number])} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white">{clusters.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm text-slate-300">Questions<select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white">{[25,50,75,100].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-sm text-slate-300">Extra time (minutes)<input type="number" min="0" max="120" value={extraTimeMinutes} onChange={(event) => setExtraTimeMinutes(Number(event.target.value))} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label><label className="flex items-end gap-2 pb-2 text-sm text-slate-300"><input type="checkbox" checked={scoreVisible} onChange={(event) => setScoreVisible(event.target.checked)} className="accent-blue-500" />Release scores to members</label><label className="text-sm text-slate-300">Open at<input type="datetime-local" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label><label className="text-sm text-slate-300">Close at<input type="datetime-local" value={availableUntil} onChange={(event) => setAvailableUntil(event.target.value)} className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label></div><button type="button" disabled={isLoading || save.isPending} onClick={submit} className="mt-5 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"><Save className="h-4 w-4" />Save chapter exam controls</button></section>;
}
