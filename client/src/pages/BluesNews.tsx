import { Link } from "wouter";
import { Check, CheckCheck, Loader2, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { hideBbxMagnitude } from "@/lib/bbxNewsCopy";

const severityClass: Record<string, string> = {
  low: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  high: "border-orange-400/30 bg-orange-400/10 text-orange-100",
  severe: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

function formatPublishedAt(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function BluesNews() {
  const utils = trpc.useUtils();
  const news = trpc.bbx.getBluesNews.useQuery({ limit: 25 });
  const markRead = trpc.bbx.markNewsRead.useMutation({
    onSuccess: async (result) => {
      await Promise.all([utils.bbx.getBluesNews.invalidate(), utils.bbx.getUnreadNewsCount.invalidate()]);
      if (result.rewarded > 0) toast.success(`+${result.rewarded} BBX BlueBucks for reading Blue’s News.`);
    },
    onError: (error) => toast.error(error.message || "Unable to update the article read state."),
  });

  const markAll = async () => {
    try {
      const result = await markRead.mutateAsync({ markAll: true });
      if (result.rewarded === 0) toast.success("All Blue’s News articles are marked as read.");
    } catch {
      // The mutation's configured error handler provides the user-facing message.
    }
  };

  if (news.isLoading) {
    return <main className="page-shell"><div className="page-content"><div className="loading-state min-h-[55vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div></div></main>;
  }

  const articles = news.data ?? [];
  const unreadCount = articles.filter((article) => !article.isRead).length;

  return (
    <main className="page-shell">
      <div className="page-content max-w-4xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="page-eyebrow">BBX fictional reporting</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="page-title">Blue’s News</h1>
              {unreadCount > 0 && <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold text-blue-100">{unreadCount} unread</span>}
            </div>
            <p className="page-intro mt-3 max-w-2xl">Scheduled fictional BBX developments and the learning context behind their simulated market impact.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={markRead.isPending || unreadCount === 0} onClick={() => void markAll()}><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button>
            <Link href="/market/news"><Button variant="outline">Full BBX feed</Button></Link>
          </div>
        </header>

        <section className="mt-8 space-y-4" aria-label="Blue’s News articles">
          {articles.length ? articles.map((article) => (
            <article key={article.id} className={`editorial-panel relative p-6 transition-colors ${article.isRead ? "opacity-80" : "border-blue-400/30 bg-blue-500/[0.045]"}`}>
              {!article.isRead && <span aria-label="Unread article" className="absolute left-0 top-7 h-10 w-1 rounded-r bg-blue-400" />}
              <div className="flex items-start gap-4">
                <div className="mt-0.5 rounded-lg border border-blue-400/20 bg-blue-400/10 p-2 text-blue-200"><Newspaper className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${severityClass[article.severity] ?? severityClass.low}`}>{article.severity}</span>
                    <span className="text-xs text-foreground/50">{article.scopeLabel} · {formatPublishedAt(article.publishedAt)}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-foreground">{hideBbxMagnitude(article.headline)}</h2>
                  <p className="mt-3 whitespace-pre-line leading-7 text-foreground/70">{hideBbxMagnitude(article.body)}</p>
                  <div className="mt-4 border-l-2 border-blue-400/50 pl-4 text-sm leading-6 text-blue-100"><strong>Why it matters:</strong> {hideBbxMagnitude(article.whyItMatters)}</div>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                    <span className="text-xs text-foreground/50">{article.isRead ? "Read" : "New BBX event"}</span>
                    {!article.isRead && <button className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-200 transition-colors hover:text-white disabled:opacity-50" disabled={markRead.isPending} onClick={() => void markRead.mutateAsync({ newsId: article.id })}><Check className="h-3.5 w-3.5" />Mark read</button>}
                  </div>
                </div>
              </div>
            </article>
          )) : (
            <div className="empty-state px-6 py-12"><Newspaper className="mx-auto h-7 w-7 text-blue-300" /><p className="mt-3 text-sm">The next scheduled fictional BBX event will publish a Blue’s News article here.</p></div>
          )}
        </section>
      </div>
    </main>
  );
}
