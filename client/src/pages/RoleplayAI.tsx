import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, BarChart3, BookOpen, CheckCircle2, ChevronRight, CircleStop, Clock3, History, Lightbulb, Loader2, LockKeyhole, Mic, RotateCcw, ShieldCheck, Sparkles, Target, TimerReset, Trash2, Trophy, Volume2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

type SourceType = "official_public_sample" | "blue_blazer_original" | "ai_generated";
type TrainingMode = "competition" | "practice" | "coach";
type Difficulty = "foundational" | "competition" | "stretch";
type Step = "select" | "briefing" | "prepare" | "judge" | "record" | "submit" | "results";

const MODES: Record<TrainingMode, { label: string; text: string; selected: string }> = {
  competition: { label: "Competition", text: "Timed conditions and no in-round coaching.", selected: "border-blue-300/50 bg-blue-400/[0.09]" },
  practice: { label: "Practice", text: "Use notes and pause between interview moments.", selected: "border-cyan-300/50 bg-cyan-400/[0.09]" },
  coach: { label: "Coach", text: "Add an optional reflection before a new judge question.", selected: "border-violet-300/50 bg-violet-400/[0.09]" },
};

function clock(total: number) {
  const safe = Math.max(0, total);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function left(startedAt: unknown, duration: number, now: number) {
  if (!startedAt) return duration;
  return Math.max(0, duration - Math.floor((now - new Date(startedAt as string).getTime()) / 1000));
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.split(",")[1] || "") : reject(new Error("The recording could not be read."));
    reader.onerror = () => reject(new Error("The recording could not be read."));
    reader.readAsDataURL(blob);
  });
}

function uploadMimeType(mimeType: string): "audio/webm" | "audio/ogg" | "audio/mp4" | "audio/mpeg" | "audio/wav" {
  if (mimeType.startsWith("audio/webm")) return "audio/webm";
  if (mimeType.startsWith("audio/ogg")) return "audio/ogg";
  if (mimeType.startsWith("audio/mp4")) return "audio/mp4";
  if (mimeType.startsWith("audio/wav")) return "audio/wav";
  return "audio/mpeg";
}

function resumeStep(status?: string): Step {
  if (status === "briefing") return "briefing";
  if (status === "preparing") return "prepare";
  if (status === "judge_intro") return "judge";
  if (status === "interview" || status === "follow_up") return "record";
  if (status === "submitted" || status === "transcribing" || status === "evaluating") return "submit";
  if (status === "completed") return "results";
  return "select";
}

function clusterClass(cluster?: string) {
  if (cluster === "Marketing") return "border-rose-300/35 bg-rose-400/[0.08] text-rose-100";
  if (cluster === "Finance") return "border-emerald-300/35 bg-emerald-400/[0.08] text-emerald-100";
  if (cluster === "Hospitality & Tourism") return "border-sky-300/35 bg-sky-400/[0.08] text-sky-100";
  if (cluster === "Business Management") return "border-amber-300/35 bg-amber-400/[0.08] text-amber-100";
  return "border-violet-300/35 bg-violet-400/[0.08] text-violet-100";
}

