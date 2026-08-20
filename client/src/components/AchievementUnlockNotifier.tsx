import { useEffect, useRef } from "react";
import { Medal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const TIER_STYLE = {
  bronze: "border-amber-500/35 bg-amber-500/12 text-amber-100",
  silver: "border-slate-200/30 bg-slate-200/12 text-slate-100",
  gold: "border-yellow-300/45 bg-yellow-300/15 text-yellow-50",
} as const;

export function AchievementUnlockNotifier() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const summary = trpc.achievements.getSummary.useQuery(undefined, { enabled: Boolean(user?.id), refetchInterval: 20_000 });
  const recordUnlocks = trpc.achievements.recordUnlocks.useMutation();
  const initialized = useRef(false);
  const queuedKeys = useRef(new Set<string>());

  useEffect(() => {
    const pending = summary.data?.pendingUnlocks.filter((unlock) => !queuedKeys.current.has(`${unlock.achievementId}:${unlock.tier}`)) ?? [];
    if (!summary.data || !pending.length || recordUnlocks.isPending) {
      if (summary.data && !initialized.current) initialized.current = true;
      return;
    }
    pending.forEach((unlock) => queuedKeys.current.add(`${unlock.achievementId}:${unlock.tier}`));
    const shouldCelebrate = initialized.current;
    recordUnlocks.mutate({ unlocks: pending.map((unlock) => ({ achievementId: unlock.achievementId, tier: unlock.tier })) }, {
      onSuccess: async ({ unlocked }) => {
        if (shouldCelebrate) {
          unlocked.filter((unlock): unlock is NonNullable<typeof unlock> => Boolean(unlock)).forEach((unlock) => toast.custom((toastId) => <div className={`animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border p-4 shadow-2xl ${TIER_STYLE[unlock.tier]}`}><span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/30 bg-black/10"><Medal className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[10px] font-mono uppercase tracking-[0.15em] opacity-75">{unlock.tierLabel} tier unlocked</p><p className="mt-1 font-semibold">{unlock.achievementTitle}</p><p className="mt-1 text-xs leading-5 opacity-80">{unlock.criteria}</p></div><Sparkles className="mt-1 h-4 w-4 shrink-0 animate-pulse" aria-hidden="true" /><button type="button" aria-label="Dismiss achievement notification" onClick={() => toast.dismiss(toastId)} className="sr-only">Dismiss</button></div>, { duration: 5_500 }));
        }
        initialized.current = true;
        await utils.achievements.getSummary.invalidate();
      },
      onError: () => pending.forEach((unlock) => queuedKeys.current.delete(`${unlock.achievementId}:${unlock.tier}`)),
    });
  }, [recordUnlocks, summary.data, utils.achievements.getSummary]);

  return null;
}
