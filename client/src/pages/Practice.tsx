import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpenCheck, Sparkles, Target, Timer, TrendingUp } from 'lucide-react';

const entryCards = [
  {
    href: '/practice/questions',
    eyebrow: 'QUESTION BANK',
    title: 'Practice Questions',
    description: 'Build confidence one question at a time with focused cluster banks, explanations, progress tracking, and review tools.',
    icon: Target,
    accent: 'from-blue-500/20 via-blue-500/10 to-transparent',
    iconClass: 'border-blue-400/30 bg-blue-500/15 text-blue-300',
    buttonClass: 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_24px_oklch(0.55_0.22_260/0.28)]',
    details: [
      { icon: BookOpenCheck, label: 'Cluster-focused banks' },
      { icon: TrendingUp, label: 'Progress and accuracy' },
    ],
  },
  {
    href: '/chapter-mock-exam',
    eyebrow: 'EXAM SIMULATION',
    title: 'Mock Exams',
    description: 'Test your readiness with balanced DECA-style exams, detailed results, weak-point analysis, and a targeted study guide.',
    icon: Sparkles,
    accent: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
    iconClass: 'border-indigo-400/30 bg-indigo-500/15 text-indigo-300',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_24px_oklch(0.5_0.22_275/0.28)]',
    details: [
      { icon: Timer, label: 'Timed exam experience' },
      { icon: TrendingUp, label: 'Results and study guide' },
    ],
  },
] as const;

export default function Practice() {
  return (
    <main className="page-shell mt-16 min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[12%] top-24 h-1 w-1 rounded-full bg-blue-300/80 shadow-[0_0_18px_6px_oklch(0.65_0.18_250/0.28)]" />
        <div className="absolute right-[18%] top-40 h-1.5 w-1.5 rounded-full bg-indigo-300/70 shadow-[0_0_20px_7px_oklch(0.55_0.2_275/0.24)]" />
        <div className="absolute bottom-24 left-[28%] h-1 w-1 rounded-full bg-blue-200/60 shadow-[0_0_16px_5px_oklch(0.65_0.18_250/0.22)]" />
        <div className="absolute right-[32%] top-[52%] h-px w-32 rotate-[18deg] bg-gradient-to-r from-transparent via-blue-400/25 to-transparent" />
      </div>

      <div className="page-content relative max-w-6xl py-10 sm:py-14">
        <header className="max-w-3xl">
          <p className="page-eyebrow">Blue Blazer practice center</p>
          <h1 className="page-title mt-2">Choose your next rep.</h1>
          <p className="page-intro mt-4 max-w-2xl">
            Use focused practice to sharpen individual skills, or simulate exam day to see how your preparation holds up under pressure.
          </p>
        </header>

        <section className="mt-10 grid gap-5 lg:grid-cols-2" aria-label="Practice options">
          {entryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.href}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br ${card.accent} bg-slate-950/75 p-6 shadow-[0_16px_36px_oklch(0_0_0/0.24)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-blue-400/30 hover:shadow-[0_24px_44px_oklch(0_0_0/0.34)] sm:p-8`}
              >
                <div className="relative flex min-h-[320px] flex-col justify-between gap-8">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${card.iconClass}`}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <span className="data-label text-foreground/45">0{index + 1} / 02</span>
                    </div>
                    <p className="data-label mt-10 text-foreground/45">{card.eyebrow}</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{card.title}</h2>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-foreground/65">{card.description}</p>
                  </div>

                  <div>
                    <div className="mb-6 grid gap-2 sm:grid-cols-2">
                      {card.details.map((detail) => {
                        const DetailIcon = detail.icon;
                        return (
                          <div key={detail.label} className="flex items-center gap-2 text-xs text-foreground/55">
                            <DetailIcon className="h-4 w-4 text-blue-300/80" aria-hidden="true" />
                            <span>{detail.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <Link href={card.href}>
                      <a className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-200 active:scale-[0.97] ${card.buttonClass}`}>
                        Open {card.title}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                      </a>
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.08] pt-5 text-xs text-foreground/45">
          <span>Practice when you want.</span>
          <span>Review what you miss.</span>
          <span>Return to the same hub for exam day.</span>
        </div>
      </div>
    </main>
  );
}

export { entryCards };
