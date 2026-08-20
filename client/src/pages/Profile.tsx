import { useEffect, useState } from 'react'
import { useAuth } from '@/_core/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { ArrowLeft, Bell, BookOpen, BriefcaseBusiness, CheckCircle, ChevronRight, Edit2, FileText, Flame, LayoutDashboard, LineChart, Medal, Plus, SlidersHorizontal, Sparkles, Target, Trash2 } from 'lucide-react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CreditScoreChart } from '@/components/CreditScoreChart'
import { PortfolioChart } from '@/components/PortfolioChart'
import { AchievementTierPanel } from '@/components/AchievementTierPanel'
import { allEvents } from '@/pages/Events'
import { useTheme, type WebsiteTheme } from '@/contexts/ThemeContext'
import { DEFAULT_PROFILE_AVATAR, DEFAULT_PROFILE_BANNER, getProfileAvatar, getProfileBanner, PROFILE_AVATAR_OPTIONS, PROFILE_BANNER_OPTIONS, type ProfileAvatarKey, type ProfileBannerKey } from '@/lib/profileVisuals'

const PORTFOLIO_CATEGORIES = [
  'Written Event', 'Roleplay', 'Exam Preparation', 'Presentation', 'Resume', 'Community Service', 'Leadership', 'Awards', 'Other',
]

const ACCENT_STYLES = {
  blue: 'from-blue-600/20 via-slate-950/70 to-slate-950 border-blue-500/25',
  violet: 'from-violet-600/20 via-slate-950/70 to-slate-950 border-violet-500/25',
  emerald: 'from-emerald-600/20 via-slate-950/70 to-slate-950 border-emerald-500/25',
  rose: 'from-rose-600/20 via-slate-950/70 to-slate-950 border-rose-500/25',
} as const

const PROFILE_EVENT_CLUSTER_STYLES: Record<string, { panel: string; label: string; muted: string; select: string; action: string; finder: string }> = {
  Marketing: { panel: 'border-red-300/25 bg-[linear-gradient(135deg,oklch(0.22_0.1_25/0.4),oklch(0.07_0.018_265/0.72))]', label: 'text-red-200', muted: 'text-red-100/70', select: 'border-red-200/25 focus:border-red-300 focus:ring-red-300/35', action: 'bg-red-600 text-white hover:bg-red-500', finder: 'border-red-300/35 bg-red-400/10 text-red-100 hover:bg-red-400/20 focus:ring-red-300' },
  Finance: { panel: 'border-green-300/25 bg-[linear-gradient(135deg,oklch(0.22_0.09_150/0.38),oklch(0.07_0.018_265/0.72))]', label: 'text-green-200', muted: 'text-green-100/70', select: 'border-green-200/25 focus:border-green-300 focus:ring-green-300/35', action: 'bg-green-600 text-white hover:bg-green-500', finder: 'border-green-300/35 bg-green-400/10 text-green-100 hover:bg-green-400/20 focus:ring-green-300' },
  'Hospitality & Tourism': { panel: 'border-blue-300/25 bg-[linear-gradient(135deg,oklch(0.22_0.1_255/0.4),oklch(0.07_0.018_265/0.72))]', label: 'text-blue-200', muted: 'text-blue-100/70', select: 'border-blue-200/25 focus:border-blue-300 focus:ring-blue-300/35', action: 'bg-blue-600 text-white hover:bg-blue-500', finder: 'border-blue-300/35 bg-blue-400/10 text-blue-100 hover:bg-blue-400/20 focus:ring-blue-300' },
  'Business Management': { panel: 'border-amber-300/25 bg-[linear-gradient(135deg,oklch(0.24_0.1_85/0.38),oklch(0.07_0.018_265/0.72))]', label: 'text-amber-200', muted: 'text-amber-100/70', select: 'border-amber-200/25 focus:border-amber-300 focus:ring-amber-300/35', action: 'bg-amber-400 text-slate-950 hover:bg-amber-300', finder: 'border-amber-300/35 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20 focus:ring-amber-300' },
  Entrepreneurship: { panel: 'border-slate-300/25 bg-[linear-gradient(135deg,oklch(0.23_0.015_255/0.4),oklch(0.07_0.018_265/0.72))]', label: 'text-slate-200', muted: 'text-slate-100/70', select: 'border-slate-200/25 focus:border-slate-300 focus:ring-slate-300/35', action: 'bg-slate-500 text-white hover:bg-slate-400', finder: 'border-slate-300/35 bg-slate-400/10 text-slate-100 hover:bg-slate-400/20 focus:ring-slate-300' },
  'Personal Finance': { panel: 'border-lime-300/25 bg-[linear-gradient(135deg,oklch(0.24_0.1_125/0.38),oklch(0.07_0.018_265/0.72))]', label: 'text-lime-200', muted: 'text-lime-100/70', select: 'border-lime-200/25 focus:border-lime-300 focus:ring-lime-300/35', action: 'bg-lime-500 text-slate-950 hover:bg-lime-400', finder: 'border-lime-300/35 bg-lime-400/10 text-lime-100 hover:bg-lime-400/20 focus:ring-lime-300' },
}

