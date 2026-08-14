import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, BookOpenCheck, Check, ClipboardCheck, Compass, Flag, PartyPopper, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getOnboardingProgress, ONBOARDING_CELEBRATION_DURATION_MS } from "@/lib/onboardingTour";

const TOUR_STEPS = [
  {
    eyebrow: "01 · Find your focus",
    title: "Build your study lane",
    body: "Start in the PI Study Library to turn performance indicators into practical lessons, review, and recall practice.",
    icon: BookOpenCheck,
    detail: "PI Study Library",
  },
  {
    eyebrow: "02 · Practice deliberately",
    title: "Strengthen one cluster at a time",
    body: "Use the question bank to focus on Marketing, Business, Finance, or Hospitality & Tourism and track your progress as you go.",
    icon: ClipboardCheck,
    detail: "Practice Question Bank",
  },
  {
    eyebrow: "03 · Check your readiness",
    title: "Turn practice into a plan",
    body: "Use Chapter Mock Exams and your progress views to see weak points, then return to the study tools that will move the needle.",
    icon: BarChart3,
    detail: "Mock Exams & Progress",
  },
] as const;

export function FirstSignInTour() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: onboarding, isLoading } = trpc.preferences.getOnboardingStatus.useQuery(undefined, { staleTime: Infinity, retry: false });
  const completeOnboarding = trpc.preferences.completeOnboarding.useMutation();
  const [stepIndex, setStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const celebrationTimerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const step = TOUR_STEPS[stepIndex];
  const StepIcon = step.icon;
  const progress = getOnboardingProgress(stepIndex, TOUR_STEPS.length);

  useEffect(() => {
    if (!isLoading && onboarding?.shouldShow) setIsOpen(true);
  }, [isLoading, onboarding?.shouldShow]);

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
        setIsOpen(true);
      },
    });
  };

  const startCelebration = () => {
    if (isCelebrating || completeOnboarding.isPending) return;
    setIsCelebrating(true);
    celebrationTimerRef.current = window.setTimeout(
      () => finishTour("/pi-quizlet"),
      reduceMotion ? 220 : ONBOARDING_CELEBRATION_DURATION_MS,
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (isCelebrating) return;
    if (!open && isOpen && !completeOnboarding.isPending) finishTour();
    else setIsOpen(open);
  };

  if (isLoading || !onboarding?.shouldShow) return null;

  const isFinalStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="overflow-hidden border-blue-300/20 bg-slate-950 p-0 text-white sm:max-w-2xl" onEscapeKeyDown={(event) => { event.preventDefault(); if (!isCelebrating) finishTour(); }}>
        <div className="relative grid min-h-[430px] sm:grid-cols-[0.78fr_1.22fr]">
          <div className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(155deg,oklch(0.17_0.07_253),oklch(0.07_0.02_265))] p-6 sm:border-b-0 sm:border-r sm:p-8">
            <div className="absolute inset-5 rounded-2xl border border-blue-300/15 bg-blue-300/[0.025]" />
            <div className="absolute inset-x-8 top-16 h-28 rounded-2xl border border-blue-300/15 bg-slate-950/25" />
            <div className="relative flex h-full min-h-[140px] flex-col justify-between">
              <div className="flex items-center justify-between"><span className="font-mono-data text-[10px] tracking-[0.19em] text-blue-200/60">BLUE BLAZER START</span><button type="button" aria-label="Skip onboarding tour" onClick={() => finishTour()} disabled={completeOnboarding.isPending || isCelebrating} className="text-white/45 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-30"><X className="h-4 w-4" /></button></div>
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-300/25 bg-blue-400/[0.09] text-blue-200 shadow-[0_0_40px_oklch(0.55_0.16_250/0.28)]"><StepIcon className="h-9 w-9" /></div>
              <div><div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-blue-100/65"><span>Tour progress</span><span>{progress.percentage}%</span></div><div role="progressbar" aria-label="Onboarding tour progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage} className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full origin-left rounded-full bg-blue-300 transition-transform duration-200 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${progress.scale})` }} /></div><div className="mt-3 flex gap-2">{TOUR_STEPS.map((item, index) => <span key={item.title} className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${index === stepIndex ? "w-9 bg-blue-300" : index < stepIndex ? "w-4 bg-blue-300/50" : "w-4 bg-white/15"}`} />)}</div></div>
            </div>
          </div>

          <div className="flex flex-col p-6 sm:p-9">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300/75"><Compass className="h-3.5 w-3.5" />{step.eyebrow}</div>
            <DialogTitle className="mt-5 font-display text-4xl leading-[0.9] tracking-tight text-white sm:text-5xl">{step.title}</DialogTitle>
            <DialogDescription className="mt-5 max-w-md text-sm leading-6 text-white/65">{step.body}</DialogDescription>
            <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-300/15 bg-blue-300/[0.06] px-3 py-2 text-xs font-medium text-blue-100"><Flag className="h-3.5 w-3.5 text-blue-300" />{step.detail}</div>

            <div className="mt-auto border-t border-white/10 pt-6">
              <div className="mb-4 flex items-center justify-between text-xs text-white/45"><span>Step {progress.currentStep} of {progress.totalSteps} · {progress.percentage}% complete</span><button type="button" onClick={() => finishTour()} disabled={completeOnboarding.isPending || isCelebrating} className="transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-30">Skip tour</button></div>
              <Button type="button" onClick={() => isFinalStep ? startCelebration() : setStepIndex((current) => current + 1)} disabled={completeOnboarding.isPending || isCelebrating} className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]">{isFinalStep ? <><Check className="mr-2 h-4 w-4" />Start my study plan</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
