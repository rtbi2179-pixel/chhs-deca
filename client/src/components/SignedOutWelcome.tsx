import { ArrowRight, BookOpenCheck, Loader2, ShieldCheck, Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

const platformHighlights = [
  { icon: BookOpenCheck, label: "PI study paths", detail: "Structured practice for every performance indicator." },
  { icon: Target, label: "Competitive prep", detail: "Focused question banks and balanced mock exams." },
  { icon: Trophy, label: "Chapter momentum", detail: "One connected space for progress and competition readiness." },
];

export function SignedOutWelcome({ isChecking = false }: { isChecking?: boolean }) {
  const [, setLocation] = useLocation();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[oklch(0.07_0.01_265)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,oklch(0.34_0.16_255/0.22),transparent_30%),radial-gradient(circle_at_83%_84%,oklch(0.22_0.1_245/0.19),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(oklch(0.72_0.1_250/0.12)_1px,transparent_1px),linear-gradient(90deg,oklch(0.72_0.1_250/0.12)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-blue-300/15 bg-slate-950/65 shadow-[0_28px_100px_oklch(0_0_0/0.42)] backdrop-blur-sm lg:grid-cols-[0.88fr_1.12fr]">
          <div className="relative min-h-[300px] overflow-hidden border-b border-white/8 bg-[linear-gradient(145deg,oklch(0.16_0.06_252),oklch(0.08_0.02_260))] p-7 sm:p-10 lg:min-h-[620px] lg:border-b-0 lg:border-r">
            <div className="absolute inset-x-8 top-12 h-40 rounded-[1.4rem] border border-blue-300/12 bg-blue-400/[0.035]" />
            <div className="absolute inset-x-10 top-16 h-40 rounded-[1.4rem] border border-blue-300/16 bg-slate-950/25" />
            <div className="absolute inset-x-12 top-20 h-40 rounded-[1.4rem] border border-blue-300/25 bg-slate-950/45 shadow-[0_18px_45px_oklch(0.04_0.03_260/0.45)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="inline-flex items-center gap-3 self-start rounded-full border border-blue-300/15 bg-slate-950/35 px-3 py-2">
                <img src="/manus-storage/Untitleddesign_c1fb0d88.png" alt="Blue Blazer logo" className="h-7 w-7 object-contain" />
                <span className="font-display text-sm tracking-[0.16em] text-white">BLUE BLAZER</span>
              </div>

              <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-blue-300/25 bg-blue-400/[0.08] shadow-[0_0_0_18px_oklch(0.55_0.17_250/0.05),0_0_80px_oklch(0.55_0.17_250/0.23)] sm:h-40 sm:w-40">
                <img src="/manus-storage/Untitleddesign_c1fb0d88.png" alt="" aria-hidden="true" className="h-24 w-24 object-contain sm:h-28 sm:w-28" />
              </div>

              <div className="relative mt-14 border-t border-white/10 pt-5"><p className="font-mono-data text-[10px] tracking-[0.22em] text-blue-200/55">CHAPTER COMPETITIVE PREPARATION</p><p className="mt-2 text-sm leading-6 text-white/55">Designed to turn steady practice into confident performance.</p></div>
            </div>
          </div>

          <div className="flex flex-col p-7 sm:p-10 lg:p-12">
            <div className="max-w-xl">
              <p className="page-eyebrow">Your chapter competitive hub</p>
              <h1 className="mt-4 font-display text-5xl leading-[0.9] tracking-tight text-white sm:text-6xl">WELCOME TO<br /><span className="text-blue-400">BLUE BLAZER</span></h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/65">A single, focused space for DECA students to build skill, monitor progress, and prepare for every round with confidence.</p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:mt-10 lg:grid-cols-1">
              {platformHighlights.map(({ icon: Icon, label, detail }) => <div key={label} className="rounded-xl border border-white/8 bg-white/[0.025] p-4"><Icon className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-semibold text-white">{label}</p><p className="mt-1 text-xs leading-5 text-white/50">{detail}</p></div>)}
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 lg:mt-auto">
              {isChecking ? <div className="flex h-12 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-500/10 text-sm text-blue-100"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking secure access</div> : <>
                <motion.button type="button" onClick={() => setLocation("/login")} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950">Sign in to Blue Blazer <ArrowRight className="h-4 w-4" /></motion.button>
                <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs leading-5 text-white/45"><ShieldCheck className="h-4 w-4 shrink-0 text-blue-300" />Blue Blazer is available through secure chapter access.</p>
              </>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
