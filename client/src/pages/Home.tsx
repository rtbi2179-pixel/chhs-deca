/*
 * Blue Blazer Home Page — Cinematic Dark Editorial
 * Hero: Full-viewport split layout with 3D Spline glass trophy on right
 * Sections: Stats, Feature cards, Quick links, Resources
 * Colors: Deep black bg, electric blue accents, white text
 * Fonts: Bebas Neue (display), Outfit (body), Space Mono (data)
 */

import { Link } from 'wouter'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/_core/hooks/useAuth'
import { Activity, ArrowRight, Banknote, BarChart3, BookOpen, BookOpenCheck, Building2, Calendar, CheckCircle2, ChevronRight, CircleDollarSign, Compass, FileText, Globe, Landmark, LineChart, Newspaper, PiggyBank, Sparkles, Star, Target, TrendingUp, Trophy, Users, WalletCards } from 'lucide-react'
import { getLoginUrl } from '@/const'
import { InteractiveBackground } from '@/components/InteractiveBackground'
import { trpc } from '@/lib/trpc'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663512099215/gkmjm4geRMb8GU58vHezuc/deca-hero-bg-3D56BJM7ugEtwwxPTqT3y7.webp'

type OverviewEventOption = {
  code: string
  name: string
  cluster: string
  type: string
}

const stats = [
  { value: '60+', label: 'Competitive Events', icon: Trophy },
  { value: '4', label: 'Career Clusters', icon: Target },
  { value: '3M+', label: 'DECA Members', icon: Users },
  { value: 'ICDC', label: 'Your Goal', icon: Star },
]

const features = [
  {
    href: '/events',
    icon: Trophy,
    title: 'Event Resources',
    description: 'Deep-dive guides, official DECA links, role-play tips, and study materials for all 60+ competitive events.',
    color: 'from-blue-600/20 to-blue-800/10',
    border: 'border-blue-500/20 hover:border-blue-500/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.2)]',
    tag: '60+ Events',
  },
  {
    href: '/practice',
    icon: BookOpen,
    title: 'Practice Questions',
    description: 'Real DECA exam questions across all clusters — Marketing, Finance, Hospitality, and Business Management.',
    color: 'from-indigo-600/20 to-indigo-800/10',
    border: 'border-indigo-500/20 hover:border-indigo-500/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.50_0.22_270/0.2)]',
    tag: '38+ Questions',
  },
  {
    href: '/calendar',
    icon: Calendar,
    title: 'Competition Calendar',
    description: 'Stay on top of district, state, and ICDC dates. Never miss a deadline or competition.',
    color: 'from-cyan-600/20 to-cyan-800/10',
    border: 'border-cyan-500/20 hover:border-cyan-500/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.65_0.15_210/0.2)]',
    tag: 'Chapter Planning',
  },
  {
    href: '/volunteer',
    icon: Users,
    title: 'Volunteer Sign-Ups',
    description: 'Earn community service hours and build your DECA portfolio by signing up for chapter events.',
    color: 'from-blue-700/20 to-slate-800/10',
    border: 'border-blue-400/20 hover:border-blue-400/50',
    glow: 'hover:shadow-[0_0_30px_oklch(0.60_0.18_255/0.2)]',
    tag: '8 Opportunities',
  },
]

const quickLinks = [
  { label: 'DECA Official Site', href: 'https://www.deca.org', icon: Globe },
  { label: 'DECA Competitive Events', href: 'https://www.deca.org/compete/competitive-events', icon: BookOpen },
  { label: 'Exam Blueprints', href: 'https://www.deca.org/advisor-resources/competitive-events-exam-blueprints', icon: Target },
  { label: 'Blue Blazer Practice', href: '/practice', icon: BookOpen },
  { label: 'ICDC Information', href: 'https://www.deca.org/conferences/icdc', icon: Trophy },
  { label: 'Texas DECA', href: 'https://www.texasdeca.org', icon: Star },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
}

const formatCurrency = (value: number | string | null | undefined) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(Number(value ?? 0))

