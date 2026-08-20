import { ArrowRight, BookOpenCheck, Loader2, ShieldCheck, Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

const platformHighlights = [
  { icon: BookOpenCheck, label: "PI study paths", detail: "Structured practice for every performance indicator." },
  { icon: Target, label: "Competitive prep", detail: "Focused question banks and balanced mock exams." },
  { icon: Trophy, label: "Chapter momentum", detail: "One connected space for progress and competition readiness." },
];

export function SignedOutWelcome({ isChecking = false, isAuthenticated = false, onContinue }: { isChecking?: boolean; isAuthenticated?: boolean; onContinue?: () => void }) {
  const [, setLocation] = useLocation();
  const handlePrimaryAction = () => {
    onContinue?.();
    if (!isAuthenticated) setLocation("/login");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[oklch(0.07_0.01_265)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,oklch(0.34_0.16_255/0.24),transparent_30%),radial-gradient(circle_at_83%_84%,oklch(0.22_0.1_245/0.2),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(oklch(0.72_0.1_250/0.12)_1px,transparent_1px),linear-gradient(90deg,oklch(0.72_0.1_250/0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(oklch(0.72_0.1_250/0.45)_1px,transparent_1px)] [background-size:90px_90px] [background-position:14px_20px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2.25rem] border border-blue-300/15 bg-slate-950/75 shadow-[0_32px_120px_oklch(0_0_0/0.5)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[360px] overflow-hidden border-b border-white/8 bg-[linear-gradient(145deg,oklch(0.17_0.075_252),oklch(0.075_0.022_260))] p-7 sm:p-11 lg:min-h-[660px] lg:border-b-0 lg:border-r">
            <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute inset-x-9 top-12 h-48 rounded-[1.65rem] border border-blue-300/10 bg-blue-400/[0.03]" />
            <div className="absolute inset-x-12 top-16 h-48 rounded-[1.65rem] border border-blue-300/16 bg-slate-950/20" />
            <div className="absolute inset-x-16 top-20 h-48 rounded-[1.65rem] border border-blue-300/25 bg-slate-950/45 shadow-[0_22px_55px_oklch(0.04_0.03_260/0.5)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="inline-flex items-center gap-3 self-start rounded-full border border-blue-300/15 bg-slate-950/40 px-3.5 py-2.5">
                <img src="/manus-storage/Untitleddesign_c1fb0d88.png" alt="Blue Blazer logo" className="h-8 w-8 object-contain" />
                <span className="font-display text-sm tracking-[0.18em] text-white">BLUE BLAZER</span>
                <span className="h-1 w-1 rounded-full bg-blue-300" />
                <span className="font-mono-data text-[9px] tracking-[0.15em] text-blue-200/65">ROAD TO ICDC</span>
              </div>

              <div className="relative mx-auto flex h-52 w-52 items-center justify-center overflow-hidden rounded-[2.4rem] border border-blue-300/30 bg-[linear-gradient(145deg,oklch(0.3_0.13_250/0.3),oklch(0.11_0.04_260/0.75))] shadow-[0_0_0_18px_oklch(0.55_0.17_250/0.05),0_0_95px_oklch(0.55_0.17_250/0.3)] sm:h-60 sm:w-60">
                <div className="absolute inset-3 rounded-[1.8rem] border border-white/10" />
                <img src="/manus-storage/Untitleddesign_c1fb0d88.png" alt="Blue Blazer logo" className="relative h-44 w-44 rounded-[1.45rem] object-contain sm:h-52 sm:w-52" />
              </div>

              <div className="relative mt-14 border-t border-white/10 pt-5"><p className="font-mono-data text-[10px] tracking-[0.22em] text-blue-200/65">CHAPTER COMPETITIVE PREPARATION</p><p className="mt-2 max-w-xs text-sm leading-6 text-white/60">A considered launchpad for steady practice, sharper feedback, and confident performance.</p></div>
            </div>
          </div>

          <div className="flex flex-col p-7 sm:p-11 lg:p-14">
            <div className="max-w-xl">
              <p className="page-eyebrow">Your chapter competitive hub</p>
              <h1 className="mt-5 font-display text-5xl leading-[0.86] tracking-tight text-white sm:text-7xl">WELCOME TO<br /><span className="text-blue-300">BLUE BLAZER</span></h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/65">A focused operating system for DECA students to build skill, monitor progress, and prepare for every round with confidence.</p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:mt-12 lg:grid-cols-1">
              {platformHighlights.map(({ icon: Icon, label, detail }, index) => <div key={label} className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition-colors hover:border-blue-300/25 hover:bg-blue-300/[0.04]"><div className="absolute inset-y-0 left-0 w-0.5 bg-blue-300/60" /><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-300/[0.06]"><Icon className="h-4 w-4 text-blue-200" /></span><div><p className="font-mono-data text-[9px] tracking-[0.17em] text-blue-200/50">0{index + 1}</p><p className="mt-1 text-sm font-semibold text-white">{label}</p><p className="mt-1 text-xs leading-5 text-white/55">{detail}</p></div></div></div>)}
            </div>

            <div className="mt-9 border-t border-white/10 pt-6 lg:mt-auto">
              {isChecking ? <div className="flex h-12 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-500/10 text-sm text-blue-100"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking secure access</div> : <>
                <motion.button type="button" onClick={handlePrimaryAction} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950">{isAuthenticated ? 'Enter Blue Blazer' : 'Sign in to Blue Blazer'} <ArrowRight className="h-4 w-4" /></motion.button>
                <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs leading-5 text-white/45"><ShieldCheck className="h-4 w-4 shrink-0 text-blue-300" />{isAuthenticated ? 'Your secure Blue Blazer workspace is ready.' : 'Blue Blazer is available through secure chapter access.'}</p>
              </>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
