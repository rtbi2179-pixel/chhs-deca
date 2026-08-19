import { useEffect, useState } from 'react'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { ArrowLeft, Bell, BookOpen, BriefcaseBusiness, CheckCircle, ChevronDown, ChevronRight, Edit2, FileText, Flame, LayoutDashboard, LineChart, Medal, Plus, SlidersHorizontal, Sparkles, Target, Trash2 } from 'lucide-react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CreditScoreChart } from '@/components/CreditScoreChart'
import { PortfolioChart } from '@/components/PortfolioChart'
import { allEvents } from '@/pages/Events'
import { useTheme, type WebsiteTheme } from '@/contexts/ThemeContext'

const PORTFOLIO_CATEGORIES = [
  'Written Event', 'Roleplay', 'Exam Preparation', 'Presentation', 'Resume', 'Community Service', 'Leadership', 'Awards', 'Other',
]

const ACCENT_STYLES = {
  blue: 'from-blue-600/20 via-slate-950/70 to-slate-950 border-blue-500/25',
  violet: 'from-violet-600/20 via-slate-950/70 to-slate-950 border-violet-500/25',
  emerald: 'from-emerald-600/20 via-slate-950/70 to-slate-950 border-emerald-500/25',
  rose: 'from-rose-600/20 via-slate-950/70 to-slate-950 border-rose-500/25',
} as const

const statCards = [
  { key: 'questionsAnswered', label: 'Questions Answered', detail: 'Total practice questions', icon: BookOpen, valueClass: 'text-blue-300', iconClass: 'text-blue-300' },
  { key: 'accuracy', label: 'Accuracy', detail: 'Overall accuracy rate', icon: CheckCircle, valueClass: 'text-emerald-300', iconClass: 'text-emerald-300' },
  { key: 'studyStreak', label: 'Study Streak', detail: 'Days in a row', icon: Flame, valueClass: 'text-amber-300', iconClass: 'text-amber-300' },
  { key: 'savedQuestions', label: 'Saved Questions', detail: 'Questions bookmarked', icon: Target, valueClass: 'text-violet-300', iconClass: 'text-violet-300' },
] as const

const PROFILE_SECTIONS = [
  { id: 'profile-settings', label: 'Profile settings', description: 'Identity and appearance', icon: LayoutDashboard },
  { id: 'event-selection', label: 'Event selection', description: 'Your current DECA focus', icon: Target },
  { id: 'progress', label: 'Progress', description: 'Credit and BBX performance', icon: LineChart },
  { id: 'preferences', label: 'Notifications', description: 'Control your updates', icon: SlidersHorizontal },
  { id: 'portfolio', label: 'My portfolio', description: 'Your DECA work', icon: BriefcaseBusiness },
  { id: 'achievements', label: 'Achievements', description: 'Milestones and badges', icon: Medal },
] as const

