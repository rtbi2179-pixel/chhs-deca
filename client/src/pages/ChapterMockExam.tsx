import { useState } from "react";
import { ClipboardCheck, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ChapterMockExam() {
  const [exam, setExam] = useState<{ sessionId: number; totalQuestions: number; difficultyPlan: { easy: number; medium: number; hard: number } } | null>(null);
  const createMock = trpc.mockExams.createChapterMock.useMutation({
    onSuccess: (result) => {
      setExam(result);
      toast.success("Your Chapter Mock Exam is ready.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3"><ClipboardCheck className="h-6 w-6 text-blue-300" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Chapter preparation</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Chapter Mock Exam</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-400">A fresh 100-question practice exam built from questions you have not answered. The exam targets 25 easy, 50 medium, and 25 hard questions to reflect a balanced DECA-style challenge.</p>
          </div>
        </div>
        {!exam ? (
          <button onClick={() => createMock.mutate()} disabled={createMock.isPending} className="mt-8 inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
            {createMock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            Build My Mock Exam
          </button>
        ) : (
          <div className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
            <p className="font-semibold text-emerald-200">Your exam is ready.</p>
            <p className="mt-1 text-sm text-slate-300">{exam.totalQuestions} unused questions: {exam.difficultyPlan.easy} easy, {exam.difficultyPlan.medium} medium, and {exam.difficultyPlan.hard} hard.</p>
            <p className="mt-3 text-xs text-slate-400">Session #{exam.sessionId} is saved. Submit answers through the practice flow to record performance and unlock weak-area recommendations.</p>
          </div>
        )}
      </section>
    </main>
  );
}
