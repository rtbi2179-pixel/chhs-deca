import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, ChevronRight, Compass, Lightbulb, Loader2, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { allEvents } from "@/pages/Events";
import { EVENT_MATCH_QUESTIONS, type EventMatchRecommendation } from "@shared/eventMatchQuiz";

type QuizPhase = "intro" | "quiz" | "results" | "browse";

const STYLE_COPY = {
  roleplay: "Live role-play",
  prepared: "Prepared / written",
  selling: "Selling / consulting",
  team: "Team decision making",
  simulation: "Online simulation",
} as const;

export default function EventMatchQuiz() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<EventMatchRecommendation[]>([]);
  const [submitError, setSubmitError] = useState("");
  const quizStatus = trpc.preferences.getEventMatchQuiz.useQuery();
  const submitQuiz = trpc.preferences.submitEventMatchQuiz.useMutation({
    onSuccess: (result) => { setRecommendations(result.recommendations); setPhase("results"); },
    onError: (error) => setSubmitError(error.message),
  });
  const chooseEvent = trpc.preferences.chooseEventMatch.useMutation({
    onSuccess: async (result) => {
      await utils.preferences.getPrimaryEvent.invalidate();
      await utils.preferences.getEventMatchQuiz.invalidate();
      setLocation('/events');
    },
  });

  const question = EVENT_MATCH_QUESTIONS[questionIndex];
  const progress = Math.round(((questionIndex + 1) / EVENT_MATCH_QUESTIONS.length) * 100);
  const currentAnswer = answers[question?.id];

  const beginQuiz = () => { setAnswers({}); setQuestionIndex(0); setSubmitError(""); setPhase("quiz"); };
  const answerQuestion = (answerId: string) => setAnswers((current) => ({ ...current, [question.id]: answerId }));
  const nextQuestion = () => {
    if (!currentAnswer) return;
    if (questionIndex === EVENT_MATCH_QUESTIONS.length - 1) {
      setSubmitError("");
      submitQuiz.mutate({ answers });
      return;
    }
    setQuestionIndex((index) => index + 1);
  };
  const choose = (eventCode: string) => chooseEvent.mutate({ eventCode });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_88%_6%,oklch(0.35_0.12_255/0.22),transparent_31%),oklch(0.07_0.012_265)] px-4 py-24 text-white sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <button type="button" onClick={() => setLocation("/events")} className="mb-7 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Back to events</button>
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.section key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="overflow-hidden rounded-3xl border border-blue-300/20 bg-slate-950/75 shadow-[0_30px_120px_oklch(0_0_0/0.42)] backdrop-blur-xl">
              <div className="border-b border-white/10 bg-[linear-gradient(145deg,oklch(0.25_0.1_255/0.6),oklch(0.08_0.02_265/0.9))] p-7 sm:p-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200/30 bg-blue-300/10 text-blue-100 shadow-[0_0_36px_oklch(0.62_0.15_250/0.3)]"><Compass className="h-7 w-7" /></div>
                <p className="mt-7 text-[11px] font-mono uppercase tracking-[0.18em] text-blue-200/80">Blue Blazer event finder</p>
                <h1 className="mt-3 max-w-2xl font-display text-5xl leading-[0.86] tracking-tight sm:text-6xl">FIND YOUR DECA EVENT</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50/75">Not sure where to start? Answer 12 short questions about your interests and competition style. We will suggest three DECA events that could be a strong fit.</p>
              </div>
              <div className="grid gap-5 p-7 sm:grid-cols-[1fr_auto] sm:items-end sm:p-10"><div><p className="font-semibold text-white">This is a starting point, not a label.</p><p className="mt-2 text-sm leading-6 text-white/60">Your results are a Blue Blazer compatibility score—not a scientific personality assessment. You can always browse all events or retake the quiz.</p>{quizStatus.data?.primaryEventCode && <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-2 text-xs text-emerald-200"><Check className="h-3.5 w-3.5" />Current selected event: {quizStatus.data.primaryEventCode}</p>}</div><div className="flex flex-col gap-3"><Button onClick={beginQuiz} className="h-11 bg-blue-600 px-5 text-white hover:bg-blue-500"><Sparkles className="mr-2 h-4 w-4" />Help me find one</Button><Button variant="outline" onClick={() => setLocation("/events")} className="h-11 border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]">Yes, choose my event</Button><button type="button" onClick={() => setLocation("/events")} className="text-xs text-white/45 transition hover:text-white">Skip for now</button></div></div>
            </motion.section>
          )}
          {phase === "quiz" && (
            <motion.section key={`question-${question.id}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_120px_oklch(0_0_0/0.4)] backdrop-blur-xl sm:p-9">
              <div className="flex items-center justify-between gap-4"><div><p className="text-[11px] font-mono uppercase tracking-[0.16em] text-blue-300">Event Match Quiz</p><p className="mt-1 text-xs text-white/45">Question {questionIndex + 1} of {EVENT_MATCH_QUESTIONS.length}</p></div><button type="button" onClick={() => setPhase("intro")} className="text-xs text-white/45 transition hover:text-white">Save for later</button></div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.58_0.17_250),oklch(0.8_0.11_230))] transition-[width] duration-200" style={{ width: `${progress}%` }} /></div>
              <div className="mt-10"><h1 className="max-w-3xl font-display text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl">{question.prompt}</h1><p className="mt-3 text-sm text-white/55">{question.helper}</p></div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">{question.options.map((option) => <button key={option.id} type="button" onClick={() => answerQuestion(option.id)} className={`rounded-xl border p-4 text-left text-sm transition ${currentAnswer === option.id ? "border-blue-300/70 bg-blue-500/15 text-white shadow-[0_0_0_1px_oklch(0.67_0.14_250/0.25)]" : "border-white/10 bg-white/[0.025] text-white/75 hover:border-blue-300/35 hover:bg-blue-500/[0.06] hover:text-white"}`}><span className="font-medium">{option.label}</span></button>)}</div>
              {submitError && <p className="mt-4 text-sm text-red-300">{submitError}</p>}
              <div className="mt-9 flex items-center justify-between gap-4 border-t border-white/10 pt-6"><Button variant="outline" disabled={questionIndex === 0 || submitQuiz.isPending} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))} className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]">Back</Button><Button disabled={!currentAnswer || submitQuiz.isPending} onClick={nextQuestion} className="bg-blue-600 text-white hover:bg-blue-500">{submitQuiz.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finding matches…</> : questionIndex === EVENT_MATCH_QUESTIONS.length - 1 ? <>See my matches <Trophy className="ml-2 h-4 w-4" /></> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}</Button></div>
            </motion.section>
          )}
          {phase === "results" && (
            <motion.section key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_120px_oklch(0_0_0/0.4)] backdrop-blur-xl sm:p-9"><div className="max-w-2xl"><p className="text-[11px] font-mono uppercase tracking-[0.16em] text-blue-300">Your DECA matches</p><h1 className="mt-3 font-display text-5xl leading-[0.86] tracking-tight sm:text-6xl">A GOOD PLACE TO START</h1><p className="mt-5 text-sm leading-6 text-white/60">These compatibility scores reflect your quiz answers and event style. They are guides, not guarantees—choose the event that makes you excited to prepare.</p></div><div className="mt-9 grid gap-4">{recommendations.map((recommendation, index) => { const event = allEvents.find((item) => item.code === recommendation.eventCode); if (!event) return null; return <article key={recommendation.eventCode} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-blue-300/30"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/25 bg-blue-500/10 font-mono text-sm font-bold text-blue-200">#{index + 1}</div><div><p className="font-mono text-xs tracking-[0.12em] text-blue-300">{event.code}</p><h2 className="mt-1 text-xl font-semibold text-white">{event.name}</h2><p className="mt-2 text-sm text-white/55">{event.description}</p></div></div><div className="rounded-xl border border-blue-300/25 bg-blue-500/[0.09] px-3 py-2 text-center"><p className="font-mono text-lg font-bold text-blue-100">{recommendation.compatibility}%</p><p className="text-[10px] uppercase tracking-[0.11em] text-blue-200/70">Match score</p></div></div><div className="mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2"><div><p className="text-[10px] font-mono uppercase tracking-[0.13em] text-white/40">Competition style</p><p className="mt-1 text-sm text-white/80">{STYLE_COPY[recommendation.style]} · {event.participants === "1" ? "Individual" : `${event.participants} participants`}</p></div><div><p className="text-[10px] font-mono uppercase tracking-[0.13em] text-white/40">Strong match because</p><p className="mt-1 text-sm text-blue-100">{recommendation.strengths.join(" · ")}</p></div></div><div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => choose(recommendation.eventCode)} disabled={chooseEvent.isPending} className="bg-blue-600 text-white hover:bg-blue-500">{chooseEvent.isPending ? "Selecting…" : `Choose ${event.code}`}</Button><a href={`/events#${event.code}`} className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white">Learn more</a></div></article>})}</div><div className="mt-7 flex flex-wrap gap-3"><Button variant="outline" onClick={() => setPhase("browse")} className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]">Browse all DECA events</Button><button type="button" onClick={beginQuiz} className="text-sm text-blue-200 transition hover:text-white">Retake quiz</button></div></motion.section>
          )}
          {phase === "browse" && (
            <motion.section key="browse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_30px_120px_oklch(0_0_0/0.4)] backdrop-blur-xl sm:p-9"><p className="text-[11px] font-mono uppercase tracking-[0.16em] text-blue-300">All supported events</p><h1 className="mt-3 font-display text-4xl tracking-tight">CHOOSE WHAT FITS YOU</h1><p className="mt-3 text-sm text-white/60">The quiz is optional. You can select any event below.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{allEvents.map((event) => <button key={event.code} type="button" onClick={() => choose(event.code)} disabled={chooseEvent.isPending} className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-blue-300/35 hover:bg-blue-500/[0.07]"><p className="font-mono text-xs text-blue-300">{event.code}</p><p className="mt-1 font-semibold text-white">{event.name}</p><p className="mt-1 text-xs text-white/45">{event.cluster} · {event.type}</p></button>)}</div><Button variant="outline" onClick={() => setPhase("results")} className="mt-7 border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]">Back to matches</Button></motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
