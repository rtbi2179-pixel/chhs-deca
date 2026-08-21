import { useMemo, useRef, useState } from "react";
import { AlertCircle, Award, BookOpen, Camera, CheckCircle2, ChevronDown, CircleStop, ExternalLink, FileText, Loader2, Mic, ShieldCheck, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";

type JudgeResult = {
  rubricItems: Array<{
    criterionId: string;
    title: string;
    maximumPoints: number;
    assessability: "assessed" | "not_assessable";
    awardedPoints: number;
    confidence: number;
    evidence: Array<{ reference: string; summary: string }>;
    judgeComment: string;
    improvement: string;
    assessabilityReason?: string;
  }>;
  observableScore: number;
  observableMaximumPoints: number;
  fullEstimatedScore: number | null;
  confidence: number;
  strengths: string[];
  priorityImprovements: string[];
  unsupportedClaims: string[];
  contradictions: string[];
  missingEvidence: string[];
  coachAnalytics: { organization: number; businessReasoning: number; evidenceSpecificity: number };
  penaltyAssessment: string;
  deliveryAnalysis?: { available?: boolean; pauseCount?: number; silencePercentage?: number; averageLoudnessDbfs?: number | null; reason?: string };
  sourceAvailability?: { writtenEntry?: boolean; originalRecording?: boolean; audioDelivery?: boolean; transcript?: boolean; videoDelivery?: boolean; visualDeliveryReason?: string };
};

// Transcript-only results continue to state: Not assessable from transcript.

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.split(",")[1] || "") : reject(new Error("The selected file could not be read."));
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.readAsDataURL(blob);
  });
}

