import { motion } from 'framer-motion'
import { Zap, ChevronRight } from 'lucide-react'
import { useLocation } from 'wouter'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
}

const aiTools = [
  {
    href: '/ai/roleplay',
    title: 'DECA Competition Simulation',
    description: 'Run a native, timed roleplay with original scenarios, recorded responses, evidence-based PI scoring, separate delivery coaching, and saved training recommendations.',
    icon: '',
    color: 'from-blue-600/20 to-blue-800/10',
    border: 'border-blue-500/20 hover:border-blue-500/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.2)]',
    tag: 'Native Simulator',
  },
  {
    href: '/ai/written',
    title: 'DECA AI Judge',
    description: 'Review a presentation transcript against a verified event rubric, trace every assessed point to evidence, and receive separate coaching priorities.',
    icon: '',
    color: 'from-purple-600/20 to-purple-800/10',
    border: 'border-purple-500/20 hover:border-purple-500/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.65_0.22_290/0.2)]',
    tag: 'Verified Rubric',
  },
]

export default function SpeechAI() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono tracking-widest uppercase mb-4">
            <Zap size={12} />
            AI-Powered Training
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-white mb-4">
            AI SPEECH TOOLS
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Leverage artificial intelligence to practice and perfect your DECA competitive event skills with instant feedback and coaching.
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {aiTools.map(({ href, title, description, icon, color, border, glow, tag }, i) => (
            <motion.div
              key={href}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div
                onClick={() => navigate(href)}
                className={`group relative p-8 rounded-2xl bg-gradient-to-br ${color} border ${border} ${glow} transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col justify-between`}
              >
                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 animate-shimmer" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      {icon && <div className="text-5xl font-bold text-blue-400">{icon}</div>}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30 font-mono">{tag}</span>
                        <ChevronRight
                          size={18}
                          className="text-white/30 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300"
                        />
                      </div>
                    </div>
                    <h3 className="text-white text-2xl font-bold mb-3">{title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{description}</p>
                  </div>

                  <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
                    <span className="text-blue-400 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                      Launch Tool
                      <ChevronRight size={16} />
                    </span>
                  </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 via-blue-800/20 to-blue-900/30 p-8 sm:p-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-blue-600/5" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-white/70">
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">For Roleplay Events</h3>
                <p className="text-sm leading-relaxed">
                  Run a timed preparation and interview round using your Blue Blazer account. Your recorded response is transcribed, scored from PI evidence, and connected to the PI Library; delivery coaching remains separate from the practice score.
                </p>
              </div>
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">For Written Events</h3>
                <p className="text-sm leading-relaxed">
                  Submit your written event responses and receive AI-powered evaluation. Learn where you excel and what areas need improvement before competition day.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
