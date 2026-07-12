import { useEffect, useState } from 'react'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { ArrowLeft, Flame, BookOpen, CheckCircle, Target, TrendingUp, Medal } from 'lucide-react'
import { useLocation } from 'wouter'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
}

export default function Profile() {
  const { user } = useAuth()
  const [, setLocation] = useLocation()
  const [studyStreak, setStudyStreak] = useState(0)

  // Fetch bookmarked questions
  const { data: savedQuestions = [] } = trpc.practice.getBookmarkedQuestions.useQuery(
    undefined,
    { enabled: !!user?.id }
  )

  // Fetch leaderboard to get user stats
  const { data: leaderboardData = [] } = trpc.practice.getLeaderboard.useQuery(
    { limit: 1000 },
    { enabled: !!user?.id }
  )

  // Find current user in leaderboard
  const userStats = (leaderboardData as any[]).find((entry: any) => {
    if ('user' in entry) return entry.user.id === user?.id
    if ('userId' in entry) return entry.userId === user?.id
    return false
  })

  const questionsAnswered = (userStats as any)?.questionsAnswered || (userStats as any)?.totalAnswered || 0
  const accuracy = (userStats as any)?.accuracy || 0

  if (!user) {
    return (
      <div className="min-h-screen bg-[oklch(0.07_0.01_265)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Please log in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-12 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Home
        </motion.button>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-slate-900/50 to-slate-950 p-8 backdrop-blur-sm">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            <div className="relative flex items-center gap-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-5xl font-bold text-white font-['Bebas_Neue']">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white font-['Bebas_Neue'] tracking-wide mb-2">
                  {user.name || user.username}
                </h1>
                <p className="text-blue-300 font-['Outfit'] mb-3">{user.email}</p>
                {user.schoolCode && (
                  <div className="inline-block px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-blue-300 text-sm font-['Outfit']">School Code: {user.schoolCode}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Questions Answered */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="group relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-slate-900/50 p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent group-hover:from-blue-500/10 pointer-events-none transition-all duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold font-['Outfit']">Questions Answered</h3>
                <BookOpen className="text-blue-400" size={24} />
              </div>
              <p className="text-5xl font-bold text-blue-400 font-['Space_Mono']">{questionsAnswered}</p>
              <p className="text-white/50 text-sm mt-2 font-['Outfit']">Total practice questions</p>
            </div>
          </motion.div>

          {/* Accuracy */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="group relative overflow-hidden rounded-xl border border-green-500/20 bg-gradient-to-br from-green-600/10 to-slate-900/50 p-6 backdrop-blur-sm hover:border-green-500/50 transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.60_0.22_140/0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent group-hover:from-green-500/10 pointer-events-none transition-all duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold font-['Outfit']">Accuracy</h3>
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <p className="text-5xl font-bold text-green-400 font-['Space_Mono']">{accuracy.toFixed(1)}%</p>
              <p className="text-white/50 text-sm mt-2 font-['Outfit']">Overall accuracy rate</p>
            </div>
          </motion.div>

          {/* Study Streak */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="group relative overflow-hidden rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-600/10 to-slate-900/50 p-6 backdrop-blur-sm hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.65_0.22_40/0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent group-hover:from-orange-500/10 pointer-events-none transition-all duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold font-['Outfit']">Study Streak</h3>
                <Flame className="text-orange-400" size={24} />
              </div>
              <p className="text-5xl font-bold text-orange-400 font-['Space_Mono']">{studyStreak}</p>
              <p className="text-white/50 text-sm mt-2 font-['Outfit']">Days in a row</p>
            </div>
          </motion.div>

          {/* Saved Questions */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 to-slate-900/50 p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.55_0.22_300/0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent group-hover:from-purple-500/10 pointer-events-none transition-all duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold font-['Outfit']">Saved Questions</h3>
                <Target className="text-purple-400" size={24} />
              </div>
              <p className="text-5xl font-bold text-purple-400 font-['Space_Mono']">{savedQuestions.length}</p>
              <p className="text-white/50 text-sm mt-2 font-['Outfit']">Questions bookmarked</p>
            </div>
          </motion.div>
        </div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-slate-900/50 to-slate-950 p-8 backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 font-['Bebas_Neue'] tracking-wide">
              <Medal className="text-yellow-400" size={32} />
              Achievements
            </h2>
            <p className="text-white/60 font-['Outfit']">
              Keep practicing and earning achievements! Complete more questions, improve your accuracy, and build your study streak to unlock special badges.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
