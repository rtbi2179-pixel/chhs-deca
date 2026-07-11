/*
 * CHHS DECA Calendar Page — Cinematic Dark Editorial
 * Competition calendar with district, state, and ICDC dates
 * Monthly view with event badges
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, MapPin, ExternalLink, Trophy, Clock, Star } from 'lucide-react'
import { useAuth } from '@/_core/hooks/useAuth'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { toast } from 'sonner'
import { Trash2, Edit2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'

type EventType = 'district' | 'state' | 'icdc' | 'chapter' | 'deadline'

interface CalEvent {
  id: number
  date: string // YYYY-MM-DD
  title: string
  type: EventType
  location?: string
  description: string
  link?: string
  time?: string
}

const calendarEvents: CalEvent[] = [
  // September 2025
  { id: 1, date: '2025-09-08', title: 'DECA Year Kickoff Meeting', type: 'chapter', description: 'Welcome back! Chapter orientation, event selection, and goal-setting for the 2025-2026 season.', time: '3:30 PM' },
  { id: 2, date: '2025-09-15', title: 'Event Selection Deadline', type: 'deadline', description: 'Last day to finalize your competitive event selection for the season.', link: 'https://www.deca.org/compete' },
  { id: 3, date: '2025-09-22', title: 'Practice Exam Session #1', type: 'chapter', description: 'First cluster exam practice session. Bring your study materials!', time: '3:30 PM' },

  // October 2025
  { id: 4, date: '2025-10-06', title: 'Role-Play Workshop', type: 'chapter', description: 'Mock role-play practice with peer judges. All event types welcome.', time: '3:30 PM' },
  { id: 5, date: '2025-10-13', title: 'Written Event Check-In', type: 'chapter', description: 'Progress check for all written/prepared event participants.', time: '3:30 PM' },
  { id: 6, date: '2025-10-20', title: 'Practice Exam Session #2', type: 'chapter', description: 'Second cluster exam practice with timed conditions.', time: '3:30 PM' },
  { id: 7, date: '2025-10-27', title: 'DECA Week Kickoff', type: 'chapter', description: 'National DECA Week activities and community engagement events.', time: 'All Week' },

  // November 2025
  { id: 8, date: '2025-11-03', title: 'Mock Competition', type: 'chapter', description: 'Full mock competition with external judges. Dress professionally!', time: '8:00 AM', location: 'CHHS Cafeteria' },
  { id: 9, date: '2025-11-10', title: 'Written Event Draft Due', type: 'deadline', description: 'First draft of all written events due for advisor review.' },
  { id: 10, date: '2025-11-17', title: 'Practice Exam Session #3', type: 'chapter', description: 'Final practice exam before district competition.', time: '3:30 PM' },

  // December 2025
  { id: 11, date: '2025-12-01', title: 'Written Event Final Draft Due', type: 'deadline', description: 'Final written event submissions due for advisor approval.' },
  { id: 12, date: '2025-12-08', title: 'Pre-District Prep Day', type: 'chapter', description: 'Last preparation session before district competition. Uniform check and final role-plays.', time: '3:30 PM' },
  { id: 13, date: '2025-12-15', title: 'Holiday Social & Awards', type: 'chapter', description: 'Chapter holiday celebration and recognition of member achievements.', time: '4:00 PM' },

  // January 2026
  { id: 14, date: '2026-01-12', title: 'District Competition', type: 'district', description: 'CHHS DECA District Competition. All members compete for state qualification.', location: 'TBD — Check with advisor', time: '7:00 AM', link: 'https://www.deca.org/calendar' },
  { id: 15, date: '2026-01-19', title: 'District Results & Debrief', type: 'chapter', description: 'Review district results, celebrate wins, and plan for state competition.', time: '3:30 PM' },
  { id: 16, date: '2026-01-26', title: 'State Prep Begins', type: 'chapter', description: 'Intensive preparation for state competition begins for qualifiers.', time: '3:30 PM' },

  // February 2026
  { id: 17, date: '2026-02-02', title: 'State Registration Deadline', type: 'deadline', description: 'Deadline to register for state competition. Confirm with advisor.', link: 'https://www.deca.org/calendar' },
  { id: 18, date: '2026-02-09', title: 'State Mock Competition', type: 'chapter', description: 'Full mock competition simulating state-level conditions.', time: '8:00 AM', location: 'CHHS Cafeteria' },
  { id: 19, date: '2026-02-16', title: 'Written Event State Submission', type: 'deadline', description: 'Final written event submissions due for state competition.' },
  { id: 20, date: '2026-02-23', title: 'State Competition Prep Day', type: 'chapter', description: 'Final preparation before state competition. Travel logistics review.', time: '3:30 PM' },

  // March 2026
  { id: 21, date: '2026-03-05', title: 'State Career Development Conference', type: 'state', description: 'Texas DECA State Career Development Conference. Compete for ICDC qualification!', location: 'Dallas, TX (TBC)', time: 'Multi-day event', link: 'https://www.deca.org/calendar' },
  { id: 22, date: '2026-03-09', title: 'State Results & Celebration', type: 'chapter', description: 'Celebrate state results and announce ICDC qualifiers!', time: '4:00 PM' },
  { id: 23, date: '2026-03-16', title: 'ICDC Prep Begins', type: 'chapter', description: 'Intensive ICDC preparation for state qualifiers.', time: '3:30 PM' },
  { id: 24, date: '2026-03-30', title: 'ICDC Registration Deadline', type: 'deadline', description: 'Final deadline to register for ICDC.', link: 'https://www.deca.org/conferences/icdc' },

  // April 2026
  { id: 25, date: '2026-04-06', title: 'ICDC Mock Competition', type: 'chapter', description: 'Final mock competition for ICDC qualifiers with external judges.', time: '8:00 AM', location: 'CHHS Cafeteria' },
  { id: 26, date: '2026-04-13', title: 'ICDC Final Prep Week', type: 'chapter', description: 'Final week of preparation. Polish presentations and role-plays.', time: '3:30 PM' },
  { id: 27, date: '2026-04-25', title: 'ICDC 2026 — International Career Development Conference', type: 'icdc', description: 'The pinnacle of DECA competition! Compete against the best from around the world.', location: 'Orlando, FL', time: 'April 25-28, 2026', link: 'https://www.deca.org/conferences/icdc' },

  // May 2026
  { id: 28, date: '2026-05-04', title: 'ICDC Debrief & Celebration', type: 'chapter', description: 'Celebrate ICDC achievements and reflect on the season.', time: '4:00 PM' },
  { id: 29, date: '2026-05-11', title: 'Chapter Awards Banquet', type: 'chapter', description: 'Annual CHHS DECA Awards Banquet. Celebrate the year\'s achievements!', time: '6:00 PM', location: 'TBD' },
  { id: 30, date: '2026-05-18', title: 'Officer Elections', type: 'chapter', description: 'Elections for 2026-2027 chapter officers.', time: '3:30 PM' },
]

const eventTypeConfig: Record<EventType, { label: string; color: string; bg: string; border: string; dot: string }> = {
  district: { label: 'District', color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  state: { label: 'State', color: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/30', dot: 'bg-purple-400' },
  icdc: { label: 'ICDC', color: 'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  chapter: { label: 'Chapter', color: 'text-green-300', bg: 'bg-green-500/15', border: 'border-green-500/30', dot: 'bg-green-400' },
  deadline: { label: 'Deadline', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/30', dot: 'bg-red-400' },
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const { user } = useAuth()
  const { adminModeActive, setAdminModeActive, neonOverlayRef, setNeonOverlayRef, deactivateAdminMode } = useAdminMode()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const [filterType, setFilterType] = useState<EventType | 'All'>('All')
  
  // Fetch calendar events from API
  const { data: apiEvents = [] } = trpc.calendar.getAll.useQuery()
  const deleteEventMutation = trpc.calendar.delete.useMutation()
  
  // Convert API events to CalEvent format
  const convertedEvents: CalEvent[] = apiEvents.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description || '',
    date: e.date,
    time: e.time || undefined,
    location: e.location || undefined,
    link: e.link || undefined,
    type: e.type as EventType,
  }))
  
  // Use API events if available, otherwise fall back to hardcoded
  const events = apiEvents.length > 0 ? convertedEvents : calendarEvents

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const monthEvents = events.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  })

  const getEventsForDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr && (filterType === 'All' || e.type === filterType))
  }
  
  const handleDeleteEvent = async (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEventMutation.mutateAsync({ id: eventId })
        setSelectedEvent(null)
        toast.success('Event deleted')
      } catch (error) {
        toast.error('Failed to delete event')
      }
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const upcomingEvents = calendarEvents
    .filter(e => {
      const d = new Date(e.date)
      const now = new Date()
      return d >= now && (filterType === 'All' || e.type === filterType)
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8)

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)]">
      {/* Header */}
      <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background overlays removed for transparency */}
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono-data tracking-widest uppercase mb-4">
            2025–2026 Season
          </div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="font-display text-5xl sm:text-7xl text-white">COMPETITION CALENDAR</h1>
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <button
                onClick={() => {
                  if (adminModeActive) {
                    deactivateAdminMode()
                    toast.info('🔵 Admin mode deactivated')
                  } else {
                    const neonOverlay = document.createElement('div')
                    neonOverlay.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 40; background: radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, transparent 70%); box-shadow: inset 0 0 60px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.3); border: 2px solid rgba(59,130,246,0.8);'
                    document.body.appendChild(neonOverlay)
                    setNeonOverlayRef(neonOverlay)
                    setAdminModeActive(true)
                    toast.info('🔵 YOU ARE IN ADMIN MODE')
                  }
                }}
                className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] border border-yellow-500/30 text-yellow-400 rounded-lg transition text-sm font-semibold whitespace-nowrap"
                title="Manage calendar (admin only)"
              >
                👑 Manage
              </button>
            )}
          </div>
          <p className="text-white/60 text-lg max-w-2xl">
            Never miss a deadline or competition. Track district, state, and ICDC dates all in one place.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="xl:col-span-2">
            <div className="glass-card p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-display text-3xl text-white">
                  {MONTHS[viewMonth]} {viewYear}
                </h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-mono-data text-white/30 py-2 uppercase tracking-wider">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-16 sm:h-20" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayEvents = getEventsForDay(day)
                  const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day

                  return (
                    <div
                      key={day}
                      className={`h-16 sm:h-20 p-1.5 rounded-lg border transition-all duration-200 ${
                        isToday
                          ? 'border-blue-500/40 bg-blue-500/10'
                          : dayEvents.length > 0
                          ? 'border-white/8 bg-white/3 hover:bg-white/5 cursor-pointer'
                          : 'border-transparent hover:bg-white/3'
                      }`}
                      onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
                    >
                      <div className={`text-xs font-mono-data mb-1 ${isToday ? 'text-blue-400 font-bold' : 'text-white/50'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(e => {
                          const cfg = eventTypeConfig[e.type]
                          return (
                            <div
                              key={e.id}
                              className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate ${cfg.bg} ${cfg.color} leading-tight`}
                            >
                              {e.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-white/30 px-1">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-3">
                {Object.entries(eventTypeConfig).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-white/40 text-xs">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Event Detail */}
            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${eventTypeConfig[selectedEvent.type].bg} ${eventTypeConfig[selectedEvent.type].color} ${eventTypeConfig[selectedEvent.type].border}`}>
                      {eventTypeConfig[selectedEvent.type].label}
                    </span>
                    <h3 className="text-white text-xl font-bold mt-2">{selectedEvent.title}</h3>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="text-white/30 hover:text-white text-lg leading-none">×</button>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar size={14} className="text-blue-400" />
                    {new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  {selectedEvent.time && (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Clock size={14} className="text-blue-400" />
                      {selectedEvent.time}
                    </div>
                  )}
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <MapPin size={14} className="text-blue-400" />
                      {selectedEvent.location}
                    </div>
                  )}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-4">{selectedEvent.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedEvent.link && (
                    <a
                      href={selectedEvent.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all"
                    >
                      Learn More
                      <ExternalLink size={13} />
                    </a>
                  )}
                  {adminModeActive && (
                    <>
                      <button
                        onClick={() => {
                          // TODO: Implement edit functionality
                          toast.info('Edit event - coming soon')
                        }}
                        className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-sm font-medium rounded-lg transition-all border border-yellow-500/30"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
                        disabled={deleteEventMutation.isPending}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-all border border-red-500/30 disabled:opacity-50"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-4">
            {/* Filter */}
            <div className="glass-card p-5">
              <h3 className="text-white/60 text-xs font-mono-data tracking-widest uppercase mb-3">Filter Events</h3>
              <div className="flex flex-wrap gap-2">
                {(['All', 'district', 'state', 'icdc', 'chapter', 'deadline'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      filterType === type
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/3 border-white/8 text-white/50 hover:text-white'
                    }`}
                  >
                    {type === 'All' ? 'All' : eventTypeConfig[type].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Star size={16} className="text-blue-400" />
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-white/30 text-sm">No upcoming events found.</p>
                ) : (
                  upcomingEvents.map(event => {
                    const cfg = eventTypeConfig[event.type]
                    const d = new Date(event.date + 'T12:00:00')
                    return (
                      <button
                        key={event.id}
                        onClick={() => {
                          setViewYear(d.getFullYear())
                          setViewMonth(d.getMonth())
                          setSelectedEvent(event)
                        }}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/6 border border-white/5 hover:border-white/10 transition-all group"
                      >
                        <div className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${cfg.dot} mt-1.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-white/80 group-hover:text-white text-xs font-medium truncate">{event.title}</div>
                          <div className="text-white/30 text-xs mt-0.5 font-mono-data">
                            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Key Dates Banner */}
            <div className="glass-card p-5 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-yellow-400" />
                <h3 className="text-yellow-300 font-semibold text-sm">Key Dates 2025-26</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'District Competition', date: 'Jan 12, 2026', color: 'text-blue-300' },
                  { label: 'State CDC', date: 'Mar 5-7, 2026', color: 'text-purple-300' },
                  { label: 'ICDC Orlando', date: 'Apr 25-28, 2026', color: 'text-yellow-300' },
                ].map(({ label, date, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className={`text-xs ${color}`}>{label}</span>
                    <span className="text-white/40 text-xs font-mono-data">{date}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://www.deca.org/calendar"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Official DECA Calendar
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-display text-base">D</div>
            <span className="text-white/60 text-sm">CHHS DECA © 2025–2026</span>
          </div>
          <div className="flex items-center gap-6 text-white/30 text-sm">
            <a href="https://www.deca.org/calendar" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Official Calendar</a>
            <a href="https://www.deca.org/conferences/icdc" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">ICDC Info</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
