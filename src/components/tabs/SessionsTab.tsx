import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react'
import type { Session } from '../../types'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import { dateRange, formatDayLabel, formatLongDate } from '../../lib/date'
import Badge, { type BadgeTone } from '../shared/Badge'
import Button from '../shared/Button'
import ConfirmInline from '../shared/ConfirmInline'
import EmptyState from '../shared/EmptyState'
import Input from '../shared/Input'
import SidePanel from '../layout/SidePanel'

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const SESSION_TYPES = [
  'Keynote',
  'Track Session',
  'Leadership Exchange',
  'Ask the Analyst',
  'Sponsored',
] as const

const TYPE_TONE: Record<string, BadgeTone> = {
  Keynote: 'primary',
  'Track Session': 'neutral',
  'Leadership Exchange': 'amber',
  'Ask the Analyst': 'success',
  Sponsored: 'innovation',
}

const TRACK_TONE: Record<string, BadgeTone> = {
  A: 'strategy',
  B: 'risk',
  C: 'people',
  D: 'technology',
  E: 'innovation',
}

function trackTone(track: string): BadgeTone {
  const letter = track.trim().charAt(0).toUpperCase()
  return TRACK_TONE[letter] ?? 'neutral'
}

function guessType(s: Session): string {
  const t = s.track.toLowerCase()
  if (s.title.toLowerCase().includes('keynote')) return 'Keynote'
  if (t.includes('ciso circle') || t.includes('leadership exchange')) return 'Leadership Exchange'
  if (t.includes('ask the analyst')) return 'Ask the Analyst'
  if (
    s.title.toLowerCase().startsWith('kroll') ||
    s.title.toLowerCase().startsWith('ninjaone') ||
    s.title.toLowerCase().startsWith('vanta') ||
    t.includes('sponsor')
  )
    return 'Sponsored'
  return 'Track Session'
}

const emptyDraft = (day: string): Omit<Session, 'id'> => ({
  title: '',
  track: '',
  speaker: '',
  startTime: '09:00',
  endTime: '10:00',
  room: '',
  description: '',
  mustAttend: false,
  notes: '',
  day,
})

/* ------------------------------------------------------------------ */
/* Session card                                                         */
/* ------------------------------------------------------------------ */

