/*
 * CHHS DECA Home Page — Cinematic Dark Editorial
 * Hero: Full-viewport split layout with 3D Spline glass trophy on right
 * Sections: Stats, Feature cards, Quick links, Resources
 * Colors: Deep black bg, electric blue accents, white text
 * Fonts: Bebas Neue (display), Outfit (body), Space Mono (data)
 */

import { Link } from 'wouter'
import { motion } from 'framer-motion'

import { Trophy, BookOpen, Calendar, Users, ArrowRight, Star, Target, Zap, Globe, ChevronRight } from 'lucide-react'

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663512099215/gkmjm4geRMb8GU58vHezuc/deca-hero-bg-3D56BJM7ugEtwwxPTqT3y7.webp'

const stats = [
  { value: '60+', label: 'Competitive Events', icon: Trophy },
  { value: '4', label: 'Career Clusters', icon: Target },
  { value: '3M+', label: 'DECA Members', icon: Users },
  { value: 'ICDC', label: 'Your Goal', icon: Star },
]

const features = [
  {
    href: '/events',
    icon: Trophy,
    title: 'Event Resources',
    description: 'Deep-dive guides, official DECA links, role-play tips, and study materials for all 60+ competitive events.',
    color: 'from-blue-600/20 to-blue-800/10',
    border: 'border-blue-500/20 hover:border-blue-500/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.2)]',
    tag: '60+ Events',
  },
  {
    href: '/practice',
    icon: BookOpen,
    title: 'Practice Questions',
    description: 'Real DECA exam questions across all clusters — Marketing, Finance, Hospitality, and Business Management.',
    color: 'from-indigo-600/20 to-indigo-800/10',
    border: 'border-indigo-500/20 hover:border-indigo-500/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.50_0.22_270/0.2)]',
    tag: '38+ Questions',
  },
  {
    href: '/calendar',
    icon: Calendar,
    title: 'Competition Calendar',
    description: 'Stay on top of district, state, and ICDC dates. Never miss a deadline or competition.',
    color: 'from-cyan-600/20 to-cyan-800/10',
    border: 'border-cyan-500/20 hover:border-cyan-500/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.65_0.15_210/0.2)]',
    tag: '2025–2026 Season',
  },
  {
    href: '/volunteer',
    icon: Users,
    title: 'Volunteer Sign-Ups',
    description: 'Earn community service hours and build your DECA portfolio by signing up for chapter events.',
    color: 'from-blue-700/20 to-slate-800/10',
    border: 'border-blue-400/20 hover:border-blue-400/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.60_0.18_255/0.2)]',
    tag: '8 Opportunities',
  },
]