const DEFAULT_PROFILE_EVENT_STYLE = PROFILE_EVENT_CLUSTER_STYLES.Marketing

const statCards = [
  { key: 'questionsAnswered', label: 'Questions Answered', detail: 'Total practice questions', icon: BookOpen, valueClass: 'text-blue-300', iconClass: 'text-blue-300', tone: 'blue' },
  { key: 'accuracy', label: 'Accuracy', detail: 'Overall accuracy rate', icon: CheckCircle, valueClass: 'text-emerald-300', iconClass: 'text-emerald-300', tone: 'green' },
  { key: 'studyStreak', label: 'Study Streak', detail: 'Days in a row', icon: Flame, valueClass: 'text-amber-300', iconClass: 'text-amber-300', tone: 'yellow' },
  { key: 'savedQuestions', label: 'Saved Questions', detail: 'Questions bookmarked', icon: Target, valueClass: 'text-violet-300', iconClass: 'text-violet-300', tone: 'slate' },
] as const

const PROFILE_SECTIONS = [
  { id: 'profile-settings', label: 'Profile settings', description: 'Identity and appearance', icon: LayoutDashboard },
  { id: 'event-selection', label: 'Event selection', description: 'Your current DECA focus', icon: Target },
  { id: 'progress', label: 'Progress', description: 'Credit and BBX performance', icon: LineChart },
  { id: 'preferences', label: 'Notifications', description: 'Control your updates', icon: SlidersHorizontal },
  { id: 'portfolio', label: 'My portfolio', description: 'Your DECA work', icon: BriefcaseBusiness },
  { id: 'achievements-tiered', label: 'Achievements', description: 'Bronze, Silver, and Gold tiers', icon: Medal },
] as const