function SessionCard({
  session,
  onEdit,
  onDelete,
  onToggleStar,
}: {
  session: Session
  onEdit: (s: Session) => void
  onDelete: (id: string) => void
  onToggleStar: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const sessionType = guessType(session)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={[
        'group rounded-card border bg-surface shadow-card transition-shadow duration-200',
        'hover:shadow-card-hover',
        session.mustAttend ? 'border-amber/40 border-l-4 border-l-amber' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Time column */}
        <div className="flex w-[88px] shrink-0 flex-col items-center rounded-control border border-border bg-background px-2 py-2 text-center">
          <span className="font-mono text-[12px] font-semibold text-primary">
            {session.startTime}
          </span>
          <span className="my-0.5 h-px w-4 bg-border" />
          <span className="font-mono text-[11px] text-text-secondary">{session.endTime}</span>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={TYPE_TONE[sessionType] ?? 'neutral'} size="sm">
              {sessionType}
            </Badge>
            {session.track && (
              <Badge tone={trackTone(session.track)} size="sm">
                {session.track}
              </Badge>
            )}
            {session.mustAttend && (
              <Badge tone="amber" size="sm" icon={<Star size={10} fill="#E8A838" />}>
                Must Attend
              </Badge>
            )}
          </div>

          <h3 className="mt-1.5 font-serif text-[15px] font-semibold leading-snug text-text-primary">
            {session.title}
          </h3>

          {session.speaker && (
            <p className="mt-0.5 font-sans text-[12.5px] text-text-secondary">
              {session.speaker}
            </p>
          )}

          {session.room && (
            <p className="mt-0.5 font-sans text-[11.5px] text-text-secondary/70">
              {session.room}
            </p>
          )}

          {session.description && (
            <>
              <p
                className={[
                  'mt-2 font-sans text-[12.5px] leading-relaxed text-text-secondary',
                  expanded ? '' : 'line-clamp-2',
                ].join(' ')}
              >
                {session.description}
              </p>
              {session.description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-0.5 font-sans text-[12px] text-primary hover:underline"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </>
          )}

          {session.notes && (
            <div className="mt-2 rounded-control border border-amber/30 bg-amber-light px-3 py-1.5 font-sans text-[12px] text-[#6B4F10]">
              {session.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            title={session.mustAttend ? 'Remove must-attend' : 'Mark must-attend'}
            onClick={() => onToggleStar(session.id)}
            className="rounded-control p-1.5 transition-colors duration-200 hover:bg-amber-light"
          >
            <Star
              size={15}
              className={session.mustAttend ? 'text-amber' : 'text-text-secondary'}
              fill={session.mustAttend ? '#E8A838' : 'none'}
            />
          </button>
          <button
            type="button"
            title="Edit session"
            onClick={() => onEdit(session)}
            className="rounded-control p-1.5 transition-colors duration-200 hover:bg-primary-light hover:text-primary"
          >
            <Pencil size={14} className="text-text-secondary" />
          </button>
          <ConfirmInline onConfirm={() => onDelete(session.id)} />
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Main tab                                                             */
/* ------------------------------------------------------------------ */

export default function SessionsTab() {
  const trip = useActiveTrip()
  const addSession = useTripStore((s) => s.addSession)
  const updateSession = useTripStore((s) => s.updateSession)
  const deleteSession = useTripStore((s) => s.deleteSession)

  const days = useMemo(
    () => (trip ? dateRange(trip.basics.startDate, trip.basics.endDate) : []),
    [trip],
  )

  /* ── filter state ── */
  const [dayFilter, setDayFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [mustOnly, setMustOnly] = useState(false)
  const [query, setQuery] = useState('')

  /* ── panel state ── */
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<Session, 'id'>>(() => emptyDraft(''))

  if (!trip) return null

  /* ── derived filter options ── */
  const allTracks = useMemo(() => {
    const seen = new Set<string>()
    trip.sessions.forEach((s) => {
      if (s.track) seen.add(s.track)
    })
    return Array.from(seen).sort()
  }, [trip.sessions])

  /* ── filtered sessions ── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return trip.sessions
      .filter((s) => {
        if (dayFilter !== 'all' && s.day !== dayFilter) return false
        if (typeFilter !== 'all' && guessType(s) !== typeFilter) return false
        if (trackFilter !== 'all' && s.track !== trackFilter) return false
        if (mustOnly && !s.mustAttend) return false
        if (q && !`${s.title} ${s.speaker} ${s.track} ${s.description}`.toLowerCase().includes(q))
          return false
        return true
      })
      .sort((a, b) => `${a.day} ${a.startTime}`.localeCompare(`${b.day} ${b.startTime}`))
  }, [trip.sessions, dayFilter, typeFilter, trackFilter, mustOnly, query])

  /* ── group by day ── */
  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>()
    filtered.forEach((s) => {
      const key = s.day || 'unscheduled'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    })
    const orderedKeys =
      dayFilter === 'all'
        ? [...days, ...Array.from(map.keys()).filter((k) => !days.includes(k))]
        : [dayFilter]
    return orderedKeys
      .filter((k) => map.has(k))
      .map((k, i) => ({
        day: k,
        dayNumber: days.indexOf(k) + 1 || i + 1,
        sessions: map.get(k)!,
      }))
  }, [filtered, days, dayFilter])

  /* ── panel handlers ── */
  const openAdd = () => {
    setEditingId(null)
    const defaultDay = dayFilter !== 'all' ? dayFilter : (days[0] ?? '')
    setDraft(emptyDraft(defaultDay))
    setPanelOpen(true)
  }

  const openEdit = (session: Session) => {
    const { id: _id, ...rest } = session
    void _id
    setEditingId(session.id)
    setDraft(rest)
    setPanelOpen(true)
  }

  const save = () => {
    if (!draft.title.trim()) return
    if (editingId) updateSession(trip.id, editingId, draft)
    else addSession(trip.id, draft)
    setPanelOpen(false)
  }

  const mustCount = trip.sessions.filter((s) => s.mustAttend).length

  /* ── clear all filters ── */
  const hasFilters =
    dayFilter !== 'all' || typeFilter !== 'all' || trackFilter !== 'all' || mustOnly || query

  const clearFilters = () => {
    setDayFilter('all')
    setTypeFilter('all')
    setTrackFilter('all')
    setMustOnly(false)
    setQuery('')
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[24px] font-semibold text-text-primary">All Sessions</h2>
          <p className="mt-0.5 font-sans text-[13px] text-text-secondary">
            {trip.sessions.length} sessions · {mustCount} must attend
            {hasFilters && (
              <span className="ml-1.5 text-primary">
                · showing {filtered.length}
              </span>
            )}
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={openAdd}>
          Add session
        </Button>
      </div>

      {/* ── Conference Navigator banner ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-primary/20 bg-primary-light px-4 py-3">
        <CalendarDays size={18} className="shrink-0 text-primary" />
        <p className="min-w-0 flex-1 font-sans text-[13px] text-primary">
          <strong>274 sessions</strong> at Gartner SRM 2026 — pre-loaded sessions shown below.
          Browse and bookmark the full agenda in{' '}
          <strong>Conference Navigator</strong> after registering.
        </p>
        <a
          href="https://www.gartner.com/en/conferences/emea/security-risk-management-uk/sessions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-control border border-primary/30 bg-surface px-3 py-1.5 font-sans text-[12.5px] font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
        >
          Open sessions page
          <ExternalLink size={12} />
        </a>
      </div>

      {/* ── Day tabs ── */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto">
        <FilterChip active={dayFilter === 'all'} onClick={() => setDayFilter('all')}>
          All days
        </FilterChip>
        {days.map((day, i) => (
          <FilterChip key={day} active={dayFilter === day} onClick={() => setDayFilter(day)}>
            Day {i + 1} · {formatDayLabel(day)}
          </FilterChip>
        ))}
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 tablet:max-w-[280px]">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions…"
            className="w-full rounded-control border border-border bg-surface py-2 pl-8 pr-3 font-sans text-[13px] outline-none transition-all duration-200 placeholder:text-text-secondary/50 hover:border-text-secondary/40 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-secondary hover:text-text-primary"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Session type filter */}
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} small>
            All types
          </FilterChip>
          {SESSION_TYPES.map((t) => (
            <FilterChip
              key={t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
              small
            >
              {t}
            </FilterChip>
          ))}
        </div>

        {/* Must-attend toggle */}
        <button
          type="button"
          onClick={() => setMustOnly((v) => !v)}
          className={[
            'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5',
            'font-sans text-[12.5px] font-medium transition-all duration-200',
            mustOnly
              ? 'border-amber/40 bg-amber-light text-[#7A5510]'
              : 'border-border bg-surface text-text-secondary hover:border-amber/40 hover:text-[#7A5510]',
          ].join(' ')}
        >
          <Star
            size={13}
            className={mustOnly ? 'text-amber' : 'text-text-secondary'}
            fill={mustOnly ? '#E8A838' : 'none'}
          />
          Must attend
        </button>

        {/* Clear */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-pill border border-border px-3 py-1.5 font-sans text-[12.5px] font-medium text-text-secondary transition-colors duration-200 hover:border-danger/40 hover:text-danger"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* ── Track filter (scrollable row) ── */}
      {allTracks.length > 0 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          <FilterChip active={trackFilter === 'all'} onClick={() => setTrackFilter('all')} small>
            All tracks
          </FilterChip>
          {allTracks.map((t) => (
            <FilterChip
              key={t}
              active={trackFilter === t}
              onClick={() => setTrackFilter(trackFilter === t ? 'all' : t)}
              small
              tone={trackTone(t)}
            >
              {t}
            </FilterChip>
          ))}
        </div>
      )}

      {/* ── Session list ── */}
      {trip.sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={38} className="text-border" strokeWidth={1.5} />}
          heading="No sessions added yet"
          subtext="Add sessions from Gartner Conference Navigator, or use the pre-loaded Gartner SRM 2026 template."
          action={
            <Button icon={<Plus size={15} />} onClick={openAdd}>
              Add your first session
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          compact
          heading="No sessions match"
          subtext="Try clearing the filters or search term."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <AnimatePresence mode="popLayout">
          {grouped.map((group) => (
            <motion.section
              key={group.day}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {dayFilter === 'all' && (
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-[18px] font-semibold text-text-primary">
                    Day {group.dayNumber}
                    <span className="ml-2 font-sans text-[14px] font-normal text-text-secondary">
                      {formatLongDate(group.day)}
                    </span>
                  </h3>
                  <span className="rounded-pill border border-border bg-surface px-2.5 py-0.5 font-sans text-[12px] text-text-secondary">
                    {group.sessions.length}
                  </span>
                </div>
              )}
              <div className="space-y-3">
                {group.sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onEdit={openEdit}
                    onDelete={(id) => deleteSession(trip.id, id)}
                    onToggleStar={(id) =>
                      updateSession(trip.id, id, {
                        mustAttend: !trip.sessions.find((s) => s.id === id)?.mustAttend,
                      })
                    }
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      )}

      {/* ── Add/Edit panel ── */}
      <SidePanel
        open={panelOpen}
        title={editingId ? 'Edit session' : 'Add session'}
        onClose={() => setPanelOpen(false)}
        onSave={save}
        saveLabel={editingId ? 'Save changes' : 'Add session'}
        saveDisabled={!draft.title.trim()}
      >
        <div className="space-y-4">
          <Input
            label="Session title"
            serif
            autoFocus
            placeholder="e.g. Future of AI in Cybersecurity"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start time"
              variant="time"
              value={draft.startTime}
              onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))}
            />
            <Input
              label="End time"
              variant="time"
              value={draft.endTime}
              onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))}
            />
          </div>

          <Input
            label="Day"
            variant="date"
            value={draft.day}
            onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))}
          />

          <Input
            label="Speaker"
            placeholder="e.g. Jeremy D'Hoinne, Distinguished VP Analyst"
            value={draft.speaker}
            onChange={(e) => setDraft((d) => ({ ...d, speaker: e.target.value }))}
          />

          <Input
            label="Track"
            placeholder="e.g. A: Cybersecurity Leadership, Spotlight: AI"
            value={draft.track}
            onChange={(e) => setDraft((d) => ({ ...d, track: e.target.value }))}
          />

          <Input
            label="Room"
            placeholder="e.g. Main Hall, Track B room"
            value={draft.room}
            onChange={(e) => setDraft((d) => ({ ...d, room: e.target.value }))}
          />

          <Input
            label="Description"
            variant="textarea"
            rows={3}
            placeholder="What will this session cover?"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />

          <Input
            label="Your notes"
            variant="textarea"
            rows={2}
            placeholder="Why you want to attend, questions to ask, conflicts…"
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />

          <div className="flex items-center gap-3 rounded-control border border-amber/30 bg-amber-light px-3.5 py-3">
            <input
              id="mustAttend"
              type="checkbox"
              checked={draft.mustAttend}
              onChange={(e) => setDraft((d) => ({ ...d, mustAttend: e.target.checked }))}
              className="h-4 w-4 rounded accent-amber"
            />
            <label htmlFor="mustAttend" className="font-sans text-[13px] font-medium text-[#7A5510]">
              <Star size={13} className="mr-1 inline text-amber" fill="#E8A838" />
              Mark as must-attend
            </label>
          </div>
        </div>
      </SidePanel>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Filter chip                                                          */
/* ------------------------------------------------------------------ */

function FilterChip({
  active,
  onClick,
  children,
  small = false,
  tone,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  small?: boolean
  tone?: BadgeTone
}) {
  const activeClasses = tone
    ? 'border-primary/40 bg-primary text-white'
    : 'border-primary bg-primary text-white'

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 rounded-pill border font-sans font-medium transition-all duration-200',
        small ? 'px-3 py-1 text-[12px]' : 'px-4 py-1.5 text-[13px]',
        active
          ? activeClasses
          : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
