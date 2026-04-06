/*
 * CHHS DECA Volunteer Sign-Up Page — Cinematic Dark Editorial
 * Volunteer opportunities with sign-up forms and hour tracking
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Clock, MapPin, CheckCircle, Star, ChevronDown, ChevronUp, Heart, Trophy, Zap, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { getLoginUrl } from '@/const'
import { Link } from 'wouter'

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
    description: 'Support the Texas DECA State Competition as a volunteer. Help with registration, logistics, and event management.',
    tasks: ['Manage competitor check-in', 'Assist with room assignments', 'Support event coordinators', 'Help with awards ceremony'],
  },
  {
    id: 7,
    title: 'ICDC 2026 Volunteer',
    date: 'April 25-28, 2026',
    time: 'Full conference',
    location: 'Orlando, FL',
    hours: 20,
    spotsTotal: 5,
    spotsFilled: 1,
    category: 'competition',
    description: 'Represent CHHS at the International Career Development Conference in Orlando. Help with logistics and support our competitors.',
    tasks: ['Assist with team logistics', 'Help with event management', 'Support competitors', 'Represent CHHS professionally'],
  },
  {
    id: 8,
    title: 'Mentorship Program Mentor',
    date: 'Ongoing',
    time: 'Flexible',
    location: 'CHHS Campus',
    hours: 5,
    spotsTotal: 12,
    spotsFilled: 8,
    category: 'chapter',
    description: 'Mentor a new DECA member and help them prepare for their first competition. Share your experience and knowledge!',
    tasks: ['Meet with mentee weekly', 'Help with event selection', 'Practice role-plays', 'Provide feedback and encouragement'],
  },
]

const categoryColors: Record<string, string> = {
  competition: 'from-blue-600/20 to-blue-800/10 border-blue-500/20',
  community: 'from-green-600/20 to-green-800/10 border-green-500/20',
  chapter: 'from-purple-600/20 to-purple-800/10 border-purple-500/20',
  fundraiser: 'from-orange-600/20 to-orange-800/10 border-orange-500/20',
}

const categoryIcons: Record<string, any> = {
  competition: Trophy,
  community: Heart,
  chapter: Users,
  fundraiser: Zap,
}

export default function Volunteer() {
  const { user, isAuthenticated } = useAuth()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [signedUpIds, setSignedUpIds] = useState<number[]>([])
  const signUpMutation = trpc.volunteers.signUp.useMutation()

  const handleSignUp = async (opportunityId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl()
      return
    }

    try {
      await signUpMutation.mutateAsync({ opportunityId })
      setSignedUpIds(prev => [...prev, opportunityId])
      toast.success('Successfully signed up for this opportunity!')
    } catch (error) {
      toast.error('Failed to sign up. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)]">
      {/* ── Hero Section ── */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-4">
              <Heart size={12} />
              Give Back to DECA
            </div>
            <h1 className="font-display text-5xl sm:text-6xl text-white mb-4">
              VOLUNTEER OPPORTUNITIES
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Build your leadership portfolio, earn community service hours, and help make CHHS DECA events amazing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Auth Prompt ── */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/20 border-b border-blue-500/20 px-4 sm:px-6 lg:px-8 py-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogIn size={18} className="text-blue-400" />
              <span className="text-white/80">Sign in to sign up for volunteer opportunities</span>
            </div>
            <a
              href={getLoginUrl()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </a>
          </div>
        </motion.div>
      )}

      {/* ── Opportunities Grid ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-6">
          {opportunities.map((opp, index) => {
            const Icon = categoryIcons[opp.category]
            const isSigned = signedUpIds.includes(opp.id)
            const spotsRemaining = opp.spotsTotal - opp.spotsFilled

            return (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`group relative p-6 rounded-xl bg-gradient-to-br ${categoryColors[opp.category]} border transition-all duration-300 cursor-pointer hover:border-opacity-100`}
                  onClick={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <Icon size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{opp.title}</h3>
                          <p className="text-white/50 text-xs font-mono-data uppercase tracking-wider">{opp.category}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Clock size={14} />
                          <span>{opp.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <MapPin size={14} />
                          <span>{opp.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Star size={14} />
                          <span>{opp.hours} hours</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Users size={14} />
                          <span>{spotsRemaining} spots left</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-white/5 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all"
                          style={{ width: `${(opp.spotsFilled / opp.spotsTotal) * 100}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-xs">{opp.spotsFilled}/{opp.spotsTotal} spots filled</span>
                        <div className="flex items-center gap-2">
                          {isSigned && (
                            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-semibold">
                              <CheckCircle size={12} />
                              Signed Up
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSignUp(opp.id)
                            }}
                            disabled={isSigned || spotsRemaining === 0 || signUpMutation.isPending}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                              isSigned
                                ? 'bg-green-600/20 text-green-300 cursor-default'
                                : spotsRemaining === 0
                                ? 'bg-gray-600/20 text-gray-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-[0_0_20px_oklch(0.55_0.22_260/0.3)]'
                            }`}
                          >
                            {signUpMutation.isPending ? 'Signing up...' : isSigned ? 'Signed Up' : spotsRemaining === 0 ? 'Full' : 'Sign Up'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: expandedId === opp.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={20} className="text-white/40" />
                    </motion.div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedId === opp.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 pt-6 border-t border-white/10"
                      >
                        <p className="text-white/70 mb-4">{opp.description}</p>
                        <div>
                          <h4 className="text-white font-semibold mb-3">Responsibilities:</h4>
                          <ul className="space-y-2">
                            {opp.tasks.map((task, i) => (
                              <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                                <CheckCircle size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-4xl text-white mb-4">Questions?</h2>
          <p className="text-white/60 mb-6">Contact the CHHS DECA leadership team or check our discussion board for more info.</p>
          <Link href="/discussions">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)]">
              Ask in Discussions
            </button>
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
