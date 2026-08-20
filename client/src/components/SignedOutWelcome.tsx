import { ArrowRight, BookOpenCheck, Loader2, ShieldCheck, Target, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";

const platformHighlights = [
  {
    icon: BookOpenCheck,
    eyebrow: "MEMBER LEARNING",
    label: "Practice with direction",
    detail: "Connect PI study, focused questions, and mock exams so every study session has a clear purpose.",
  },
  {
    icon: Target,
    eyebrow: "CHAPTER OPERATIONS",
    label: "Keep your chapter aligned",
    detail: "Bring events, announcements, discussions, and shared preparation into one familiar home base.",
  },
  {
    icon: Trophy,
    eyebrow: "VISIBLE MOMENTUM",
    label: "Make preparation measurable",
    detail: "Give members a clear view of progress, priorities, Blue Bucks, and the next productive step.",
  },
];

export function SignedOutWelcome({ isChecking = false, isAuthenticated = false, onContinue }: { isChecking?: boolean; isAuthenticated?: boolean; onContinue?: () => void }) {
  const [, setLocation] = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const handlePrimaryAction = () => {
    onContinue?.();
    if (!isAuthenticated) setLocation("/login");
  };

  const markInitial = shouldReduceMotion ? false : { opacity: 0, scale: 0.76, y: 20, rotate: -7 };
  const markAnimate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, rotate: 0 };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[oklch(0.07_0.01_265)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,oklch(0.34_0.16_255/0.25),transparent_31%),radial-gradient(circle_at_83%_84%,oklch(0.22_0.1_245/0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(oklch(0.72_0.1_250/0.12)_1px,transparent_1px),linear-gradient(90deg,oklch(0.72_0.1_250/0.12)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-blue-300/15 bg-slate-950/80 shadow-[0_32px_120px_oklch(0_0_0/0.5)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[360px] overflow-hidden border-b border-white/8 bg-[linear-gradient(145deg,oklch(0.16_0.07_252),oklch(0.075_0.02_260))] p-7 sm:p-10 lg:min-h-[650px] lg:border-b-0 lg:border-r lg:p-12">
            <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-8 top-9 h-44 rounded-[1.5rem] border border-blue-300/10 bg-blue-400/[0.025]" />
            <div className="relative flex w-full flex-col justify-between">
              <div className="inline-flex items-center gap-3 self-start rounded-full border border-blue-300/15 bg-slate-950/40 px-3.5 py-2.5">
                <img src="/manus-storage/Untitleddesign_c1fb0d88.png" alt="Blue Blazer logo" className="h-8 w-8 object-contain" />
                <span className="font-display text-sm tracking-[0.18em] text-white">BLUE BLAZER</span>
                <span className="h-1 w-1 rounded-full bg-blue-300" />
                <span className="font-mono-data text-[9px] tracking-[0.15em] text-blue-200/65">ROAD TO ICDC</span>
              </div>

              <motion.div
                initial={markInitial}
                animate={markAnimate}
                transition={{ duration: shouldReduceMotion ? 0 : 0.62, delay: shouldReduceMotion ? 0 : 0.14, ease: [0.23, 1, 0.32, 1] }}
                className="welcome-blueblazer-mark relative mx-auto flex h-52 w-52 items-center justify-center rounded-[2.4rem] border border-blue-300/30 bg-[linear-gradient(145deg,oklch(0.3_0.13_250/0.32),oklch(0.11_0.04_260/0.78))] shadow-[0_0_0_18px_oklch(0.55_0.17_250/0.05),0_0_95px_oklch(0.55_0.17_250/0.3)] sm:h-60 sm:w-60"
              >
                {!shouldReduceMotion && <motion.span aria-hidden="true" animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.94, 1.08, 0.94] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }} className="absolute -inset-7 rounded-[3rem] border border-blue-300/15" />}
                <div className="absolute inset-3 rounded-[1.8rem] border border-white/10" />
                <img src="/manus-storage/Untitleddesign_c1fb0d88.png" alt="Blue Blazer" className="relative h-44 w-44 rounded-[1.45rem] object-contain sm:h-52 sm:w-52" />
              </motion.div>

              <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.42, delay: shouldReduceMotion ? 0 : 0.5, ease: [0.23, 1, 0.32, 1] }} className="relative mt-12 border-t border-white/10 pt-5">
                <p className="font-mono-data text-[10px] tracking-[0.22em] text-blue-200/65">ONE HOME FOR CHAPTER PREPARATION</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">Built for members who want a clearer plan and chapter teams that want every preparation tool in reach.</p>
              </motion.div>
            </div>
          </div>

          <div className="flex flex-col p-7 sm:p-10 lg:p-14">
            <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay: shouldReduceMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }} className="max-w-xl">
              <p className="page-eyebrow">Chapter-ready competitive preparation</p>
              <h1 className="mt-5 font-display text-5xl leading-[0.88] tracking-tight text-white sm:text-7xl">A BETTER HOME<br />FOR <span className="text-blue-300">DECA PREP.</span></h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/65">Blue Blazer brings guided practice, DECA event resources, chapter communication, and member progress into one intentional workspace—so every member can see what to do next.</p>
            </motion.div>

            <div className="mt-8 grid gap-3 lg:mt-10">
              {platformHighlights.map(({ icon: Icon, eyebrow, label, detail }, index) => (
                <motion.div key={label} initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.32, delay: shouldReduceMotion ? 0 : 0.32 + index * 0.08, ease: [0.23, 1, 0.32, 1] }} className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-4 transition-colors hover:border-blue-300/25 hover:bg-blue-300/[0.04]">
                  <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-300/60" />
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-300/[0.06]"><Icon className="h-4 w-4 text-blue-200" /></span>
                    <div><p className="font-mono-data text-[9px] tracking-[0.17em] text-blue-200/50">{eyebrow}</p><p className="mt-1 text-sm font-semibold text-white">{label}</p><p className="mt-1 text-xs leading-5 text-white/55">{detail}</p></div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 lg:mt-auto">
              <p className="mb-4 max-w-lg text-sm leading-6 text-white/55">Give your chapter a more consistent path from the first practice question to competition day.</p>
              {isChecking ? <div className="flex h-12 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-500/10 text-sm text-blue-100"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking secure access</div> : <>
                <motion.button type="button" onClick={handlePrimaryAction} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950">{isAuthenticated ? "Enter Blue Blazer" : "Sign in to Blue Blazer"} <ArrowRight className="h-4 w-4" /></motion.button>
                <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs leading-5 text-white/45"><ShieldCheck className="h-4 w-4 shrink-0 text-blue-300" />{isAuthenticated ? "Your secure Blue Blazer workspace is ready." : "Blue Blazer is available through secure chapter access."}</p>
              </>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
