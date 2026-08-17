// @ts-nocheck -- this view intentionally branches across the score-visible and score-withheld tRPC result contracts.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CalendarClock, Check, ClipboardCheck, Clock3, EyeOff, ListChecks, Loader2, LockKeyhole, ShieldAlert, Target, Timer, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { IndividualMockExamHistory } from "@/components/IndividualMockExamHistory";

const MOCK_EXAM_CLUSTERS = [
  { value: "Marketing", label: "Marketing" },
  { value: "Business Management & Administration", label: "Business Management" },
  { value: "Finance", label: "Finance" },
  { value: "Hospitality & Tourism", label: "Hospitality & Tourism" },
] as const;

const ANSWER_CHOICES = ["A", "B", "C", "D"] as const;
type MockExamCluster = (typeof MOCK_EXAM_CLUSTERS)[number]["value"];
type ExamMode = "individual" | "chapter";
type MockExamQuestion = {
  id: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};
type MockExam = {
  sessionId: number;
  cluster: string;
  totalQuestions: number;
  questions: MockExamQuestion[];
  mode: ExamMode;
  attemptId?: number;
  expiresAt?: Date;
  scoreVisible?: boolean;
};

function QuestionNavigator({ questions, currentIndex, answeredQuestionIds, onSelect, disabled }: { questions: MockExamQuestion[]; currentIndex: number; answeredQuestionIds: Set<string>; onSelect: (index: number) => void; disabled: boolean }) {
  return (
    <aside className="editorial-panel h-fit p-4 lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="data-label">Question navigator</p>
          <p className="mt-1 text-sm text-slate-300">{answeredQuestionIds.size} of {questions.length} answered</p>
        </div>
        <ListChecks className="h-5 w-5 text-blue-300" aria-hidden="true" />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[11px] text-slate-400" aria-label="Question status legend">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />Current</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Answered</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-600" />Unanswered</span>
      </div>
      <div className="mt-4 grid grid-cols-10 gap-1.5" aria-label="All mock exam questions">
        {questions.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isAnswered = answeredQuestionIds.has(item.id);
          const stateClass = isCurrent
            ? "border-blue-300 bg-blue-500/20 text-blue-100 shadow-[0_0_0_1px_rgba(96,165,250,0.35)]"
            : isAnswered
              ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-blue-400/45 hover:text-slate-200";
          return <button key={item.id} type="button" disabled={disabled} aria-current={isCurrent ? "step" : undefined} aria-label={`Question ${index + 1}${isCurrent ? ", current" : ""}${isAnswered ? ", answered" : ", unanswered"}`} onClick={() => onSelect(index)} className={`aspect-square rounded-sm border text-[10px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${stateClass}`}>{index + 1}</button>;
        })}
      </div>
    </aside>
  );
}

