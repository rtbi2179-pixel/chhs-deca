import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, BarChart3, BookOpenCheck, Check, ClipboardCheck, Compass, Flag, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

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
  const step = TOUR_STEPS[stepIndex];
  const StepIcon = step.icon;

  useEffect(() => {
    if (!isLoading && onboarding?.shouldShow) setIsOpen(true);
  }, [isLoading, onboarding?.shouldShow]);

  const finishTour = (destination?: string) => {
    completeOnboarding.mutate(undefined, {
      onSuccess: async () => {
        setIsOpen(false);
        await utils.preferences.getOnboardingStatus.invalidate();
        if (destination) setLocation(destination);
      },
      onError: () => setIsOpen(true),
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isOpen && !completeOnboarding.isPending) finishTour();
    else setIsOpen(open);
  };

  if (isLoading || !onboarding?.shouldShow) return null;

  const isFinalStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="overflow-hidden border-blue-300/20 bg-slate-950 p-0 text-white sm:max-w-2xl" onEscapeKeyDown={(event) => { event.preventDefault(); finishTour(); }}>
        <div className="relative grid min-h-[430px] sm:grid-cols-[0.78fr_1.22fr]">
          <div className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(155deg,oklch(0.17_0.07_253),oklch(0.07_0.02_265))] p-6 sm:border-b-0 sm:border-r sm:p-8">
            <div className="absolute inset-5 rounded-2xl border border-blue-300/15 bg-blue-300/[0.025]" />
            <div className="absolute inset-x-8 top-16 h-28 rounded-2xl border border-blue-300/15 bg-slate-950/25" />
            <div className="relative flex h-full min-h-[140px] flex-col justify-between">
              <div className="flex items-center justify-between"><span className="font-mono-data text-[10px] tracking-[0.19em] text-blue-200/60">BLUE BLAZER START</span><button type="button" aria-label="Skip onboarding tour" onClick={() => finishTour()} disabled={completeOnboarding.isPending} className="text-white/45 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"><X className="h-4 w-4" /></button></div>
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-300/25 bg-blue-400/[0.09] text-blue-200 shadow-[0_0_40px_oklch(0.55_0.16_250/0.28)]"><StepIcon className="h-9 w-9" /></div>
              <div className="flex gap-2">{TOUR_STEPS.map((item, index) => <span key={item.title} className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${index === stepIndex ? "w-9 bg-blue-300" : index < stepIndex ? "w-4 bg-blue-300/50" : "w-4 bg-white/15"}`} />)}</div>
            </div>
          </div>

          <div className="flex flex-col p-6 sm:p-9">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300/75"><Compass className="h-3.5 w-3.5" />{step.eyebrow}</div>
            <DialogTitle className="mt-5 font-display text-4xl leading-[0.9] tracking-tight text-white sm:text-5xl">{step.title}</DialogTitle>
            <DialogDescription className="mt-5 max-w-md text-sm leading-6 text-white/65">{step.body}</DialogDescription>
            <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-300/15 bg-blue-300/[0.06] px-3 py-2 text-xs font-medium text-blue-100"><Flag className="h-3.5 w-3.5 text-blue-300" />{step.detail}</div>

            <div className="mt-auto border-t border-white/10 pt-6">
              <div className="mb-4 flex items-center justify-between text-xs text-white/45"><span>Step {stepIndex + 1} of {TOUR_STEPS.length}</span><button type="button" onClick={() => finishTour()} disabled={completeOnboarding.isPending} className="transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">Skip tour</button></div>
              <Button type="button" onClick={() => isFinalStep ? finishTour("/pi-quizlet") : setStepIndex((current) => current + 1)} disabled={completeOnboarding.isPending} className="h-11 w-full bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]">{isFinalStep ? <><Check className="mr-2 h-4 w-4" />Start my study plan</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
