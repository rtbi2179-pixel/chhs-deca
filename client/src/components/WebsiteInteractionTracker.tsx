import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

function interactionLabel(target: HTMLElement) {
  const labelled = target.closest<HTMLElement>("[aria-label], [data-diagnostics-label]");
  const raw = labelled?.dataset.diagnosticsLabel || labelled?.getAttribute("aria-label") || target.textContent || "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Captures authenticated route views and semantic control clicks without collecting member-entered content. */
export function WebsiteInteractionTracker() {
  const { user } = useAuth();
  const [location] = useLocation();
  const track = trpc.superAdminDiagnostics.trackInteraction.useMutation();
  const recentClicks = useRef(new Map<string, number>());

  useEffect(() => {
    if (!user) return;
    track.mutate({ eventType: "page_view", path: location });
  }, [location, user?.id]);

  useEffect(() => {
    if (!user) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("a, button, [role=button]") : null;
      if (!target || target.closest("[data-no-diagnostics]")) return;
      const label = interactionLabel(target);
      if (!label) return;
      const key = `${location}:${label}`;
      const now = Date.now();
      if ((recentClicks.current.get(key) ?? 0) + 2500 > now) return;
      recentClicks.current.set(key, now);
      track.mutate({ eventType: "control_click", path: location, label });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [location, user?.id]);

  return null;
}