export default function RoleplayAI() {
  const { user } = useAuth();
  const eventsQuery = trpc.roleplay.getCompatibleEvents.useQuery(undefined, { enabled: Boolean(user) });
  const activeQuery = trpc.roleplay.getActiveAttempt.useQuery(undefined, { enabled: Boolean(user) });
  const historyQuery = trpc.roleplay.listAttempts.useQuery({ limit: 12 }, { enabled: Boolean(user) });
  const [step, setStep] = useState<Step>("select");
  const [attempt, setAttempt] = useState<any>(null);
  const [eventCode, setEventCode] = useState("");
  const [mode, setMode] = useState<TrainingMode>("competition");
  const [sourceType, setSourceType] = useState<SourceType>("blue_blazer_original");
  const [difficulty, setDifficulty] = useState<Difficulty>("competition");
  const [scratchpad, setScratchpad] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [recording, setRecording] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingLive, setRecordingLive] = useState(false);
  const [coachSummary, setCoachSummary] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRecordingAt = useRef<number | null>(null);
  const restored = useRef(false);

  const startMutation = trpc.roleplay.startAttempt.useMutation({ onSuccess: openAttempt, onError: (cause) => setError(cause.message) });
  const saveMutation = trpc.roleplay.saveAttemptState.useMutation({ onError: (cause) => setError(cause.message) });
  const judgeMutation = trpc.roleplay.beginJudgeIntroduction.useMutation({ onSuccess: openAttempt, onError: (cause) => setError(cause.message) });
  const followUpMutation = trpc.roleplay.nextJudgeQuestion.useMutation({
    onSuccess: (turn) => setAttempt((current: any) => current ? { ...current, judgeTurns: [...(current.judgeTurns ?? []), turn] } : current),
    onError: (cause) => setError(cause.message),
  });
  const uploadMutation = trpc.roleplay.uploadInterviewAudio.useMutation({ onError: (cause) => setError(cause.message) });
  const scoreMutation = trpc.roleplay.submitAttempt.useMutation({ onSuccess: openAttempt, onError: (cause) => setError(cause.message) });
  const deleteMutation = trpc.roleplay.deleteAttempt.useMutation({ onSuccess: () => { historyQuery.refetch(); reset(); }, onError: (cause) => setError(cause.message) });
  const resultQuery = trpc.roleplay.getAttemptResult.useQuery({ attemptId: attempt?.attempt?.id ?? 0 }, { enabled: Boolean(attempt?.attempt?.id && step === "results") });
  const playbackQuery = trpc.roleplay.getRecordingPlayback.useQuery({ attemptId: attempt?.attempt?.id ?? 0 }, { enabled: Boolean(attempt?.attempt?.id && step === "submit" && !recordingUrl) });

  const detail = resultQuery.data ?? attempt;
  const events = eventsQuery.data?.events ?? [];
  const selectedEvent = events.find((item) => item.eventCode === eventCode);
  const prepLeft = detail?.timing ? left(detail.attempt?.prepStartedAt, detail.timing.prepDurationSeconds, now) : 0;
  const interviewLeft = detail?.timing ? left(detail.attempt?.interviewStartedAt, detail.timing.interviewDurationSeconds, now) : 0;
  const judgePrompt = detail?.judgeTurns?.[detail.judgeTurns.length - 1]?.question;
  const busy = startMutation.isPending || saveMutation.isPending || judgeMutation.isPending || followUpMutation.isPending || uploadMutation.isPending || scoreMutation.isPending;

  function openAttempt(data: any) {
    setAttempt(data);
    setScratchpad(data.attempt?.scratchpad ?? "");
    setStep(resumeStep(data.attempt?.status));
    setError(null);
    activeQuery.refetch();
    historyQuery.refetch();
  }

  function reset() {
    stopRecording();
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setAttempt(null); setStep("select"); setScratchpad(""); setRecording(null); setRecordingUrl(null); setRecordingSeconds(0); setCoachSummary(""); setError(null);
  }

  useEffect(() => { if (!eventCode && eventsQuery.data?.preferredEventCode) setEventCode(eventsQuery.data.preferredEventCode); }, [eventCode, eventsQuery.data]);
  useEffect(() => { if (!restored.current && activeQuery.data && !attempt) { restored.current = true; openAttempt(activeQuery.data); } }, [activeQuery.data, attempt]);
  useEffect(() => { if (step !== "prepare" && step !== "record") return; const id = window.setInterval(() => setNow(Date.now()), 500); return () => window.clearInterval(id); }, [step]);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); if (recordingUrl) URL.revokeObjectURL(recordingUrl); }, [recordingUrl]);

  async function beginPreparation() {
    if (!attempt?.attempt?.id) return;
    await saveMutation.mutateAsync({ attemptId: attempt.attempt.id, stage: "preparing", scratchpad });
    setAttempt((current: any) => ({ ...current, attempt: { ...current.attempt, status: "preparing", prepStartedAt: current.attempt.prepStartedAt ?? new Date() } }));
    setStep("prepare"); setNow(Date.now());
  }

  async function enterJudge() {
    if (!attempt?.attempt?.id) return;
    await saveMutation.mutateAsync({ attemptId: attempt.attempt.id, stage: "preparing", scratchpad });
    judgeMutation.mutate({ attemptId: attempt.attempt.id });
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null; setRecordingLive(false);
  }

  async function beginRecording() {
    if (!attempt?.attempt?.id) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Your browser does not support microphone recording. Use a current version of Chrome, Edge, Safari, or Firefox.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      streamRef.current = stream; recorderRef.current = recorder; chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecording(blob); setRecordingUrl(URL.createObjectURL(blob));
        setRecordingSeconds(Math.max(1, Math.round((Date.now() - (startedRecordingAt.current ?? Date.now())) / 1000))); startedRecordingAt.current = null;
      };
      await saveMutation.mutateAsync({ attemptId: attempt.attempt.id, stage: "interview" });
      setAttempt((current: any) => ({ ...current, attempt: { ...current.attempt, status: "interview", interviewStartedAt: current.attempt.interviewStartedAt ?? new Date() } }));
      startedRecordingAt.current = Date.now(); recorder.start(1000); setRecordingLive(true); setStep("record"); setError(null);
    } catch (cause: any) {
      const name = cause?.name;
      setError(name === "NotAllowedError" ? "Microphone access is blocked. Allow it in browser site settings, then retry. Your attempt and notes remain saved." : name === "NotFoundError" ? "No microphone was found. Connect or enable one, then retry." : cause?.message || "Blue Blazer could not start recording.");
    }
  }

  async function evaluate() {
    if (!attempt?.attempt?.id) return;
    try {
      if (recording) {
        const base64 = await blobToBase64(recording);
        await uploadMutation.mutateAsync({ attemptId: attempt.attempt.id, audioBase64: base64, contentType: uploadMimeType(recording.type || "audio/webm"), durationSeconds: recordingSeconds });
      }
      setStep("submit");
      await scoreMutation.mutateAsync({ attemptId: attempt.attempt.id });
    } catch (cause: any) { setError(cause?.message || "The recording is saved. Retry evaluation without recording again."); }
  }

  if (!user) return <div className="flex min-h-[65vh] items-center justify-center px-5"><div className="max-w-lg rounded-2xl border border-blue-300/20 bg-slate-950/70 p-8 text-center"><LockKeyhole className="mx-auto h-8 w-8 text-blue-300" /><h1 className="mt-4 text-2xl font-semibold text-white">Sign in to enter the simulator</h1><p className="mt-3 text-sm leading-6 text-slate-400">Your recordings, scorecards, PI mastery, and recommendations are private to your Blue Blazer account.</p></div></div>;

  return <div className="mx-auto w-full max-w-[1450px] space-y-6 px-3 pb-10 pt-2 sm:px-5 lg:px-7">
    <header className="overflow-hidden rounded-[1.6rem] border border-blue-300/20 bg-[radial-gradient(circle_at_12%_0%,rgba(37,99,235,0.3),transparent_34%),linear-gradient(135deg,rgba(8,20,48,0.96),rgba(4,9,22,0.98))] p-5 shadow-2xl sm:p-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono-data text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/70">Native Blue Blazer tool</p><h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">DECA Competition Simulation</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Prepare, present, and review an original practice roleplay. PI scoring is evidence-based; delivery coaching remains separate.</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-blue-300/20 bg-black/20 px-3 py-1.5 text-blue-100"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Private account history</span><span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-slate-300"><Clock3 className="mr-1 inline h-3.5 w-3.5" />Versioned DECA timing</span></div></div></header>
    {error && <div role="alert" className="flex gap-3 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] p-4 text-sm text-amber-50"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><div>{error}<button type="button" onClick={() => setError(null)} className="ml-3 text-xs font-semibold underline">Dismiss</button></div></div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><main className="min-w-0">
      {step === "select" && <Selection events={events} eventCode={eventCode} setEventCode={setEventCode} selected={selectedEvent} mode={mode} setMode={setMode} sourceType={sourceType} setSourceType={setSourceType} difficulty={difficulty} setDifficulty={setDifficulty} preferred={eventsQuery.data?.preferredEventCode ?? null} onStart={() => eventCode && startMutation.mutate({ eventCode, trainingMode: mode, sourceType, difficulty })} busy={eventsQuery.isLoading || startMutation.isPending} />}
      {step === "briefing" && <Briefing detail={detail} onReset={reset} onStart={beginPreparation} busy={busy} />}
      {step === "prepare" && <Preparation detail={detail} remaining={prepLeft} scratchpad={scratchpad} setScratchpad={setScratchpad} onSave={() => attempt?.attempt?.id && saveMutation.mutate({ attemptId: attempt.attempt.id, stage: "preparing", scratchpad })} onJudge={enterJudge} busy={busy} />}
      {step === "judge" && <Judge detail={detail} onBack={() => setStep("prepare")} onRecord={beginRecording} busy={busy} />}
      {step === "record" && <Record detail={detail} remaining={interviewLeft} live={recordingLive} seconds={recordingSeconds} url={recordingUrl} prompt={judgePrompt} mode={detail?.attempt?.trainingMode ?? mode} summary={coachSummary} setSummary={setCoachSummary} onRecord={beginRecording} onStop={stopRecording} onFollowUp={() => attempt?.attempt?.id && followUpMutation.mutate({ attemptId: attempt.attempt.id, studentSummary: coachSummary || undefined })} onReview={() => setStep("submit")} busy={followUpMutation.isPending} />}
      {step === "submit" && <Submit detail={detail} localUrl={recordingUrl} savedUrl={playbackQuery.data?.url} busy={uploadMutation.isPending || scoreMutation.isPending} canScore={Boolean(recording || detail?.attempt?.hasRecording)} onBack={() => setStep("record")} onScore={evaluate} />}
      {step === "results" && <Results detail={detail} loading={resultQuery.isLoading} onNew={reset} onDelete={() => attempt?.attempt?.id && deleteMutation.mutate({ attemptId: attempt.attempt.id })} deleting={deleteMutation.isPending} />}
    </main><HistoryPanel history={historyQuery.data ?? []} loading={historyQuery.isLoading} onOpen={(id) => { setAttempt({ attempt: { id } }); setStep("results"); setError(null); }} /></div>
  </div>;
}

