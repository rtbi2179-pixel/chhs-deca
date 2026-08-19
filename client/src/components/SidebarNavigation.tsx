import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { InteractiveBackground, type BackgroundVariant } from '@/components/InteractiveBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { getProfileAvatar } from '@/lib/profileVisuals';
import {
  Home,
  BookOpen,
  Target,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  Newspaper,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  Bell,
  Zap,
  MessageSquarePlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BLUE_BLAZER_LOGO = '/manus-storage/Untitleddesign_c1fb0d88.png';

const mainNavLinks = [
  { href: '/', label: 'Overview', icon: Home, group: 'MAIN' },
  { href: '/events', label: 'Events', icon: Calendar, group: 'MAIN' },
  { href: '/practice', label: 'Practice', icon: Target, group: 'MAIN' },
  { href: '/speech-ai', label: 'AI Study & Roleplay', icon: Zap, group: 'MAIN' },
  { href: '/leaderboard', label: 'Leaderboard', icon: TrendingUp, group: 'MAIN' },
];

const chapterNavLinks = [
  { href: '/calendar', label: 'Calendar', icon: Calendar, group: 'CHAPTER' },
  { href: '/announcements', label: 'Announcements', icon: Bell, group: 'CHAPTER' },
  { href: '/discussions', label: 'Discussion Posts', icon: MessageSquare, group: 'CHAPTER' },
  { href: '/volunteer', label: 'Volunteer Sign-Ups', icon: Users, group: 'CHAPTER' },
  { href: '/feedback', label: 'Feedback', icon: MessageSquarePlus, group: 'MAIN' },
];

const financialNavLinks = [
  { href: '/banking', label: 'Banking & Cards', icon: Building2, group: 'FINANCIAL' },
  { href: '/blue-market', label: 'Stock Market (BBX)', icon: TrendingUp, group: 'FINANCIAL' },
  { href: '/blues-news', label: "Blue's News", icon: Newspaper, group: 'FINANCIAL' },
];

const chapterManagementNavLinks = [
  { href: '/chapter/members', label: 'Member Management', icon: Users, group: 'CHAPTER_MANAGEMENT' },
  { href: '/admin', label: 'Chapter Management', icon: ShieldAlert, group: 'CHAPTER_MANAGEMENT' },
];

function atmosphereForRoute(location: string): Exclude<BackgroundVariant, "hero" | "overview"> {
  if (location.startsWith('/events')) return 'events';
  if (location.startsWith('/practice')) return 'practice';
  if (location.startsWith('/mock-exams')) return 'mockExam';
  if (location.startsWith('/speech-ai')) return 'roleplay';
  if (location.startsWith('/leaderboard')) return 'leaderboard';
  if (location.startsWith('/pi-quizlet')) return 'piLibrary';
  if (location.startsWith('/calendar')) return 'calendar';
  if (location.startsWith('/announcements')) return 'announcements';
  if (location.startsWith('/discussions')) return 'discussions';
  if (location.startsWith('/volunteer')) return 'volunteer';
  if (location.startsWith('/feedback')) return 'feedback';
  if (location.startsWith('/banking')) return 'banking';
  if (location.startsWith('/blue-market') || location.startsWith('/market')) return 'market';
  if (location.startsWith('/blues-news')) return 'news';
  if (location.startsWith('/chapter/members')) return 'members';
  if (location.startsWith('/admin') || location.startsWith('/super-admin')) return 'admin';
  if (location.startsWith('/chapter')) return 'chapter';
  if (location.startsWith('/profile')) return 'profile';
  return 'study';
}

export function SidebarNavigation({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { websiteTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const bankAccountQuery = trpc.banking.getBankAccount.useQuery(undefined, { enabled: !!user });
  const profileSettingsQuery = trpc.preferences.getProfileSettings.useQuery(undefined, { enabled: !!user });
  const unreadNews = trpc.bbx.getUnreadNewsCount.useQuery(undefined, { enabled: !!user, refetchInterval: 60_000 });
  const atmosphere = atmosphereForRoute(location);
  const profileAvatar = getProfileAvatar(profileSettingsQuery.data?.avatarKey);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  const handleInternalLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    afterNavigate?: () => void,
  ) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    navigate(href);
    afterNavigate?.();
  };

  const restartOnboardingTour = () => {
    window.dispatchEvent(new Event('blueblazer:restart-tour'));
    setMobileOpen(false);
  };

  return (
    <div className="blueblazer-shell flex min-h-screen bg-[oklch(0.06_0.012_265)] text-foreground" data-website-theme={websiteTheme}>
      {/* Desktop Sidebar */}
      <aside
        className={`blueblazer-sidebar hidden md:flex flex-col border-r border-white/[0.08] bg-[oklch(0.08_0.014_265/0.95)] backdrop-blur-2xl transition-all duration-300 z-40 sticky top-0 h-screen select-none ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Header / Brand */}
        <div className="blueblazer-sidebar-header flex items-center justify-between border-b border-white/[0.08] bg-black p-4">
          {!collapsed ? (
            <button type="button" onClick={restartOnboardingTour} aria-label="Restart Blue Blazer tour" className="flex items-center gap-3 rounded-xl text-left transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-300">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-blue-300/30 bg-black p-1 shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)]">
                <img src={BLUE_BLAZER_LOGO} alt="Blue Blazer logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="font-heading tracking-wide text-white text-base leading-none">BLUE BLAZER</h1>
                <p className="text-[10px] font-mono tracking-[0.15em] text-blue-400/80 mt-0.5">CHHS DECA</p>
              </div>
            </button>
          ) : (
            <button type="button" onClick={restartOnboardingTour} aria-label="Restart Blue Blazer tour" className="mx-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-blue-300/30 bg-black p-1 shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300">
              <img src={BLUE_BLAZER_LOGO} alt="Blue Blazer logo" className="h-full w-full object-contain" />
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Section */}
          <div>
            {!collapsed && (
              <p className="px-3 text-[10px] font-mono tracking-[0.18em] text-white/40 mb-2">MAIN NAVIGATION</p>
            )}
            <div className="space-y-1">
              {mainNavLinks.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/practice'
                  ? location === '/practice' || location.startsWith('/practice/questions')
                  : location === href;
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={(event) => handleInternalLinkClick(event, href)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)]'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'} />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            {!collapsed && (
              <p className="px-3 text-[10px] font-mono tracking-[0.18em] text-white/40 mb-2">CHAPTER</p>
            )}
            <div className="space-y-1">
              {chapterNavLinks.map(({ href, label, icon: Icon }) => {
                const isActive = location === href;
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={(event) => handleInternalLinkClick(event, href)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)]'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-cyan-300 group-hover:text-cyan-200'} />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Financial Section */}
          <div>
            {!collapsed && (
              <p className="px-3 text-[10px] font-mono tracking-[0.18em] text-white/40 mb-2">FINANCIAL SYSTEMS</p>
            )}
            <div className="space-y-1">
              {financialNavLinks.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/banking'
                  ? location === '/banking' || location === '/transaction-history'
                  : location === href;
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={(event) => handleInternalLinkClick(event, href)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)]'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-green-400 group-hover:text-green-300'} />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {href === '/blues-news' && (unreadNews.data?.count ?? 0) > 0 && (
                      <span className={`absolute ${collapsed ? 'top-1 right-1' : 'right-3'} px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full`}>
                        {unreadNews.data?.count}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Chapter Management Section if applicable */}
          {user && (user.role === 'admin' || user.role === 'super_admin' || user.email === 'rtbi2179@gmail.com' || user.email === 'sahan.mallampati@gmail.com') && (
            <div>
              {!collapsed && (
                <p className="px-3 text-[10px] font-mono tracking-[0.18em] text-white/40 mb-2">CHAPTER MANAGEMENT</p>
              )}
              <div className="space-y-1">
                {chapterManagementNavLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = location === href;
                  return (
                    <a
                      key={href}
                      href={href}
                      onClick={(event) => handleInternalLinkClick(event, href)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-[0_0_20px_oklch(0.55_0.22_260/0.4)]'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                      title={collapsed ? label : undefined}
                    >
                      <Icon size={20} className={isActive ? 'text-white' : 'text-amber-400 group-hover:text-amber-300'} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Profile / Bottom Dock */}
        <div className="p-3 border-t border-white/[0.08] bg-slate-950/40">
          {user ? (
            <div className={`flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
              {!collapsed ? (
                <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 overflow-hidden rounded-full border border-blue-300/30 bg-slate-900">
                        <img src={profileAvatar.src} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{user.name || user.username || 'Member'}</p>
                        <p className="text-[10px] text-blue-300/80 font-mono">${Number(bankAccountQuery.data?.checkingBalance ?? 0).toFixed(2)} Checking</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Logout"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                  <a href="/profile" onClick={(event) => handleInternalLinkClick(event, '/profile')} className="block w-full mt-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium text-center rounded-lg transition-colors shadow-sm">
                    View Profile & Stats
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <a href="/profile" onClick={(event) => handleInternalLinkClick(event, '/profile')}>
                    <div className="w-10 h-10 overflow-hidden rounded-full border border-blue-500/30 bg-slate-900 transition hover:border-blue-300/60" title={user.name || user.username || undefined}>
                      <img src={profileAvatar.src} alt="" className="h-full w-full object-cover" />
                    </div>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" onClick={(event) => handleInternalLinkClick(event, '/login')} className="block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium text-center rounded-xl transition-colors shadow-md">
              {!collapsed ? 'Sign In to Blue Blazer' : 'Login'}
            </a>
          )}
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="blueblazer-mobile-bar md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/[0.08] bg-black px-4 py-3 backdrop-blur-xl">
        <button type="button" onClick={restartOnboardingTour} aria-label="Restart Blue Blazer tour" className="flex items-center gap-3 rounded-lg text-left transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-300">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-blue-300/30 bg-black p-0.5 shadow-md">
            <img src={BLUE_BLAZER_LOGO} alt="Blue Blazer logo" className="h-full w-full object-contain" />
          </div>
          <span className="font-heading tracking-wide text-white text-sm">BLUE BLAZER</span>
        </button>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-white/80 hover:text-white"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="blueblazer-mobile-drawer md:hidden fixed inset-0 top-14 z-40 bg-[oklch(0.06_0.012_265/0.98)] backdrop-blur-2xl p-4 overflow-y-auto"
          >
            <nav className="space-y-4 pb-12">
              <div>
                <p className="text-[10px] font-mono tracking-[0.18em] text-white/40 mb-2">MAIN NAVIGATION</p>
                <div className="space-y-1">
                  {mainNavLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={(event) => handleInternalLinkClick(event, href, () => setMobileOpen(false))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                        (href === '/practice'
                          ? location === '/practice' || location.startsWith('/practice/questions')
                          : location === href)
                          ? 'bg-blue-600 text-white'
                          : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} className="text-blue-400" />
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono tracking-[0.18em] text-white/40 mb-2">FINANCIAL SYSTEMS</p>
                <div className="space-y-1">
                  {financialNavLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={(event) => handleInternalLinkClick(event, href, () => setMobileOpen(false))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                        (href === '/banking'
                          ? location === '/banking' || location === '/transaction-history'
                          : location === href)
                          ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} className="text-green-400" />
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono tracking-[0.18em] text-white/40 mb-2">CHAPTER</p>
                <div className="space-y-1">
                  {chapterNavLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={(event) => handleInternalLinkClick(event, href, () => setMobileOpen(false))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                        location === href ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} className="text-cyan-300" />
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {user && (user.role === 'admin' || user.role === 'super_admin' || user.email === 'rtbi2179@gmail.com' || user.email === 'sahan.mallampati@gmail.com') && (
                <div>
                  <p className="text-[10px] font-mono tracking-[0.18em] text-white/40 mb-2">CHAPTER MANAGEMENT</p>
                  <div className="space-y-1">
                    {chapterManagementNavLinks.map(({ href, label, icon: Icon }) => (
                      <a
                        key={href}
                        href={href}
                        onClick={(event) => handleInternalLinkClick(event, href, () => setMobileOpen(false))}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                          location === href ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <Icon size={18} className="text-amber-400" />
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm font-semibold text-white">{user.name || user.username}</span>
                      <span className="text-xs text-blue-300 font-mono">${Number(bankAccountQuery.data?.checkingBalance ?? 0).toFixed(2)} Checking</span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="w-full py-3 bg-red-600 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                ) : (
                  <a
                    href="/login"
                    onClick={(event) => handleInternalLinkClick(event, '/login', () => setMobileOpen(false))}
                    className="w-full py-3 bg-blue-600 text-white text-sm font-medium text-center rounded-xl block shadow-md"
                  >
                    Sign In
                  </a>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="app-atmosphere relative isolate flex-1 min-w-0 overflow-hidden md:pt-0 pt-14" data-atmosphere={atmosphere}>
        {location !== '/' && <InteractiveBackground variant={atmosphere} />}
        <div className="relative z-10 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
