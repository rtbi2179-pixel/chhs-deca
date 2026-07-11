/*
 * CHHS DECA Discussions Page — Active Community Forum
 * Real-time discussion threads with user participation
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Heart, MessageCircle, Send, LogIn, Plus, Search, Filter, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/_core/hooks/useAuth'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { trpc } from '@/lib/trpc'
import { getLoginUrl } from '@/const'

const categories = [
  { id: 'general', label: 'General', color: 'text-blue-400' },
  { id: 'events', label: 'Events', color: 'text-green-400' },
  { id: 'practice', label: 'Practice', color: 'text-purple-400' },
  { id: 'roleplay', label: 'Roleplay', color: 'text-orange-400' },
  { id: 'study-tips', label: 'Study Tips', color: 'text-pink-400' },
]

export default function Discussions() {
  const { user, isAuthenticated } = useAuth()
  const { adminModeActive, setAdminModeActive, neonOverlayRef, setNeonOverlayRef, deactivateAdminMode } = useAdminMode()
  const [selectedCategory, setSelectedCategory] = useState<string>('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewThread, setShowNewThread] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')
  const [newReplyContent, setNewReplyContent] = useState('')

  // Fetch threads
  const { data: threads = [] } = trpc.discussions.getThreads.useQuery({
    category: selectedCategory,
  })

  // Fetch replies for selected thread
  const { data: replies = [] } = trpc.discussions.getReplies.useQuery(
    { threadId: selectedThreadId || 0 },
    { enabled: !!selectedThreadId }
  )

  const createThreadMutation = trpc.discussions.createThread.useMutation()
  const createReplyMutation = trpc.discussions.createReply.useMutation()
  const deleteThreadMutation = trpc.discussions.deleteThread.useMutation()
  const deleteReplyMutation = trpc.discussions.deleteReply.useMutation()

  const handleCreateThread = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl()
      return
    }

    if (!newThreadTitle.trim() || !newThreadContent.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await createThreadMutation.mutateAsync({
        title: newThreadTitle,
        content: newThreadContent,
        category: selectedCategory,
      })
      setNewThreadTitle('')
      setNewThreadContent('')
      setShowNewThread(false)
      toast.success('Thread created successfully!')
    } catch (error) {
      toast.error('Failed to create thread')
    }
  }

  const handleCreateReply = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isAuthenticated) {
      window.location.href = getLoginUrl()
      return
    }

    if (!newReplyContent.trim() || !selectedThreadId) {
      toast.error('Please enter a reply')
      return
    }

    try {
      await createReplyMutation.mutateAsync({
        threadId: selectedThreadId,
        content: newReplyContent,
      })
      setNewReplyContent('')
      toast.success('Reply posted!')
    } catch (error) {
      toast.error('Failed to post reply')
    }
  }

  const handleThreadClick = (e: React.MouseEvent, threadId: number | null) => {
    e.stopPropagation()
    setSelectedThreadId(selectedThreadId === threadId ? null : threadId)
  }

  const handleDeleteThread = async (e: React.MouseEvent, threadId: number) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this thread? All replies will also be deleted.')) return
    
    try {
      await deleteThreadMutation.mutateAsync({ threadId })
      setSelectedThreadId(null)
      toast.success('Thread deleted')
    } catch (error) {
      toast.error('Failed to delete thread')
    }
  }

  const handleDeleteReply = async (e: React.MouseEvent, replyId: number) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this reply?')) return
    
    try {
      await deleteReplyMutation.mutateAsync({ replyId })
      toast.success('Reply deleted')
    } catch (error) {
      toast.error('Failed to delete reply')
    }
  }

  const handleManageClick = () => {
    if (adminModeActive) {
      // Toggle off
      deactivateAdminMode()
      toast.info('🔵 Admin mode deactivated')
    } else {
      // Toggle on
      const neonOverlay = document.createElement('div')
      neonOverlay.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 40; background: radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, transparent 70%); box-shadow: inset 0 0 60px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.3); border: 2px solid rgba(59,130,246,0.8);'
      document.body.appendChild(neonOverlay)
      setNeonOverlayRef(neonOverlay)
      setAdminModeActive(true)
      toast.info('🔵 YOU ARE IN ADMIN MODE')
    }
  }

  const filteredThreads = threads.filter(t =>
    (t.thread?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <MessageSquare size={12} />
              Community Forum
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="font-display text-5xl sm:text-6xl text-white">
                DISCUSSIONS
              </h1>
              {user && (user.role === 'admin' || user.role === 'super_admin') && (
                <button
                  onClick={handleManageClick}
                  className="ml-4 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] border border-yellow-500/30 text-yellow-400 rounded-lg transition text-sm font-semibold"
                  title="Manage discussions (admin only)"
                >
                  👑 Manage
                </button>
              )}
            </div>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Ask questions, share tips, and connect with your DECA teammates.
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
              <span className="text-white/80">Sign in to participate in discussions</span>
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

      {/* ── Main Content ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── Sidebar: Categories & Controls ── */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* New Thread Button */}
              {isAuthenticated && (
                <button
                  onClick={() => setShowNewThread(!showNewThread)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all hover:shadow-[0_0_20px_oklch(0.55_0.22_260/0.3)]"
                >
                  <Plus size={16} />
                  New Thread
                </button>
              )}

              {/* Categories */}
              <div className="glass-card p-4 border-blue-500/20 space-y-2">
                <h3 className="text-white font-semibold text-sm mb-3">Categories</h3>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      setSelectedThreadId(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600/30 border border-blue-500/50 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className={`text-sm font-medium ${cat.color}`}>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Guidelines */}
              <div className="glass-card p-4 border-blue-500/20">
                <h3 className="text-white font-semibold text-sm mb-3">Guidelines</h3>
                <ul className="space-y-2 text-white/50 text-xs">
                  <li>• Be respectful and constructive</li>
                  <li>• Stay on topic</li>
                  <li>• No spam or self-promotion</li>
                  <li>• Help others succeed</li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* ── Main Content: Threads ── */}
          <div className="lg:col-span-3">
            {/* New Thread Form */}
            <AnimatePresence>
              {showNewThread && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 glass-card p-6 border-blue-500/20"
                >
                  <h3 className="text-white font-semibold mb-4">Start a New Thread</h3>
                  <input
                    type="text"
                    placeholder="Thread title..."
                    value={newThreadTitle}
                    onChange={e => setNewThreadTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 mb-3 focus:outline-none focus:border-blue-500/50"
                  />
                  <textarea
                    placeholder="What's on your mind? (supports markdown)"
                    value={newThreadContent}
                    onChange={e => setNewThreadContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 mb-4 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateThread}
                      disabled={createThreadMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {createThreadMutation.isPending ? 'Posting...' : 'Post Thread'}
                    </button>
                    <button
                      onClick={() => setShowNewThread(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search & Filter */}
            <div className="mb-6 flex gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-3 text-white/40" />
                <input
                  type="text"
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Threads List */}
            <div className="space-y-4">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={40} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/40">No threads yet. Be the first to start a discussion!</p>
                </div>
              ) : (
                filteredThreads.map((item, index) => {
                  const thread = item.thread
                  const author = item.author
                  const isSelected = selectedThreadId === thread?.id
                  const isThreadAuthor = user?.id === author?.id

                  return (
                    <motion.div
                      key={thread?.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/50'
                          : 'bg-white/3 border-white/10 hover:bg-white/5 hover:border-blue-500/30'
                      }`}
                    >
                      <div
                        onClick={(e) => handleThreadClick(e, thread?.id || null)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold mb-1 truncate">{thread?.title}</h4>
                            <p className="text-white/60 text-sm mb-2 line-clamp-2">{thread?.content}</p>
                            <div className="flex items-center gap-4 text-white/40 text-xs">
                              <span>{author?.name}</span>
                              <span>•</span>
                              <span>{thread?.views || 0} views</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-white/40">
                              <MessageCircle size={16} />
                              <span className="text-sm font-semibold">0</span>
                            </div>
                            {(isThreadAuthor || user?.role === 'admin') && (
                              <button
                                onClick={(e) => handleDeleteThread(e, thread?.id || 0)}
                                className="text-white/40 hover:text-red-400 transition-colors"
                                title="Delete thread"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded View */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Replies */}
                            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                              {replies.length === 0 ? (
                                <p className="text-white/40 text-sm">No replies yet. Be the first to respond!</p>
                              ) : (
                                replies.map(r => (
                                  <div key={r.reply?.id} className="p-3 bg-white/3 rounded-lg">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <span className="text-white/70 text-sm font-semibold">{r.author?.name}</span>
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-white/40 text-xs">
                                          <Heart size={12} />
                                          {r.reply?.likes || 0}
                                        </div>
                                        {(user?.id === r.author?.id || user?.role === 'admin') && (
                                          <button
                                            onClick={(e) => handleDeleteReply(e, r.reply?.id || 0)}
                                            className="text-white/40 hover:text-red-400 transition-colors"
                                            title="Delete reply"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-white/60 text-sm">{r.reply?.content}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Reply Form */}
                            {isAuthenticated && (
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  value={newReplyContent}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    setNewReplyContent(e.target.value)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                                <button
                                  onClick={handleCreateReply}
                                  disabled={createReplyMutation.isPending}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <Send size={16} />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
