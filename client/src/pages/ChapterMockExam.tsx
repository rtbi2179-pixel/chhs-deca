import { useState } from "react";
import { ClipboardCheck, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ChapterMockExam() {
  const [exam, setExam] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const createMock = trpc.mockExams.createChapterMock.useMutation({
    onSuccess: (result) => {
      setExam(result);
      toast.success("Your Chapter Mock Exam is ready.");
    },
    onError: (error) => toast.error(error.message),
  });
  const submitAnswer = trpc.mockExams.submitAnswer.useMutation({
    onSuccess: () => {
      setSelectedAnswer(null);
      if (exam && currentIndex + 1 === exam.questions.length) setFinished(true);
      else setCurrentIndex((index) => index + 1);
    },
    onError: (error) => toast.error(error.message),
  });
  const results = trpc.mockExams.getResults.useQuery(
    { sessionId: exam?.sessionId ?? 0 },
    { enabled: !!exam?.sessionId && finished }
  );
  const question = exam?.questions[currentIndex];

  return (
    <main className="page-shell">
      <section className="page-content max-w-3xl">
      <div className="editorial-panel p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3"><ClipboardCheck className="h-6 w-6 text-blue-300" /></div>
          <div>
            <p className="page-eyebrow">Chapter preparation</p>
            <h1 className="page-title mt-2">Chapter Mock Exam</h1>
            <p className="page-intro mt-3">A fresh 100-question practice exam built from questions you have not answered. The exam targets 25 easy, 50 medium, and 25 hard questions to reflect a balanced DECA-style challenge.</p>
          </div>
        </div>
        {!exam ? (
          <button onClick={() => createMock.mutate()} disabled={createMock.isPending} className="mt-8 inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
            {createMock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            Build My Mock Exam
          </button>
        ) : finished ? (
          <div className="mt-8 space-y-5">
            <div className="editorial-panel border-emerald-500/25 bg-emerald-500/[0.045] p-5">
              <p className="font-semibold text-emerald-200">Mock exam complete</p>
              <p className="mt-1 text-sm text-slate-300">{results.data?.score ?? 0} / {results.data?.total ?? exam.totalQuestions} correct · {results.data?.accuracy ?? 0}% accuracy</p>
            </div>
            {results.data?.recommendation && (
              <div className="editorial-panel border-amber-500/25 bg-amber-500/[0.045] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Recommended study guide</p>
                <p className="mt-2 font-semibold text-white">{results.data.recommendation.instructionalArea}</p>
                <p className="mt-1 text-sm text-slate-300">Review: {results.data.recommendation.recommendedPI ?? "the lowest-performing indicators in this area"}.</p>
                <a href="/study-guide" className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Open Study Guide</a>
              </div>
            )}
          </div>
        ) : (
          <div className="editorial-panel mt-8 border-emerald-500/25 bg-emerald-500/[0.035] p-5">
            <div className="flex items-center justify-between gap-4"><p className="font-semibold text-emerald-200">Question {currentIndex + 1} of {exam.totalQuestions}</p><p className="text-xs text-slate-400">Saved session #{exam.sessionId}</p></div>
            <p className="mt-5 text-lg font-medium leading-relaxed text-white">{question?.stem}</p>
            <div className="mt-5 grid gap-3">
              {(["A", "B", "C", "D"] as const).map((choice) => (
                <button key={choice} onClick={() => setSelectedAnswer(choice)} className={`editorial-panel-interactive rounded-md border p-3 text-left text-sm ${selectedAnswer === choice ? "border-blue-400 bg-blue-500/15 text-white" : "border-white/10 bg-white/[0.025] text-slate-300"}`}>
                  <span className="mr-3 font-semibold text-blue-300">{choice}.</span>{question?.[`option${choice}`]}
                </button>
              ))}
            </div>
            <button onClick={() => selectedAnswer && submitAnswer.mutate({ sessionId: exam.sessionId, questionId: question.id, selectedAnswer })} disabled={!selectedAnswer || submitAnswer.isPending} className="mt-5 inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
              {submitAnswer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{currentIndex + 1 === exam.totalQuestions ? "Finish Exam" : "Save & Next"}
            </button>
          </div>
        )}
      </div>
      </section>
    </main>
  );
}
