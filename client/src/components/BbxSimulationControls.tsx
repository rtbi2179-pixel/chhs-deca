import { useState } from "react";
import { Landmark, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export function BbxSimulationControls() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const canAdmin = user?.role === "super_admin";
  const overview = trpc.bbx.getOverview.useQuery(undefined, { enabled: canAdmin });
  const adminOptions = trpc.bbx.getAdminOptions.useQuery(undefined, { enabled: canAdmin });
  const advance = trpc.bbx.advanceNow.useMutation({ onSuccess: () => void utils.bbx.getOverview.invalidate() });
  const setRegime = trpc.bbx.setRegime.useMutation({ onSuccess: () => void utils.bbx.getOverview.invalidate() });
  const setMarketOpen = trpc.bbx.setMarketOpen.useMutation({ onSuccess: () => void utils.bbx.getOverview.invalidate() });
  const injectEvent = trpc.bbx.injectEvent.useMutation({
    onSuccess: () => {
      void utils.bbx.getOverview.invalidate();
      void utils.bbx.getNews.invalidate();
    },
  });
  const [eventTemplate, setEventTemplate] = useState("");
  const [eventTicker, setEventTicker] = useState("");

  if (!canAdmin) return null;
  if (overview.isLoading || !overview.data) {
    return <Card className="editorial-panel mt-8 flex items-center gap-3 p-6 text-sm text-foreground/65"><Loader2 className="h-5 w-5 animate-spin text-blue-300" />Loading BBX simulation controls…</Card>;
  }

  const { state } = overview.data;
  return (
    <Card className="editorial-panel mt-8 p-6" aria-label="BBX simulation controls">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow">Chapter Management · super-admin only</p>
          <h2 className="section-heading mt-2 flex items-center gap-2"><Landmark className="h-5 w-5 text-blue-300" />BBX simulation controls</h2>
          <p className="mt-1 text-sm text-foreground/60">Controls operate only on fictional BBX data. Event magnitudes remain server-defined by reviewed templates.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void advance.mutateAsync()} disabled={advance.isPending}>{advance.isPending ? "Advancing…" : "Advance BBX"}</Button>
          <Button variant="outline" onClick={() => void setMarketOpen.mutateAsync({ open: !state.marketOpen })} disabled={setMarketOpen.isPending}>{state.marketOpen ? "Pause exchange" : "Resume exchange"}</Button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <label className="text-sm text-foreground/70">Market regime<select className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground" value={state.marketRegime} onChange={(event) => void setRegime.mutateAsync({ regime: event.target.value as "bull" | "neutral" | "bear" | "high_volatility" })} disabled={setRegime.isPending}><option value="bull">Bull</option><option value="neutral">Neutral</option><option value="bear">Bear</option><option value="high_volatility">High volatility</option></select></label>
        <label className="text-sm text-foreground/70">Event template<select className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground" value={eventTemplate} onChange={(event) => setEventTemplate(event.target.value)}><option value="">Choose reviewed event</option>{adminOptions.data?.templates.map((template) => <option key={template.id} value={template.id}>{template.id} · {template.severity} · {template.headline}</option>)}</select></label>
        <label className="text-sm text-foreground/70">Company target (optional)<select className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground" value={eventTicker} onChange={(event) => setEventTicker(event.target.value)}><option value="">Use event scope</option>{adminOptions.data?.companies.map((company) => <option key={company.ticker} value={company.ticker}>{company.ticker} · {company.companyName}</option>)}</select></label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button disabled={!eventTemplate || injectEvent.isPending} onClick={() => void injectEvent.mutateAsync({ templateId: eventTemplate, ticker: eventTicker || undefined }).then((result) => { toast.success(`Queued ${result.templateId} for the next BBX tick.`); setEventTemplate(""); })}>{injectEvent.isPending ? "Queueing…" : "Inject fictional event"}</Button>
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground/50"><ShieldAlert className="h-3.5 w-3.5" />Server role checks remain enforced.</span>
      </div>
    </Card>
  );
}