const quickLinks = [
  { label: 'DECA Official Site', href: 'https://www.deca.org', icon: Globe },
  { label: 'DECA Guide 2025-26', href: 'https://issuu.com/decainc/docs/deca_guide_2025-2026', icon: BookOpen },
  { label: 'Exam Blueprints', href: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', icon: Target },
  { label: 'Decademy Practice', href: 'https://decademy.app', icon: Zap },
  { label: 'ICDC 2026 Info', href: 'https://www.deca.org/conferences/icdc', icon: Trophy },
  { label: 'Texas DECA', href: 'https://www.texasdeca.org', icon: Star },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)]">
      {/* ── Hero Section ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.07_0.01_265)] via-[oklch(0.07_0.01_265/0.88)] to-[oklch(0.07_0.01_265/0.25)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.07_0.01_265)] via-transparent to-transparent" />

        {/* Animated grid lines */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(oklch(0.55 0.22 260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.22 260) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
            {/* Left: Text Content */}
            <div className="flex flex-col justify-center py-20 lg:py-0">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  CHHS DECA Chapter
                </div>

                <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-white leading-none mb-4">
                  YOUR PATH
                  <br />
                  <span className="gradient-text">TO ICDC</span>
                </h1>

                <p className="text-white/60 text-lg leading-relaxed max-w-lg mb-8">
                  Everything you need to compete and win — event resources, practice exams,
                  competition calendar, and volunteer opportunities. One hub. Zero excuses.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link href="/events">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors duration-200 hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)] cursor-pointer"
                    >
                      Explore Events
                      <ArrowRight size={16} />
                    </motion.div>
                  </Link>
                  <Link href="/practice">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      Start Practicing
                    </motion.div>
                  </Link>
                </div>
              </motion.div>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="grid grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/5"
              >
                {stats.map(({ value, label, icon: Icon }) => (
                  <div key={label} className="text-center">
                    <Icon size={16} className="text-blue-400 mx-auto mb-1" />
                    <div className="font-display text-2xl text-white">{value}</div>
                    <div className="text-white/40 text-xs mt-0.5 leading-tight">{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: DECA Glass Award */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative h-[500px] lg:h-[700px] hidden lg:flex items-center justify-center"
            >
              {/* Glow backdrop */}
              <div className="absolute inset-0 rounded-2xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl animate-pulse-glow" />
              <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />
              <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

              {/* DECA Glass Award Image */}
              <motion.img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663512099215/gkmjm4geRMb8GU58vHezuc/deca-glass-raw_4bb84ef8.png"
                alt="DECA Glass Award - First Place ICDC"
                className="relative z-10 w-full max-w-md h-auto drop-shadow-[0_0_60px_oklch(0.55_0.22_260/0.5)]"
                animate={{
                  rotateZ: [-2, 2, -2],
                  y: [-8, 8, -8],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Floating DECA badge */}
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute top-8 right-4 glass-card px-4 py-3 text-center border-blue-500/20"
              >
                <div className="font-display text-2xl text-blue-400">DECA</div>
                <div className="text-white/50 text-xs font-mono-data tracking-wider">GLASS AWARD</div>
              </motion.div>

              {/* ICDC badge */}
              <motion.div
                animate={{ y: [6, -6, 6] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute bottom-20 left-4 glass-card px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-400" />
                  <div>
                    <div className="text-white text-sm font-semibold">ICDC 2026</div>
                    <div className="text-white/40 text-xs">Orlando, FL</div>
                  </div>
                </div>
              </motion.div>

              {/* Score badge */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 5, repeat: Infinity, delay: 2 }}
                className="absolute top-1/2 right-2 glass-card px-3 py-2"
              >
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-blue-400" />
                  <span className="text-white/70 text-xs font-mono-data">Top Scorer</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/30" />
          <span className="text-xs font-mono-data tracking-widest uppercase">Scroll</span>
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div custom={0} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-4">
              Your Resource Hub
            </div>
            <h2 className="font-display text-5xl sm:text-6xl text-white mb-4">
              EVERYTHING YOU NEED
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              From first-year principles to ICDC-level written events — CHHS DECA has you covered.
            </p>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ href, icon: Icon, title, description, color, border, glow, tag }, i) => (
            <motion.div
              key={href}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Link href={href}>
                <div
                  className={`group relative p-8 rounded-2xl bg-gradient-to-br ${color} border ${border} ${glow} transition-all duration-300 cursor-pointer overflow-hidden`}
                >
                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 animate-shimmer" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Icon size={24} className="text-blue-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30 font-mono-data">{tag}</span>
                        <ArrowRight
                          size={18}
                          className="text-white/30 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300"
                        />
                      </div>
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{description}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ICDC Countdown Banner ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono-data tracking-widest uppercase mb-3">
                  <Trophy size={12} />
                  The Ultimate Goal
                </div>
                <h2 className="font-display text-4xl sm:text-5xl text-white mb-2">ICDC 2026</h2>
                <p className="text-white/60 text-lg">International Career Development Conference</p>
                <p className="text-white/40 text-sm mt-1 font-mono-data">April 25–28, 2026 · Orlando, FL</p>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { value: '22', label: 'Days' },
                    { value: '4', label: 'Clusters' },
                    { value: '60+', label: 'Events' },
                  ].map(({ value, label }) => (
                    <div key={label} className="glass-card px-4 py-3 border-blue-500/20">
                      <div className="font-display text-3xl text-blue-400">{value}</div>
                      <div className="text-white/40 text-xs font-mono-data">{label}</div>
                    </div>
                  ))}
                </div>
                <a
                  href="https://www.deca.org/conferences/icdc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)]"
                >
                  Learn About ICDC
                  <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl text-white">QUICK LINKS</h2>
              <p className="text-white/40 text-sm mt-1">Official DECA resources at your fingertips</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-blue-500/30 transition-all duration-200 text-center hover:shadow-[0_0_20px_oklch(0.55_0.22_260/0.1)]"
              >
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/15 group-hover:bg-blue-500/20 transition-colors">
                  <Icon size={18} className="text-blue-400" />
                </div>
                <span className="text-white/60 group-hover:text-white text-xs font-medium leading-tight transition-colors">{label}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── DECA Clusters Overview ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="section-divider mb-16" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-3">CAREER CLUSTERS</h2>
            <p className="text-white/50">DECA covers 4 major career clusters — find yours and start competing</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Marketing', events: '15+', color: 'border-blue-500/30 bg-blue-500/5', tag: 'text-blue-300', desc: 'Advertising, retail, sports & entertainment marketing' },
              { name: 'Finance', events: '8+', color: 'border-green-500/30 bg-green-500/5', tag: 'text-green-300', desc: 'Accounting, business finance, financial services' },
              { name: 'Hospitality & Tourism', events: '8+', color: 'border-orange-500/30 bg-orange-500/5', tag: 'text-orange-300', desc: 'Hotels, restaurants, travel & tourism management' },
              { name: 'Business Management', events: '10+', color: 'border-purple-500/30 bg-purple-500/5', tag: 'text-purple-300', desc: 'HR, entrepreneurship, international business' },
            ].map(({ name, events, color, tag, desc }) => (
              <Link key={name} href="/events">
                <div className={`group p-6 rounded-xl border ${color} hover:scale-[1.02] transition-all duration-200 cursor-pointer`}>
                  <div className={`text-xs font-mono-data tracking-widest uppercase mb-2 ${tag}`}>{events} Events</div>
                  <h3 className="text-white font-bold text-base mb-2">{name}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                  <div className={`mt-3 flex items-center gap-1 text-xs ${tag} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    View events <ChevronRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663512099215/gkmjm4geRMb8GU58vHezuc/ch-paw-raw_b4eafc24.png"
                alt="CH Paw Logo"
                className="w-10 h-10"
              />
              <div>
                <div className="font-display text-xl text-white tracking-wider">CHHS DECA</div>
                <div className="text-blue-400/60 text-xs font-mono-data tracking-widest">ROAD TO ICDC</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-white/30 text-sm">
              <a href="https://www.deca.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">DECA.org</a>
              <a href="https://www.texasdeca.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Texas DECA</a>
              <a href="https://decademy.app" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Decademy</a>
              <a href="https://www.deca.org/conferences/icdc" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">ICDC 2026</a>
            </div>
          </div>
          <div className="section-divider mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white/20 text-xs font-mono-data">
            <span>© 2025–2026 CHHS DECA Chapter. All rights reserved.</span>
            <span>Built for students, by students. Road to ICDC.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
