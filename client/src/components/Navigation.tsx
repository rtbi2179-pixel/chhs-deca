import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Menu, X, Trophy, BookOpen, Calendar, Users, Home, LogOut, MessageSquare, Mic, Crown, Bell, DollarSign, TrendingUp, History, Building2, Zap, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: Trophy },
  { href: '/practice', label: 'Practice', icon: BookOpen },
  { href: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/volunteer', label: 'Volunteer', icon: Users },
  { href: '/discussions', label: 'Discussions', icon: MessageSquare },
  { href: '/announcements', label: 'Announcements', icon: Bell },
  { href: '/speech-ai', label: 'AI Tools', icon: Zap },
]

const adminLink = { href: '/admin', label: 'Admin', icon: Crown }

interface NavigationProps {
  onLoginRequired?: () => void
}

export default function Navigation({ onLoginRequired }: NavigationProps) {
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [showFinancialMenu, setShowFinancialMenu] = useState(false)
  const { user } = useAuth()
  const logoutMutation = trpc.auth.logout.useMutation()
  const { data: blueBucksData } = trpc.practice.getBlueBucksBalance.useQuery(undefined, { enabled: !!user })

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
            ? 'bg-[oklch(0.07_0.01_265/0.92)] backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_oklch(0_0_0/0.5)]'
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
                    src="/manus-storage/Untitleddesign_c1fb0d88.png"
                    alt="Blue Blazer Logo"
                    className="w-8 h-8 group-hover:drop-shadow-[0_0_12px_oklch(0.55_0.22_260/0.6)] transition-all duration-300"
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
                      onClick={() => setShowFinancialMenu(!showFinancialMenu)}
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
