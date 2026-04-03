/*
 * CHHS DECA Volunteer Sign-Up Page — Cinematic Dark Editorial
 * Volunteer opportunities with sign-up forms and hour tracking
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Clock, MapPin, CheckCircle, Star, ChevronDown, ChevronUp, Heart, Trophy, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface VolunteerOpportunity {
  id: number
  title: string
  date: string
  time: string
  location: string
  hours: number
  spotsTotal: number
  spotsFilled: number
  description: string
  tasks: string[]
  category: 'competition' | 'community' | 'chapter' | 'fundraiser'
}

const opportunities: VolunteerOpportunity[] = [
  {
    id: 1,
    title: 'District Competition Judge Assistant',
    date: 'January 12, 2026',
    time: '7:00 AM – 4:00 PM',
    location: 'CHHS Main Campus',
    hours: 8,
    spotsTotal: 15,
    spotsFilled: 7,
    category: 'competition',
    description: 'Help run the district DECA competition by assisting judges, managing check-in, and supporting event logistics.',
    tasks: ['Check-in competitor registration', 'Guide participants to event rooms', 'Assist judges with materials', 'Help with scoring and tabulation', 'Set up and break down event spaces'],
  },
  {
    id: 2,
    title: 'Financial Literacy Workshop Volunteer',
    date: 'November 18, 2025',
    time: '9:00 AM – 12:00 PM',
    location: 'CHHS Library',
    hours: 3,
    spotsTotal: 8,
    spotsFilled: 3,
    category: 'community',
    description: 'Teach basic financial literacy concepts to middle school students from a partner school.',
    tasks: ['Present budgeting basics', 'Lead interactive activities', 'Assist students with worksheets', 'Answer questions about personal finance'],
  },
  {
    id: 3,
    title: 'DECA Week Community Service Day',
    date: 'October 28, 2025',
    time: '8:00 AM – 1:00 PM',
    location: 'Local Food Bank',
    hours: 5,
    spotsTotal: 20,
    spotsFilled: 12,
    category: 'community',
    description: 'Annual DECA Week community service event. Help sort and distribute food at the local food bank.',
    tasks: ['Sort donated food items', 'Pack food boxes', 'Assist with distribution', 'Help with inventory tracking'],
  },
  {
    id: 4,
    title: 'Chapter Fundraiser — Car Wash',
    date: 'October 11, 2025',
    time: '10:00 AM – 3:00 PM',
    location: 'CHHS Parking Lot',
    hours: 5,
    spotsTotal: 25,
    spotsFilled: 18,
    category: 'fundraiser',
    description: 'Help raise funds for chapter competition travel expenses by running our annual car wash fundraiser.',
    tasks: ['Wash and dry vehicles', 'Collect donations', 'Manage customer flow', 'Handle marketing/signage'],
  },
  {
    id: 5,
    title: 'Mock Competition Judge',
    date: 'November 3, 2025',
    time: '8:00 AM – 12:00 PM',
    location: 'CHHS Cafeteria',
    hours: 4,
    spotsTotal: 10,
    spotsFilled: 4,
    category: 'chapter',
    description: 'Serve as a mock judge for fellow DECA members preparing for district competition. Great for alumni and upperclassmen!',
    tasks: ['Review judge scoring rubrics', 'Evaluate role-play presentations', 'Provide constructive feedback', 'Score written event presentations'],
  },
  {
    id: 6,
    title: 'State Competition Volunteer',
    date: 'March 5-7, 2026',
    time: 'Varies by shift',
    location: 'Dallas Convention Center',
    hours: 12,
    spotsTotal: 8,
    spotsFilled: 2,
    category: 'competition',
    description: 'Volunteer at the Texas DECA State CDC. Assist with event logistics, competitor guidance, and general support.',
    tasks: ['Assist with competitor registration', 'Guide participants', 'Support event room operations', 'Help with awards ceremony'],
  },
  {
    id: 7,
    title: 'Business Plan Workshop Facilitator',
    date: 'February 9, 2026',
    time: '3:30 PM – 5:30 PM',
    location: 'CHHS Room 204',
    hours: 2,
    spotsTotal: 6,
    spotsFilled: 1,
    category: 'chapter',
    description: 'Help first-year DECA members develop their written event business plans with guidance and feedback.',
    tasks: ['Review business plan drafts', 'Provide feedback on structure', 'Share tips from your experience', 'Help with formatting and citations'],
  },
  {
    id: 8,
    title: 'Chapter Awards Banquet Setup',
    date: 'May 11, 2026',
    time: '3:00 PM – 6:00 PM',
    location: 'CHHS Cafeteria',
    hours: 3,
    spotsTotal: 12,
    spotsFilled: 5,
    category: 'chapter',
    description: 'Help set up and decorate for the annual CHHS DECA Awards Banquet celebrating the year\'s achievements.',
    tasks: ['Set up tables and chairs', 'Arrange decorations', 'Prepare award displays', 'Assist with AV setup', 'Welcome guests'],
  },
]

const categoryConfig = {
  competition: { label: 'Competition', color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: Trophy },
  community: { label: 'Community Service', color: 'text-green-300', bg: 'bg-green-500/15', border: 'border-green-500/30', icon: Heart },
  chapter: { label: 'Chapter Event', color: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/30', icon: Star },
  fundraiser: { label: 'Fundraiser', color: 'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', icon: Zap },
}

interface SignUpFormData {
  name: string
  email: string
  grade: string
  phone: string
  notes: string
}

function OpportunityCard({ opp, onSignUp }: { opp: VolunteerOpportunity; onSignUp: (opp: VolunteerOpportunity) => void }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = categoryConfig[opp.category]
  const Icon = cfg.icon
  const spotsLeft = opp.spotsTotal - opp.spotsFilled
  const fillPercent = (opp.spotsFilled / opp.spotsTotal) * 100
  const isFull = spotsLeft === 0

  return (
    <div className={`glass-card overflow-hidden ${isFull ? 'opacity-60' : ''}`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 p-2.5 rounded-xl ${cfg.bg} border ${cfg.border}`}>
              <Icon size={18} className={cfg.color} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                <span className="text-white/30 text-xs font-mono-data">{opp.hours}h</span>
              </div>
              <h3 className="text-white font-bold text-base leading-tight">{opp.title}</h3>
            </div>
          </div>
          {isFull ? (
            <span className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/30">Full</span>
          ) : (
            <button
              onClick={() => onSignUp(opp)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:shadow-[0_0_15px_oklch(0.55_0.22_260/0.3)]"
            >
              Sign Up
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Clock size={12} className="text-blue-400" />
            {opp.date}
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Clock size={12} className="text-blue-400" />
            {opp.time}
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <MapPin size={12} className="text-blue-400" />
            {opp.location}
          </div>
        </div>

        {/* Spots progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/40">{opp.spotsFilled}/{opp.spotsTotal} spots filled</span>
            <span className={`font-mono-data ${spotsLeft <= 3 ? 'text-red-400' : 'text-white/40'}`}>
              {isFull ? 'No spots left' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${fillPercent >= 80 ? 'bg-red-500' : fillPercent >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        <p className="text-white/50 text-sm leading-relaxed mb-3">{opp.description}</p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Hide tasks' : 'View tasks'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-6 pb-6 border-t border-white/5 pt-4">
              <h4 className="text-white/60 text-xs font-mono-data tracking-widest uppercase mb-3">Tasks & Responsibilities</h4>
              <ul className="space-y-2">
                {opp.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-white/60 text-sm">
                    <CheckCircle size={13} className="text-blue-400 mt-0.5 shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SignUpModal({ opp, onClose }: { opp: VolunteerOpportunity; onClose: () => void }) {
  const [form, setForm] = useState<SignUpFormData>({ name: '', email: '', grade: '', phone: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.grade) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSubmitted(true)
    toast.success(`Signed up for "${opp.title}"! Check your email for confirmation.`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md glass-card p-8 border-blue-500/20"
      >
        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-bold mb-2">You're Signed Up!</h3>
            <p className="text-white/60 text-sm mb-2">
              You've registered for <strong className="text-white">{opp.title}</strong>.
            </p>
            <p className="text-white/40 text-xs mb-6">Your advisor will confirm your spot via email. See you there!</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-white text-xl font-bold mb-1">Sign Up</h3>
              <p className="text-white/50 text-sm">{opp.title}</p>
              <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
                <span className="flex items-center gap-1"><Clock size={11} />{opp.date}</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{opp.location}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your.email@school.edu"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Grade <span className="text-red-400">*</span></label>
                  <select
                    value={form.grade}
                    onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    required
                  >
                    <option value="" className="bg-gray-900">Select grade</option>
                    <option value="9" className="bg-gray-900">9th Grade</option>
                    <option value="10" className="bg-gray-900">10th Grade</option>
                    <option value="11" className="bg-gray-900">11th Grade</option>
                    <option value="12" className="bg-gray-900">12th Grade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="555-0123"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any questions or special circumstances..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)]"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function Volunteer() {
  const [selectedOpp, setSelectedOpp] = useState<VolunteerOpportunity | null>(null)
  const [filterCategory, setFilterCategory] = useState<'all' | 'competition' | 'community' | 'chapter' | 'fundraiser'>('all')

  const filtered = filterCategory === 'all'
    ? opportunities
    : opportunities.filter(o => o.category === filterCategory)

  const totalHours = opportunities.reduce((sum, o) => sum + o.hours, 0)
  const totalSpots = opportunities.reduce((sum, o) => sum + (o.spotsTotal - o.spotsFilled), 0)

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)]">
      {/* Header */}
      <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.09_0.015_265)] to-[oklch(0.07_0.01_265)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-4">
            {opportunities.length} Opportunities Available
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">VOLUNTEER</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Earn community service hours, build your DECA portfolio, and give back to the chapter. Sign up for volunteer opportunities below.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              <span className="text-white font-bold font-mono-data">{totalHours}</span>
              <span className="text-white/50 text-sm">total hours available</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <span className="text-white font-bold font-mono-data">{totalSpots}</span>
              <span className="text-white/50 text-sm">spots remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-[oklch(0.07_0.01_265/0.95)] backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
          {(['all', 'competition', 'community', 'chapter', 'fundraiser'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                filterCategory === cat
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {cat === 'all' ? 'All' : categoryConfig[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(opp => (
            <OpportunityCard key={opp.id} opp={opp} onSignUp={setSelectedOpp} />
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-8 glass-card p-6 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30">
              <Users size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Questions about volunteering?</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Contact your DECA advisor for more information about volunteer opportunities, hour verification, and how volunteer service counts toward your DECA portfolio. Community service is a key component of DECA membership and looks great on college applications!
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href="https://www.deca.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Learn about DECA community service →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Up Modal */}
      <AnimatePresence>
        {selectedOpp && (
          <SignUpModal opp={selectedOpp} onClose={() => setSelectedOpp(null)} />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-display text-base">D</div>
            <span className="text-white/60 text-sm">CHHS DECA © 2025–2026</span>
          </div>
          <div className="flex items-center gap-6 text-white/30 text-sm">
            <a href="https://www.deca.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">DECA.org</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