export default function WrittenEventAI() {
  const utils = trpc.useUtils();
  const ruleSetsQuery = trpc.aiJudge.ruleSets.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const sessionsQuery = trpc.aiJudge.recentSessions.useQuery(undefined, { staleTime: 30_000 });
  const [transcript, setTranscript] = useState("");
  const [groupSize, setGroupSize] = useState(1);
  const [transcriptReviewed, setTranscriptReviewed] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [openCriterion, setOpenCriterion] = useState<string | null>(null);
  const [openingSessionId, setOpeningSessionId] = useState<number | null>(null);
  const ruleSet = ruleSetsQuery.data?.[0];
  const wordCount = useMemo(() => transcript.trim() ? transcript.trim().split(/\s+/).length : 0, [transcript]);

  const gradeMutation = trpc.aiJudge.gradeTranscript.useMutation({
    onSuccess: async (response) => {
      setResult(response.result as JudgeResult);
      await utils.aiJudge.recentSessions.invalidate();
    },
  });
  const deleteMutation = trpc.aiJudge.deleteSession.useMutation({ onSuccess: () => utils.aiJudge.recentSessions.invalidate() });
  const openSavedSession = async (sessionId: number) => {
    setOpeningSessionId(sessionId);
    try {
      const session = await utils.aiJudge.getSession.fetch({ sessionId });
      setTranscript(session.transcript);
      setGroupSize(session.groupSize);
      setTranscriptReviewed(true);
      setResult(session.result ? session.result as JudgeResult : null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setOpeningSessionId(null);
    }
  };

  if (ruleSetsQuery.isLoading) return <div className="page-shell"><div className="page-content flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-300" /><span className="ml-3 text-sm text-white/70">Loading verified DECA rule sets…</span></div></div>;
  if (!ruleSet) return <div className="page-shell"><div className="page-content py-16"><div className="rounded-2xl border border-amber-300/25 bg-amber-400/[0.07] p-6 text-amber-50"><AlertCircle className="mb-3 h-6 w-6" /><h1 className="font-display text-3xl">NO VERIFIED AI JUDGE RULE SET</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100/75">A rule set must be verified against current official DECA materials before Blue Blazer can simulate an event evaluation.</p></div></div></div>;

  const canSubmit = transcriptReviewed && transcript.trim().length >= 250 && !gradeMutation.isPending;
  const observablePercent = result ? Math.round((result.observableScore / Math.max(result.observableMaximumPoints, 1)) * 100) : 0;

  return <div className="page-shell"><div className="page-content max-w-6xl pb-12">
    <header className="border-b border-white/10 pb-8">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-200/75"><ShieldCheck className="h-3.5 w-3.5" />Evidence-bound practice feedback</div>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-white sm:text-5xl">DECA AI JUDGE</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">A criterion-by-criterion practice simulation grounded in the verified {ruleSet.competitionYear} {ruleSet.eventName} evaluation configuration. It is not an official DECA score or a substitute for a human judge.</p>
    </header>

    <section className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-2xl border border-blue-300/20 bg-[linear-gradient(135deg,oklch(0.16_0.06_255/0.72),oklch(0.08_0.014_265/0.92))] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.14em] text-blue-200/70">Verified rule set</p><h2 className="mt-1 text-xl font-semibold text-white">{ruleSet.eventName} · {ruleSet.eventCode}</h2><p className="mt-1 text-sm text-white/55">{ruleSet.competitionYear} · {ruleSet.version}</p></div><a href={ruleSet.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white">Source <ExternalLink className="h-3.5 w-3.5" /></a></div>
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-4"><div><dt className="text-[10px] font-mono-data uppercase tracking-[0.12em] text-white/40">Team</dt><dd className="mt-1 font-medium text-white">{ruleSet.participantMin}–{ruleSet.participantMax}</dd></div><div><dt className="text-[10px] font-mono-data uppercase tracking-[0.12em] text-white/40">Entry</dt><dd className="mt-1 font-medium text-white">{ruleSet.preparedEntryLimit}</dd></div><div><dt className="text-[10px] font-mono-data uppercase tracking-[0.12em] text-white/40">Judge window</dt><dd className="mt-1 font-medium text-white">{Math.round(ruleSet.presentationTimeSeconds / 60)} minutes</dd></div><div><dt className="text-[10px] font-mono-data uppercase tracking-[0.12em] text-white/40">Rubric</dt><dd className="mt-1 font-medium text-white">{ruleSet.maximumPoints} points</dd></div></dl>
      </div>
      <aside className="rounded-2xl border border-white/10 bg-slate-950/55 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-white"><Award className="h-4 w-4 text-blue-300" />What this can assess now</div><p className="mt-3 text-sm leading-6 text-white/55">A reviewed transcript supports content, organization, and persuasion evidence. Delivery, visual design, and professional presence are deliberately left unscored until appropriate audio, slide, or video evidence is available.</p><div className="mt-4 flex items-start gap-2 text-xs leading-5 text-blue-100/70"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300" />Every awarded point must cite a submitted transcript passage. The server validates those citations before results are stored.</div></aside>
    </section>

    <RecordedEvidencePanel groupSize={groupSize} onComplete={(nextResult) => { setResult(nextResult); void utils.aiJudge.recentSessions.invalidate(); }} />

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.14em] text-blue-200/65">Step 1 · Review your evidence</p><h2 className="mt-1 text-2xl font-semibold text-white">PASTE YOUR PRESENTATION TRANSCRIPT</h2></div><FileText className="h-5 w-5 text-blue-300" /></div><p className="mt-3 text-sm leading-6 text-white/55">Review and correct the transcript before judging. This protects score integrity: editing a transcript after a recording-based score is introduced will require a new attempt.</p><label htmlFor="ai-judge-group-size" className="mt-5 block text-xs font-semibold text-white/70">Participants</label><select id="ai-judge-group-size" value={groupSize} onChange={(event) => setGroupSize(Number(event.target.value))} className="mt-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-300"><option value={1}>1 participant</option><option value={2}>2 participants</option><option value={3}>3 participants</option></select><label htmlFor="ai-judge-transcript" className="mt-5 block text-xs font-semibold text-white/70">Reviewed transcript</label><textarea id="ai-judge-transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Paste the spoken presentation text here. Include clear paragraph breaks for stronger evidence citations." className="mt-2 min-h-72 w-full resize-y rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/15" /><div className="mt-2 flex items-center justify-between text-xs text-white/40"><span>{wordCount.toLocaleString()} words</span><span>{transcript.trim().length.toLocaleString()} / 50,000 characters</span></div><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-white/70"><Checkbox checked={transcriptReviewed} onCheckedChange={(checked) => setTranscriptReviewed(checked === true)} className="mt-0.5" /><span>I reviewed this transcript and understand that this transcript-only attempt cannot evaluate visual-only presentation criteria.</span></label>{gradeMutation.error && <p role="alert" className="mt-4 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">{gradeMutation.error.message}</p>}<Button disabled={!canSubmit} onClick={() => gradeMutation.mutate({ competitionYear: "2026-2027", eventCode: "EIP", groupSize, transcript })} className="mt-5 w-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">{gradeMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Matching evidence to the DECA rubric…</> : "Generate evidence-bound practice evaluation"}</Button><p className="mt-3 text-center text-xs text-white/40">Processing states: reviewing rules → matching transcript evidence → validating score arithmetic → building coaching plan.</p></div>

      <aside className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 sm:p-6"><p className="text-[10px] font-mono-data uppercase tracking-[0.14em] text-blue-200/65">Your recent attempts</p><h2 className="mt-1 text-2xl font-semibold text-white">JUDGE HISTORY</h2>{sessionsQuery.isLoading ? <div className="mt-6 flex items-center gap-2 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" />Loading private attempts…</div> : sessionsQuery.data?.length ? <div className="mt-5 space-y-3">{sessionsQuery.data.map((session) => <div key={session.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-data text-xs font-semibold tracking-[0.1em] text-blue-200">{session.eventCode} · {session.competitionYear}</p><p className="mt-1 text-xs text-white/45">{new Date(session.createdAt).toLocaleDateString()}</p></div><button type="button" onClick={() => deleteMutation.mutate({ sessionId: session.id })} disabled={deleteMutation.isPending} className="rounded p-1.5 text-white/35 transition hover:bg-red-500/10 hover:text-red-200" aria-label="Delete this AI Judge attempt"><Trash2 className="h-4 w-4" /></button></div><p className="mt-3 text-sm font-semibold text-white">{session.status === "completed" ? `${session.observableScore ?? 0} / ${session.observableMaximumPoints ?? 0} observable points` : session.status === "failed" ? "Ready to retry" : "Processing"}</p><p className="mt-1 text-xs text-white/45">{session.fullEstimatedScore === null ? "Transcript-only attempt" : `Estimated DECA evaluation: ${session.fullEstimatedScore}/100`}</p><Button variant="outline" size="sm" onClick={() => void openSavedSession(session.id)} disabled={openingSessionId === session.id} className="mt-3 border-blue-300/25 bg-blue-500/[0.06] text-blue-100 hover:bg-blue-500/15">{openingSessionId === session.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}{session.status === "completed" ? "Review attempt" : "Reuse transcript"}</Button></div>)}</div> : <div className="mt-6 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm leading-6 text-white/45">No saved AI Judge attempts yet. Your transcript and results remain private to your account and can be deleted from this panel.</div>}</aside>
    </section>

    {result && <section aria-labelledby="judge-results-heading" className="mt-8 rounded-2xl border border-blue-300/20 bg-[linear-gradient(180deg,oklch(0.11_0.03_255/0.88),oklch(0.075_0.014_265/0.96))] p-5 sm:p-7"><div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-start"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.14em] text-blue-200/75">Estimated DECA evaluation · partial evidence</p><h2 id="judge-results-heading" className="mt-2 font-display text-4xl tracking-tight text-white">{result.observableScore} <span className="text-xl text-white/40">/ {result.observableMaximumPoints} observable points</span></h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{result.fullEstimatedScore === null ? "No full 100-point DECA Rubric Simulation is shown because the submitted evidence cannot observe every official criterion. This partial result is intentionally not converted into a fabricated total." : `Estimated score: ${result.fullEstimatedScore}/100.`}</p></div><div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/70"><p className="text-[10px] font-mono-data uppercase tracking-[0.12em] text-white/40">Evidence confidence</p><p className="mt-1 text-lg font-semibold text-white">{Math.round(result.confidence * 100)}%</p></div></div>{result.sourceAvailability && <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-white/10 bg-black/15 p-3 text-xs text-slate-300">Paper: {result.sourceAvailability.writtenEntry ? "used as primary evidence" : "unavailable"}</div><div className="rounded-lg border border-white/10 bg-black/15 p-3 text-xs text-slate-300">Recording: {result.sourceAvailability.originalRecording ? "preserved and analyzed" : "unavailable"}</div><div className="rounded-lg border border-white/10 bg-black/15 p-3 text-xs text-slate-300">Visual delivery: {result.sourceAvailability.videoDelivery ? "available" : result.sourceAvailability.visualDeliveryReason || "unavailable"}</div></div>}<div className="mt-6 grid gap-5 lg:grid-cols-3"><div><h3 className="text-sm font-semibold text-white">Top score gains</h3><ol className="mt-3 space-y-2 text-sm leading-6 text-white/60">{result.priorityImprovements.map((item, index) => <li key={item} className="flex gap-2"><span className="font-mono-data text-blue-200">0{index + 1}</span><span>{item}</span></li>)}</ol></div><div><h3 className="text-sm font-semibold text-white">What is working</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-white/60">{result.strengths.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-300" />{item}</li>)}</ul></div><div><h3 className="text-sm font-semibold text-white">Missing evidence</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-white/60">{result.missingEvidence.map((item) => <li key={item} className="flex gap-2"><AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-300" />{item}</li>)}</ul></div></div><div className="mt-7 grid gap-5 border-t border-white/10 pt-6 lg:grid-cols-[1.1fr_0.9fr]"><div><h3 className="text-sm font-semibold text-white">Official-rubric view</h3><div className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10 bg-black/15">{result.rubricItems.map((item) => <div key={item.criterionId} className="p-4"><button type="button" onClick={() => setOpenCriterion((current) => current === item.criterionId ? null : item.criterionId)} className="flex w-full items-center justify-between gap-4 text-left"><span><span className="font-semibold text-white">{item.title}</span><span className="ml-2 text-xs text-white/40">{item.assessability === "assessed" ? `${item.awardedPoints}/${item.maximumPoints}` : "Not assessable from supplied evidence"}</span></span><ChevronDown className={`h-4 w-4 text-blue-200 transition ${openCriterion === item.criterionId ? "rotate-180" : ""}`} /></button>{openCriterion === item.criterionId && <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-white/60"><p>{item.judgeComment}</p><p className="mt-2 text-blue-100/80"><span className="font-semibold">Next move:</span> {item.improvement}</p>{item.evidence.length > 0 && <div className="mt-3 rounded-lg border border-blue-300/15 bg-blue-500/[0.05] p-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200/70">Evidence used</p>{item.evidence.map((evidence) => <p key={`${evidence.reference}-${evidence.summary}`} className="mt-2 text-xs leading-5 text-white/55"><span className="font-mono-data text-blue-200">{evidence.reference}</span> {evidence.summary}</p>)}</div>}{item.assessabilityReason && <p className="mt-3 text-xs text-amber-100/70">Why unscored: {item.assessabilityReason}</p>}</div>}</div>)}</div></div><aside className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className="text-[10px] font-mono-data uppercase tracking-[0.14em] text-blue-200/65">Blue Blazer coaching analytics</p><p className="mt-2 text-xs leading-5 text-white/50">Content coaching and saved-recording delivery evidence are separate from official rubric points.</p><div className="mt-4 space-y-3">{Object.entries(result.coachAnalytics).map(([label, value]) => <div key={label}><div className="flex justify-between gap-3 text-xs text-white/65"><span className="capitalize">{label.replace(/([A-Z])/g, " $1")}</span><span>{value}/100</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{ width: `${value}%` }} /></div></div>)}</div>{result.deliveryAnalysis && <div className="mt-4 rounded-lg border border-violet-300/15 bg-violet-400/[0.05] p-3 text-xs leading-5 text-violet-50">{result.deliveryAnalysis.available ? `Audio delivery: ${result.deliveryAnalysis.pauseCount ?? 0} pauses · ${result.deliveryAnalysis.silencePercentage ?? 0}% silence · ${result.deliveryAnalysis.averageLoudnessDbfs ?? "—"} dBFS.` : `Audio delivery unavailable: ${result.deliveryAnalysis.reason || "record again for waveform-based feedback."}`}</div>}<p className="mt-5 rounded-lg border border-amber-300/15 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-100/75">{result.penaltyAssessment}</p></aside></div></section>}
  </div></div>;
}

