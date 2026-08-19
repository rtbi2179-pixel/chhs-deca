import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, Bell, BookOpenCheck, Calendar, Check, ClipboardCheck, Coins, Compass, Flag, Home, Landmark, MessageSquare, MessageSquarePlus, Newspaper, PartyPopper, Sparkles, TrendingUp, Trophy, Users, X, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getOnboardingProgress, ONBOARDING_CELEBRATION_DURATION_MS, ONBOARDING_SKIP_FADE_DURATION_MS, ONBOARDING_TOUR_ACTIONS } from "@/lib/onboardingTour";
import { ONBOARDING_WALKTHROUGH_STEPS } from "@/lib/onboardingWalkthrough";

const TOUR_STEPS = ONBOARDING_WALKTHROUGH_STEPS;
const TOUR_PARTS = ["MAIN PRACTICE TOOLS", "CHAPTER TOOLS", "BLUE BUCKS"] as const;
const TOUR_PART_START_INDEX = Object.fromEntries(TOUR_PARTS.map((part) => [part, TOUR_STEPS.findIndex((step) => step.part === part)])) as Record<(typeof TOUR_PARTS)[number], number>;
const TOUR_STEP_ICONS = {
  home: Home,
  study: BookOpenCheck,
  practice: ClipboardCheck,
  readiness: BarChart3,
  leaderboard: BarChart3,
  ai: Zap,
  events: Trophy,
  calendar: Calendar,
  announcements: Bell,
  discussions: MessageSquare,
  volunteer: Users,
  feedback: MessageSquarePlus,
  blueBucks: Coins,
  banking: Landmark,
  news: Newspaper,
  market: TrendingUp,
} as const;