function AuthenticatedOverview({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  const [eventPickerOpen, setEventPickerOpen] = useState(false)
  const [eventSearch, setEventSearch] = useState('')
  const [eventCatalog, setEventCatalog] = useState<OverviewEventOption[]>([])
  const utils = trpc.useUtils()
  const profileMetricsQuery = trpc.practice.getProfileMetrics.useQuery(undefined, { staleTime: 60_000, refetchOnWindowFocus: false })
  const primaryEventQuery = trpc.preferences.getPrimaryEvent.useQuery(undefined, { staleTime: 60_000, refetchOnWindowFocus: false })
  const bankAccountQuery = trpc.banking.getBankAccount.useQuery(undefined, { staleTime: 60_000, refetchOnWindowFocus: false })
  const bbxPortfolioQuery = trpc.bbx.getPortfolio.useQuery(undefined, { staleTime: 45_000, refetchInterval: 60_000, refetchIntervalInBackground: false, refetchOnWindowFocus: false })
  const unreadNewsQuery = trpc.bbx.getUnreadNewsCount.useQuery(undefined, { staleTime: 90_000, refetchInterval: 120_000, refetchIntervalInBackground: false, refetchOnWindowFocus: false })
  const recentNewsQuery = trpc.bbx.getBluesNews.useQuery({ limit: 1 }, { staleTime: 90_000, refetchInterval: 120_000, refetchIntervalInBackground: false, refetchOnWindowFocus: false })

  const metrics = profileMetricsQuery.data
  const bankAccount = bankAccountQuery.data
  const portfolio = bbxPortfolioQuery.data
  const primaryEvent = primaryEventQuery.data?.primaryEventCode
  const choosePrimaryEvent = trpc.preferences.setPrimaryEvent.useMutation({
    onSuccess: async () => {
      await utils.preferences.getPrimaryEvent.invalidate()
      setEventPickerOpen(false)
      setEventSearch('')
    },
  })
  const studyDestination = primaryEvent ? '/pi-quizlet' : '/event-match'
  const firstName = user.name?.trim().split(/\s+/)[0] || user.email?.split('@')[0] || 'Competitor'
  const latestNews = recentNewsQuery.data?.[0]
  const normalizedEventSearch = eventSearch.trim().toLocaleLowerCase()
  const selectableEvents = useMemo(() => eventCatalog.filter((event) => {
    if (!normalizedEventSearch) return true
    return [event.code, event.name, event.cluster, event.type].some((value) => value.toLocaleLowerCase().includes(normalizedEventSearch))
  }), [eventCatalog, normalizedEventSearch])
  const eventCatalogLoading = eventPickerOpen && eventCatalog.length === 0

  useEffect(() => {
    if (!eventPickerOpen || eventCatalog.length > 0) return
    let isCurrent = true

    void import('./Events').then(({ allEvents }) => {
      if (isCurrent) setEventCatalog(allEvents)
    })

    return () => { isCurrent = false }
  }, [eventCatalog.length, eventPickerOpen])
  const balanceReady = !bankAccountQuery.isLoading
  const portfolioReady = !bbxPortfolioQuery.isLoading
  const practiceMetrics = [
    { label: 'Questions answered', value: metrics ? metrics.questionsAnswered.toLocaleString() : '—', icon: BookOpenCheck, detail: metrics ? 'Across practice and review' : 'Syncing your practice record', tone: 'blue' },
    { label: 'Overall accuracy', value: metrics ? `${metrics.accuracyPercent}%` : '—', icon: Target, detail: metrics ? `${metrics.correctAnswers.toLocaleString()} correct answers` : 'Syncing your accuracy', tone: 'green' },
    { label: 'Study streak', value: metrics ? `${metrics.studyStreak} day${metrics.studyStreak === 1 ? '' : 's'}` : '—', icon: Activity, detail: 'Practice on consecutive days', tone: 'yellow' },
    { label: 'Saved questions', value: metrics ? metrics.savedQuestions.toLocaleString() : '—', icon: Star, detail: 'Ready for focused review', tone: 'slate' },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[oklch(0.07_0.01_265)] text-white">
      <InteractiveBackground variant="overview" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-[10px] font-mono-data uppercase tracking-[0.18em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" /> Member Overview
            </div>
            <h1 className="mt-4 font-display text-5xl leading-none tracking-tight sm:text-6xl">WELCOME BACK, {firstName.toUpperCase()}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">Your current practice, event preparation, chapter activity, and Blue Bucks accounts are organized here so the next productive step is always clear.</p>
          </div>
          <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto">
            <Link href={studyDestination} className="group rounded-xl border border-blue-300/25 bg-blue-500/15 px-4 py-3 transition-colors hover:bg-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-300">
              <span className="flex items-center gap-2 text-xs font-semibold text-blue-100"><BookOpen className="h-4 w-4" />PI Study</span>
              <span className="mt-1 block text-[11px] text-blue-100/60">{primaryEvent ? primaryEvent : 'Choose an event'}</span>
            </Link>
            <Link href="/practice" className="group rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 transition-colors hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-blue-300">
              <span className="flex items-center gap-2 text-xs font-semibold text-white"><Target className="h-4 w-4 text-blue-300" />Practice</span>
              <span className="mt-1 block text-[11px] text-white/45">Question Bank</span>
            </Link>
            <Link href="/mock-exams" className="col-span-2 group rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 transition-colors hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:col-span-1">
              <span className="flex items-center gap-2 text-xs font-semibold text-white"><FileText className="h-4 w-4 text-blue-300" />Mock Exams</span>
              <span className="mt-1 block text-[11px] text-white/45">Build exam readiness</span>
            </Link>
          </div>
        </header>

        <section aria-labelledby="study-progress-heading" className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-200/65">Live practice record</p><h2 id="study-progress-heading" className="mt-1 font-display text-3xl tracking-tight">STUDY PROGRESS</h2></div><Link href="/profile" className="text-xs font-semibold text-blue-300 transition-colors hover:text-blue-200">View profile <ChevronRight className="inline h-3.5 w-3.5" /></Link></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {practiceMetrics.map(({ label, value, detail, icon: Icon, tone }) => <Link key={label} href="/profile" data-metric-tone={tone} className="overview-metric-card group rounded-2xl border border-white/10 bg-slate-950/55 p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-blue-300"><Icon className="overview-metric-icon h-5 w-5 text-blue-300" /><p className="overview-metric-label mt-6 text-[10px] font-mono-data uppercase tracking-[0.14em] text-white/45">{label}</p><p className="overview-metric-value mt-1 font-display text-3xl tracking-tight text-white">{value}</p><p className="overview-metric-detail mt-2 text-xs text-white/45">{detail}</p></Link>)}
          </div>
        </section>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section aria-labelledby="next-step-heading" className="rounded-2xl border border-blue-300/20 bg-[linear-gradient(135deg,oklch(0.18_0.08_255/0.55),oklch(0.09_0.02_265/0.85))] p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2 text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-200/75"><Compass className="h-3.5 w-3.5" />Your study path</div><h2 id="next-step-heading" className="mt-3 font-display text-4xl tracking-tight">{primaryEvent ? `FOCUS: ${primaryEvent}` : 'FIND YOUR EVENT'}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{primaryEvent ? `Open your event’s mapped performance indicators, then move directly into targeted practice and mock-exam preparation.` : 'Choose an event now or take the Event Match Quiz if you would like a personalized recommendation.'}</p></div><button type="button" onClick={() => setEventPickerOpen(true)} aria-label="Choose your DECA event focus" title="Choose event focus" className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200/25 bg-blue-300/10 text-blue-200 transition hover:border-blue-200/50 hover:bg-blue-300/20 focus:outline-none focus:ring-2 focus:ring-blue-200"><Compass className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" /></button></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3"><Link href={studyDestination} className="rounded-xl border border-blue-200/20 bg-blue-400/15 p-4 transition-colors hover:bg-blue-400/25 focus:outline-none focus:ring-2 focus:ring-blue-300"><BookOpen className="h-4 w-4 text-blue-100" /><p className="mt-4 text-sm font-semibold">{primaryEvent ? 'Open PI Library' : 'Take Event Quiz'}</p><p className="mt-1 text-xs leading-5 text-white/55">{primaryEvent ? 'Study the PIs for your event.' : 'Get a personalized event fit.'}</p></Link><Link href="/practice" className="rounded-xl border border-white/10 bg-slate-950/35 p-4 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-300"><Target className="h-4 w-4 text-blue-200" /><p className="mt-4 text-sm font-semibold">Practice Questions</p><p className="mt-1 text-xs leading-5 text-white/55">Choose a cluster and build accuracy.</p></Link><Link href="/mock-exams" className="rounded-xl border border-white/10 bg-slate-950/35 p-4 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-300"><FileText className="h-4 w-4 text-blue-200" /><p className="mt-4 text-sm font-semibold">Mock Exams</p><p className="mt-1 text-xs leading-5 text-white/55">Turn weak PIs into a study plan.</p></Link></div>
          </section>

          <section aria-labelledby="accounts-heading" data-overview-panel="financial" className="overview-support-panel rounded-2xl border border-white/10 bg-slate-950/65 p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-200/65">Blue Bucks accounts</p><h2 id="accounts-heading" className="mt-1 font-display text-3xl tracking-tight">BANKING &amp; BBX</h2></div><Landmark className="h-5 w-5 text-blue-300" /></div>
            <div className="mt-6 divide-y divide-white/10 border-y border-white/10"><div className="flex items-center justify-between py-4"><span className="flex items-center gap-2 text-sm text-white/65"><WalletCards className="h-4 w-4 text-blue-300" />Checking</span><span className="font-mono-data text-sm text-white">{balanceReady ? formatCurrency(bankAccount?.checkingBalance) : 'Syncing…'}</span></div><div className="flex items-center justify-between py-4"><span className="flex items-center gap-2 text-sm text-white/65"><PiggyBank className="h-4 w-4 text-blue-300" />Savings</span><span className="font-mono-data text-sm text-white">{balanceReady ? formatCurrency(bankAccount?.savingsBalance) : 'Syncing…'}</span></div><div className="flex items-center justify-between py-4"><span className="flex items-center gap-2 text-sm text-white/65"><TrendingUp className="h-4 w-4 text-blue-300" />BBX value</span><span className="font-mono-data text-sm text-white">{portfolioReady ? formatCurrency(portfolio?.totalValue) : 'Syncing…'}</span></div></div>
            <div className="mt-4 flex items-center justify-between"><span className="text-xs text-white/45">{portfolioReady ? `${portfolio?.totalReturnPercent && portfolio.totalReturnPercent > 0 ? '+' : ''}${portfolio?.totalReturnPercent?.toFixed(1) ?? '0.0'}% BBX total return` : 'Updating BBX valuation'}</span><Link href="/banking" className="text-xs font-semibold text-blue-300 transition-colors hover:text-blue-200">Manage accounts <ChevronRight className="inline h-3.5 w-3.5" /></Link></div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section aria-labelledby="blues-news-heading" data-overview-panel="news" className="overview-support-panel rounded-2xl border border-white/10 bg-slate-950/65 p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-200/65">Market simulation</p><h2 id="blues-news-heading" className="mt-1 font-display text-3xl tracking-tight">BLUE&apos;S NEWS</h2></div><Newspaper className="h-5 w-5 text-blue-300" /></div><div className="mt-6 rounded-xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] font-mono-data uppercase tracking-[0.14em] text-blue-200/60">{recentNewsQuery.isLoading ? 'Checking for updates' : latestNews?.isRead ? 'Latest read update' : `${unreadNewsQuery.data?.count ?? 0} unread update${unreadNewsQuery.data?.count === 1 ? '' : 's'}`}</p><p className="mt-3 text-sm font-semibold leading-6 text-white">{latestNews?.headline ?? (recentNewsQuery.isLoading ? 'Loading Blue’s News…' : 'No active Blue’s News article yet.')}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">{latestNews?.body ?? 'New simulated market stories will appear here as they are published.'}</p></div><Link href="/blues-news" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-300 transition-colors hover:text-blue-200">Read Blue&apos;s News <ArrowRight className="h-3.5 w-3.5" /></Link></section>

          <section aria-labelledby="chapter-hub-heading" data-overview-panel="chapter" className="overview-support-panel rounded-2xl border border-white/10 bg-slate-950/65 p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-200/65">Stay connected</p><h2 id="chapter-hub-heading" className="mt-1 font-display text-3xl tracking-tight">CHAPTER HUB</h2></div><Building2 className="h-5 w-5 text-blue-300" /></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Link href="/events" className="rounded-xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-300"><Trophy className="h-4 w-4 text-blue-300" /><p className="mt-3 text-sm font-semibold">Events</p><p className="mt-1 text-xs text-white/45">Explore event pathways</p></Link><Link href="/calendar" className="rounded-xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-300"><Calendar className="h-4 w-4 text-blue-300" /><p className="mt-3 text-sm font-semibold">Calendar</p><p className="mt-1 text-xs text-white/45">Plan chapter dates</p></Link><Link href="/announcements" className="rounded-xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-300"><CircleDollarSign className="h-4 w-4 text-blue-300" /><p className="mt-3 text-sm font-semibold">Announcements</p><p className="mt-1 text-xs text-white/45">Chapter updates</p></Link><Link href="/discussions" className="rounded-xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-300"><Users className="h-4 w-4 text-blue-300" /><p className="mt-3 text-sm font-semibold">Discussions</p><p className="mt-1 text-xs text-white/45">Connect with members</p></Link></div></section>
        </div>
      </div>

      <Dialog open={eventPickerOpen} onOpenChange={(open) => { setEventPickerOpen(open); if (!open) setEventSearch('') }}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-hidden border-blue-300/25 bg-[oklch(0.09_0.014_265)] p-0 text-white shadow-[0_24px_90px_oklch(0.02_0.04_265/0.82)]">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,oklch(0.35_0.13_255/0.28),transparent_48%)] px-6 py-6 pr-14">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-[10px] font-mono-data uppercase tracking-[0.16em] text-blue-300"><Compass className="h-3.5 w-3.5" /> Study focus</div>
              <DialogTitle className="mt-2 font-display text-3xl tracking-wide text-white">CHOOSE YOUR EVENT</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-slate-300">Select the DECA event you want Blue Blazer to prioritize. This updates your Overview focus; PI study remains available in the dedicated PI Library.</DialogDescription>
            </DialogHeader>
            <label htmlFor="overview-event-search" className="sr-only">Search DECA events</label>
            <input id="overview-event-search" type="search" value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="Search by event name, code, cluster, or type" autoComplete="off" className="mt-5 h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20" />
          </div>
          <div className="max-h-[calc(88vh-270px)] overflow-y-auto px-6 py-5">
            <p className="mb-4 text-xs text-slate-400">{eventCatalogLoading ? 'Loading the event catalog…' : `${selectableEvents.length} available event${selectableEvents.length === 1 ? '' : 's'}${normalizedEventSearch ? ` match “${eventSearch.trim()}”` : ''}.`}</p>
            {eventCatalogLoading ? (
              <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] text-sm text-blue-100/75"><span className="mr-3 h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" />Loading DECA events…</div>
            ) : selectableEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] px-5 py-10 text-center"><Compass className="mx-auto h-6 w-6 text-blue-300" /><p className="mt-3 font-medium text-white">No event matches that search.</p><button type="button" onClick={() => setEventSearch('')} className="mt-3 text-sm font-semibold text-blue-300 hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300">Clear search</button></div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {selectableEvents.map((event) => {
                  const isSelected = event.code === primaryEvent
                  return <button key={event.code} type="button" aria-pressed={isSelected} onClick={() => choosePrimaryEvent.mutate({ eventCode: event.code })} disabled={choosePrimaryEvent.isPending} className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-wait disabled:opacity-60 ${isSelected ? 'border-blue-300/60 bg-blue-500/20' : 'border-white/10 bg-white/[0.025] hover:border-blue-300/35 hover:bg-blue-500/[0.07]'}`}><div className="flex items-center justify-between gap-3"><span className="font-mono-data text-xs font-semibold tracking-[0.12em] text-blue-200">{event.code}</span>{isSelected && <CheckCircle2 className="h-4 w-4 text-blue-200" />}</div><p className="mt-2 text-sm font-semibold leading-5 text-white">{event.name}</p><p className="mt-1 text-xs text-white/45">{event.cluster} · {event.type}</p></button>
                })}
              </div>
            )}
          </div>
          <div className="border-t border-white/10 bg-black/10 px-6 py-4"><p className="text-xs text-slate-400">Want a recommendation instead? <Link href="/event-match" className="font-semibold text-blue-300 hover:text-blue-200">Take the Event Match Quiz</Link>.</p>{choosePrimaryEvent.error && <p role="alert" className="mt-2 text-xs text-red-300">{choosePrimaryEvent.error.message}</p>}</div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default function Home() {
  const { user } = useAuth();

  const beginJourney = (destination: string) => {
    if (user) {
      window.location.href = destination;
      return;
    }
    window.location.href = getLoginUrl();
  };

  if (user) return <AuthenticatedOverview user={user} />

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)]">
      {/* ── Hero Section ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        {/* Interactive background with particles and network */}
        <InteractiveBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
            {/* Left: Text Content */}
            <div className="flex flex-col justify-center py-20 lg:py-0">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Blue Blazer Chapter
                </div>

                <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-white leading-none mb-4">
                  YOUR PATH
                  <br />
                  <span className="gradient-text">TO ICDC</span>
                </h1>

                <p className="text-white/60 text-lg leading-relaxed max-w-lg mb-8">
                  Give every competitor a clearer path from first practice to peak performance —
                  with PI study guides, balanced mock exams, chapter operations, and student momentum in one hub.
                </p>

                <div className="flex flex-wrap gap-3">
                  <motion.button type="button" onClick={() => beginJourney('/study-guide')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors duration-200 hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)]">
                    {user ? 'Open My Study Guide' : 'Start Your Chapter'} <ArrowRight size={16} />
                  </motion.button>
                  <motion.button type="button" onClick={() => beginJourney('/practice')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold rounded-lg transition-all duration-200">
                    {user ? 'Start Practicing' : 'See How It Works'}
                  </motion.button>
                </div>
                {!user && <p className="mt-4 text-sm text-white/40">Secure chapter access for students, advisors, and chapter administrators.</p>}
              </motion.div>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="grid grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/5"
              >
                {stats.map(({ value, label, icon: Icon }) => (
                  <div key={label} className="text-center">
                    <Icon size={16} className="text-blue-400 mx-auto mb-1" />
                    <div className="font-display text-2xl text-white">{value}</div>
                    <div className="text-white/40 text-xs mt-0.5 leading-tight">{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: DECA Glass Award */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative h-[500px] lg:h-[700px] hidden lg:flex items-center justify-center"
            >
              {/* Glow backdrop - removed for transparency */}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/30" />
          <span className="text-xs font-mono-data tracking-widest uppercase">Scroll</span>
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div custom={0} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-4">
              Your Resource Hub
            </div>
            <h2 className="font-display text-5xl sm:text-6xl text-white mb-4">
              EVERYTHING YOU NEED
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              From first-year principles to ICDC-level written events — Blue Blazer has you covered.
            </p>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ href, icon: Icon, title, description, color, border, glow, tag }, i) => (
            <motion.div
              key={href}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Link href={user ? href : "/"} onClick={(event) => { if (!user) { event.preventDefault(); beginJourney(href); } }}>
                <div
                  className={`group relative p-8 rounded-2xl bg-gradient-to-br ${color} border ${border} ${glow} transition-all duration-300 cursor-pointer overflow-hidden`}
                >
                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 animate-shimmer" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Icon size={24} className="text-blue-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30 font-mono-data">{tag}</span>
                        <ArrowRight
                          size={18}
                          className="text-white/30 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300"
                        />
                      </div>
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{description}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Chapter value banner ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 via-blue-800/20 to-blue-900/30 p-8 sm:p-12"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-blue-600/5" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono-data tracking-widest uppercase mb-3">
                  <Trophy size={12} />
                  Built for Chapter Momentum
                </div>
                <h2 className="font-display text-4xl sm:text-5xl text-white mb-2">A FULL-SEASON ADVANTAGE</h2>
                <p className="text-white/60 text-lg">A purposeful experience for competitors and a practical command center for chapter leaders.</p>
                <p className="text-white/40 text-sm mt-1 font-mono-data">Study, simulate, organize, and review progress from one secure chapter space.</p>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { value: '2,772', label: 'PI Modules' },
                    { value: '100', label: 'Mock Questions' },
                    { value: '1', label: 'Chapter Hub' },
                  ].map(({ value, label }) => (
                    <div key={label} className="glass-card px-4 py-3 border-blue-500/20">
                      <div className="font-display text-3xl text-blue-400">{value}</div>
                      <div className="text-white/40 text-xs font-mono-data">{label}</div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => beginJourney('/study-guide')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)]"
                >
                  {user ? 'Open Study Guide' : 'Bring Blue Blazer to Your Chapter'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Chapter leader conversion section ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="section-divider mb-16" />
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-blue-950/40 p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-mono-data uppercase tracking-widest text-emerald-300"><Building2 size={13} /> For chapter leaders</div>
              <h2 className="font-display text-4xl sm:text-5xl text-white">RUN A STRONGER CHAPTER, WITHOUT MORE SPREADSHEETS.</h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/60">Blue Blazer pairs serious competition preparation with the everyday tools chapters need to keep students informed, organized, and motivated.</p>
              <button type="button" onClick={() => beginJourney('/')} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-slate-200">
                {user ? 'Return to My Chapter' : 'Start with Blue Blazer'} <ArrowRight size={16} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: Compass, title: 'Clear student paths', detail: 'Guide students from event selection to PI study, practice, and mock exams.' },
                { icon: BarChart3, title: 'Visible progress', detail: 'Use accurate practice, market, and learning activity to guide support.' },
                { icon: CheckCircle2, title: 'One operational home', detail: 'Keep announcements, calendars, volunteer work, feedback, and chapter tools together.' },
              ].map(({ icon: Icon, title, detail }) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <Icon className="mb-3 h-5 w-5 text-blue-300" />
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl text-white">QUICK LINKS</h2>
              <p className="text-white/40 text-sm mt-1">Official DECA resources at your fingertips</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-blue-500/30 transition-all duration-200 text-center hover:shadow-[0_0_20px_oklch(0.55_0.22_260/0.1)]"
              >
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/15 group-hover:bg-blue-500/20 transition-colors">
                  <Icon size={18} className="text-blue-400" />
                </div>
                <span className="text-white/60 group-hover:text-white text-xs font-medium leading-tight transition-colors">{label}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── DECA Clusters Overview ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="section-divider mb-16" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-3">CAREER CLUSTERS</h2>
            <p className="text-white/50">DECA covers 4 major career clusters — find yours and start competing</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Marketing', events: '15+', color: 'border-red-500/30 bg-red-500/5', tag: 'text-red-300', desc: 'Advertising, retail, sports & entertainment marketing' },
              { name: 'Finance', events: '8+', color: 'border-green-500/30 bg-green-500/5', tag: 'text-green-300', desc: 'Accounting, business finance, financial services' },
              { name: 'Hospitality & Tourism', events: '8+', color: 'border-blue-500/30 bg-blue-500/5', tag: 'text-blue-300', desc: 'Hotels, restaurants, travel & tourism management' },
              { name: 'Business Management', events: '10+', color: 'border-amber-500/30 bg-amber-500/5', tag: 'text-amber-300', desc: 'HR, entrepreneurship, international business' },
            ].map(({ name, events, color, tag, desc }) => (
              <Link key={name} href="/events">
                <div className={`group p-6 rounded-xl border ${color} hover:scale-[1.02] transition-all duration-200 cursor-pointer`}>
                  <div className={`text-xs font-mono-data tracking-widest uppercase mb-2 ${tag}`}>{events} Events</div>
                  <h3 className="text-white font-bold text-base mb-2">{name}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                  <div className={`mt-3 flex items-center gap-1 text-xs ${tag} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    View events <ChevronRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Discussion Forum ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="section-divider mb-16" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-3">COMMUNITY DISCUSSION</h2>
            <p className="text-white/60 text-lg">Ask questions, share tips, and learn from your teammates</p>
          </div>
          <div className="glass-card p-8 border-blue-500/20 text-center">
            <div className="mb-6">
              <Users size={40} className="mx-auto text-blue-400 mb-4" />
              <p className="text-white/60 text-lg mb-6">Join the Blue Blazer community discussion board to ask questions about events, share study tips, and connect with teammates.</p>
            </div>
            <Link href="/discussions">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)]">
                View Discussions
                <ChevronRight size={16} />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img
                src="/manus-storage/Untitleddesign_c1fb0d88.png"
                alt="Blue Blazer Logo"
                className="w-10 h-10"
              />
              <div>
                <div className="font-display text-xl text-white tracking-wider">Blue Blazer</div>
                <div className="text-blue-400/60 text-xs font-mono-data tracking-widest">ROAD TO ICDC</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-white/30 text-sm">
              <a href="https://www.deca.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">DECA.org</a>
              <a href="https://www.texasdeca.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Texas DECA</a>
              <Link href="/practice" className="hover:text-white/60 transition-colors">Blue Blazer Practice</Link>
              <a href="https://www.deca.org/conferences/icdc" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">ICDC Information</a>
            </div>
          </div>
          <div className="section-divider mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white/20 text-xs font-mono-data">
            <span>© 2025–2026 Blue Blazer Chapter. All rights reserved.</span>
            <span>Built by Sahan Mallampati & Ricardo Burciaga</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
