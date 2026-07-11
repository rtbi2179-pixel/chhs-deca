import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Menu, X, Trophy, BookOpen, Calendar, Users, Home, LogOut, BarChart3, MessageSquare, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: Trophy },
  { href: '/practice', label: 'Practice', icon: BookOpen },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/volunteer', label: 'Volunteer', icon: Users },
  { href: '/discussions', label: 'Discussions', icon: MessageSquare },
  { href: '/speech-ai', label: 'Speech AI', icon: Mic },
  { href: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
]

interface NavigationProps {
  onLoginRequired?: () => void
}

export default function Navigation({ onLoginRequired }: NavigationProps) {
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const { user } = useAuth()
  const logoutMutation = trpc.auth.logout.useMutation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    window.location.href = '/'
  }

  const handleProtectedNavClick = (href: string) => {
    if (!user) {
      onLoginRequired?.()
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
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
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663512099215/gkmjm4geRMb8GU58vHezuc/ch-paw-raw_b4eafc24.png"
                    alt="CH Paw Logo"
                    className="w-8 h-8 group-hover:drop-shadow-[0_0_12px_oklch(0.55_0.22_260/0.6)] transition-all duration-300"
                  />
                </div>
                <div className="hidden sm:block">
                  <span className="font-display text-lg text-white tracking-wider">CHHS DECA</span>
                  <div className="text-[8px] text-blue-400/70 font-mono-data tracking-[0.2em] uppercase -mt-0.5">
                    Road to ICDC
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Nav - Icon Only */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = location === href
                const isProtected = href !== '/'
                return (
                  <div key={href} className="relative group">
                    <Link href={isProtected && !user ? '#' : href}>
                      <button
                        onClick={() => isProtected && handleProtectedNavClick(href)}
                        onMouseEnter={() => setHoveredIcon(href)}
                        onMouseLeave={() => setHoveredIcon(null)}
                        className={`relative p-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'text-blue-400 bg-blue-500/10'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        } ${isProtected && !user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Icon size={20} />
                        {isActive && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute bottom-1 left-2 right-2 h-0.5 bg-blue-500 rounded-full"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                      </button>
                    </Link>
                    
                    {/* Tooltip */}
                    <AnimatePresence>
                      {hoveredIcon === href && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-xs font-medium whitespace-nowrap pointer-events-none"
                        >
                          {label}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white/10 border-r border-b border-white/20 transform rotate-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </nav>

            {/* Right Side - Auth */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <div className="text-white/50 text-xs px-3 py-1 rounded-lg bg-white/5">
                    {user.name || user.username}
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
                      onClick={() => {
                        if (isProtected && !user) {
                          handleProtectedNavClick(href)
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
