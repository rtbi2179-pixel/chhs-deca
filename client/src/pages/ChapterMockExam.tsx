import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, ListChecks, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const MOCK_EXAM_CLUSTERS = [
  { value: "Marketing", label: "Marketing" },
  { value: "Business Management & Administration", label: "Business Management" },
  { value: "Finance", label: "Finance" },
  { value: "Hospitality & Tourism", label: "Hospitality & Tourism" },
] as const;

const ANSWER_CHOICES = ["A", "B", "C", "D"] as const;
type MockExamCluster = (typeof MOCK_EXAM_CLUSTERS)[number]["value"];
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
};

function QuestionNavigator({
  questions,
  currentIndex,
  answeredQuestionIds,
  onSelect,
  disabled,
}: {
  questions: MockExamQuestion[];
  currentIndex: number;
  answeredQuestionIds: Set<string>;
  onSelect: (index: number) => void;
  disabled: boolean;
}) {
  return (
    <aside className="editorial-panel h-fit p-4 lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="data-label">Question navigator</p>
          <p className="mt-1 text-sm text-slate-300">
            {answeredQuestionIds.size} of {questions.length} answered
          </p>
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
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Question ${index + 1}${isCurrent ? ", current" : ""}${isAnswered ? ", answered" : ", unanswered"}`}
              onClick={() => onSelect(index)}
              className={`aspect-square rounded-sm border text-[10px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${stateClass}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default function ChapterMockExam() {
  const [exam, setExam] = useState<MockExam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<MockExamCluster | null>(null);
  const [preparationProgress, setPreparationProgress] = useState(0);

  const createMock = trpc.mockExams.createChapterMock.useMutation({
    onSuccess: (result) => {
      setPreparationProgress(100);
      setExam(result);
      setCurrentIndex(0);
      setAnsweredQuestionIds(new Set());
      setFinished(false);
      toast.success("Your 100-question Chapter Mock Exam is ready.");
    },
    onError: (error) => {
      setPreparationProgress(0);
      toast.error(error.message);
    },
  });
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
  const results = trpc.mockExams.getResults.useQuery(
    { sessionId: exam?.sessionId ?? 0 },
    { enabled: !!exam?.sessionId && finished }
  );

  useEffect(() => {
    if (!createMock.isPending) return;

    setPreparationProgress(8);
    const progressTimer = window.setInterval(() => {
      setPreparationProgress((previous) => Math.min(92, previous + (previous < 48 ? 9 : 4)));
    }, 360);

    return () => window.clearInterval(progressTimer);
  }, [createMock.isPending]);

  const question = exam?.questions[currentIndex];
  const selectedClusterLabel = MOCK_EXAM_CLUSTERS.find((cluster) => cluster.value === selectedCluster)?.label;
  const selectQuestion = (index: number) => {
    setCurrentIndex(index);
    setSelectedAnswer(null);
  };

  return (
    <main className="page-shell">
      <section className="page-content max-w-6xl">
        <div className="editorial-panel p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3"><ClipboardCheck className="h-6 w-6 text-blue-300" /></div>
            <div>
              <p className="page-eyebrow">Chapter preparation</p>
              <h1 className="page-title mt-2">Chapter Mock Exam</h1>
              <p className="page-intro mt-3">Choose one career cluster for a fresh 100-question practice exam. Every question is unanswered and comes only from your selected cluster, with a 25 easy, 50 medium, and 25 hard target.</p>
            </div>
          </div>

          {!exam && createMock.isPending ? (
            <div className="mx-auto mt-10 max-w-xl rounded-lg border border-blue-500/25 bg-blue-500/[0.045] p-6 sm:p-8" role="status" aria-live="polite">
              <div className="flex items-start gap-4">
                <div className="rounded-md border border-blue-400/35 bg-blue-500/10 p-2.5"><Loader2 className="h-5 w-5 animate-spin text-blue-300" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">Preparing your 100-question exam</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">We are filtering unused {selectedClusterLabel ?? "cluster"} questions, balancing difficulty, and saving the complete exam session.</p>
                </div>
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <p className="data-label">Question set preparation</p>
                <p className="font-mono text-sm font-semibold text-blue-200">{preparationProgress}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full border border-blue-400/15 bg-slate-950/60" aria-label={`Exam preparation ${preparationProgress}% complete`}>
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-300 transition-[width] duration-300 ease-out" style={{ width: `${preparationProgress}%` }} />
              </div>
              <p className="mt-3 text-xs text-slate-400">The exam opens once the complete, balanced 100-question session is ready.</p>
            </div>
          ) : !exam ? (
            <div className="mt-8">
              <fieldset>
                <legend className="data-label">Choose a career cluster</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {MOCK_EXAM_CLUSTERS.map((cluster) => (
                    <button key={cluster.value} type="button" onClick={() => setSelectedCluster(cluster.value)} className={`editorial-tab px-4 py-3 text-left text-sm font-medium ${selectedCluster === cluster.value ? "editorial-tab-active" : "bg-white/[0.02]"}`}>
                      {cluster.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button onClick={() => selectedCluster && createMock.mutate({ cluster: selectedCluster })} disabled={!selectedCluster} className="mt-5 inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 active:scale-[0.97] disabled:opacity-60">
                <Target className="h-4 w-4" />
                {selectedCluster ? `Build ${selectedClusterLabel} Mock Exam` : "Choose a cluster to continue"}
              </button>
            </div>
          ) : finished ? (
            <div className="mt-8 space-y-5">
              <div className="editorial-panel border-emerald-500/25 bg-emerald-500/[0.045] p-5">
                <p className="font-semibold text-emerald-200">Mock exam complete</p>
                {results.isLoading ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin text-blue-300" />Calculating your results and study priorities…</div>
                ) : (
                  <p className="mt-1 text-sm text-slate-300">{results.data?.score ?? 0} / {results.data?.total ?? exam.totalQuestions} correct · {results.data?.accuracy ?? 0}% accuracy</p>
                )}
              </div>
              {results.data && (
                <>
                  <section className="editorial-panel p-5 sm:p-6" aria-labelledby="concept-accuracy-heading">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="page-eyebrow">Performance analysis</p>
                        <h2 id="concept-accuracy-heading" className="mt-2 text-xl font-semibold text-white">Concept and PI accuracy</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">Each instructional area expands to show the Performance Indicators measured in this exam. Accuracy is calculated from every saved answer in that group.</p>
                      </div>
                      <p className="rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 font-mono text-xs text-slate-300">{results.data.instructionalAreas.length} concepts measured</p>
                    </div>
                    <div className="mt-5 space-y-3">
                      {results.data.instructionalAreas.map((area) => (
                        <details key={area.instructionalArea} className="group rounded-md border border-white/10 bg-slate-950/30 p-4" open>
                          <summary className="cursor-pointer list-none">
                            <div className="flex flex-wrap items-center justify-between gap-3 pr-1">
                              <div>
                                <p className="font-semibold text-white">{area.instructionalArea}</p>
                                <p className="mt-1 text-xs text-slate-400">{area.correct} of {area.attempted} correct · {area.performanceIndicators.length} PI{area.performanceIndicators.length === 1 ? "" : "s"}</p>
                              </div>
                              <span className={`rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${area.accuracy < 60 ? "border-amber-400/35 bg-amber-500/10 text-amber-200" : "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"}`}>{area.accuracy}%</span>
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div className={`h-full rounded-full transition-[width] duration-300 ${area.accuracy < 60 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${area.accuracy}%` }} />
                            </div>
                          </summary>
                          <div className="mt-4 border-t border-white/10 pt-3">
                            <p className="data-label">Performance Indicators</p>
                            <div className="mt-2 space-y-2">
                              {area.performanceIndicators.map((pi) => (
                                <div key={pi.performanceIndicator} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white/[0.025] px-3 py-2.5">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-100">{pi.performanceIndicator}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">{pi.correct} of {pi.attempted} correct</p>
                                  </div>
                                  <span className={`font-mono text-sm font-semibold ${pi.accuracy < 60 ? "text-amber-200" : "text-emerald-200"}`}>{pi.accuracy}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>

                  <section className="editorial-panel border-amber-500/25 bg-amber-500/[0.035] p-5 sm:p-6" aria-labelledby="study-guide-heading">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="page-eyebrow text-amber-300">Targeted study guide</p>
                        <h2 id="study-guide-heading" className="mt-2 text-xl font-semibold text-white">Practice your priority PIs</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">PIs below 60% accuracy are prioritized here. Each section compiles fresh, cluster-matched questions from the question bank that were not part of this mock exam.</p>
                      </div>
                      <p className="rounded-md border border-amber-400/25 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-100">{results.data.studyGuide.length} PI{results.data.studyGuide.length === 1 ? "" : "s"} ready to review</p>
                    </div>
                    {results.data.studyGuide.length ? (
                      <div className="mt-5 space-y-5">
                        {results.data.studyGuide.map((section) => (
                          <article key={section.performanceIndicator} className="rounded-md border border-white/10 bg-slate-950/30 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="data-label">{section.instructionalArea}</p>
                                <h3 className="mt-1 font-semibold text-white">{section.performanceIndicator}</h3>
                              </div>
                              <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-amber-100">{section.accuracy}% · {section.correct}/{section.attempted}</span>
                            </div>
                            <div className="mt-4 grid gap-3">
                              {section.questions.map((studyQuestion, questionIndex) => (
                                <details key={studyQuestion.id} className="rounded-md border border-white/10 bg-white/[0.02] p-3">
                                  <summary className="cursor-pointer list-none text-sm font-medium text-slate-100">
                                    <span className="mr-2 font-mono text-xs text-blue-200">REVIEW {questionIndex + 1}</span>{studyQuestion.stem}
                                  </summary>
                                  <ol className="mt-3 grid gap-2 border-t border-white/10 pt-3 text-sm text-slate-300">
                                    {ANSWER_CHOICES.map((choice) => <li key={choice} className="rounded border border-white/5 bg-slate-950/30 px-3 py-2"><span className="mr-2 font-semibold text-blue-300">{choice}.</span>{studyQuestion[`option${choice}`]}</li>)}
                                  </ol>
                                  <p className="mt-3 text-xs text-slate-500">Use this question to rehearse the PI before returning to the question bank for more practice.</p>
                                </details>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-md border border-emerald-400/20 bg-emerald-500/[0.045] p-4 text-sm leading-relaxed text-emerald-100">No Performance Indicator fell below the 60% priority threshold, or no additional cluster-matched questions are currently available for the PIs measured in this exam.</div>
                    )}
                  </section>
                </>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
              <div className="editorial-panel order-2 border-emerald-500/25 bg-emerald-500/[0.035] p-5 lg:order-1 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-semibold text-emerald-200">{exam.cluster} · Question {currentIndex + 1} of {exam.totalQuestions}</p>
                    <p className="mt-1 text-xs text-slate-400">Saved session #{exam.sessionId} · {answeredQuestionIds.size} answered</p>
                  </div>
                  <div className="rounded-md border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 font-mono text-xs text-blue-200">{Math.round((answeredQuestionIds.size / exam.totalQuestions) * 100)}% complete</div>
                </div>

                <p className="mt-6 text-lg font-medium leading-relaxed text-white">{question?.stem}</p>
                <div className="mt-5 grid gap-3">
                  {ANSWER_CHOICES.map((choice) => (
                    <button key={choice} type="button" onClick={() => setSelectedAnswer(choice)} disabled={submitAnswer.isPending} className={`editorial-panel-interactive rounded-md border p-3 text-left text-sm disabled:cursor-wait ${selectedAnswer === choice ? "border-blue-400 bg-blue-500/15 text-white" : "border-white/10 bg-white/[0.025] text-slate-300"}`}>
                      <span className="mr-3 font-semibold text-blue-300">{choice}.</span>{question?.[`option${choice}`]}</button>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                  <button type="button" onClick={() => selectQuestion(currentIndex - 1)} disabled={currentIndex === 0 || submitAnswer.isPending} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-400/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"><ArrowLeft className="h-4 w-4" />Previous</button>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => selectQuestion(currentIndex + 1)} disabled={currentIndex + 1 >= exam.questions.length || submitAnswer.isPending} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-400/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-45">Next<ArrowRight className="h-4 w-4" /></button>
                    <button onClick={() => selectedAnswer && question && submitAnswer.mutate({ sessionId: exam.sessionId, questionId: question.id, selectedAnswer })} disabled={!selectedAnswer || submitAnswer.isPending} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.97] disabled:opacity-60">
                      {submitAnswer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Save answer</button>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <QuestionNavigator questions={exam.questions} currentIndex={currentIndex} answeredQuestionIds={answeredQuestionIds} onSelect={selectQuestion} disabled={submitAnswer.isPending} />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
