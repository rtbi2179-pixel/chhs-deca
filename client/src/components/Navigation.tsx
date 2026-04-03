/*
 * CHHS DECA Navigation — Cinematic Dark Editorial
 * Floating glassmorphic top bar with backdrop blur
 * Active state: blue underline grow + text glow
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Menu, X, Trophy, BookOpen, Calendar, Users, Home, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: Trophy },
  { href: '/practice', label: 'Practice', icon: BookOpen },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/volunteer', label: 'Volunteer', icon: Users },
]

export default function Navigation() {
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663512099215/gkmjm4geRMb8GU58vHezuc/ch-paw-raw_b4eafc24.png"
                    alt="CH Paw Logo"
                    className="w-9 h-9 group-hover:drop-shadow-[0_0_12px_oklch(0.55_0.22_260/0.6)] transition-all duration-300"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300" />
                </div>
                <div>
                  <span className="font-display text-xl text-white tracking-wider">CHHS DECA</span>
                  <div className="text-[10px] text-blue-400/70 font-mono-data tracking-[0.2em] uppercase -mt-0.5">
                    Road to ICDC
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = location === href
                return (
                  <Link key={href} href={href}>
                    <div
                      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'text-blue-400 bg-blue-500/10'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={15} className={isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/70'} />
                      {label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* CTA + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.deca.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)]"
              >
                DECA.org
                <ChevronRight size={14} />
              </a>
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
                return (
                  <Link key={href} href={href}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={16} />
                      {label}
                    </div>
                  </Link>
                )
              })}
              <a
                href="https://www.deca.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                Visit DECA.org
                <ChevronRight size={14} />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