function RecordedEvidencePanel({ groupSize, onComplete }: { groupSize: number; onComplete: (result: JudgeResult) => void }) {
  const [writtenEntry, setWrittenEntry] = useState<File | null>(null);
  const [recording, setRecording] = useState<Blob | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const createMutation = trpc.aiJudge.createRecordedSession.useMutation();
  const uploadEntryMutation = trpc.aiJudge.uploadWrittenEntry.useMutation();
  const uploadRecordingMutation = trpc.aiJudge.uploadPresentationRecording.useMutation();
  const evaluateMutation = trpc.aiJudge.evaluateRecordedSession.useMutation({ onSuccess: (response) => onComplete(response.result as JudgeResult) });
  const busy = createMutation.isPending || uploadEntryMutation.isPending || uploadRecordingMutation.isPending || evaluateMutation.isPending;

  function stopCapture() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  }

  async function beginCapture() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("This browser cannot record a presentation. Use a current Chrome, Edge, Safari, or Firefox browser.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: cameraEnabled });
      const mimeType = (cameraEnabled ? ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"] : ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"]).find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = []; streamRef.current = stream; recorderRef.current = recorder; startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => setRecording(new Blob(chunksRef.current, { type: recorder.mimeType || (cameraEnabled ? "video/webm" : "audio/webm") }));
      recorder.start(1_000); setLive(true); setError(null);
    } catch (cause: any) {
      setError(cause?.name === "NotAllowedError" ? "Camera or microphone permission is blocked. Allow the selected device in browser settings and retry." : cause?.message || "Blue Blazer could not start presentation recording.");
    }
  }

  async function submitRecordedEvidence() {
    if (!writtenEntry || !recording) return;
    try {
      const created = await createMutation.mutateAsync({ competitionYear: "2026-2027", eventCode: "EIP", groupSize });
      const sessionId = created.sessionId;
      const writtenMimeType = writtenEntry.type === "text/plain" ? "text/plain" : "application/pdf" as const;
      await uploadEntryMutation.mutateAsync({ sessionId, fileName: writtenEntry.name, mimeType: writtenMimeType, fileBase64: await blobToBase64(writtenEntry) });
      const hasVideo = recording.type.startsWith("video/");
      const mimeType = recording.type.startsWith("video/webm") ? "video/webm" : recording.type.startsWith("video/mp4") ? "video/mp4" : recording.type.startsWith("audio/ogg") ? "audio/ogg" : recording.type.startsWith("audio/mp4") ? "audio/mp4" : recording.type.startsWith("audio/wav") ? "audio/wav" : recording.type.startsWith("audio/mpeg") ? "audio/mpeg" : "audio/webm" as const;
      const durationMs = Math.max(1_000, Date.now() - startedAtRef.current);
      await uploadRecordingMutation.mutateAsync({ sessionId, mediaBase64: await blobToBase64(recording), mimeType, durationMs, hasVideo, segments: [{ segmentType: "presentation", startMs: 0, endMs: durationMs, label: "Prepared presentation" }] });
      await evaluateMutation.mutateAsync({ sessionId });
    } catch (cause: any) { setError(cause?.message || "Your paper and original recording remain saved when the upload succeeds. Retry evaluation without recording again."); }
  }

  return <section className="mt-6 rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(8,50,74,0.35),rgba(4,10,28,0.9))] p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.14em] text-cyan-100/70">Recommended · media-first evidence</p><h2 className="mt-1 text-2xl font-semibold text-white">UPLOAD THE PAPER + RECORD THE PRESENTATION</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">The written entry remains primary evidence. Blue Blazer preserves your original presentation, derives a supporting transcript and acoustic delivery metrics from it, and shows unavailable sources rather than inventing them.</p></div><div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs text-cyan-50"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Private attempt</div></div><div className="mt-5 grid gap-4 lg:grid-cols-3"><label className="rounded-xl border border-white/10 bg-black/20 p-4"><FileText className="h-4 w-4 text-cyan-200" /><p className="mt-2 text-sm font-semibold text-white">1. Written entry</p><p className="mt-1 text-xs leading-5 text-slate-400">Text-based PDF or plain text, up to 12 MB.</p><input type="file" accept="application/pdf,text/plain" onChange={(event) => setWrittenEntry(event.target.files?.[0] ?? null)} className="mt-3 block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-300/10 file:px-2 file:py-1.5 file:text-cyan-100" />{writtenEntry && <p className="mt-2 truncate text-[11px] text-emerald-200">{writtenEntry.name}</p>}</label><div className="rounded-xl border border-white/10 bg-black/20 p-4"><Mic className="h-4 w-4 text-cyan-200" /><p className="mt-2 text-sm font-semibold text-white">2. Presentation recording</p><p className="mt-1 text-xs leading-5 text-slate-400">Audio is required. Camera is optional and preserved for playback.</p><button type="button" onClick={() => setCameraEnabled((current) => !current)} className={`mt-3 rounded-lg border px-2.5 py-1.5 text-xs ${cameraEnabled ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-50" : "border-white/10 text-slate-300"}`}>{cameraEnabled ? <Video className="mr-1 inline h-3.5 w-3.5" /> : <Camera className="mr-1 inline h-3.5 w-3.5" />}{cameraEnabled ? "Camera on" : "Audio only"}</button><Button onClick={live ? stopCapture : beginCapture} disabled={busy} className={`mt-3 w-full ${live ? "bg-rose-500 hover:bg-rose-400" : "bg-cyan-600 hover:bg-cyan-500"}`}>{live ? <><CircleStop className="mr-2 h-4 w-4" />End presentation</> : <><Mic className="mr-2 h-4 w-4" />{recording ? "Record again" : "Start recording"}</>}</Button>{recording && <p className="mt-2 text-[11px] text-emerald-200">Original recording ready</p>}</div><div className="rounded-xl border border-white/10 bg-black/20 p-4"><Award className="h-4 w-4 text-cyan-200" /><p className="mt-2 text-sm font-semibold text-white">3. Evaluate evidence</p><p className="mt-1 text-xs leading-5 text-slate-400">The scorecard distinguishes paper, recording, transcript, audio delivery, and unavailable visual evidence.</p><Button onClick={() => void submitRecordedEvidence()} disabled={!writtenEntry || !recording || busy} className="mt-3 w-full bg-blue-600 text-white hover:bg-blue-500">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing evidence</> : "Evaluate saved evidence"}</Button></div></div>{error && <p role="alert" className="mt-4 rounded-lg border border-red-300/20 bg-red-400/[0.08] px-3 py-2 text-sm text-red-100">{error}</p>}</section>;
}
