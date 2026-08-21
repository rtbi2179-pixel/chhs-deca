import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Landmark,
  Layers3,
  Loader2,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";

const logoUrl = "/manus-storage/Untitleddesign_c1fb0d88.png";

const featureGroups = [
  { icon: BrainCircuit, title: "Study with a purpose", detail: "Build event knowledge through performance-indicator study, focused practice, and mock exams that recognize what you have already answered.", items: ["PI Library", "Practice", "Mock Exams"], tone: "blue" },
  { icon: Target, title: "Follow a real roadmap", detail: "Choose an event, see the next competition milestone, and use a timeline that responds to meaningful progress.", items: ["Event Focus", "Timeline", "Readiness"], tone: "cyan" },
  { icon: ClipboardCheck, title: "Practice like competition day", detail: "Use native roleplay simulations and written-event feedback designed to surface evidence, priorities, and useful next steps.", items: ["Roleplay AI", "Written Event AI", "PI Feedback"], tone: "violet" },
  { icon: FileCheck2, title: "Keep work organized", detail: "Submit checkpoint-based portfolio versions, see advisor feedback, and connect team deliverables to chapter deadlines.", items: ["Portfolios", "Checkpoints", "Advisor Review"], tone: "amber" },
  { icon: UsersRound, title: "Stay connected", detail: "One home for announcements, calendar dates, discussions, volunteer sign-ups, and chapter updates.", items: ["Calendar", "Announcements", "Community"], tone: "emerald" },
  { icon: Landmark, title: "Make progress tangible", detail: "Earn Blue Bucks through study, track banking and BBX, collect achievements, and see the chapter net-worth board.", items: ["Blue Bucks", "Achievements", "Leaderboard"], tone: "rose" },
] as const;

const journey = [
  { icon: Layers3, label: "Choose your event", detail: "Set a focused competitive direction." },
  { icon: BarChart3, label: "Train with feedback", detail: "Connect practice to visible progress." },
  { icon: Trophy, label: "Arrive prepared", detail: "Turn weekly preparation into confidence." },
];

const toneStyles = {
  blue: "from-blue-400/20 via-blue-400/[0.04] border-blue-300/20 text-blue-100",
  cyan: "from-cyan-300/20 via-cyan-300/[0.04] border-cyan-200/20 text-cyan-50",
  violet: "from-violet-400/20 via-violet-400/[0.04] border-violet-300/20 text-violet-50",
  amber: "from-amber-300/20 via-amber-300/[0.04] border-amber-200/20 text-amber-50",
  emerald: "from-emerald-300/20 via-emerald-300/[0.04] border-emerald-200/20 text-emerald-50",
  rose: "from-rose-300/20 via-rose-300/[0.04] border-rose-200/20 text-rose-50",
} as const;

