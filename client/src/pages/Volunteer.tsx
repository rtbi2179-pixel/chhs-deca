/*
 * Blue Blazer Volunteer Sign-Up Page — Cinematic Dark Editorial
 * Volunteer opportunities with sign-up forms and hour tracking
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Clock, MapPin, CheckCircle, Star, ChevronDown, ChevronUp, Heart, Trophy, Zap, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/_core/hooks/useAuth'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { useSchoolCode } from '@/contexts/SchoolCodeContext'
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
    location: 'Blue Blazer Main Campus',
    hours: 8,
    spotsTotal: 15,
    category: 'competition',
    description: 'Help run the district DECA competition by assisting judges, managing check-in, and supporting event logistics.',
    tasks: ['Check-in competitor registration', 'Guide participants to event rooms', 'Assist judges with materials', 'Help with scoring and tabulation', 'Set up and break down event spaces'],
  },
  {
    id: 2,
    title: 'Financial Literacy Workshop Volunteer',
    date: 'November 18, 2025',
    time: '9:00 AM – 12:00 PM',
    location: 'Blue Blazer Library',
    hours: 3,
    spotsTotal: 8,
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
    category: 'community',
    description: 'Annual DECA Week community service event. Help sort and distribute food at the local food bank.',
    tasks: ['Sort donated food items', 'Pack food boxes', 'Assist with distribution', 'Help with inventory tracking'],
  },
  {
    id: 4,
    title: 'Chapter Fundraiser — Car Wash',
    date: 'October 11, 2025',
    time: '10:00 AM – 3:00 PM',
    location: 'Blue Blazer Parking Lot',
    hours: 5,
    spotsTotal: 25,
    category: 'fundraiser',
    description: 'Help raise funds for chapter competition travel expenses by running our annual car wash fundraiser.',
    tasks: ['Wash and dry vehicles', 'Collect donations', 'Manage customer flow', 'Handle marketing/signage'],
  },
  {
    id: 5,
    title: 'Mock Competition Judge',
    date: 'November 3, 2025',
    time: '8:00 AM – 12:00 PM',
    location: 'Blue Blazer Cafeteria',
    hours: 4,
    spotsTotal: 10,
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
    category: 'competition',
    description: 'Represent Blue Blazer at the International Career Development Conference in Orlando. Help with logistics and support our competitors.',
    tasks: ['Assist with team logistics', 'Help with event management', 'Support competitors', 'Represent Blue Blazer professionally'],
  },
  {
    id: 8,
    title: 'Mentorship Program Mentor',
    date: 'Ongoing',
    time: 'Flexible',
    location: 'Blue Blazer Campus',
    hours: 5,
    spotsTotal: 12,
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

const Volunteer = () => {
  const { user, isAuthenticated } = useAuth()
  const { adminModeActive, setAdminModeActive, neonOverlayRef, setNeonOverlayRef, deactivateAdminMode } = useAdminMode()
  const { selectedSchoolCode } = useSchoolCode()
  
  // Prefer the live chapter selection, then the persisted selection returned with auth.
  const effectiveSchoolCode = user?.role === 'super_admin'
    ? (selectedSchoolCode || user.selectedSchoolCode || user.schoolCode)
    : user?.schoolCode
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [signedUpIds, setSignedUpIds] = useState<number[]>([])
  const [showSignups, setShowSignups] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingOpp, setEditingOpp] = useState<any | null>(null)
  const [newOpp, setNewOpp] = useState({ title: '', description: '', date: '', spotsAvailable: 1 })
  
  // Load all signups from database
  const { data: allSignups = [] } = trpc.volunteers.getAllSignups.useQuery()
  const utils = trpc.useUtils()
  const { data: dbOpportunities = [] } = trpc.volunteers.getAll.useQuery(
    { schoolCode: effectiveSchoolCode || undefined },
    { enabled: !!effectiveSchoolCode }
  )
  const createOppMutation = trpc.volunteers.create.useMutation({
    onSuccess: () => { 
      utils.volunteers.getAll.invalidate()
      setShowAddModal(false)
      setNewOpp({ title: '', description: '', date: '', spotsAvailable: 1 })
      toast.success('Opportunity created successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create opportunity')
    }
  })
  const updateOppMutation = trpc.volunteers.update.useMutation({
    onSuccess: () => { utils.volunteers.getAll.invalidate(); setEditingOpp(null) }
  })
  const deleteOppMutation = trpc.volunteers.delete.useMutation({
    onSuccess: () => { utils.volunteers.getAll.invalidate() }
  })
  
  const signUpMutation = trpc.volunteers.signUp.useMutation()
  const { data: signups = [] } = trpc.volunteers.getByOpportunity.useQuery(
    { opportunityId: showSignups || 0 },
    { enabled: !!showSignups }
  )

  // Calculate spotsFilled for each opportunity based on real signups
  const opportunitiesWithRealCounts = useMemo(() => {
    const oppsToUse = dbOpportunities.length > 0 ? dbOpportunities : opportunities
    return oppsToUse.map((opp: any) => {
      const signupCount = allSignups.filter((s: any) => s.signup?.opportunityId === opp.id).length
      return {
        ...opp,
        spotsFilled: signupCount
      }
    })
  }, [dbOpportunities, allSignups])

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
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="font-display text-5xl sm:text-6xl text-white">
                VOLUNTEER OPPORTUNITIES
              </h1>
              {user && (user.role === 'admin' || user.role === 'super_admin') && (
                <div className="flex items-center gap-2">
                  <button
                  onClick={() => {
                    if (adminModeActive) {
                      deactivateAdminMode()
                      toast.info('🔵 Admin mode deactivated')
                    } else {
                      setAdminModeActive(true)
                      toast.info('🔵 YOU ARE IN ADMIN MODE')
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] border border-yellow-500/30 text-yellow-400 rounded-lg transition text-sm font-semibold whitespace-nowrap"
                  title="Manage volunteer opportunities (admin only)"
                >
                  {adminModeActive ? "🔴 Exit Admin" : "👑 Manage"}
                </button>
                {adminModeActive && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-500/50 text-blue-300 rounded-lg transition text-sm font-semibold whitespace-nowrap"
                  >
                    ➕ Add Opportunity
                  </button>
                )}
                </div>
              )}
            </div>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Build your leadership portfolio, earn community service hours, and help make Blue Blazer events amazing.
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
          {opportunitiesWithRealCounts.map((opp, index) => {
            const Icon = categoryIcons[opp.category] || Trophy
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
                          <span>{typeof opp.date === 'string' ? opp.date : new Date(opp.date).toLocaleDateString()}</span>
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowSignups(opp.id)
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all border border-white/10 hover:border-blue-500/30"
                            title="View who signed up"
                          >
                            View Signups ({opp.spotsFilled})
                          </button>
                          {isSigned && (
                            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-semibold">
                              <CheckCircle size={12} />
                              Signed Up
                            </div>
                          )}
                          {adminModeActive && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Are you sure you want to delete this opportunity?')) {
                                  deleteOppMutation.mutateAsync({ id: opp.id }).then(() => {
                                    toast.success('Opportunity deleted')
                                  }).catch(() => {
                                    toast.error('Failed to delete opportunity')
                                  })
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 text-xs font-semibold transition-all border border-red-500/30 hover:border-red-500/50"
                              title="Delete opportunity"
                            >
                              🗑️ Delete
                            </button>
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
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedId === opp.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-white/70 text-sm mb-4">{opp.description}</p>
                        <div>
                          <h4 className="text-white font-semibold text-sm mb-3">Tasks:</h4>
                          <ul className="space-y-2">
                            {opp.tasks?.map((task: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                                <span className="text-blue-400 mt-1">•</span>
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

      {/* ── FAQ Section ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="section-divider mb-16" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl text-white mb-8">QUESTIONS?</h2>
          <div className="glass-card p-8 border-blue-500/20">
            <p className="text-white/60 text-lg mb-6">
              Have questions about volunteering? Want to suggest a new opportunity? Reach out to the DECA leadership team or ask in our community discussions.
            </p>
            <Link href="/discussions">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)]">
                Ask in Discussions
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Add Opportunity Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[oklch(0.12_0.01_265)] border border-blue-500/30 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Add Volunteer Opportunity</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={newOpp.title}
                    onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                    placeholder="Opportunity title"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Description</label>
                  <textarea
                    value={newOpp.description}
                    onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })}
                    placeholder="Opportunity description"
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Date</label>
                  <input
                    type="text"
                    value={newOpp.date}
                    onChange={(e) => setNewOpp({ ...newOpp, date: e.target.value })}
                    placeholder="MM/DD/YYYY"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Spots Available</label>
                  <input
                    type="number"
                    value={newOpp.spotsAvailable}
                    onChange={(e) => setNewOpp({ ...newOpp, spotsAvailable: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      if (newOpp.title.trim() && newOpp.description.trim() && newOpp.date.trim()) {
                        createOppMutation.mutateAsync({
                          title: newOpp.title,
                          description: newOpp.description,
                          date: new Date(newOpp.date),
                          spotsAvailable: newOpp.spotsAvailable
                        }).then(() => {
                          toast.success('Opportunity created')
                        }).catch(() => {
                          toast.error('Failed to create opportunity')
                        })
                      } else {
                        toast.error('Please fill in all fields')
                      }
                    }}
                    disabled={createOppMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors"
                  >
                    {createOppMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Signups Modal ── */}
      <AnimatePresence>
        {showSignups && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSignups(null)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[oklch(0.12_0.01_265)] border border-blue-500/30 rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Volunteers Signed Up</h3>
                <button
                  onClick={() => setShowSignups(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {signups.length === 0 ? (
                <p className="text-white/50 text-center py-8">No one has signed up yet</p>
              ) : (
                <div className="space-y-3">
                  {signups.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white font-semibold text-sm">{item.user?.name}</p>
                      <p className="text-white/50 text-xs">{item.user?.email}</p>
                      <p className="text-blue-400 text-xs mt-1 capitalize">Status: {item.signup?.status?.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Volunteer
