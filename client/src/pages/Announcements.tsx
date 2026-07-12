import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Upload, X, Send } from 'lucide-react'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { useSchoolCode } from '@/contexts/SchoolCodeContext'

export function Announcements() {
  const { user } = useAuth()
  const { selectedSchoolCode } = useSchoolCode()
  const [showPostForm, setShowPostForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string>()
  const [fileUrl, setFileUrl] = useState<string>()
  const [fileName, setFileName] = useState<string>()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [showManagement, setShowManagement] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const schoolCodeForQuery = selectedSchoolCode || user?.schoolCode || ''
  const announcements = trpc.announcements.getBySchool.useQuery(
    { schoolCode: schoolCodeForQuery },
    { enabled: !!schoolCodeForQuery }
  )

  const createAnnouncement = trpc.announcements.create.useMutation({
    onSuccess: () => {
      setTitle('')
      setContent('')
      setImageUrl(undefined)
      setFileUrl(undefined)
      setFileName(undefined)
      setShowPostForm(false)
      announcements.refetch()
      toast.success('Announcement posted!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to post announcement')
    },
  })

  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => {
      setIsEditing(false)
      setEditingId(null)
      announcements.refetch()
      toast.success('Announcement updated!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update announcement')
    },
  })

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      setShowManagement(null)
      announcements.refetch()
      toast.success('Announcement deleted!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete announcement')
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // For now, just use the file name as placeholder
      // In production, implement file upload to S3
      setImageUrl(URL.createObjectURL(file))
      toast.success('Image selected!')
    } catch (error) {
      toast.error('Failed to select image')
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // For now, just use the file name as placeholder
      // In production, implement file upload to S3
      setFileUrl(URL.createObjectURL(file))
      setFileName(file.name)
      toast.success('File selected!')
    } catch (error) {
      toast.error('Failed to select file')
    } finally {
      setUploading(false)
    }
  }

  const handlePostAnnouncement = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required')
      return
    }

    const schoolCode = selectedSchoolCode || user?.schoolCode
    if (!schoolCode) {
      toast.error('No school selected')
      return
    }

    createAnnouncement.mutate({
      title,
      content,
      imageUrl,
      fileUrl,
      fileName,
      schoolCode,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black pt-24 pb-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">
            ANNOUNCEMENTS
          </h1>
          <p className="text-white/60 text-lg">
            Stay updated with the latest news from your DECA chapter
          </p>
        </motion.div>

        {/* Post Button (Admin Only) */}
        {user && (user.role === 'admin' || user.role === 'super_admin') && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPostForm(!showPostForm)}
            className="mb-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition"
          >
            {showPostForm ? 'Cancel' : '+ Post Announcement'}
          </motion.button>
        )}

        {/* Post Form */}
        <AnimatePresence>
          {showPostForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <input
                type="text"
                placeholder="Announcement Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mb-4 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />

              <textarea
                placeholder="Announcement Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full mb-4 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
              />

              {/* Image Upload */}
              <div className="mb-4">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  hidden
                />
                {imageUrl && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-xs h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setImageUrl(undefined)}
                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  hidden
                />
                {fileName && (
                  <div className="mt-2 flex items-center justify-between bg-slate-700 p-2 rounded-lg">
                    <span className="text-white text-sm">{fileName}</span>
                    <button
                      onClick={() => {
                        setFileUrl(undefined)
                        setFileName(undefined)
                      }}
                      className="p-1 hover:bg-slate-600 rounded"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Post Button */}
              <button
                onClick={handlePostAnnouncement}
                disabled={createAnnouncement.isPending}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {createAnnouncement.isPending ? 'Posting...' : 'Post Announcement'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcements Feed */}
        <div className="space-y-6">
          {announcements.isLoading ? (
            <div className="text-center text-white/60">Loading announcements...</div>
          ) : announcements.data?.length === 0 ? (
            <div className="text-center text-white/60">No announcements yet</div>
          ) : (
            announcements.data?.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AnnouncementCard({ announcement }: any) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showManagement, setShowManagement] = useState(false)
  const [editTitle, setEditTitle] = useState(announcement.title)
  const [editContent, setEditContent] = useState(announcement.content)
  const [isEditing, setIsEditing] = useState(false)

  const likes = trpc.announcements.getLikes.useQuery({ announcementId: announcement.id })
  const comments = trpc.announcements.getComments.useQuery({ announcementId: announcement.id })
  const adminComments = trpc.announcements.getAdminComments.useQuery(
    { announcementId: announcement.id },
    { enabled: user?.role === 'admin' || user?.role === 'super_admin' }
  )
  
  const likeMutation = trpc.announcements.like.useMutation({
    onSuccess: () => {
      likes.refetch()
    },
  })

  const commentMutation = trpc.announcements.addComment.useMutation({
    onSuccess: () => {
      setCommentText('')
      comments.refetch()
    },
  })

  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => {
      setIsEditing(false)
      toast.success('Announcement updated!')
    },
  })

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      toast.success('Announcement deleted!')
    },
  })

  const adminCommentMutation = trpc.announcements.addAdminComment.useMutation({
    onSuccess: () => {
      setCommentText('')
      adminComments.refetch()
    },
  })

  const handleLike = () => {
    likeMutation.mutate({ announcementId: announcement.id })
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    commentMutation.mutate({
      announcementId: announcement.id,
      content: commentText,
    })
  }

  const date = new Date(announcement.createdAt).toLocaleDateString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{isEditing ? 'Edit Announcement' : announcement.title}</h3>
          <p className="text-sm text-white/60">
            {announcement.authorName} • {date}
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <button
            onClick={() => setShowManagement(showManagement === announcement.id ? null : announcement.id)}
            className="px-3 py-1 bg-blue-600/20 border border-blue-500/50 hover:border-blue-500 text-blue-400 text-sm rounded transition"
          >
            {showManagement === announcement.id ? '✕ Close' : '👑 Manage'}
          </button>
        )}
      </div>

      {/* Management Mode */}
      {showManagement === announcement.id && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg"
        >
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                placeholder="Title"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                placeholder="Content"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateMutation.mutate({
                      announcementId: announcement.id,
                      title: editTitle,
                      content: editContent,
                    })
                  }}
                  disabled={updateMutation.isPending}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this announcement?')) {
                    deleteMutation.mutate({ announcementId: announcement.id })
                  }
                }}
                disabled={deleteMutation.isPending}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Content */}
      <p className="text-white/80 mb-4">{announcement.content}</p>

      {/* Image */}
      {announcement.imageUrl && (
        <img
          src={announcement.imageUrl}
          alt={announcement.title}
          className="w-full max-h-96 object-cover rounded-lg mb-4"
        />
      )}

      {/* File Link */}
      {announcement.fileUrl && (
        <a
          href={announcement.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
        >
          📎 {announcement.fileName}
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 text-white/60 text-sm">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 hover:text-red-400 transition"
        >
          <Heart size={18} fill={likeMutation.isPending ? 'currentColor' : 'none'} />
          {likes.data || 0}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 hover:text-blue-400 transition"
        >
          <MessageCircle size={18} />
          {comments.data?.length || 0}
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-700"
          >
            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {comments.data?.map((comment) => (
                <div key={comment.id} className="text-sm">
                  <p className="font-semibold text-white">{comment.userName}</p>
                  <p className="text-white/70">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            {user && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  onClick={handleComment}
                  disabled={commentMutation.isPending || !commentText.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