export default function Profile() {
  const { user } = useAuth()
  const { setWebsiteTheme } = useTheme()
  const utils = trpc.useUtils()
  const [, setLocation] = useLocation()
  const [showAddPortfolioDialog, setShowAddPortfolioDialog] = useState(false)
  const [activeSection, setActiveSection] = useState<(typeof PROFILE_SECTIONS)[number]['id']>('profile-settings')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<any>(null)
  const [portfolioFormData, setPortfolioFormData] = useState({ title: '', category: '', description: '', fileUrl: '', externalUrl: '', memberProgressNotes: '' })
  const [profileCustomization, setProfileCustomization] = useState({ displayName: '', bio: '', accentColor: 'blue' as 'blue' | 'violet' | 'emerald' | 'rose', websiteTheme: 'glass' as WebsiteTheme, showOnLeaderboard: true })

  const profileMetricsQuery = trpc.practice.getProfileMetrics.useQuery(undefined, { enabled: !!user?.id })
  const { data: portfolio = [], refetch: refetchPortfolio } = trpc.members.getPortfolioItems.useQuery({ userId: user?.id }, { enabled: !!user?.id })
  const creditScoreQuery = trpc.banking.getCreditScore.useQuery(undefined, { enabled: !!user?.id })
  const creditScoreHistoryQuery = trpc.banking.getCreditScoreHistory.useQuery({ limit: 30 }, { enabled: !!user?.id })
  const creditRefreshQuery = trpc.banking.getCreditScoreRefreshSchedule.useQuery(undefined, { enabled: !!user?.id })
  const bbxPortfolioQuery = trpc.bbx.getPortfolio.useQuery(undefined, { enabled: !!user?.id, refetchInterval: 20_000 })
  const bankAccountQuery = trpc.banking.getBankAccount.useQuery(undefined, { enabled: !!user?.id })
  const primaryEventQuery = trpc.preferences.getPrimaryEvent.useQuery(undefined, { enabled: !!user?.id })
  const notificationPreferencesQuery = trpc.preferences.getNotificationPreferences.useQuery(undefined, { enabled: !!user?.id })
  const profileSettingsQuery = trpc.preferences.getProfileSettings.useQuery(undefined, { enabled: !!user?.id })

  const updateNotificationPreferences = trpc.preferences.updateNotificationPreferences.useMutation({
    onSuccess: () => { notificationPreferencesQuery.refetch(); toast.success('Notification preferences saved') },
    onError: (error) => toast.error(error.message),
  })
  const updateProfileSettings = trpc.preferences.updateProfileSettings.useMutation({
    onSuccess: async () => { await utils.preferences.getProfileSettings.invalidate(); toast.success('Profile customization saved') },
    onError: (error) => toast.error(error.message),
  })
  const updateWebsiteTheme = trpc.preferences.updateWebsiteTheme.useMutation({
    onSuccess: async () => { await utils.preferences.getProfileSettings.invalidate(); toast.success('Website style saved') },
    onError: (error) => toast.error(error.message),
  })
  const createPortfolioMutation = trpc.members.createPortfolioItem.useMutation({
    onSuccess: () => { resetPortfolioForm(); refetchPortfolio(); toast.success('Portfolio item added') },
    onError: (error) => toast.error(error.message),
  })
  const updatePortfolioMutation = trpc.members.updatePortfolioItem.useMutation({
    onSuccess: () => { resetPortfolioForm(); refetchPortfolio(); toast.success('Portfolio item updated') },
    onError: (error) => toast.error(error.message),
  })
  const deletePortfolioMutation = trpc.members.deletePortfolioItem.useMutation({
    onSuccess: () => { refetchPortfolio(); toast.success('Portfolio item deleted') },
    onError: (error) => toast.error(error.message),
  })

  useEffect(() => {
    const settings = profileSettingsQuery.data
    if (!settings) return
    setProfileCustomization({ displayName: settings.displayName || '', bio: settings.bio || '', accentColor: settings.accentColor, websiteTheme: settings.websiteTheme, showOnLeaderboard: settings.showOnLeaderboard })
    setWebsiteTheme(settings.websiteTheme)
  }, [profileSettingsQuery.data])

  const setNotificationPreference = (key: 'announcementsEnabled' | 'feedbackResponsesEnabled' | 'systemUpdatesEnabled' | 'studyRemindersEnabled', checked: boolean) => {
    const current = notificationPreferencesQuery.data
    if (!current) return
    updateNotificationPreferences.mutate({
      announcementsEnabled: current.announcementsEnabled,
      feedbackResponsesEnabled: current.feedbackResponsesEnabled,
      systemUpdatesEnabled: current.systemUpdatesEnabled,
      studyRemindersEnabled: current.studyRemindersEnabled,
      [key]: checked,
    })
  }

  const resetPortfolioForm = () => {
    setEditingPortfolioItem(null)
    setPortfolioFormData({ title: '', category: '', description: '', fileUrl: '', externalUrl: '', memberProgressNotes: '' })
    setShowAddPortfolioDialog(false)
  }

  const handleAddPortfolioItem = () => {
    if (!portfolioFormData.title || !portfolioFormData.category || (!portfolioFormData.fileUrl && !portfolioFormData.externalUrl)) {
      toast.error('Please fill in required fields')
      return
    }
    createPortfolioMutation.mutate(portfolioFormData)
  }

  const handleUpdatePortfolioItem = () => {
    if (!portfolioFormData.title || !portfolioFormData.category || !editingPortfolioItem?.id) {
      toast.error('Please fill in required fields')
      return
    }
    updatePortfolioMutation.mutate({ itemId: editingPortfolioItem.id, ...portfolioFormData })
  }

  const handleEditPortfolioItem = (item: any) => {
    setEditingPortfolioItem(item)
    setPortfolioFormData({
      title: item.title,
      category: item.category,
      description: item.description || '',
      fileUrl: item.fileUrl || '',
      externalUrl: item.externalUrl || '',
      memberProgressNotes: item.memberProgressNotes || '',
    })
    setShowAddPortfolioDialog(true)
  }

  if (!user) {
    return <div className="min-h-screen bg-[oklch(0.07_0.01_265)] flex items-center justify-center"><div className="text-center"><p className="text-white/60">Please log in to view your profile</p></div></div>
  }

  const metrics = profileMetricsQuery.data
  const creditHistory = (creditScoreHistoryQuery.data ?? []).map((item) => ({ date: item.date, score: item.score, change: item.change ?? 0 }))
  const metricValues = {
    questionsAnswered: metrics?.questionsAnswered ?? 0,
    accuracy: `${(metrics?.accuracyPercent ?? 0).toFixed(1)}%`,
    studyStreak: metrics?.studyStreak ?? 0,
    savedQuestions: metrics?.savedQuestions ?? 0,
  }
  const primaryEventCode = primaryEventQuery.data?.primaryEventCode
  const focusedEvent = allEvents.find((event) => event.code === primaryEventCode)
  const formatAccountBalance = (value: unknown) => Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const selectSection = (id: (typeof PROFILE_SECTIONS)[number]['id']) => {
    setActiveSection(id)
    setMobileNavOpen(false)
  }
  const activeSectionLabel = PROFILE_SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Profile settings'
  const applyWebsiteTheme = (websiteTheme: WebsiteTheme) => {
    const previousTheme = profileCustomization.websiteTheme
    setProfileCustomization((current) => ({ ...current, websiteTheme }))
    setWebsiteTheme(websiteTheme)
    updateWebsiteTheme.mutate({ websiteTheme }, {
      onError: () => {
        setProfileCustomization((current) => ({ ...current, websiteTheme: previousTheme }))
        setWebsiteTheme(previousTheme)
      },
    })
  }

  return (
    <main className="min-h-screen bg-[oklch(0.07_0.01_265)] pb-16 pt-20 text-white">
      <div className="mx-auto max-w-[1450px] px-4 sm:px-6 lg:px-8">
        <button onClick={() => setLocation('/')} className="mb-5 inline-flex items-center gap-2 text-sm text-blue-300 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" />Back to Home</button>

        <div className="relative z-20 mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-2 shadow-[0_12px_34px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 sm:hidden">
            <button type="button" onClick={() => setMobileNavOpen((open) => !open)} aria-expanded={mobileNavOpen} className="flex w-full items-center justify-between rounded-xl bg-white/[0.045] px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/[0.08]"><span><span className="block text-[10px] uppercase tracking-[0.16em] text-white/40">Jump to</span><span className="mt-0.5 block font-medium">{activeSectionLabel}</span></span><ChevronDown className={`h-4 w-4 text-blue-300 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} /></button>
            {mobileNavOpen && <div role="tablist" aria-label="Profile sections" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl">{PROFILE_SECTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeSection === id} onClick={() => selectSection(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${activeSection === id ? 'bg-blue-500/15 text-blue-100' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}><Icon className="h-4 w-4 text-blue-300" />{label}</button>)}</div>}
          </div>
          <div role="tablist" aria-label="Profile sections" className="hidden min-w-0 items-center gap-1 overflow-x-auto sm:flex">{PROFILE_SECTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeSection === id} onClick={() => selectSection(id)} className={`group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${activeSection === id ? 'bg-blue-500/15 text-blue-100 ring-1 ring-inset ring-blue-400/25' : 'text-white/55 hover:bg-white/[0.06] hover:text-white'}`}><Icon className="h-3.5 w-3.5 text-blue-300/75" />{label}</button>)}</div>
          <button type="button" onClick={() => setFocusMode((mode) => !mode)} aria-pressed={focusMode} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${focusMode ? 'bg-blue-500/15 text-blue-100 ring-1 ring-inset ring-blue-400/25' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'}`}><SlidersHorizontal className="h-3.5 w-3.5" />{focusMode ? 'Exit focus' : 'Focus view'}</button>
        </div>

        <section className={`overflow-hidden rounded-[1.6rem] border bg-gradient-to-br ${ACCENT_STYLES[profileCustomization.accentColor]} shadow-[0_24px_70px_oklch(0_0_0/0.28)]`}>
          <div className="h-28 border-b border-white/10 bg-[radial-gradient(circle_at_18%_20%,oklch(0.7_0.16_245/0.32),transparent_33%),radial-gradient(circle_at_85%_0%,oklch(0.62_0.16_285/0.2),transparent_36%)] sm:h-36" />
          <div className="relative flex flex-col gap-5 px-5 pb-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-14 flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-slate-950 bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-700 shadow-[0_14px_40px_oklch(0.45_0.2_260/0.42)] sm:-mt-16 sm:h-32 sm:w-32">
                <span className="font-display text-5xl text-white">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate font-display text-4xl tracking-wide text-white sm:text-5xl">{profileCustomization.displayName || user.name || user.username}</h1>
                <p className="mt-1 truncate text-sm text-blue-200/80">{user.email}</p>
                {profileCustomization.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">{profileCustomization.bio}</p>}
                {user.schoolCode && <p className="mt-3 inline-flex rounded-full border border-blue-300/20 bg-blue-400/[0.08] px-3 py-1 text-xs text-blue-100">School Code: {user.schoolCode}</p>}
              </div>
            </div>
            <Button variant="outline" className="border-blue-300/35 bg-slate-950/35 text-blue-100 hover:bg-blue-400/10 hover:text-white" onClick={() => selectSection('profile-settings')}><Edit2 className="mr-2 h-4 w-4" />Edit Profile</Button>
          </div>
        </section>

        <div className={`mt-7 grid gap-7 ${focusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,2fr)]'}`}>
          <aside className={`${focusMode ? 'hidden' : ''} self-start lg:sticky lg:top-24`}>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65 p-3 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl">
              <p className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Profile navigation</p>
              <div className="space-y-1">
                {PROFILE_SECTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeSection === id} onClick={() => selectSection(id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${activeSection === id ? 'bg-blue-500/15 text-blue-100 ring-1 ring-inset ring-blue-400/25' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}><Icon className={`h-4 w-4 shrink-0 ${activeSection === id ? 'text-blue-300' : 'text-white/45 group-hover:text-blue-200'}`} /><span className="min-w-0"><span className="block truncate">{label}</span><span className={`mt-0.5 block truncate text-[10px] ${activeSection === id ? 'text-blue-200/70' : 'text-white/35'}`}>{PROFILE_SECTIONS.find((section) => section.id === id)?.description}</span></span>{activeSection === id && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-300" />}</button>)}
              </div>
            </div>

          </aside>

          <div className="min-w-0 space-y-7">
            {activeSection === 'profile-settings' && <section id="profile-settings" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="page-eyebrow">Member profile</p><h2 className="mt-2 text-2xl font-semibold text-white">Profile Customization</h2><p className="mt-1 text-sm text-white/60">Personalize what other members see on your profile.</p></div><Sparkles className="mt-1 h-5 w-5 text-blue-300" /></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-white/80">Display name<Input value={profileCustomization.displayName} onChange={(event) => setProfileCustomization((current) => ({ ...current, displayName: event.target.value }))} placeholder={user.name || user.username || 'Your display name'} maxLength={60} className="mt-1.5 bg-slate-950/70 border-white/10 text-white" /></label>
                <label className="text-sm text-white/80">Accent color<select value={profileCustomization.accentColor} onChange={(event) => setProfileCustomization((current) => ({ ...current, accentColor: event.target.value as typeof current.accentColor }))} className="mt-1.5 w-full rounded-md border border-white/10 bg-slate-950/70 p-2 text-white"><option value="blue">Blue</option><option value="violet">Violet</option><option value="emerald">Emerald</option><option value="rose">Rose</option></select></label>
                <label className="text-sm text-white/80 md:col-span-2">Short bio<textarea value={profileCustomization.bio} onChange={(event) => setProfileCustomization((current) => ({ ...current, bio: event.target.value }))} maxLength={280} rows={3} placeholder="Share your DECA focus, event, or goal." className="mt-1.5 w-full resize-y rounded-md border border-white/10 bg-slate-950/70 p-2 text-white" /></label>
              </div>
              <div className="mt-5 border-t border-white/10 pt-5"><div><p className="data-label">Website style</p><h3 className="mt-1 text-base font-semibold text-white">Choose your Blue Blazer experience</h3><p className="mt-1 text-sm text-white/60">Glass preserves the current blue editorial system. Blazer adds colorful aurora accents across the app.</p></div><div className="mt-4 grid gap-3 md:grid-cols-2">{([{ value: 'glass', label: 'Glass', description: 'The original dark-blue, frosted editorial look.' }, { value: 'blazer', label: 'Blazer', description: 'A more colorful indigo, cyan, violet, and amber atmosphere.' }] as const).map((option) => <button key={option.value} type="button" data-active={profileCustomization.websiteTheme === option.value} onClick={() => applyWebsiteTheme(option.value)} disabled={updateWebsiteTheme.isPending} className="website-theme-choice rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-wait disabled:opacity-70"><span className="website-theme-swatch" aria-hidden="true" /><span className="mt-3 block font-semibold text-white">{option.label}</span><span className="mt-1 block text-xs leading-5 text-white/60">{option.description}</span><span className="mt-3 block text-[10px] font-mono-data uppercase tracking-[0.14em] text-white/45">{profileCustomization.websiteTheme === option.value ? 'Selected' : 'Select style'}</span></button>)}</div></div>
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-white/80"><input type="checkbox" checked={profileCustomization.showOnLeaderboard} onChange={(event) => setProfileCustomization((current) => ({ ...current, showOnLeaderboard: event.target.checked }))} className="h-4 w-4 accent-blue-500" />Show my customized profile on chapter leaderboards</label>
              <div className="mt-5 flex justify-end"><Button disabled={updateProfileSettings.isPending} onClick={() => updateProfileSettings.mutate({ displayName: profileCustomization.displayName.trim() || null, bio: profileCustomization.bio.trim() || null, accentColor: profileCustomization.accentColor, websiteTheme: profileCustomization.websiteTheme, showOnLeaderboard: profileCustomization.showOnLeaderboard })}>Save customization</Button></div>
            </section>}

            {activeSection === 'event-selection' && <section id="event-selection" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="page-eyebrow">Competition focus</p><h2 className="mt-2 text-2xl font-semibold text-white">Event Selection</h2><p className="mt-1 text-sm text-white/60">Keep your Blue Blazer practice, PI study, and event guidance aligned with the event you plan to compete in.</p></div><Target className="mt-1 h-5 w-5 text-blue-300" /></div>
              <div className="mt-6 rounded-2xl border border-blue-300/25 bg-[linear-gradient(135deg,oklch(0.22_0.1_255/0.4),oklch(0.07_0.018_265/0.72))] p-5">
                <p className="data-label text-blue-200">Focused event</p>
                {focusedEvent ? <><h3 className="mt-2 text-xl font-semibold text-white">{focusedEvent.code} — {focusedEvent.name}</h3><p className="mt-2 text-sm text-blue-100/70">{focusedEvent.cluster} · {focusedEvent.type}</p></> : <><h3 className="mt-2 text-xl font-semibold text-white">No event selected</h3><p className="mt-2 text-sm text-blue-100/70">Take the short survey to receive event suggestions, then choose the event that fits your competition plan.</p></>}
                <a href="/event-match?retake=1" className="mt-5 inline-flex h-10 items-center rounded-md border border-blue-300/35 bg-blue-400/10 px-4 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/20 focus:outline-none focus:ring-2 focus:ring-blue-300"><Target className="mr-2 h-4 w-4" />Find Your DECA Event</a>
              </div>
            </section>}

            {activeSection === 'progress' && <section id="progress" role="tabpanel" className="space-y-4"><div className="flex items-end justify-between gap-4"><div><p className="page-eyebrow">Authoritative progress</p><h2 className="mt-2 text-2xl font-semibold text-white">Credit & BBX Performance</h2></div></div>
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl" aria-label="Learning summary"><p className="data-label">Learning summary</p><div className="mt-4 grid grid-cols-2 gap-3">{statCards.map((card) => { const Icon = card.icon; return <div key={card.key} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><Icon className={`h-4 w-4 ${card.iconClass}`} /><p className={`mt-3 font-mono-data text-xl font-semibold ${card.valueClass}`}>{metricValues[card.key]}</p><p className="mt-1 text-[11px] leading-4 text-white/50">{card.label}</p></div> })}</div></section>
                <section className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl" aria-label="Banking information"><p className="data-label">Banking information</p><div className="mt-4 divide-y divide-white/10 border-y border-white/10"><div className="flex items-center justify-between py-3 text-sm"><span className="text-white/60">Checking</span><span className="font-mono-data text-white">${formatAccountBalance(bankAccountQuery.data?.checkingBalance)}</span></div><div className="flex items-center justify-between py-3 text-sm"><span className="text-white/60">Savings</span><span className="font-mono-data text-white">${formatAccountBalance(bankAccountQuery.data?.savingsBalance)}</span></div><div className="flex items-center justify-between py-3 text-sm"><span className="text-white/60">Investment</span><span className="font-mono-data text-white">${formatAccountBalance(bankAccountQuery.data?.investmentBalance)}</span></div></div><a href="/banking" className="mt-4 inline-flex text-xs font-semibold text-blue-300 transition hover:text-blue-200">Manage Banking &amp; Cards <ChevronRight className="ml-1 h-3.5 w-3.5" /></a></section>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-1 shadow-[0_16px_42px_oklch(0_0_0/0.2)]"><CreditScoreChart data={creditHistory} isLoading={creditScoreHistoryQuery.isLoading} currentScore={creditScoreQuery.data?.score} refreshSchedule={{ lastRunAt: creditRefreshQuery.data?.lastRunAt, nextRunAt: creditRefreshQuery.data?.nextRunAt }} /></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-1 shadow-[0_16px_42px_oklch(0_0_0/0.2)]"><PortfolioChart data={[]} isLoading={bbxPortfolioQuery.isLoading} currentValue={bbxPortfolioQuery.data?.totalValue} totalGain={bbxPortfolioQuery.data?.totalReturnPercent} currencyLabel="BBX Blue Bucks" /></div>
              </div>
            </section>}

            {activeSection === 'preferences' && <section id="preferences" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7"><div className="flex items-center gap-3"><Bell className="h-5 w-5 text-blue-300" /><div><h2 className="text-2xl font-semibold text-white">Notification Preferences</h2><p className="mt-1 text-sm text-white/60">Choose which in-app updates you want to see. Changes save automatically.</p></div></div><div className="mt-6 grid gap-3 md:grid-cols-2">{[
              ['announcementsEnabled', 'Chapter announcements', 'New chapter-wide posts and updates'], ['feedbackResponsesEnabled', 'Feedback responses', 'Replies to feedback you submit'], ['systemUpdatesEnabled', 'System updates', 'Important Blue Blazer feature notices'], ['studyRemindersEnabled', 'Study reminders', 'Optional practice and PI study reminders'],
            ].map(([key, title, description]) => { const preferenceKey = key as 'announcementsEnabled' | 'feedbackResponsesEnabled' | 'systemUpdatesEnabled' | 'studyRemindersEnabled'; return <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition-colors hover:border-blue-400/35"><span><span className="block font-medium text-white">{title}</span><span className="mt-1 block text-xs text-white/55">{description}</span></span><input type="checkbox" checked={notificationPreferencesQuery.data?.[preferenceKey] ?? (preferenceKey !== 'studyRemindersEnabled')} disabled={notificationPreferencesQuery.isLoading || updateNotificationPreferences.isPending} onChange={(event) => setNotificationPreference(preferenceKey, event.target.checked)} className="mt-1 h-4 w-4 accent-blue-500" /></label> })}</div></section>}

            {activeSection === 'portfolio' && <section id="portfolio" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><FileText className="h-6 w-6 text-blue-300" /><h2 className="text-2xl font-semibold text-white">My Portfolio</h2></div><Button onClick={() => setShowAddPortfolioDialog(true)}><Plus className="mr-2 h-4 w-4" />Add Item</Button></div>{portfolio.length === 0 ? <div className="py-12 text-center"><FileText className="mx-auto mb-4 h-14 w-14 text-white/25" /><p className="text-sm text-white/55">No portfolio items yet</p><Button onClick={() => setShowAddPortfolioDialog(true)} variant="outline" className="mt-4 border-blue-400/30 text-blue-200 hover:bg-blue-500/10">Add Your First Item</Button></div> : <div className="mt-6 grid gap-4 md:grid-cols-2">{portfolio.map((item: any) => <Card key={item.id} className="border-white/10 bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold text-white">{item.title}</h3><p className="mt-1 text-sm text-blue-300">{item.category}</p></div><div className="flex shrink-0 gap-1"><button onClick={() => handleEditPortfolioItem(item)} className="rounded p-1.5 transition-colors hover:bg-white/10"><Edit2 className="h-4 w-4 text-white/55" /></button><button onClick={() => { if (confirm('Are you sure you want to delete this portfolio item?')) deletePortfolioMutation.mutate({ itemId: item.id }) }} className="rounded p-1.5 transition-colors hover:bg-red-500/10"><Trash2 className="h-4 w-4 text-red-300" /></button></div></div>{item.description && <p className="mt-3 text-sm text-white/60">{item.description}</p>}<div className="mt-4 flex flex-wrap gap-3">{item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:text-blue-200">View File →</a>}{item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:text-blue-200">View Link →</a>}</div></Card>)}</div>}</section>}

            {activeSection === 'achievements' && <section id="achievements" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7"><div className="flex items-center gap-3"><Medal className="h-6 w-6 text-amber-300" /><h2 className="text-2xl font-semibold text-white">Achievements</h2></div><p className="mt-4 text-sm leading-6 text-white/60">Keep practicing and earning achievements! Complete more questions, improve your accuracy, and build your study streak to unlock special badges.</p></section>}
          </div>
        </div>

        <Dialog open={showAddPortfolioDialog} onOpenChange={setShowAddPortfolioDialog}><DialogContent className="border-white/10 bg-slate-900 text-white"><DialogHeader><DialogTitle>{editingPortfolioItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</DialogTitle></DialogHeader><div className="space-y-4"><div><label className="mb-2 block text-sm text-white">Title *</label><Input value={portfolioFormData.title} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, title: event.target.value })} placeholder="Item title" className="border-slate-600 bg-slate-800 text-white" /></div><div><label className="mb-2 block text-sm text-white">Category *</label><select value={portfolioFormData.category} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, category: event.target.value })} className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"><option value="">Select a category</option>{PORTFOLIO_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></div><div><label className="mb-2 block text-sm text-white">Description</label><textarea value={portfolioFormData.description} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, description: event.target.value })} placeholder="Describe this item" className="h-24 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" /></div><div><label className="mb-2 block text-sm text-white">File URL</label><Input value={portfolioFormData.fileUrl} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, fileUrl: event.target.value })} placeholder="Link to file" className="border-slate-600 bg-slate-800 text-white" /></div><div><label className="mb-2 block text-sm text-white">External URL</label><Input value={portfolioFormData.externalUrl} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, externalUrl: event.target.value })} placeholder="Link to external resource" className="border-slate-600 bg-slate-800 text-white" /></div><div className="flex gap-3 pt-2"><Button onClick={editingPortfolioItem ? handleUpdatePortfolioItem : handleAddPortfolioItem} className="flex-1">{editingPortfolioItem ? 'Update' : 'Add'}</Button><Button onClick={resetPortfolioForm} variant="outline" className="flex-1 border-slate-600 text-white/70">Cancel</Button></div></div></DialogContent></Dialog>
      </div>
    </main>
  )
}