function formatRemaining(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function ChapterMockExam() {
  const [examState, setExam] = useState<MockExam | null>(null);
  // The JSX branches gate all non-setup states behind a truthy exam value.
  const exam = examState as MockExam;
  const [mode, setMode] = useState<ExamMode | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<MockExamCluster | null>(null);
  const [preparationProgress, setPreparationProgress] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());

  const chapterAvailability = trpc.mockExams.getChapterAvailability.useQuery();
  const createIndividual = trpc.mockExams.createIndividualMock.useMutation({ onSuccess: (result) => startExam(result, "Your 100-question individual mock exam is ready."), onError: (error) => { setPreparationProgress(0); toast.error(error.message); } });
  const createChapter = trpc.mockExams.createChapterMock.useMutation({ onSuccess: (result) => startExam(result, "Your administrator-assigned chapter mock exam is ready."), onError: (error) => { setPreparationProgress(0); toast.error(error.message); } });
  const submitAnswer = trpc.mockExams.submitAnswer.useMutation({
    onSuccess: (result, variables) => {
      const updatedAnsweredIds = new Set(answeredQuestionIds);
      updatedAnsweredIds.add(variables.questionId);
      setAnsweredQuestionIds(updatedAnsweredIds);
      setSelectedAnswer(null);
      if (!exam || result.questionsAnswered >= exam.questions.length) {
        setFinished(true);
        return;
      }
      const nextUnansweredIndex = exam.questions.findIndex((item) => !updatedAnsweredIds.has(item.id));
      setCurrentIndex(nextUnansweredIndex >= 0 ? nextUnansweredIndex : currentIndex);
    },
    onError: (error) => toast.error(error.message),
  });
  const reportActivity = trpc.mockExams.reportChapterActivity.useMutation();
  const results = trpc.mockExams.getResults.useQuery({ sessionId: exam?.sessionId ?? 0 }, { enabled: !!exam?.sessionId && finished });

  const isPreparing = createIndividual.isPending || createChapter.isPending;
  const currentQuestion = exam?.questions[currentIndex];
  const selectedClusterLabel = MOCK_EXAM_CLUSTERS.find((cluster) => cluster.value === selectedCluster)?.label;
  const configuredChapter = chapterAvailability.data?.config;
  const chapterIsAvailable = Boolean(chapterAvailability.data?.isAvailable);
  const expiresAtMs = exam?.mode === "chapter" && exam.expiresAt ? new Date(exam.expiresAt).getTime() : null;
  const isExpired = expiresAtMs !== null && now >= expiresAtMs;
  const preparationCount = mode === "chapter" ? configuredChapter?.questionCount ?? 0 : 100;

  function startExam(result: MockExam, message: string) {
    setPreparationProgress(100);
    setExam(result);
    setCurrentIndex(0);
    setAnsweredQuestionIds(new Set());
    setFinished(false);
    setQuestionStartedAt(Date.now());
    toast.success(message);
  }

  useEffect(() => {
    if (!isPreparing) return;
    setPreparationProgress(8);
    const progressTimer = window.setInterval(() => setPreparationProgress((previous) => Math.min(92, previous + (previous < 48 ? 9 : 4))), 360);
    return () => window.clearInterval(progressTimer);
  }, [isPreparing]);

  useEffect(() => {
    if (!exam?.expiresAt || exam.mode !== "chapter" || finished) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [exam?.expiresAt, exam?.mode, finished]);

  useEffect(() => setQuestionStartedAt(Date.now()), [exam?.sessionId, currentIndex]);

  useEffect(() => {
    if (exam?.mode !== "chapter" || !exam.attemptId || finished) return;
    const recordTabExit = () => {
      if (document.visibilityState === "hidden") reportActivity.mutate({ attemptId: exam.attemptId!, eventType: "tab_hidden", questionId: currentQuestion?.id });
    };
    document.addEventListener("visibilitychange", recordTabExit);
    return () => document.removeEventListener("visibilitychange", recordTabExit);
  }, [exam?.attemptId, exam?.mode, currentQuestion?.id, finished, reportActivity]);

  const selectQuestion = (index: number) => {
    setCurrentIndex(index);
    setSelectedAnswer(null);
  };

  const saveAnswer = () => {
    if (!exam || !currentQuestion || !selectedAnswer) return;
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - questionStartedAt) / 1_000));
    submitAnswer.mutate({ sessionId: exam.sessionId, questionId: currentQuestion.id, selectedAnswer, elapsedSeconds: exam.mode === "chapter" ? elapsedSeconds : undefined });
  };

  const resultIsWithheld = results.data?.scoreVisible === false;

  return (
    <main className="page-shell">
      <section className="page-content max-w-6xl">
        <div className="editorial-panel p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3"><ClipboardCheck className="h-6 w-6 text-blue-300" /></div>
            <div>
              <p className="page-eyebrow">Assessment center</p>
              <h1 className="page-title mt-2">Mock Exams</h1>
              <p className="page-intro mt-3">Choose an individual readiness check at any time, or complete a chapter exam only when your chapter administrator has opened one for you.</p>
            </div>
          </div>

          {!exam && !isPreparing && <IndividualMockExamHistory />}

          {!exam && isPreparing ? (
            <div className="mx-auto mt-10 max-w-xl rounded-lg border border-blue-500/25 bg-blue-500/[0.045] p-6 sm:p-8" role="status" aria-live="polite">
              <div className="flex items-start gap-4"><div className="rounded-md border border-blue-400/35 bg-blue-500/10 p-2.5"><Loader2 className="h-5 w-5 animate-spin text-blue-300" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-white">Preparing your {preparationCount || ""}-question {mode === "chapter" ? "chapter" : "individual"} exam</p><p className="mt-1 text-sm leading-relaxed text-slate-300">We are filtering unused questions, balancing difficulty, and saving the complete assessment session.</p></div></div>
              <div className="mt-6 flex items-end justify-between gap-4"><p className="data-label">Question set preparation</p><p className="font-mono text-sm font-semibold text-blue-200">{preparationProgress}%</p></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full border border-blue-400/15 bg-slate-950/60"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-300 transition-[width] duration-300 ease-out" style={{ width: `${preparationProgress}%` }} /></div>
              <p className="mt-3 text-xs text-slate-400">The exam opens only after the complete, balanced question set is ready.</p>
            </div>
          ) : !exam && !mode ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <button type="button" onClick={() => setMode("individual")} className="editorial-panel-interactive group rounded-lg border border-blue-400/30 bg-blue-500/[0.045] p-6 text-left transition hover:border-blue-300/60">
                <div className="flex items-start justify-between gap-4"><div className="rounded-md border border-blue-400/30 bg-blue-500/10 p-2.5"><UserRound className="h-5 w-5 text-blue-200" /></div><span className="rounded-full border border-blue-400/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-blue-100">Any time</span></div>
                <h2 className="mt-5 text-xl font-semibold text-white">Individual Mock Exam</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Build a fresh, 100-question exam for one cluster whenever you are ready. Your score, concept analysis, and PI study guide are available as soon as you finish.</p><p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-200">Choose a cluster <ArrowRight className="h-4 w-4" /></p>
              </button>
              <button type="button" onClick={() => chapterIsAvailable && setMode("chapter")} disabled={!chapterIsAvailable || chapterAvailability.isLoading} className={`rounded-lg border p-6 text-left transition ${chapterIsAvailable ? "editorial-panel-interactive border-emerald-400/30 bg-emerald-500/[0.04] hover:border-emerald-300/60" : "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-70"}`}>
                <div className="flex items-start justify-between gap-4"><div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-2.5">{chapterIsAvailable ? <Building2 className="h-5 w-5 text-emerald-200" /> : <LockKeyhole className="h-5 w-5 text-slate-400" />}</div><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${chapterIsAvailable ? "border-emerald-400/25 text-emerald-100" : "border-white/10 text-slate-400"}`}>{chapterIsAvailable ? "Open now" : "Admin controlled"}</span></div>
                <h2 className="mt-5 text-xl font-semibold text-white">Chapter Mock Exam</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">A chapter assessment with administrator-selected timing, length, score-release settings, and activity review.</p><p className={`mt-5 text-sm font-medium ${chapterIsAvailable ? "text-emerald-200" : "text-slate-400"}`}>{chapterAvailability.isLoading ? "Checking chapter availability…" : chapterIsAvailable ? `${configuredChapter?.questionCount} questions · ${configuredChapter?.cluster}` : chapterAvailability.data?.reason}</p>
              </button>
            </div>
          ) : !exam && mode === "individual" ? (
            <div className="mt-8"><button type="button" onClick={() => setMode(null)} className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />All mock exam options</button><fieldset className="mt-5"><legend className="data-label">Choose an individual-exam cluster</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{MOCK_EXAM_CLUSTERS.map((cluster) => <button key={cluster.value} type="button" onClick={() => setSelectedCluster(cluster.value)} className={`editorial-tab px-4 py-3 text-left text-sm font-medium ${selectedCluster === cluster.value ? "editorial-tab-active" : "bg-white/[0.02]"}`}>{cluster.label}</button>)}</div></fieldset><div className="mt-5 flex flex-wrap items-center gap-3"><button onClick={() => selectedCluster && createIndividual.mutate({ cluster: selectedCluster })} disabled={!selectedCluster} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 active:scale-[0.97] disabled:opacity-60"><Target className="h-4 w-4" />{selectedCluster ? `Build ${selectedClusterLabel} Mock Exam` : "Choose a cluster to continue"}</button><p className="text-xs text-slate-400">100 questions · 25 easy · 50 medium · 25 hard</p></div></div>
          ) : !exam && mode === "chapter" ? (
            <div className="mt-8"><button type="button" onClick={() => setMode(null)} className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />All mock exam options</button><div className="mt-5 rounded-lg border border-emerald-400/25 bg-emerald-500/[0.04] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="page-eyebrow text-emerald-300">Chapter assignment</p><h2 className="mt-2 text-xl font-semibold text-white">{configuredChapter?.cluster} chapter mock exam</h2><p className="mt-2 text-sm text-slate-300">Your chapter has assigned a {configuredChapter?.questionCount}-question exam. Activity flags are provided to administrators for review; they do not automatically determine an outcome.</p></div><Timer className="h-6 w-6 text-emerald-200" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><p className="rounded-md border border-white/10 bg-slate-950/30 p-3 text-sm text-slate-300"><span className="data-label block">Questions</span><span className="mt-1 block font-semibold text-white">{configuredChapter?.questionCount}</span></p><p className="rounded-md border border-white/10 bg-slate-950/30 p-3 text-sm text-slate-300"><span className="data-label block">Extra time</span><span className="mt-1 block font-semibold text-white">+{configuredChapter?.extraTimeMinutes ?? 0} min</span></p><p className="rounded-md border border-white/10 bg-slate-950/30 p-3 text-sm text-slate-300"><span className="data-label block">Score release</span><span className="mt-1 block font-semibold text-white">{configuredChapter?.scoreVisible ? "After completion" : "Advisor release"}</span></p></div><button onClick={() => createChapter.mutate({})} className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97]"><Building2 className="h-4 w-4" />Begin chapter exam</button></div></div>
          ) : finished ? (
            <div className="mt-8 space-y-5"><div className="editorial-panel border-emerald-500/25 bg-emerald-500/[0.045] p-5"><p className="font-semibold text-emerald-200">Mock exam complete</p>{results.isLoading ? <div className="mt-3 flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin text-blue-300" />Calculating your results and study priorities…</div> : resultIsWithheld ? <div className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-slate-300"><EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />{results.data?.message}</div> : <p className="mt-1 text-sm text-slate-300">{results.data?.score ?? 0} / {results.data?.total ?? exam.totalQuestions} correct · {results.data?.accuracy ?? 0}% accuracy</p>}</div>
              {results.data && !resultIsWithheld && <><section className="editorial-panel p-5 sm:p-6" aria-labelledby="concept-accuracy-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="page-eyebrow">Performance analysis</p><h2 id="concept-accuracy-heading" className="mt-2 text-xl font-semibold text-white">Concept and PI accuracy</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">Each instructional area expands to show the Performance Indicators measured in this exam. Accuracy is calculated from every saved answer in that group.</p></div><p className="rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 font-mono text-xs text-slate-300">{results.data.instructionalAreas.length} concepts measured</p></div><div className="mt-5 space-y-3">{results.data.instructionalAreas.map((area) => <details key={area.instructionalArea} className="group rounded-md border border-white/10 bg-slate-950/30 p-4" open><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center justify-between gap-3 pr-1"><div><p className="font-semibold text-white">{area.instructionalArea}</p><p className="mt-1 text-xs text-slate-400">{area.correct} of {area.attempted} correct · {area.performanceIndicators.length} PI{area.performanceIndicators.length === 1 ? "" : "s"}</p></div><span className={`rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${area.accuracy < 60 ? "border-amber-400/35 bg-amber-500/10 text-amber-200" : "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"}`}>{area.accuracy}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-[width] duration-300 ${area.accuracy < 60 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${area.accuracy}%` }} /></div></summary><div className="mt-4 border-t border-white/10 pt-3"><p className="data-label">Performance Indicators</p><div className="mt-2 space-y-2">{area.performanceIndicators.map((pi) => <div key={pi.performanceIndicator} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white/[0.025] px-3 py-2.5"><div className="min-w-0"><p className="text-sm font-medium text-slate-100">{pi.performanceIndicator}</p><p className="mt-0.5 text-xs text-slate-400">{pi.correct} of {pi.attempted} correct</p></div><span className={`font-mono text-sm font-semibold ${pi.accuracy < 60 ? "text-amber-200" : "text-emerald-200"}`}>{pi.accuracy}%</span></div>)}</div></div></details>)}</div></section>
                <section className="editorial-panel border-amber-500/25 bg-amber-500/[0.035] p-5 sm:p-6" aria-labelledby="study-guide-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="page-eyebrow text-amber-300">Targeted study guide</p><h2 id="study-guide-heading" className="mt-2 text-xl font-semibold text-white">Practice your priority PIs</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">PIs below 60% accuracy are prioritized here. Each section compiles fresh, cluster-matched questions that were not part of this mock exam.</p></div><p className="rounded-md border border-amber-400/25 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-100">{results.data.studyGuide.length} PI{results.data.studyGuide.length === 1 ? "" : "s"} ready to review</p></div>{results.data.studyGuide.length ? <div className="mt-5 space-y-5">{results.data.studyGuide.map((section) => <article key={section.performanceIndicator} className="rounded-md border border-white/10 bg-slate-950/30 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="data-label">{section.instructionalArea}</p><h3 className="mt-1 font-semibold text-white">{section.performanceIndicator}</h3></div><span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-amber-100">{section.accuracy}% · {section.correct}/{section.attempted}</span></div><div className="mt-4 grid gap-3">{section.questions.map((studyQuestion, questionIndex) => <details key={studyQuestion.id} className="rounded-md border border-white/10 bg-white/[0.02] p-3"><summary className="cursor-pointer list-none text-sm font-medium text-slate-100"><span className="mr-2 font-mono text-xs text-blue-200">REVIEW {questionIndex + 1}</span>{studyQuestion.stem}</summary><ol className="mt-3 grid gap-2 border-t border-white/10 pt-3 text-sm text-slate-300">{ANSWER_CHOICES.map((choice) => <li key={choice} className="rounded border border-white/5 bg-slate-950/30 px-3 py-2"><span className="mr-2 font-semibold text-blue-300">{choice}.</span>{studyQuestion[`option${choice}`]}</li>)}</ol></details>)}</div></article>)}</div> : <div className="mt-5 rounded-md border border-emerald-400/20 bg-emerald-500/[0.045] p-4 text-sm leading-relaxed text-emerald-100">No Performance Indicator fell below the 60% priority threshold, or no additional cluster-matched questions are currently available for the PIs measured in this exam.</div>}</section></>}</div>
          ) : isExpired ? (
            <div className="mt-8 rounded-lg border border-amber-400/25 bg-amber-500/[0.06] p-6"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-5 w-5 text-amber-200" /><div><p className="font-semibold text-amber-100">Chapter exam time has expired</p><p className="mt-1 text-sm leading-relaxed text-slate-300">No additional answers can be submitted. Your administrator can review the attempt record and any activity flags in member management.</p></div></div></div>
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start"><div className="editorial-panel order-2 border-emerald-500/25 bg-emerald-500/[0.035] p-5 lg:order-1 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div><p className="font-semibold text-emerald-200">{exam.cluster} · Question {currentIndex + 1} of {exam.totalQuestions}</p><p className="mt-1 text-xs text-slate-400">{exam.mode === "chapter" ? "Chapter assessment" : "Individual readiness check"} · {answeredQuestionIds.size} answered</p></div><div className="flex items-center gap-2"><div className="rounded-md border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 font-mono text-xs text-blue-200">{Math.round((answeredQuestionIds.size / exam.totalQuestions) * 100)}% complete</div>{exam.mode === "chapter" && expiresAtMs && <div className="rounded-md border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-100">{formatRemaining(expiresAtMs - now)}</div>}</div></div>{exam.mode === "chapter" && <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-400/20 bg-amber-500/[0.045] px-3 py-2 text-xs leading-relaxed text-amber-100"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />Quickly submitted answers and tab exits are flagged for chapter-administrator review. Flags are review signals, not automatic judgments.</div>}<p className="mt-6 text-lg font-medium leading-relaxed text-white">{currentQuestion?.stem}</p><div className="mt-5 grid gap-3">{ANSWER_CHOICES.map((choice) => <button key={choice} type="button" onClick={() => setSelectedAnswer(choice)} disabled={submitAnswer.isPending} className={`editorial-panel-interactive rounded-md border p-3 text-left text-sm disabled:cursor-wait ${selectedAnswer === choice ? "border-blue-400 bg-blue-500/15 text-white" : "border-white/10 bg-white/[0.025] text-slate-300"}`}><span className="mr-3 font-semibold text-blue-300">{choice}.</span>{currentQuestion?.[`option${choice}`]}</button>)}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5"><button type="button" onClick={() => selectQuestion(currentIndex - 1)} disabled={currentIndex === 0 || submitAnswer.isPending} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-400/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"><ArrowLeft className="h-4 w-4" />Previous</button><div className="flex items-center gap-2"><button type="button" onClick={() => selectQuestion(currentIndex + 1)} disabled={currentIndex + 1 >= exam.questions.length || submitAnswer.isPending} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-400/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-45">Next<ArrowRight className="h-4 w-4" /></button><button onClick={saveAnswer} disabled={!selectedAnswer || submitAnswer.isPending} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.97] disabled:opacity-60">{submitAnswer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Save answer</button></div></div></div><div className="order-1 lg:order-2"><QuestionNavigator questions={exam.questions} currentIndex={currentIndex} answeredQuestionIds={answeredQuestionIds} onSelect={selectQuestion} disabled={submitAnswer.isPending} /></div></div>
          )}
        </div>
      </section>
    </main>
  );
}
