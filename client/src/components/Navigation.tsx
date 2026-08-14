import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Menu, X, Trophy, BookOpen, Calendar, Users, Home, LogOut, MessageSquare, MessageSquarePlus, Mic, Crown, Bell, DollarSign, TrendingUp, History, Building2, Zap, Sparkles, Brain, ClipboardCheck, Newspaper, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: Trophy },
  { href: '/practice', label: 'Practice', icon: BookOpen },
  { href: '/chapter-mock-exam', label: 'Mock Exam', icon: ClipboardCheck },
  { href: '/pi-quizlet', label: 'PI Quizlet', icon: Brain },
  { href: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/volunteer', label: 'Volunteer', icon: Users },
  { href: '/discussions', label: 'Discussions', icon: MessageSquare },
  { href: '/announcements', label: 'Announcements', icon: Bell },
  { href: '/feedback', label: 'Feedback', icon: MessageSquarePlus },
  { href: '/speech-ai', label: 'AI Tools', icon: Zap },
]

const adminLink = { href: '/admin', label: 'Admin', icon: Crown }
const formatNewsTimestamp = (value: Date | string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))

interface NavigationProps {
  onLoginRequired?: () => void
}

export default function Navigation({ onLoginRequired }: NavigationProps) {
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [showFinancialMenu, setShowFinancialMenu] = useState(false)
  const [showBluesNews, setShowBluesNews] = useState(false)
  const { user } = useAuth()
  const logoutMutation = trpc.auth.logout.useMutation()
  const utils = trpc.useUtils()
  const { data: blueBucksData } = trpc.practice.getBlueBucksBalance.useQuery(undefined, { enabled: !!user })
  const bluesNews = trpc.bbx.getBluesNews.useQuery({ limit: 8 }, { enabled: !!user, refetchInterval: 60_000 })
  const unreadNews = trpc.bbx.getUnreadNewsCount.useQuery(undefined, { enabled: !!user, refetchInterval: 60_000 })
  const markNewsRead = trpc.bbx.markNewsRead.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.bbx.getBluesNews.invalidate(), utils.bbx.getUnreadNewsCount.invalidate()])
    },
  })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    window.location.href = '/'
  }

  const handleProtectedNavClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault()
      e.stopPropagation()
      onLoginRequired?.()
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
          scrolled
            ? 'bg-[oklch(0.07_0.01_265/0.97)] border-b border-white/10 shadow-[0_8px_24px_oklch(0_0_0/0.22)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 group">
                <div className="relative">
                  <img
                    src="/manus-storage/blue-blazer-logo_d8b42460.png"
                    alt="Blue Blazer Logo"
                    className="w-8 h-8 transition-opacity duration-200 group-hover:opacity-85"
                  />
                </div>
                <div className="hidden sm:block">
                  <span className="font-display text-lg text-white tracking-wider">Blue Blazer</span>
                  <div className="text-[8px] text-blue-400/70 font-mono-data tracking-[0.2em] uppercase -mt-0.5">
                    Road to ICDC
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Nav - Expandable on Hover */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = location === href
                const isProtected = href !== '/'
                const isHovered = hoveredIcon === href
                
                return (
                  <Link key={href} href={isProtected && !user ? '#' : href}>
                    <motion.button
                      onClick={(e) => isProtected && handleProtectedNavClick(e, href)}
                      onMouseEnter={() => setHoveredIcon(href)}
                      onMouseLeave={() => setHoveredIcon(null)}
                      layout
                      className={`relative px-2 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? 'text-blue-400 bg-blue-500/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      } ${isProtected && !user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon size={20} />
                      
                      {/* Expandable Label */}
                      <motion.span
                        initial={false}
                        animate={{
                          opacity: isHovered ? 1 : 0,
                          width: isHovered ? 'auto' : 0,
                          marginLeft: isHovered ? 4 : 0,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: 'easeOut',
                        }}
                        className="text-xs font-medium overflow-hidden"
                      >
                        {label}
                      </motion.span>

                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-1 left-2 right-2 h-0.5 bg-blue-500 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  </Link>
                )
              })}
              
              {/* Members Link - Only show if user is admin */}
              {user && (user.role === 'admin' || user.role === 'super_admin') && (
                <Link href="/chapter/members">
                  <motion.button
                    onMouseEnter={() => setHoveredIcon('/chapter/members')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    layout
                    className={`relative px-2 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                      location === '/chapter/members'
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-green-400/60 hover:text-green-400 hover:bg-green-500/5'
                    }`}
                  >
                    <Users size={20} />
                    
                    {/* Expandable Label */}
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: hoveredIcon === '/chapter/members' ? 1 : 0,
                        width: hoveredIcon === '/chapter/members' ? 'auto' : 0,
                        marginLeft: hoveredIcon === '/chapter/members' ? 4 : 0,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: 'easeOut',
                      }}
                      className="text-xs font-medium overflow-hidden"
                    >
                      Members
                    </motion.span>

                    {location === '/chapter/members' && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-1 left-2 right-2 h-0.5 bg-green-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                </Link>
              )}
              
              {/* Admin Link - Only show if user is super admin */}
              {user && (user.email === 'rtbi2179@gmail.com' || user.email === 'sahan.mallampati@gmail.com') && (
                <Link href={adminLink.href}>
                  <motion.button
                    onMouseEnter={() => setHoveredIcon(adminLink.href)}
                    onMouseLeave={() => setHoveredIcon(null)}
                    layout
                    className={`relative px-2 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                      location === adminLink.href
                        ? 'text-yellow-400 bg-yellow-500/10'
                        : 'text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-500/5'
                    }`}
                  >
                    <adminLink.icon size={20} />
                    
                    {/* Expandable Label */}
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: hoveredIcon === adminLink.href ? 1 : 0,
                        width: hoveredIcon === adminLink.href ? 'auto' : 0,
                        marginLeft: hoveredIcon === adminLink.href ? 4 : 0,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: 'easeOut',
                      }}
                      className="text-xs font-medium overflow-hidden"
                    >
                      {adminLink.label}
                    </motion.span>

                    {location === adminLink.href && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-1 left-2 right-2 h-0.5 bg-yellow-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                </Link>
              )}
            </nav>

            {/* Right Side - Auth */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/profile">
                    <button className="text-white/50 hover:text-white text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      {user.name || user.username}
                    </button>
                  </Link>
                  
                  {/* Financial Systems Menu */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowFinancialMenu(!showFinancialMenu)
                        setShowBluesNews(false)
                      }}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                      title="Financial Systems"
                    >
                      <DollarSign size={20} />
                    </button>
                    
                    <AnimatePresence>
                      {showFinancialMenu && (
                        <motion.div
                          initial={{ opacity: 0, x: 20, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.9 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="absolute right-0 mt-2 bg-slate-900 border border-blue-500/30 rounded-lg shadow-xl z-[70] overflow-hidden"
                        >
                          <div className="flex flex-col gap-0 min-w-max">
                            {/* Blue Bucks Display */}
                            <div className="px-4 py-3 border-b border-blue-500/20 flex items-center gap-2">
                              <DollarSign size={16} className="text-blue-400" />
                              <span className="text-sm font-semibold text-white">{blueBucksData?.balance || 0} Blue Bucks</span>
                            </div>
                            <Link href="/study-cards">
                              <button
                                onClick={() => setShowFinancialMenu(false)}
                                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-blue-500/10 transition-colors text-sm text-white/80 hover:text-white border-b border-blue-500/20"
                              >
                                <Sparkles size={18} className="text-blue-300" />
                                <span className="font-medium">Study Cards</span>
                              </button>
                            </Link>
                            
                            {/* Banking Option */}
                            <Link href="/banking">
                              <button
                                onClick={() => setShowFinancialMenu(false)}
                                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-blue-500/10 transition-colors text-sm text-white/80 hover:text-white border-b border-blue-500/20"
                              >
                                <Building2 size={18} className="text-green-400" />
                                <span className="font-medium">Banking</span>
                              </button>
                            </Link>
                            
                            {/* Stock Market Option */}
                            <Link href="/blue-market">
                              <button
                                onClick={() => setShowFinancialMenu(false)}
                                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-blue-500/10 transition-colors text-sm text-white/80 hover:text-white border-b border-blue-500/20"
                              >
                                <TrendingUp size={18} className="text-purple-400" />
                                <span className="font-medium">Stock Market</span>
                              </button>
                            </Link>
                            
                            {/* Transaction History Option */}
                            <Link href="/transaction-history">
                              <button
                                onClick={() => setShowFinancialMenu(false)}
                                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-blue-500/10 transition-colors text-sm text-white/80 hover:text-white"
                              >
                                <History size={18} className="text-yellow-400" />
                                <span className="font-medium">Transactions</span>
                              </button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowBluesNews(!showBluesNews)
                        setShowFinancialMenu(false)
                      }}
                      className="relative p-2 text-blue-300 hover:text-blue-100 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                      title="Blue's News"
                      aria-label={`Blue's News${unreadNews.data?.count ? `, ${unreadNews.data.count} unread` : ''}`}
                    >
                      <Newspaper size={20} />
                      {(unreadNews.data?.count ?? 0) > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-950 bg-blue-500 px-1 text-[9px] font-bold leading-none text-white">{(unreadNews.data?.count ?? 0) > 99 ? '99+' : unreadNews.data?.count}</span>}
                    </button>
                    <AnimatePresence>
                      {showBluesNews && <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="absolute right-0 z-[70] mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-blue-400/25 bg-slate-950 shadow-2xl shadow-black/40">
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><p className="text-sm font-semibold text-white">Blue’s News</p><p className="mt-0.5 text-[10px] font-mono-data tracking-[0.12em] text-blue-300/70">FICTIONAL BBX REPORTING</p></div><button className="inline-flex items-center gap-1 text-xs text-blue-200 hover:text-white disabled:opacity-50" disabled={markNewsRead.isPending || (unreadNews.data?.count ?? 0) === 0} onClick={() => void markNewsRead.mutateAsync({ markAll: true })}><CheckCheck size={14} />Read all</button></div>
                        <div className="max-h-[60vh] divide-y divide-white/7 overflow-y-auto">
                          {bluesNews.isLoading ? <div className="px-4 py-8 text-center text-sm text-white/50">Loading Blue’s News…</div> : bluesNews.data?.length ? bluesNews.data.map((article) => <Link key={article.id} href="/blues-news"><button className={`w-full px-4 py-3.5 text-left transition-colors hover:bg-white/[0.045] ${article.isRead ? 'opacity-65' : 'bg-blue-500/[0.045]'}`} onClick={() => { if (!article.isRead) void markNewsRead.mutateAsync({ newsId: article.id }); setShowBluesNews(false) }}><div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${article.isRead ? 'bg-transparent' : 'bg-blue-400 shadow-[0_0_8px_oklch(0.7_0.17_245/0.65)]'}`} /><div className="min-w-0"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em]"><span className="text-blue-200">Simulated</span><span className="text-white/40">{article.severity}</span></div><p className="mt-1 line-clamp-2 text-sm font-medium text-white">{article.headline}</p><p className="mt-1 text-xs text-white/45">{formatNewsTimestamp(article.publishedAt)}</p></div></div></button></Link>) : <div className="px-4 py-8 text-center text-sm text-white/50">The next fictional BBX event will appear here.</div>}
                        </div>
                        <Link href="/blues-news"><button onClick={() => setShowBluesNews(false)} className="flex w-full items-center justify-center gap-2 border-t border-white/10 px-4 py-3 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-500/10 hover:text-white"><Newspaper size={15} />Open Blue’s News</button></Link>
                      </motion.div>}
                    </AnimatePresence>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <button className="hidden md:flex items-center justify-center p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200" title="Login">
                    <span className="text-sm font-medium">Login</span>
                  </button>
                </Link>
              )}
              <button
                className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[oklch(0.09_0.012_265/0.98)] backdrop-blur-xl border-b border-white/5"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = location === href
                const isProtected = href !== '/'
                return (
                  <Link key={href} href={isProtected && !user ? '#' : href}>
                    <div
                      onClick={(e) => {
                        if (isProtected && !user) {
                          handleProtectedNavClick(e as any, href)
                        } else {
                          setMobileOpen(false)
                        }
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      } ${isProtected && !user ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <Icon size={18} />
                      {label}
                    </div>
                  </Link>
                )
              })}
              <div className="border-t border-white/10 mt-2 pt-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-white/70 text-sm mb-2">
                      {user.name || user.username}
                    </div>
                    <Link href="/blues-news">
                      <button onClick={() => setMobileOpen(false)} className="mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-blue-200 hover:bg-blue-500/10">
                        <span className="relative"><Newspaper size={18} />{(unreadNews.data?.count ?? 0) > 0 && <span className="absolute -right-2 -top-2 h-3.5 min-w-3.5 rounded-full bg-blue-500 px-1 text-center text-[8px] leading-[14px] text-white">{unreadNews.data?.count}</span>}</span>
                        Blue’s News
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-lg"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login">
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg"
                    >
                      Login
                    </button>
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
