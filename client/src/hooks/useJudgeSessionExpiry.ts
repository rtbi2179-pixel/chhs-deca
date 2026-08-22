import { useEffect, useRef } from "react";

export const JUDGE_SESSION_IDLE_LIMIT_MS = 60 * 60 * 1_000;

export function isJudgeSessionExpired(lastActivity: number, now = Date.now()) {
  return !lastActivity || now - lastActivity > JUDGE_SESSION_IDLE_LIMIT_MS;
}

type JudgeSessionExpiryOptions = {
  enabled: boolean;
  storageKey: string;
  onExpire: () => void;
};

export function useJudgeSessionExpiry({ enabled, storageKey, onExpire }: JudgeSessionExpiryOptions) {
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const expire = () => {
      if (expiredRef.current) return;
      expiredRef.current = true;
      window.sessionStorage.removeItem(storageKey);
      onExpireRef.current();
    };
    const touch = () => {
      expiredRef.current = false;
      window.sessionStorage.setItem(storageKey, String(Date.now()));
    };
    const lastActivity = Number(window.sessionStorage.getItem(storageKey) ?? 0);
    if (lastActivity && isJudgeSessionExpired(lastActivity)) {
      expire();
      return;
    }
    touch();
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "focus"];
    events.forEach((eventName) => window.addEventListener(eventName, touch));
    const timer = window.setInterval(() => {
      const last = Number(window.sessionStorage.getItem(storageKey) ?? 0);
      if (!last || isJudgeSessionExpired(last)) expire();
    }, 30_000);
    return () => {
      window.clearInterval(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, touch));
    };
  }, [enabled, storageKey]);
}