function SectionHeading({ number, eyebrow, title, text }: { number: string; eyebrow: string; title: string; text: string }) {
  return <div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-300/20 bg-blue-400/[0.08] font-mono-data text-[10px] font-semibold text-blue-200">{number}</span><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/65">{eyebrow}</p><h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{text}</p></div></div>;
}

function Selection({ events, eventCode, setEventCode, selected, mode, setMode, sourceType, setSourceType, difficulty, setDifficulty, preferred, onStart, busy }: any) {
  const groups = useMemo(() => events.reduce((all: Record<string, any[]>, event: any) => { (all[event.careerCluster] ??= []).push(event); return all; }, {}), [events]);
  return <section className="space-y-5"><SectionHeading number="01" eyebrow="Simulation setup" title="Choose a complete roleplay round" text="The simulator includes current Individual Series, Principles, and Team Decision Making events, then uses the event’s saved timing configuration." />
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Event selection</p><div className="mt-5 space-y-5">{Object.entries(groups).map(([cluster, values]) => <div key={cluster as string}><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{cluster as string}</p><div className="grid gap-2 sm:grid-cols-2">{(values as any[]).map((event) => <button key={event.eventCode} type="button" onClick={() => setEventCode(event.eventCode)} className={`rounded-xl border p-3 text-left transition ${eventCode === event.eventCode ? "border-blue-300/55 bg-blue-400/[0.09] shadow-[0_0_0_1px_rgba(96,165,250,0.12)]" : "border-white/[0.09] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"}`}><div className="flex gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">{event.eventCode}</p><p className="mt-1 text-xs leading-5 text-slate-400">{event.eventName}</p></div>{event.eventCode === preferred && <span className="h-fit rounded-full bg-blue-300/10 px-2 py-1 text-[10px] font-semibold text-blue-100">Focused</span>}</div><p className="mt-3 text-[11px] text-slate-500">{event.eventCategory.replaceAll("_", " ")} · {event.prepMinutes}+{event.interviewMinutes}</p></button>)}</div></div>)}</div></div>
    <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Training mode</p><div className="mt-4 space-y-2">{(Object.keys(MODES) as TrainingMode[]).map((key) => <button type="button" key={key} onClick={() => setMode(key)} className={`w-full rounded-xl border p-3 text-left transition ${mode === key ? MODES[key].selected : "border-white/[0.09] bg-white/[0.025] hover:bg-white/[0.05]"}`}><p className="text-sm font-semibold text-white">{MODES[key].label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{MODES[key].text}</p></button>)}</div></div><div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Original scenario source</p><div className="mt-4 space-y-2">{([{ key: "blue_blazer_original", label: "Blue Blazer Original", text: "A wholly original practice case created for this simulator.", enabled: true }, { key: "ai_generated", label: "AI-Generated Practice", text: "A new original case built around the selected event PIs.", enabled: true }, { key: "official_public_sample", label: "Official / Public Sample", text: "Locked until an exact sample has verified public-use approval.", enabled: false }] as const).map((source) => <button type="button" key={source.key} disabled={!source.enabled} onClick={() => setSourceType(source.key)} className={`w-full rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${sourceType === source.key ? "border-violet-300/50 bg-violet-400/[0.08]" : "border-white/[0.09] bg-white/[0.025] hover:bg-white/[0.05]"}`}><div className="flex justify-between gap-2"><p className="text-sm font-semibold text-white">{source.label}</p>{!source.enabled && <span className="text-[10px] uppercase tracking-wide text-slate-500">Unavailable</span>}</div><p className="mt-1 text-xs leading-5 text-slate-400">{source.text}</p></button>)}</div><div className="mt-5 border-t border-white/[0.08] pt-4"><p className="text-xs font-semibold text-slate-300">Difficulty</p><div className="mt-2 flex flex-wrap gap-2">{(["foundational", "competition", "stretch"] as Difficulty[]).map((key) => <button type="button" key={key} onClick={() => setDifficulty(key)} className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${difficulty === key ? "border-violet-300/45 bg-violet-400/[0.09] text-violet-100" : "border-white/10 text-slate-400 hover:text-white"}`}>{key}</button>)}</div></div></div></div>
    <div className="flex flex-col gap-3 rounded-2xl border border-blue-300/20 bg-blue-400/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between"><div>{selected ? <><p className="text-sm font-semibold text-white">{selected.eventCode} — {selected.eventName}</p><p className="mt-1 text-xs text-blue-100/65">{selected.participantCount} participant{selected.participantCount === 2 ? "s" : ""} · {selected.prepMinutes} minutes prep · {selected.interviewMinutes} minutes interview</p></> : <p className="text-sm text-slate-400">Select an event to continue.</p>}</div><Button disabled={!selected || busy} onClick={onStart} className="bg-blue-500 text-white hover:bg-blue-400">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Build scenario <ArrowRight className="ml-2 h-4 w-4" /></>}</Button></div>
  </section>;
}

function Briefing({ detail, onReset, onStart, busy }: { detail: any; onReset: () => void; onStart: () => void; busy: boolean }) {
  const scenario = detail?.scenario; const event = detail?.event;
  return <section className="space-y-5"><SectionHeading number="02" eyebrow="Competition briefing" title="Read the case. Then prepare your response." text="The performance indicators displayed here are the same indicators that will be scored from transcript evidence after you submit." /><div className="grid gap-5 lg:grid-cols-[1.4fr_0.85fr]"><div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 sm:p-6"><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${clusterClass(event?.careerCluster)}`}>{event?.careerCluster}</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{detail?.attempt?.trainingMode} mode</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{scenario?.difficulty}</span></div><h3 className="mt-4 text-2xl font-semibold text-white">{event?.eventCode} — {event?.eventName}</h3><div className="mt-5 space-y-4 text-sm leading-7 text-slate-300"><Block label="Your role" value={scenario?.participantRole} /><Block label="Judge role" value={scenario?.judgeRole} /><Block label="Company context" value={scenario?.companyContext} /><Block label="Situation" value={scenario?.situation} /><Block label="Your task" value={scenario?.task} /></div></div><div className="space-y-4"><div className="rounded-2xl border border-blue-300/20 bg-blue-400/[0.06] p-5"><TimerReset className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-semibold text-white">Versioned timing</p><p className="mt-1 text-xs leading-5 text-blue-100/65">{detail?.timing?.prepDurationSeconds / 60} minutes to prepare, followed by {detail?.timing?.interviewDurationSeconds / 60} minutes with the judge.</p><p className="mt-3 text-[11px] leading-5 text-slate-500">The live session reads timing from the saved event configuration, not a fixed client-side value.</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Performance indicators in this round</p><div className="mt-3 space-y-3">{scenario?.performanceIndicators?.map((pi: any) => <div key={pi.piId} className="border-l-2 border-blue-400/45 pl-3"><p className="font-mono-data text-[10px] text-blue-300">{pi.piId}</p><p className="mt-1 text-xs leading-5 text-slate-300">{pi.performanceIndicator}</p></div>)}</div></div></div></div><div className="flex justify-between gap-3"><Button variant="outline" onClick={onReset} className="border-white/15 text-slate-300"><ArrowLeft className="mr-2 h-4 w-4" />Start over</Button><Button onClick={onStart} disabled={busy} className="bg-blue-500 text-white hover:bg-blue-400">Enter preparation room <ChevronRight className="ml-2 h-4 w-4" /></Button></div></section>;
}

function Preparation({ detail, remaining, scratchpad, setScratchpad, onSave, onJudge, busy }: any) {
  return <section className="space-y-5"><SectionHeading number="03" eyebrow="Timed preparation" title="Build a specific, workable recommendation." text={detail?.attempt?.trainingMode === "competition" ? "Competition mode does not surface AI hints during preparation." : "Your scratchpad saves as part of this resumable attempt and is never scored."} /><div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]"><div className="rounded-2xl border border-blue-300/20 bg-[linear-gradient(145deg,rgba(10,30,70,0.72),rgba(2,8,23,0.92))] p-5"><p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-blue-200/70">Preparation time</p><p className={`mt-3 font-mono-data text-6xl font-semibold ${remaining === 0 ? "text-amber-200" : "text-white"}`}>{clock(remaining)}</p><p className="mt-3 text-xs leading-5 text-blue-100/60">{remaining === 0 ? "The preparation window has ended. Move to the judge when ready." : "Organize your recommendation, reasoning, implementation, and measurement."}</p><div className="mt-6 space-y-3 border-t border-white/10 pt-5">{detail?.scenario?.performanceIndicators?.map((pi: any) => <div key={pi.piId} className="flex gap-2 text-xs text-slate-300"><Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300" />{pi.performanceIndicator}</div>)}</div></div><div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-white">Digital scratchpad</p><p className="mt-1 text-xs text-slate-500">Private notes for this roleplay attempt.</p></div><Button variant="outline" size="sm" onClick={onSave} disabled={busy} className="border-white/15 text-slate-300">Save notes</Button></div><textarea value={scratchpad} onChange={(event) => setScratchpad(event.target.value)} onBlur={onSave} placeholder="Opening, recommendation, evidence, implementation steps, metrics, closing..." className="mt-4 min-h-[320px] w-full resize-y rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-300/45 focus:ring-2 focus:ring-blue-300/15" /></div></div><div className="flex justify-end"><Button onClick={onJudge} disabled={busy} className="bg-blue-500 text-white hover:bg-blue-400">Meet the judge <ChevronRight className="ml-2 h-4 w-4" /></Button></div></section>;
}

function Judge({ detail, onBack, onRecord, busy }: any) {
  const intro = detail?.judgeTurns?.find((turn: any) => turn.turnType === "introduction")?.question;
  return <section className="space-y-5"><SectionHeading number="04" eyebrow="Judge room" title="The interview begins now." text="You control when Blue Blazer begins recording. The app only uses audio after you explicitly start the microphone." /><div className="rounded-2xl border border-blue-300/20 bg-[radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_38%),rgba(2,8,23,0.82)] p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-blue-300/25 bg-blue-400/10"><Volume2 className="h-6 w-6 text-blue-200" /></div><p className="mt-5 font-mono-data text-[10px] uppercase tracking-[0.2em] text-blue-200/70">{detail?.scenario?.judgeRole}</p><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white sm:text-xl">“{intro || "Thank you for meeting with me. Please walk me through your recommendation."}”</p></div><div className="flex justify-between gap-3"><Button variant="outline" onClick={onBack} className="border-white/15 text-slate-300"><ArrowLeft className="mr-2 h-4 w-4" />Return to notes</Button><Button onClick={onRecord} disabled={busy} className="bg-rose-500 text-white hover:bg-rose-400"><Mic className="mr-2 h-4 w-4" />Start recording</Button></div></section>;
}

function Record({ detail, remaining, live, seconds, url, prompt, mode, summary, setSummary, onRecord, onStop, onFollowUp, onReview, busy }: any) {
  return <section className="space-y-5"><SectionHeading number="05" eyebrow="Timed interview" title="Present, respond, and stay specific." text="Record one continuous roleplay response. Follow-up questions are saved to this attempt and remain scenario-relevant." /><div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]"><div className="rounded-2xl border border-rose-300/20 bg-[linear-gradient(145deg,rgba(70,12,30,0.4),rgba(2,8,23,0.92))] p-5"><p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-rose-100/70">Interview window</p><p className={`mt-3 font-mono-data text-6xl font-semibold ${remaining === 0 ? "text-amber-200" : "text-white"}`}>{clock(remaining)}</p><p className="mt-3 text-xs leading-5 text-slate-400">{live ? "Recording in progress." : url ? `Recorded ${clock(seconds)}. Play it back before submitting.` : "Start recording only when you are ready."}</p><div className="mt-6 flex flex-wrap gap-2"><Button onClick={live ? onStop : onRecord} className={live ? "bg-rose-500 text-white hover:bg-rose-400" : "bg-blue-500 text-white hover:bg-blue-400"}>{live ? <><CircleStop className="mr-2 h-4 w-4" />Stop recording</> : <><Mic className="mr-2 h-4 w-4" />{url ? "Record again" : "Start recording"}</>}</Button>{url && <Button variant="outline" onClick={onReview} className="border-white/15 text-slate-200">Review submission <ArrowRight className="ml-2 h-4 w-4" /></Button>}</div>{url && <audio className="mt-4 w-full" controls src={url} />}</div><div className="space-y-4"><div className="rounded-2xl border border-blue-300/20 bg-blue-400/[0.05] p-5"><p className="font-mono-data text-[10px] uppercase tracking-[0.16em] text-blue-200/70">Judge follow-up</p><p className="mt-3 text-base leading-7 text-white">“{prompt || "Begin your presentation when you are ready."}”</p><p className="mt-3 text-xs leading-5 text-blue-100/60">The full recording is transcribed after you submit. The judge does not coach during evaluation.</p></div>{mode === "coach" && <div className="rounded-2xl border border-violet-300/20 bg-violet-400/[0.05] p-4"><p className="text-sm font-semibold text-violet-100">Optional reflection for the next question</p><p className="mt-1 text-xs leading-5 text-violet-100/60">This note guides the next question but is not included in your score.</p><textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="What have you already addressed?" className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-200 outline-none focus:border-violet-300/40" /></div>}<Button disabled={!live || busy} variant="outline" onClick={onFollowUp} className="border-blue-300/25 text-blue-100 hover:bg-blue-400/10">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Ask next judge question</Button></div></div></section>;
}

function Block({ label, value }: { label: string; value?: string }) { return <div><p className="font-mono-data text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/70">{label}</p><p className="mt-1 text-sm leading-6 text-slate-300">{value}</p></div>; }

function Submit({ detail, localUrl, savedUrl, busy, canScore, onBack, onScore }: any) {
  const audioUrl = localUrl ?? savedUrl;
  const uploaded = Boolean(detail?.attempt?.hasRecording);
  return <section className="space-y-5"><SectionHeading number="06" eyebrow="Submission & evaluation" title="Review the recording, then build your scorecard." text="If transcription or scoring temporarily fails, the saved recording remains attached to your attempt for retry." /><div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 sm:p-6"><div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><div><h3 className="text-lg font-semibold text-white">Your roleplay recording</h3><p className="mt-2 text-sm leading-6 text-slate-400">Audio is used only to transcribe and evaluate this private attempt. Blue Blazer does not represent that it is used to train unrelated models.</p>{audioUrl ? <audio className="mt-5 w-full" controls src={audioUrl} /> : <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No browser playback is available after refresh. If already uploaded, the saved recording can still be evaluated.</div>}</div><div className="rounded-xl border border-blue-300/15 bg-blue-400/[0.04] p-4"><p className="text-sm font-semibold text-blue-50">Evaluation stages</p><div className="mt-4 space-y-3">{[{ label: "Uploading recording", active: busy || uploaded }, { label: "Transcribing presentation", active: busy }, { label: "Analyzing performance indicators", active: busy }, { label: "Analyzing delivery separately", active: busy }, { label: "Building scorecard", active: false }].map((stage) => <div key={stage.label} className="flex items-center gap-2 text-xs text-slate-300">{stage.active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-300" /> : <span className="h-3.5 w-3.5 rounded-full border border-slate-600" />}{stage.label}</div>)}</div></div></div></div><div className="flex flex-wrap justify-between gap-3"><Button variant="outline" disabled={busy} onClick={onBack} className="border-white/15 text-slate-300"><ArrowLeft className="mr-2 h-4 w-4" />Back to recording</Button><Button disabled={!canScore || busy} onClick={onScore} className="bg-blue-500 text-white hover:bg-blue-400">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing</> : <><BarChart3 className="mr-2 h-4 w-4" />Build scorecard</>}</Button></div></section>;
}