export function FirstSignInTour() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: onboarding, isLoading } = trpc.preferences.getOnboardingStatus.useQuery(undefined, { staleTime: Infinity, retry: false });
  const primaryEventQuery = trpc.preferences.getPrimaryEvent.useQuery(undefined, { staleTime: Infinity, retry: false });
  const completeOnboarding = trpc.preferences.completeOnboarding.useMutation();
  const [stepIndex, setStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [tourOpenVersion, setTourOpenVersion] = useState(0);
  const celebrationTimerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const step = TOUR_STEPS[stepIndex];
  const StepIcon = TOUR_STEP_ICONS[step.icon];
  const progress = getOnboardingProgress(stepIndex, TOUR_STEPS.length);
  const currentPartIndex = TOUR_PARTS.indexOf(step.part as (typeof TOUR_PARTS)[number]);

  useEffect(() => {
    if (!isLoading && onboarding?.shouldShow) setIsOpen(true);
  }, [isLoading, onboarding?.shouldShow]);

  useEffect(() => {
    const restartTour = () => {
      if (celebrationTimerRef.current !== null) window.clearTimeout(celebrationTimerRef.current);
      setStepIndex(0);
      setIsCelebrating(false);
      setIsSkipping(false);
      setTourOpenVersion((version) => version + 1);
      setIsOpen(true);
    };
    window.addEventListener("blueblazer:restart-tour", restartTour);
    return () => window.removeEventListener("blueblazer:restart-tour", restartTour);
  }, []);

  useEffect(() => {
    if (isOpen && !isCelebrating && !isSkipping) setLocation(step.path);
  }, [isOpen, isCelebrating, isSkipping, setLocation, step.path]);

  useEffect(() => () => {
    if (celebrationTimerRef.current !== null) window.clearTimeout(celebrationTimerRef.current);
  }, []);

  const finishTour = (destination?: string) => {
    completeOnboarding.mutate(undefined, {
      onSuccess: async () => {
        setIsOpen(false);
        await utils.preferences.getOnboardingStatus.invalidate();
        if (destination) setLocation(destination);
      },
      onError: () => {
        setIsCelebrating(false);
        setIsSkipping(false);
        setIsOpen(true);
      },
    });
  };

  const startCelebration = () => {
    if (isCelebrating || isSkipping || completeOnboarding.isPending) return;
    setIsCelebrating(true);
    celebrationTimerRef.current = window.setTimeout(
      () => finishTour(primaryEventQuery.data?.primaryEventCode ? "/pi-quizlet" : "/event-match?onboarding=1"),
      reduceMotion ? 220 : ONBOARDING_CELEBRATION_DURATION_MS,
    );
  };

  const startSkipExit = () => {
    if (isCelebrating || isSkipping || completeOnboarding.isPending) return;
    if (reduceMotion) {
      finishTour();
      return;
    }
    setIsSkipping(true);
  };

  const jumpToPart = (part: (typeof TOUR_PARTS)[number]) => {
    const destinationIndex = TOUR_PART_START_INDEX[part];
    if (destinationIndex >= 0 && !isCelebrating && !isSkipping) setStepIndex(destinationIndex);
  };

  const handleOpenChange = (open: boolean) => {
    if (isCelebrating || isSkipping) return;
    if (!open && isOpen && !completeOnboarding.isPending) startSkipExit();
    else setIsOpen(open);
  };

  if (isLoading || (!onboarding?.shouldShow && !isOpen)) return null;

  const isFinalStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <Dialog modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent allowBackgroundInteraction showCloseButton={false} className="fixed bottom-4 right-4 left-auto top-auto z-[80] max-h-[calc(100vh-2rem)] w-[min(31rem,calc(100vw-2rem))] translate-x-0 translate-y-0 overflow-y-auto border-blue-300/25 bg-slate-950 p-0 text-white shadow-[0_30px_120px_oklch(0_0_0/0.58)] sm:max-w-none" onInteractOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => { event.preventDefault(); startSkipExit(); }}>
        <AnimatePresence initial={false} onExitComplete={() => { if (isSkipping) finishTour(); }}>
          {!isSkipping && <motion.div key={`onboarding-tour-${tourOpenVersion}`} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.985 }} animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.28, ease: "easeOut" }} className="relative">
          <div className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(155deg,oklch(0.18_0.085_253),oklch(0.07_0.02_265))] p-5">
            <div className="absolute -left-16 top-28 h-52 w-52 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute inset-5 rounded-[1.5rem] border border-blue-300/15 bg-blue-300/[0.025]" />
            <div className="absolute inset-x-8 top-16 h-32 rounded-[1.35rem] border border-blue-300/15 bg-slate-950/25" />
            <div className="relative flex min-h-[118px] flex-col justify-between">
              <div className="flex items-center justify-between"><span className="font-mono-data text-[10px] tracking-[0.19em] text-blue-100/70">BLUE BLAZER START</span><span className="rounded-full border border-blue-300/15 bg-slate-950/30 px-2 py-1 font-mono-data text-[9px] tracking-[0.12em] text-blue-200/65">PART {currentPartIndex + 1} / {TOUR_PARTS.length}</span><button type="button" aria-label={ONBOARDING_TOUR_ACTIONS.skipLabel} onClick={startSkipExit} disabled={completeOnboarding.isPending || isCelebrating || isSkipping} className="text-white/45 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-30"><X className="h-4 w-4" /></button></div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-300/30 bg-[linear-gradient(145deg,oklch(0.32_0.13_252/0.28),oklch(0.1_0.035_263/0.75))] text-blue-100 shadow-[0_0_0_12px_oklch(0.55_0.16_250/0.05),0_0_48px_oklch(0.55_0.16_250/0.25)]"><StepIcon className="h-7 w-7" /></div>
              <nav aria-label="Tour categories" className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-slate-950/35 p-1.5">
                {TOUR_PARTS.map((part, index) => {
                  const isActivePart = part === step.part;
                  const shortLabel = part === "MAIN PRACTICE TOOLS" ? "PRACTICE" : part === "CHAPTER TOOLS" ? "CHAPTER" : "BLUE BUCKS";
                  return <button key={part} type="button" aria-current={isActivePart ? "step" : undefined} onClick={() => jumpToPart(part)} disabled={isCelebrating || isSkipping} className={`min-w-0 rounded-lg px-2 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-40 ${isActivePart ? "bg-blue-400/20 text-blue-100 shadow-[inset_0_0_0_1px_oklch(0.68_0.15_245/0.32)]" : "text-white/45 hover:bg-white/[0.06] hover:text-white/75"}`}><span className="block font-mono-data text-[8px] tracking-[0.12em]">PART {index + 1}</span><span className="mt-0.5 block truncate text-[10px] font-semibold">{shortLabel}</span></button>;
                })}
              </nav>
              <div><div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-blue-100/70"><span>TOUR PROGRESS</span><span>{progress.percentage}%</span></div><div role="progressbar" aria-label="Onboarding tour progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage} className="h-2.5 overflow-hidden rounded-full border border-white/5 bg-slate-950/55"><div className="h-full origin-left rounded-full bg-[linear-gradient(90deg,oklch(0.66_0.16_250),oklch(0.84_0.1_230))] transition-transform duration-200 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${progress.scale})` }} /></div><div className="mt-3 flex gap-2">{TOUR_STEPS.map((item, index) => <span key={item.title} className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${index === stepIndex ? "w-9 bg-blue-200" : index < stepIndex ? "w-4 bg-blue-300/50" : "w-4 bg-white/15"}`} />)}</div></div>
            </div>
          </div>

          <div className="flex flex-col p-5">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300/80"><Compass className="h-3.5 w-3.5" />{step.eyebrow}</div><span className="font-mono-data text-[9px] tracking-[0.16em] text-white/35">YOUR FIRST MOVE · {step.part}</span></div>
            <DialogTitle className="mt-4 max-w-md font-display text-3xl leading-[0.9] tracking-tight text-white">{step.title}</DialogTitle>
            <DialogDescription className="mt-3 max-w-md text-sm leading-6 text-white/65">{step.body}</DialogDescription>
            <div className="mt-4 flex w-fit items-center gap-3 rounded-xl border border-blue-300/15 bg-blue-300/[0.055] px-3.5 py-2.5"><span className="font-mono-data text-[9px] tracking-[0.13em] text-blue-200/55">CURRENT TOOL</span><span className="h-3 w-px bg-blue-300/25" /><span className="text-xs font-semibold text-blue-100">{step.tabLabel}</span></div>
            <div className="mt-3 inline-flex w-fit items-center gap-2 text-xs leading-5 text-white/55"><Flag className="h-3.5 w-3.5 shrink-0 text-blue-300" />{step.action}</div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="mb-4 flex items-center justify-between text-xs text-white/45"><span>Part {currentPartIndex + 1} of {TOUR_PARTS.length} · Step {progress.currentStep} of {progress.totalSteps}</span><Button type="button" variant="outline" size="sm" onClick={startSkipExit} disabled={completeOnboarding.isPending || isCelebrating || isSkipping} className="h-8 border-white/15 bg-white/[0.03] px-3 text-xs text-white/80 hover:bg-white/[0.08] hover:text-white disabled:opacity-30">{ONBOARDING_TOUR_ACTIONS.skipLabel}</Button></div>
              <Button type="button" onClick={() => isFinalStep ? startCelebration() : setStepIndex((current) => current + 1)} disabled={completeOnboarding.isPending || isCelebrating || isSkipping} className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]">{isFinalStep ? <><Check className="mr-2 h-4 w-4" />Start my study plan</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </div>
          </div>

          <AnimatePresence>
            {isCelebrating && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-slate-950/95 px-8 text-center">
              {!reduceMotion && [
                { x: -150, y: -120, delay: 0 }, { x: 150, y: -105, delay: 0.04 }, { x: -120, y: 120, delay: 0.08 }, { x: 120, y: 130, delay: 0.12 }, { x: -20, y: -160, delay: 0.16 }, { x: 25, y: 155, delay: 0.2 },
              ].map((particle, index) => <motion.span key={index} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.7], x: particle.x, y: particle.y, rotate: index % 2 ? 120 : -120 }} transition={{ duration: 0.7, delay: particle.delay, ease: "easeOut" }} className="absolute h-2.5 w-2.5 rounded-sm bg-blue-300" />)}
              <motion.div initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }} animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.24, ease: "easeOut" }} className="flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-300/30 bg-blue-300/10 text-blue-200 shadow-[0_0_60px_oklch(0.6_0.16_250/0.28)]"><PartyPopper className="h-9 w-9" /></motion.div>
              <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: reduceMotion ? 0 : 0.1, ease: "easeOut" }} className="mt-6 font-display text-4xl text-white sm:text-5xl">YOU&apos;RE READY</motion.h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/65"><Sparkles className="mr-1 inline h-4 w-4 text-blue-300" />Opening your study plan.</p>
            </motion.div>}
          </AnimatePresence>
          </motion.div>}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
