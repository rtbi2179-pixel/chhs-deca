import { useEffect, useState } from 'react'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { ArrowLeft, Flame, BookOpen, CheckCircle, Target, TrendingUp } from 'lucide-react'
import { useLocation } from 'wouter'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Please log in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Profile Header */}
        <div className="glass-card p-8 border-blue-500/20 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{user.name || user.username}</h1>
              <p className="text-white/60">{user.email}</p>
              {user.schoolCode && (
                <p className="text-blue-400 text-sm mt-2">School Code: {user.schoolCode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Questions Answered */}
          <div className="glass-card p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Questions Answered</h3>
              <BookOpen className="text-blue-400" size={24} />
            </div>
            <p className="text-4xl font-bold text-blue-400">{questionsAnswered}</p>
            <p className="text-white/50 text-sm mt-2">Total practice questions</p>
          </div>

          {/* Accuracy */}
          <div className="glass-card p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Accuracy</h3>
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <p className="text-4xl font-bold text-green-400">{accuracy.toFixed(1)}%</p>
            <p className="text-white/50 text-sm mt-2">Overall accuracy rate</p>
          </div>

          {/* Study Streak */}
          <div className="glass-card p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Study Streak</h3>
              <Flame className="text-orange-400" size={24} />
            </div>
            <p className="text-4xl font-bold text-orange-400">{studyStreak}</p>
            <p className="text-white/50 text-sm mt-2">Days in a row</p>
          </div>

          {/* Saved Questions */}
          <div className="glass-card p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Saved Questions</h3>
              <Target className="text-purple-400" size={24} />
            </div>
            <p className="text-4xl font-bold text-purple-400">{savedQuestions.length}</p>
            <p className="text-white/50 text-sm mt-2">Questions bookmarked</p>
          </div>
        </div>

        {/* Accuracy Per Topic - Placeholder */}
        <div className="glass-card p-8 border-blue-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="text-blue-400" size={28} />
            Accuracy Per Topic
          </h2>
          <p className="text-white/60">Topic accuracy data will be displayed here once you complete practice sessions.</p>
        </div>
      </div>
    </div>
  )
}