export default function Profile() {
  const { user } = useAuth()
  const { setWebsiteTheme } = useTheme()
  const utils = trpc.useUtils()
  const [, setLocation] = useLocation()
  const [showAddPortfolioDialog, setShowAddPortfolioDialog] = useState(false)
  const [activeSection, setActiveSection] = useState<(typeof PROFILE_SECTIONS)[number]['id'] | 'achievements'>('profile-settings')
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<any>(null)
  const [portfolioFormData, setPortfolioFormData] = useState({ title: '', category: '', description: '', fileUrl: '', externalUrl: '', memberProgressNotes: '' })
  const [profileCustomization, setProfileCustomization] = useState({ displayName: '', bio: '', accentColor: 'blue' as 'blue' | 'violet' | 'emerald' | 'rose', websiteTheme: 'glass' as WebsiteTheme, avatarKey: DEFAULT_PROFILE_AVATAR as ProfileAvatarKey, bannerKey: DEFAULT_PROFILE_BANNER as ProfileBannerKey, showOnLeaderboard: true })
  const [selectedEventCode, setSelectedEventCode] = useState('')

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
  const setPrimaryEvent = trpc.preferences.setPrimaryEvent.useMutation({
    onSuccess: async ({ primaryEventCode }) => {
      setSelectedEventCode(primaryEventCode)
      await utils.preferences.getPrimaryEvent.invalidate()
      toast.success('Focused event updated')
    },
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
    setProfileCustomization({ displayName: settings.displayName || '', bio: settings.bio || '', accentColor: settings.accentColor, websiteTheme: settings.websiteTheme, avatarKey: settings.avatarKey, bannerKey: settings.bannerKey, showOnLeaderboard: settings.showOnLeaderboard })
    setWebsiteTheme(settings.websiteTheme)
  }, [profileSettingsQuery.data])

  useEffect(() => {
    setSelectedEventCode(primaryEventQuery.data?.primaryEventCode ?? '')
  }, [primaryEventQuery.data?.primaryEventCode])

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
  const selectedEvent = allEvents.find((event) => event.code === selectedEventCode)
  const eventSelectionStyle = PROFILE_EVENT_CLUSTER_STYLES[selectedEvent?.cluster ?? focusedEvent?.cluster ?? ''] ?? DEFAULT_PROFILE_EVENT_STYLE
  const selectedAvatar = getProfileAvatar(profileCustomization.avatarKey)
  const selectedBanner = getProfileBanner(profileCustomization.bannerKey)
  const formatAccountBalance = (value: unknown) => Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  // The legacy one-level panel below remains unreachable while the tiered panel
  // is now served by AchievementTierPanel. Keep its stale local inputs empty
  // until the old markup is removed in the next Profile layout consolidation.
  const achievementDefinitions: any[] = []
  const earnedAchievements: any[] = []
  const nextAchievement: any = null
  const selectSection = (id: (typeof PROFILE_SECTIONS)[number]['id']) => {
    setActiveSection(id)
  }
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

        <section className={`overflow-hidden rounded-[1.6rem] border bg-gradient-to-br ${ACCENT_STYLES[profileCustomization.accentColor]} shadow-[0_24px_70px_oklch(0_0_0/0.28)]`}>
          <div className="h-28 border-b border-white/10 bg-cover bg-center sm:h-36" style={{ backgroundImage: `linear-gradient(90deg, oklch(0.05 0.014 265 / 0.78), oklch(0.05 0.014 265 / 0.22)), url(${selectedBanner.src})` }} />
          <div className="relative flex flex-col gap-5 px-5 pb-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-14 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-slate-950 bg-slate-900 shadow-[0_14px_40px_oklch(0.45_0.2_260/0.42)] sm:-mt-16 sm:h-32 sm:w-32">
                <img src={selectedAvatar.src} alt={`${selectedAvatar.label} profile avatar`} className="h-full w-full object-cover" />
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

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,2fr)]">
          <aside className="self-start lg:sticky lg:top-24">

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65 p-3 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl">
              <p className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Profile navigation</p>
              <div className="space-y-1">
                {PROFILE_SECTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeSection === id} onClick={() => selectSection(id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${activeSection === id ? 'bg-blue-500/15 text-blue-100 ring-1 ring-inset ring-blue-400/25' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}><Icon className={`h-4 w-4 shrink-0 ${activeSection === id ? 'text-blue-300' : 'text-white/45 group-hover:text-blue-200'}`} /><span className="min-w-0"><span className="block truncate">{label}</span><span className={`mt-0.5 block truncate text-[10px] ${activeSection === id ? 'text-blue-200/70' : 'text-white/35'}`}>{PROFILE_SECTIONS.find((section) => section.id === id)?.description}</span></span>{activeSection === id && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-300" />}</button>)}
              </div>
            </div>

          </aside>

          <div className="min-w-0 space-y-7">
            {activeSection === 'achievements-tiered' && <AchievementTierPanel />}
            {activeSection === 'profile-settings' && <section id="profile-settings" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="page-eyebrow">Member profile</p><h2 className="mt-2 text-2xl font-semibold text-white">Profile Customization</h2><p className="mt-1 text-sm text-white/60">Personalize what other members see on your profile.</p></div><Sparkles className="mt-1 h-5 w-5 text-blue-300" /></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-white/80">Display name<Input value={profileCustomization.displayName} onChange={(event) => setProfileCustomization((current) => ({ ...current, displayName: event.target.value }))} placeholder={user.name || user.username || 'Your display name'} maxLength={60} className="mt-1.5 bg-slate-950/70 border-white/10 text-white" /></label>
                <label className="text-sm text-white/80">Accent color<select value={profileCustomization.accentColor} onChange={(event) => setProfileCustomization((current) => ({ ...current, accentColor: event.target.value as typeof current.accentColor }))} className="mt-1.5 w-full rounded-md border border-white/10 bg-slate-950/70 p-2 text-white"><option value="blue">Blue</option><option value="violet">Violet</option><option value="emerald">Emerald</option><option value="rose">Rose</option></select></label>
                <label className="text-sm text-white/80 md:col-span-2">Short bio<textarea value={profileCustomization.bio} onChange={(event) => setProfileCustomization((current) => ({ ...current, bio: event.target.value }))} maxLength={280} rows={3} placeholder="Share your DECA focus, event, or goal." className="mt-1.5 w-full resize-y rounded-md border border-white/10 bg-slate-950/70 p-2 text-white" /></label>
              </div>
              <div className="mt-6 border-t border-white/10 pt-5"><div><p className="data-label">Profile avatar</p><h3 className="mt-1 text-base font-semibold text-white">Choose your profile picture</h3><p className="mt-1 text-sm text-white/60">Select a DECA-inspired emblem or a general visual that fits your style.</p></div><div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">{PROFILE_AVATAR_OPTIONS.map((option) => <button key={option.key} type="button" aria-pressed={profileCustomization.avatarKey === option.key} onClick={() => setProfileCustomization((current) => ({ ...current, avatarKey: option.key }))} className={`group relative overflow-hidden rounded-xl border p-1 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${profileCustomization.avatarKey === option.key ? 'border-blue-300 ring-1 ring-blue-300/50' : 'border-white/10 hover:border-white/30'}`}><img src={option.src} alt="" className="aspect-square w-full rounded-lg object-cover" /><span className="mt-1.5 block truncate px-1 text-[10px] font-medium text-white/75">{option.label}</span><span className="block truncate px-1 text-[9px] text-white/40">{option.category}</span></button>)}</div></div>
              <div className="mt-6 border-t border-white/10 pt-5"><div><p className="data-label">Profile banner</p><h3 className="mt-1 text-base font-semibold text-white">Set your profile backdrop</h3><p className="mt-1 text-sm text-white/60">Choose a DECA scene or a general banner. Your selection appears behind your profile picture.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{PROFILE_BANNER_OPTIONS.map((option) => <button key={option.key} type="button" aria-pressed={profileCustomization.bannerKey === option.key} onClick={() => setProfileCustomization((current) => ({ ...current, bannerKey: option.key }))} className={`group overflow-hidden rounded-xl border text-left transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${profileCustomization.bannerKey === option.key ? 'border-blue-300 ring-1 ring-blue-300/50' : 'border-white/10 hover:border-white/30'}`}><img src={option.src} alt="" className="aspect-[3/1] w-full object-cover" /><span className="flex items-center justify-between px-3 py-2"><span className="text-xs font-medium text-white/85">{option.label}</span><span className="text-[10px] text-white/40">{option.category}</span></span></button>)}</div></div>
              <div className="mt-5 border-t border-white/10 pt-5"><div><p className="data-label">Website style</p><h3 className="mt-1 text-base font-semibold text-white">Choose your Blue Blazer experience</h3><p className="mt-1 text-sm text-white/60">Glass preserves the current blue editorial system. Blazer uses the supplied solid palette on dark surfaces. Light Blazer brings the same palette into a clean, high-contrast light mode.</p></div><div className="mt-4 grid gap-3 md:grid-cols-3">{([{ value: 'glass', label: 'Glass', description: 'The original dark-blue, frosted editorial look.' }, { value: 'blazer', label: 'Blazer', description: 'Solid reference-palette buttons and controls on a restrained dark surface.' }, { value: 'light-blazer', label: 'Light Blazer', description: 'A clean light-mode workspace with the same Blue Blazer color system.' }] as const).map((option) => <button key={option.value} type="button" data-active={profileCustomization.websiteTheme === option.value} onClick={() => applyWebsiteTheme(option.value)} disabled={updateWebsiteTheme.isPending} className="website-theme-choice rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-wait disabled:opacity-70"><span className="website-theme-swatch" aria-hidden="true" /><span className="mt-3 block font-semibold text-white">{option.label}</span><span className="mt-1 block text-xs leading-5 text-white/60">{option.description}</span><span className="mt-3 block text-[10px] font-mono-data uppercase tracking-[0.14em] text-white/45">{profileCustomization.websiteTheme === option.value ? 'Selected' : 'Select style'}</span></button>)}</div></div>
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-white/80"><input type="checkbox" checked={profileCustomization.showOnLeaderboard} onChange={(event) => setProfileCustomization((current) => ({ ...current, showOnLeaderboard: event.target.checked }))} className="h-4 w-4 accent-blue-500" />Show my customized profile on chapter leaderboards</label>
              <div className="mt-5 flex justify-end"><Button disabled={updateProfileSettings.isPending} onClick={() => updateProfileSettings.mutate({ displayName: profileCustomization.displayName.trim() || null, bio: profileCustomization.bio.trim() || null, accentColor: profileCustomization.accentColor, websiteTheme: profileCustomization.websiteTheme, avatarKey: profileCustomization.avatarKey, bannerKey: profileCustomization.bannerKey, showOnLeaderboard: profileCustomization.showOnLeaderboard })}>Save customization</Button></div>
            </section>}

            {activeSection === 'event-selection' && <section id="event-selection" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="page-eyebrow">Competition focus</p><h2 className="mt-2 text-2xl font-semibold text-white">Event Selection</h2><p className="mt-1 text-sm text-white/60">Keep your Blue Blazer practice, PI study, and event guidance aligned with the event you plan to compete in.</p></div><Target className="mt-1 h-5 w-5 text-blue-300" /></div>
              <div className={`mt-6 rounded-2xl border p-5 ${eventSelectionStyle.panel}`}>
                <p className={`data-label ${eventSelectionStyle.label}`}>Focused event</p>
                {focusedEvent ? <><h3 className="mt-2 text-xl font-semibold text-white">{focusedEvent.code} — {focusedEvent.name}</h3><p className={`mt-2 text-sm ${eventSelectionStyle.muted}`}>{focusedEvent.cluster} · {focusedEvent.type}</p></> : <><h3 className="mt-2 text-xl font-semibold text-white">No event selected</h3><p className={`mt-2 text-sm ${eventSelectionStyle.muted}`}>Take the short survey to receive event suggestions, then choose the event that fits your competition plan.</p></>}
                <div className="mt-5 grid gap-3 border-t border-blue-200/15 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <label className="block text-sm font-medium text-white">Change focused event<select value={selectedEventCode} onChange={(event) => setSelectedEventCode(event.target.value)} disabled={primaryEventQuery.isLoading || setPrimaryEvent.isPending} className={`mt-1.5 w-full rounded-md border bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:ring-2 disabled:cursor-wait disabled:opacity-70 ${eventSelectionStyle.select}`}><option value="">Choose an event</option>{allEvents.map((event) => <option key={event.code} value={event.code}>{event.code} — {event.name}</option>)}</select></label>
                  <Button type="button" onClick={() => selectedEventCode && setPrimaryEvent.mutate({ eventCode: selectedEventCode })} disabled={!selectedEvent || selectedEventCode === primaryEventCode || setPrimaryEvent.isPending} className={`min-w-44 ${eventSelectionStyle.action}`}>{setPrimaryEvent.isPending ? 'Saving focus...' : focusedEvent ? 'Change Focused Event' : 'Save Focused Event'}</Button>
                </div>
                <p className={`mt-3 text-xs leading-5 ${eventSelectionStyle.muted}`}>Changing your focus updates event-aligned practice guidance, PI study links, and mock-exam recommendations.</p>
                <a href="/event-match?retake=1" className={`mt-4 inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 ${eventSelectionStyle.finder}`}><Target className="mr-2 h-4 w-4" />Start Event Finder</a>
              </div>
            </section>}

            {activeSection === 'progress' && <section id="progress" role="tabpanel" className="space-y-4"><div className="flex items-end justify-between gap-4"><div><p className="page-eyebrow">Authoritative progress</p><h2 className="mt-2 text-2xl font-semibold text-white">Credit & BBX Performance</h2></div></div>
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl" aria-label="Learning summary"><p className="data-label">Learning summary</p><div className="mt-4 grid grid-cols-2 gap-3">{statCards.map((card) => { const Icon = card.icon; return <div key={card.key} data-profile-metric-tone={card.tone} className="profile-progress-metric rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><Icon className={`profile-progress-metric-icon h-4 w-4 ${card.iconClass}`} /><p className={`profile-progress-metric-value mt-3 font-mono-data text-xl font-semibold ${card.valueClass}`}>{metricValues[card.key]}</p><p className="profile-progress-metric-label mt-1 text-[11px] leading-4 text-white/50">{card.label}</p></div> })}</div></section>
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

            {activeSection === 'achievements' && <section id="achievements" role="tabpanel" className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_16px_42px_oklch(0_0_0/0.2)] backdrop-blur-xl sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-3"><Medal className="h-6 w-6 text-amber-300" /><h2 className="text-2xl font-semibold text-white">Achievements</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Live milestones based only on your recorded Blue Blazer practice, saved questions, selected event, and portfolio work. Nothing is awarded manually or inferred.</p></div><div className="w-fit rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-left"><p className="data-label text-amber-200/70">Earned now</p><p className="mt-1 text-2xl font-semibold text-amber-100">{earnedAchievements.length} <span className="text-sm font-medium text-amber-100/60">/ {achievementDefinitions.length}</span></p></div></div>{nextAchievement && <div className="mt-6 rounded-2xl border border-blue-300/20 bg-blue-400/[0.08] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><p className="data-label text-blue-200/75">Next milestone</p><h3 className="mt-1 text-base font-semibold text-white">{nextAchievement.title}</h3><p className="mt-1 text-sm text-blue-100/70">{nextAchievement.criteria} · {nextAchievement.progressLabel}</p></div><span className="mt-3 inline-flex rounded-full border border-blue-300/25 bg-slate-950/35 px-3 py-1.5 text-xs font-medium text-blue-100 sm:mt-0">{Math.round((nextAchievement.value / nextAchievement.target) * 100)}% complete</span></div>}<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{achievementDefinitions.map((achievement) => { const earned = achievement.value >= achievement.target; const Icon = achievement.icon; const completion = Math.min(100, Math.round((achievement.value / achievement.target) * 100)); const tone = achievement.tone === 'emerald' ? 'border-emerald-300/25 bg-emerald-400/[0.07] text-emerald-200' : achievement.tone === 'violet' ? 'border-violet-300/25 bg-violet-400/[0.07] text-violet-200' : achievement.tone === 'amber' ? 'border-amber-300/25 bg-amber-400/[0.07] text-amber-200' : 'border-blue-300/25 bg-blue-400/[0.07] text-blue-200'; return <article key={achievement.id} aria-label={`${achievement.title}: ${earned ? 'earned' : 'in progress'}`} className={`rounded-2xl border p-4 transition ${earned ? tone : 'border-white/10 bg-white/[0.02] opacity-80'}`}><div className="flex items-start justify-between gap-3"><span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${earned ? tone : 'border-white/10 bg-slate-950/65 text-white/35'}`}><Icon className="h-5 w-5" /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${earned ? 'bg-white/10 text-white' : 'bg-white/[0.05] text-white/45'}`}>{earned ? 'Earned' : 'In progress'}</span></div><h3 className="mt-4 font-semibold text-white">{achievement.title}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-white/60">{achievement.description}</p><p className="mt-4 text-xs font-medium text-white/75">{achievement.criteria}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25"><div className={`${earned ? achievement.tone === 'emerald' ? 'bg-emerald-400' : achievement.tone === 'violet' ? 'bg-violet-400' : achievement.tone === 'amber' ? 'bg-amber-300' : 'bg-blue-400' : 'bg-white/25'} h-full rounded-full transition-all`} style={{ width: `${completion}%` }} /></div><p className="mt-2 text-xs text-white/50">{achievement.progressLabel}</p></article> })}</div>{earnedAchievements.length === achievementDefinitions.length && <div className="mt-6 rounded-2xl border border-emerald-300/25 bg-emerald-400/[0.08] p-4 text-sm text-emerald-100">Every current Blue Blazer achievement is earned. Keep building your practice history and portfolio as new milestones are added.</div>}</section>}
          </div>
        </div>

        <Dialog open={showAddPortfolioDialog} onOpenChange={setShowAddPortfolioDialog}><DialogContent className="border-white/10 bg-slate-900 text-white"><DialogHeader><DialogTitle>{editingPortfolioItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</DialogTitle></DialogHeader><div className="space-y-4"><div><label className="mb-2 block text-sm text-white">Title *</label><Input value={portfolioFormData.title} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, title: event.target.value })} placeholder="Item title" className="border-slate-600 bg-slate-800 text-white" /></div><div><label className="mb-2 block text-sm text-white">Category *</label><select value={portfolioFormData.category} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, category: event.target.value })} className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"><option value="">Select a category</option>{PORTFOLIO_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></div><div><label className="mb-2 block text-sm text-white">Description</label><textarea value={portfolioFormData.description} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, description: event.target.value })} placeholder="Describe this item" className="h-24 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" /></div><div><label className="mb-2 block text-sm text-white">File URL</label><Input value={portfolioFormData.fileUrl} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, fileUrl: event.target.value })} placeholder="Link to file" className="border-slate-600 bg-slate-800 text-white" /></div><div><label className="mb-2 block text-sm text-white">External URL</label><Input value={portfolioFormData.externalUrl} onChange={(event) => setPortfolioFormData({ ...portfolioFormData, externalUrl: event.target.value })} placeholder="Link to external resource" className="border-slate-600 bg-slate-800 text-white" /></div><div className="flex gap-3 pt-2"><Button onClick={editingPortfolioItem ? handleUpdatePortfolioItem : handleAddPortfolioItem} className="flex-1">{editingPortfolioItem ? 'Update' : 'Add'}</Button><Button onClick={resetPortfolioForm} variant="outline" className="flex-1 border-slate-600 text-white/70">Cancel</Button></div></div></DialogContent></Dialog>
      </div>
    </main>
  )
}
