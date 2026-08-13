import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquarePlus, ShieldCheck } from "lucide-react";

const categories = ["bug", "feature", "content", "other"] as const;
const reviewStatuses = ["new", "reviewing", "resolved", "dismissed"] as const;

export default function Feedback() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [category, setCategory] = useState<(typeof categories)[number]>("feature");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const mineQuery = trpc.feedback.listMine.useQuery(undefined, { enabled: !!user });
  const schoolQuery = trpc.feedback.listForSchool.useQuery(undefined, { enabled: !!user && isAdmin });
  const submit = trpc.feedback.submit.useMutation({
    onSuccess: async () => {
      setSubject("");
      setMessage("");
      setNotice("Thank you. Your feedback has been sent to the chapter team.");
      await utils.feedback.listMine.invalidate();
      await utils.feedback.listForSchool.invalidate();
    },
    onError: (error) => setNotice(error.message),
  });
  const review = trpc.feedback.review.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.feedback.listMine.invalidate(), utils.feedback.listForSchool.invalidate()]);
    },
  });

  if (!user) {
    return <div className="min-h-screen bg-background pt-28 text-center text-foreground">Sign in to submit feedback.</div>;
  }

  return (
    <main className="min-h-screen bg-background pt-28 pb-16">
      <div className="container max-w-5xl space-y-8">
        <header>
          <div className="flex items-center gap-3 mb-2"><MessageSquarePlus className="w-8 h-8 text-blue-500" /><h1 className="text-3xl font-bold text-foreground">Feedback Center</h1></div>
          <p className="text-foreground/70">Report a problem, suggest an improvement, or share feedback with your chapter team.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Send feedback</CardTitle><CardDescription>Be specific so the team can review it effectively.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm font-medium text-foreground">Category
                <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-foreground">
                  {categories.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-foreground">Subject
                <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} placeholder="Briefly describe your feedback" className="mt-1 w-full rounded-md border border-border bg-background p-2 text-foreground" />
              </label>
              <label className="block text-sm font-medium text-foreground">Details
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} rows={6} placeholder="Include the page or feature involved, what happened, and what you expected." className="mt-1 w-full resize-y rounded-md border border-border bg-background p-2 text-foreground" />
              </label>
              {notice && <p className="text-sm text-foreground/70">{notice}</p>}
              <Button className="w-full" disabled={subject.trim().length < 3 || message.trim().length < 10 || submit.isPending} onClick={() => submit.mutate({ category, subject, message })}>
                {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit feedback
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Your feedback</CardTitle><CardDescription>Responses from your chapter team appear here.</CardDescription></CardHeader>
            <CardContent className="space-y-3 max-h-[560px] overflow-y-auto">
              {mineQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : mineQuery.data?.length ? mineQuery.data.map((entry) => (
                <article key={entry.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex justify-between gap-3"><strong className="text-foreground">{entry.subject}</strong><span className="text-xs uppercase text-blue-400">{entry.status}</span></div>
                  <p className="text-sm text-foreground/70">{entry.message}</p>
                  {entry.adminResponse && <p className="rounded bg-blue-500/10 p-2 text-sm text-foreground"><span className="font-medium">Chapter response:</span> {entry.adminResponse}</p>}
                </article>
              )) : <p className="text-sm text-foreground/60">You have not submitted feedback yet.</p>}
            </CardContent>
          </Card>
        </div>

        {isAdmin && <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500" />Chapter feedback queue</CardTitle><CardDescription>Review feedback submitted by members of this chapter.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {schoolQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : schoolQuery.data?.length ? schoolQuery.data.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-3"><div><strong className="text-foreground">{entry.subject}</strong><p className="text-xs text-foreground/60">{entry.category} · {new Date(entry.createdAt).toLocaleString()}</p></div><span className="text-xs uppercase text-blue-400">{entry.status}</span></div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{entry.message}</p>
                <div className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
                  <select defaultValue={entry.status} onChange={(event) => review.mutate({ feedbackId: entry.id, status: event.target.value as typeof reviewStatuses[number], adminResponse: responses[entry.id] || entry.adminResponse || undefined })} className="rounded-md border border-border bg-background p-2 text-sm text-foreground">
                    {reviewStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <input value={responses[entry.id] ?? entry.adminResponse ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [entry.id]: event.target.value }))} placeholder="Optional response for the member" className="rounded-md border border-border bg-background p-2 text-sm text-foreground" />
                  <Button variant="outline" disabled={review.isPending} onClick={() => review.mutate({ feedbackId: entry.id, status: entry.status, adminResponse: responses[entry.id] ?? entry.adminResponse ?? undefined })}>Save response</Button>
                </div>
              </article>
            )) : <p className="text-sm text-foreground/60">No feedback is waiting for review.</p>}
          </CardContent>
        </Card>}
      </div>
    </main>
  );
}
