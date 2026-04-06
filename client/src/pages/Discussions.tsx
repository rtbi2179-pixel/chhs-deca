/*
 * CHHS DECA Discussions Page — Cinematic Dark Editorial
 * Community discussion board for students to ask questions, share tips, and connect
 * Categories: Events, Practice, General, Roleplay, Study Tips
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Heart, Reply, Search, Plus, Filter, TrendingUp } from 'lucide-react'

interface DiscussionThread {
  id: string
  title: string
  author: string
  category: 'Events' | 'Practice' | 'General' | 'Roleplay' | 'Study Tips'
  replies: number
  likes: number
  views: number
  timestamp: string
  preview: string
}

const discussionThreads: DiscussionThread[] = [
  {
    id: '1',
    title: 'Best strategies for Personal Financial Literacy exam?',
    author: 'Sarah Chen',
    category: 'Practice',
    replies: 12,
    likes: 24,
    views: 156,
    timestamp: '2 hours ago',
    preview: 'Has anyone taken the PFL exam? I\'m looking for study tips and practice resources...',
  },
  {
    id: '2',
    title: 'Roleplay scenario tips for Retail Management',
    author: 'Marcus Johnson',
    category: 'Roleplay',
    replies: 8,
    likes: 18,
    views: 112,
    timestamp: '4 hours ago',
    preview: 'What are some common judge questions in the Retail Management roleplay? Looking for tips...',
  },
  {
    id: '3',
    title: 'Which events are easiest to prepare for?',
    author: 'Alex Rivera',
    category: 'Events',
    replies: 15,
    likes: 31,
    views: 203,
    timestamp: '6 hours ago',
    preview: 'First time competing at DECA. Which events have the shortest learning curve?',
  },
  {
    id: '4',
    title: 'Study group forming for Marketing cluster',
    author: 'Jordan Lee',
    category: 'Study Tips',
    replies: 6,
    likes: 14,
    views: 89,
    timestamp: '1 day ago',
    preview: 'Anyone interested in forming a study group for Marketing events? We could meet weekly...',
  },
  {
    id: '5',
    title: 'How to handle difficult judge scenarios?',
    author: 'Taylor Smith',
    category: 'Roleplay',
    replies: 10,
    likes: 22,
    views: 134,
    timestamp: '1 day ago',
    preview: 'What do you do when a judge asks an unexpected question during roleplay?',
  },
  {
    id: '6',
    title: 'Decademy practice test scores - share your progress!',
    author: 'Casey Williams',
    category: 'Practice',
    replies: 20,
    likes: 45,
    views: 267,
    timestamp: '2 days ago',
    preview: 'Let\'s share our Decademy scores and motivate each other! Currently averaging 82%...',
  },
]

const categories = ['All', 'Events', 'Practice', 'General', 'Roleplay', 'Study Tips'] as const
type Category = typeof categories[number]

const categoryColors: Record<Category, string> = {
  'All': 'bg-white/10 text-white border-white/20',
  'Events': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Practice': 'bg-green-500/15 text-green-300 border-green-500/30',
  'General': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Roleplay': 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Study Tips': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
}

function ThreadCard({ thread }: { thread: DiscussionThread }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-5 border-white/5 hover:border-blue-500/30 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {thread.author.split(' ').map(n => n[0]).join('')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base group-hover:text-blue-400 transition-colors truncate">
                {thread.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-white/40 text-xs">{thread.author}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[thread.category as Category]}`}>
                  {thread.category}
                </span>
                <span className="text-white/30 text-xs">· {thread.timestamp}</span>
              </div>
            </div>
          </div>

          <p className="text-white/50 text-xs sm:text-sm line-clamp-2 mb-3">{thread.preview}</p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-white/40 text-xs">
            <div className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span>{thread.replies} replies</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={14} />
              <span>{thread.likes} likes</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp size={14} />
              <span>{thread.views} views</span>
            </div>
          </div>
        </div>

        {/* Reply Arrow */}
        <div className="shrink-0 text-white/20 group-hover:text-blue-400 transition-colors mt-1">
          <Reply size={16} />
        </div>
      </div>
    </motion.div>
  )
}

export default function Discussions() {
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [search, setSearch] = useState('')

  const filtered = discussionThreads.filter((thread) => {
    const matchCategory = activeCategory === 'All' || thread.category === activeCategory
    const matchSearch = search === '' || thread.title.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <MessageSquare size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl text-white">DISCUSSIONS</h1>
              <p className="text-white/60 text-lg mt-1">Ask questions, share tips, and connect with teammates</p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search discussions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg border font-medium text-sm transition-all duration-200 ${
                  activeCategory === cat
                    ? `${categoryColors[cat]} border-current`
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* New Thread Button */}
          <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)]">
            <Plus size={18} />
            Start New Discussion
          </button>
        </motion.div>

        {/* Threads List */}
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((thread) => <ThreadCard key={thread.id} thread={thread} />)
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <MessageSquare size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/40 text-lg">No discussions found. Be the first to start one!</p>
            </motion.div>
          )}
        </div>

        {/* Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 glass-card p-8 border-blue-500/20"
        >
          <h3 className="font-display text-2xl text-white mb-4">Discussion Guidelines</h3>
          <ul className="space-y-3 text-white/60 text-sm">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">•</span>
              <span>Be respectful and constructive in all discussions</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">•</span>
              <span>Stay on topic and use appropriate categories</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">•</span>
              <span>Share resources and tips to help your teammates prepare</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">•</span>
              <span>No spam, self-promotion, or off-topic content</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">•</span>
              <span>Have fun and support each other on the road to ICDC!</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