function Results({ detail, loading, onNew, onDelete, deleting }: any) {
  const evaluation = detail?.evaluation;
  if (loading || !detail?.attempt?.id) return <div className="flex min-h-72 items-center justify-center gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin text-blue-300" />Loading saved scorecard</div>;
  if (!evaluation) return <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-6"><h2 className="text-xl font-semibold text-amber-50">This attempt is still recoverable</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100/70">The recording or transcript was saved, but an evaluation is not available yet. Return to the active attempt and retry without recording again.</p><Button className="mt-5 bg-blue-500 text-white hover:bg-blue-400" onClick={onNew}>Return to simulator</Button></section>;
  const piScores = evaluation.piScores as any[];
  const delivery = evaluation.deliveryAnalysis as any;
  return <section className="space-y-5"><SectionHeading number="07" eyebrow="Roleplay results" title="Evidence-based practice scorecard" text="The practice score comes only from individual PI evidence. Delivery coaching is intentionally separated and does not change the score." /><div className="grid gap-5 lg:grid-cols-[0.68fr_1.32fr]"><div className="rounded-2xl border border-blue-300/20 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.24),transparent_55%),rgba(2,8,23,0.9)] p-6 text-center"><Trophy className="mx-auto h-7 w-7 text-blue-200" /><p className="mt-4 font-mono-data text-[10px] uppercase tracking-[0.2em] text-blue-200/70">Blue Blazer practice score</p><p className="mt-2 text-6xl font-semibold tracking-tight text-white">{evaluation.overallScore}</p><p className="mt-2 text-sm font-semibold text-blue-100">{evaluation.performanceLevel}</p><p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">{detail?.rubric?.disclosure?.disclosure ?? "This is not an official DECA score."}</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">What the judge heard</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{(evaluation.strengths as string[]).map((text, index) => <div key={`s-${index}`} className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.04] p-3 text-sm leading-6 text-emerald-50"><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-300" />{text}</div>)}{(evaluation.improvements as string[]).map((text, index) => <div key={`i-${index}`} className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3 text-sm leading-6 text-amber-50"><Lightbulb className="mr-2 inline h-4 w-4 text-amber-300" />{text}</div>)}</div></div></div>
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 sm:p-6"><div className="flex items-center gap-2"><Target className="h-5 w-5 text-blue-300" /><div><h3 className="text-lg font-semibold text-white">Performance indicators</h3><p className="mt-1 text-xs text-slate-500">Each indicator is independently scored and requires an exact transcript excerpt.</p></div></div><div className="mt-5 space-y-4">{piScores.map((pi) => <article key={pi.piId} className="rounded-xl border border-white/[0.09] bg-white/[0.025] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono-data text-[10px] text-blue-300">{pi.piId}</p><h4 className="mt-1 text-sm font-semibold leading-6 text-white">{pi.performanceIndicator}</h4></div><div className="shrink-0 text-left sm:text-right"><p className="text-lg font-semibold text-white">{pi.score}</p><p className="text-xs text-blue-100/70">{pi.level}</p></div></div><p className="mt-3 text-sm leading-6 text-slate-300">{pi.evaluation}</p>{pi.evidenceQuotes?.length ? <blockquote className="mt-3 border-l-2 border-blue-300/45 pl-3 text-xs italic leading-5 text-blue-100/70">“{pi.evidenceQuotes[0]}”</blockquote> : <p className="mt-3 text-xs text-slate-500">No verifiable transcript evidence was found for this indicator.</p>}<p className="mt-3 rounded-lg bg-black/20 p-3 text-xs leading-5 text-slate-400"><span className="font-semibold text-slate-200">Next move: </span>{pi.improvement}</p></article>)}</div></div>
    <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-violet-300/18 bg-violet-400/[0.04] p-5"><div className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-violet-200" /><h3 className="text-sm font-semibold text-violet-50">Delivery analysis — separate from score</h3></div><div className="mt-4 grid grid-cols-2 gap-3"><MiniMetric label="Pace" value={`${delivery.paceWordsPerMinute} wpm`} /><MiniMetric label="Filler words" value={String(delivery.fillerWordCount)} /><MiniMetric label="Duration" value={clock(delivery.durationSeconds)} /><MiniMetric label="Repeated terms" value={delivery.repeatedTerms?.length ? delivery.repeatedTerms.map((term: any) => term.word).join(", ") : "None flagged"} /></div><p className="mt-4 text-xs leading-5 text-violet-100/55">{delivery.timeUse}</p><p className="mt-2 text-[11px] leading-5 text-slate-500">{delivery.limitations}</p></div><div className="rounded-2xl border border-blue-300/18 bg-blue-400/[0.04] p-5"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-200" /><h3 className="text-sm font-semibold text-blue-50">Personalized training recommendations</h3></div><div className="mt-4 space-y-3">{(evaluation.trainingRecommendations as any[])?.length ? evaluation.trainingRecommendations.map((item: any) => <Link key={item.piId} href={item.href} className="block rounded-xl border border-white/[0.09] bg-black/15 p-3 transition hover:border-blue-300/35 hover:bg-blue-400/[0.08]"><p className="font-mono-data text-[10px] text-blue-300">{item.piId} · {item.currentLevel}</p><p className="mt-1 text-xs font-semibold leading-5 text-white">{item.performanceIndicator}</p><p className="mt-1 text-xs leading-5 text-slate-400">{item.action}</p></Link>) : <p className="text-sm leading-6 text-blue-100/70">No PI fell below the review threshold. Reinforce your strongest PIs with a new scenario.</p>}</div></div></div>
    <div className="flex flex-wrap justify-between gap-3 border-t border-white/[0.08] pt-5"><Button variant="outline" onClick={onDelete} disabled={deleting} className="border-rose-300/20 text-rose-100 hover:bg-rose-400/10">{deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Delete attempt</Button><Button onClick={onNew} className="bg-blue-500 text-white hover:bg-blue-400"><RotateCcw className="mr-2 h-4 w-4" />Run another roleplay</Button></div></section>;
}

function HistoryPanel({ history, loading, onOpen }: { history: any[]; loading: boolean; onOpen: (id: number) => void }) {
  return <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start"><div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-xl"><div className="flex items-center gap-2"><History className="h-4 w-4 text-blue-300" /><h2 className="text-sm font-semibold text-white">Your roleplay history</h2></div><p className="mt-1 text-xs leading-5 text-slate-500">Attempts, results, and PI mastery stay connected to your account.</p><div className="mt-4 space-y-2">{loading ? <div className="flex items-center gap-2 py-3 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading history</div> : history.length ? history.map((item) => <button type="button" key={item.id} onClick={() => onOpen(item.id)} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition hover:border-blue-300/30 hover:bg-blue-400/[0.06]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white">{item.event?.eventCode ?? item.eventCode}</p><p className="mt-0.5 text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p></div>{item.totalScore !== null ? <span className="rounded-md bg-blue-400/10 px-2 py-1 text-xs font-semibold text-blue-100">{item.totalScore}</span> : <span className="text-[11px] text-amber-200">{item.status.replace("_", " ")}</span>}</div><p className="mt-2 line-clamp-1 text-[11px] text-slate-400">{item.event?.eventName ?? "Roleplay attempt"}</p></button>) : <div className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs leading-5 text-slate-500">Completed simulations will appear here.</div>}</div></div><div className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.045] p-4"><div className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-blue-300" /><p className="text-xs leading-5 text-blue-100/65">Blue Blazer is not an official DECA judge. Results are practice feedback, not an official score or ranking.</p></div></div></aside>;
}

function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/[0.08] bg-black/15 p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-white">{value}</p></div>; }