export function SignedOutWelcome({ isChecking = false, isAuthenticated = false, onContinue }: { isChecking?: boolean; isAuthenticated?: boolean; onContinue?: () => void }) {
  const [, setLocation] = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const handlePrimaryAction = () => {
    onContinue?.();
    if (!isAuthenticated) setLocation("/login");
  };
  const fadeUp = (delay = 0) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.48, delay: shouldReduceMotion ? 0 : delay },
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050914] px-4 py-4 text-white sm:px-6 sm:py-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_14%_8%,rgba(48,111,255,.32),transparent_20%),radial-gradient(circle_at_88%_34%,rgba(12,94,185,.22),transparent_22%),radial-gradient(circle_at_56%_94%,rgba(64,138,255,.14),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(112,160,255,.36)_1px,transparent_1px),linear-gradient(90deg,rgba(112,160,255,.36)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="relative mx-auto max-w-7xl pb-8">
        <motion.header {...fadeUp(0)} className="flex items-center justify-between border-b border-white/10 py-4 sm:py-5">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/20 bg-slate-950/55 shadow-[0_0_24px_rgba(59,130,246,.22)]"><img src={logoUrl} alt="Blue Blazer" className="h-8 w-8 object-contain" /></span><div><p className="font-display text-base tracking-[0.18em] text-white">BLUE BLAZER</p><p className="font-mono-data text-[9px] tracking-[0.18em] text-blue-200/60">CHAPTER PREPARATION, CONNECTED</p></div></div>
          <span className="hidden items-center gap-2 rounded-full border border-blue-200/15 bg-blue-400/[0.06] px-3 py-1.5 text-xs text-blue-100/75 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" />Secure chapter access</span>
        </motion.header>

        <section className="grid gap-10 py-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-20">
          <motion.div {...fadeUp(0.08)} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/15 bg-white/[0.035] px-3 py-1.5 font-mono-data text-[10px] tracking-[0.16em] text-blue-100/75"><Sparkles className="h-3.5 w-3.5 text-blue-300" />ONE WORKSPACE. A CLEARER PATH TO COMPETITION.</div>
            <h1 className="mt-7 font-display text-5xl leading-[0.88] tracking-tight text-white sm:text-7xl xl:text-8xl">PREP WITH<br /><span className="text-blue-300">A PLAN.</span><br />PERFORM WITH<br />PURPOSE.</h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-200/70 sm:text-lg">Blue Blazer brings the tools a chapter actually uses into one focused experience—from event selection and PI study to chapter updates, portfolios, and competition-ready practice.</p>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">{journey.map(({ icon: Icon, label, detail }, index) => <motion.div key={label} {...fadeUp(0.22 + index * 0.08)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm"><Icon className="h-5 w-5 text-blue-200" /><p className="mt-5 text-sm font-semibold text-white">{label}</p><p className="mt-1 text-xs leading-5 text-slate-300/60">{detail}</p></motion.div>)}</div>
          </motion.div>
          <motion.aside {...fadeUp(0.16)} className="relative overflow-hidden rounded-[2rem] border border-blue-200/15 bg-[linear-gradient(150deg,rgba(24,62,132,.65),rgba(7,14,31,.96)_54%,rgba(12,28,65,.82))] p-6 shadow-[0_28px_100px_rgba(0,0,0,.42)] sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-blue-300/20 bg-blue-400/10 blur-sm" />
            <div className="relative"><div className="flex items-start justify-between gap-5"><div><p className="page-eyebrow">Built for the full season</p><h2 className="mt-3 text-2xl font-semibold text-white">Every useful signal, in one place.</h2></div><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200/20 bg-blue-300/[0.08]"><img src={logoUrl} alt="" className="h-9 w-9 object-contain" /></span></div><div className="mt-8 space-y-4">{[["Your next move", "Adaptive timelines turn progress into a practical weekly focus."], ["Your chapter pulse", "Updates, deadlines, and discussions stay visible without scattered tools."], ["Your competitive record", "Practice, portfolio versions, feedback, and achievements stay connected."]].map(([title, detail], index) => <div key={title} className="flex gap-4 border-l border-blue-300/30 pl-4"><span className="font-mono-data text-xs text-blue-200/60">0{index + 1}</span><div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-200/60">{detail}</p></div></div>)}</div><div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/35 p-4"><div className="flex items-center gap-2 text-sm font-medium text-blue-50"><CheckCircle2 className="h-4 w-4 text-blue-300" />Start with your chapter account</div><p className="mt-2 text-xs leading-5 text-slate-200/55">Your work, feedback, and chapter information are kept within your secure Blue Blazer workspace.</p></div></div>
          </motion.aside>
        </section>

        <motion.section {...fadeUp(0.24)} className="border-y border-white/10 py-10 sm:py-14"><div className="max-w-2xl"><p className="page-eyebrow">Explore the Blue Blazer system</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Everything your preparation needs to stay connected.</h2><p className="mt-4 text-sm leading-6 text-slate-200/65 sm:text-base">From your first event decision to chapter checkpoints and competition week, every area works toward the same goal: helping members know what to do next.</p></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{featureGroups.map(({ icon: Icon, title, detail, items, tone }, index) => <motion.article key={title} {...fadeUp(0.28 + index * 0.055)} whileHover={shouldReduceMotion ? undefined : { y: -4 }} className={`group rounded-2xl border bg-gradient-to-br to-slate-950/70 p-5 transition duration-300 hover:shadow-[0_18px_44px_rgba(0,0,0,.22)] ${toneStyles[tone]}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-slate-950/35"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-base font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-200/65">{detail}</p><div className="mt-5 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full border border-white/10 bg-slate-950/30 px-2.5 py-1 text-[10px] font-medium tracking-wide text-slate-100/75">{item}</span>)}</div></motion.article>)}</div></motion.section>

        <motion.section {...fadeUp(0.42)} className="grid gap-6 py-12 lg:grid-cols-[1.25fr_.75fr] lg:py-16"><div className="rounded-[1.75rem] border border-blue-200/15 bg-[linear-gradient(120deg,rgba(22,68,155,.32),rgba(9,16,34,.88)_52%,rgba(7,14,28,.98))] p-7 sm:p-9"><p className="page-eyebrow">A chapter-ready experience</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white">Make member preparation easier to start, easier to sustain, and easier to see.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-200/65">Members can focus on their own next step while advisors keep deadlines, review, and chapter progress organized.</p></div><div className="flex flex-col justify-between rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-7 sm:p-9"><MessageCircleMore className="h-7 w-7 text-blue-200" /><div className="mt-10"><h2 className="text-xl font-semibold text-white">Ready to begin?</h2><p className="mt-2 text-sm leading-6 text-slate-200/60">Sign in with your chapter account to enter your personalized workspace.</p></div></div></motion.section>

        <motion.footer {...fadeUp(0.48)} className="rounded-[1.75rem] border border-blue-200/20 bg-blue-600 px-6 py-6 shadow-[0_18px_48px_rgba(37,99,235,.22)] sm:flex sm:items-center sm:justify-between sm:px-8"><div><p className="text-lg font-semibold text-white">Your preparation has a home.</p><p className="mt-1 text-sm text-blue-100/80">Sign in to connect your event, chapter, and next competitive step.</p></div>{isChecking ? <div className="mt-5 flex h-12 items-center justify-center rounded-xl border border-white/20 bg-slate-950/15 px-5 text-sm text-white sm:mt-0"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking secure access</div> : <motion.button type="button" onClick={handlePrimaryAction} whileHover={shouldReduceMotion ? undefined : { y: -2 }} whileTap={{ scale: 0.98 }} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 sm:mt-0 sm:w-auto">{isAuthenticated ? "Enter Blue Blazer" : "Sign in to Blue Blazer"}<ArrowRight className="h-4 w-4" /></motion.button>}</motion.footer>
      </div>
    </main>
  );
}
