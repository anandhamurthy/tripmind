import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Briefcase,
  GripVertical,
  Lightbulb,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Star,
  User,
} from 'lucide-react'
import type { Insight, InsightCategory, Session } from '../../types'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import { dateRange, formatDayLabel, formatStamp } from '../../lib/date'
import Button from '../shared/Button'
import Input from '../shared/Input'
import Badge, { toneFor, type BadgeTone } from '../shared/Badge'
import ConfirmInline from '../shared/ConfirmInline'
import EmptyState from '../shared/EmptyState'
import SidePanel from '../layout/SidePanel'

const CATEGORIES: InsightCategory[] = [
  'Strategy',
  'Technology',
  'People',
  'Risk',
  'Innovation',
]

const CATEGORY_BORDER: Record<InsightCategory, string> = {
  Strategy: '#2A52BE',
  Technology: '#E8A838',
  People: '#1A7F4B',
  Risk: '#C0392B',
  Innovation: '#7C3AED',
}

const emptySession = (day: string): Omit<Session, 'id'> => ({
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

const emptyInsight = (): Omit<Insight, 'id' | 'timestamp' | 'priority'> => ({
  title: '',
  body: '',
  category: 'Strategy',
  sessionId: '',
  starred: false,
})

/* ------------------------------------------------------------------ */

export default function BusinessTab() {
  const [sub, setSub] = useState<'agenda' | 'insights'>('agenda')

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-pill border border-border bg-surface p-1 shadow-card">
        {(['agenda', 'insights'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSub(key)}
            className={[
              'rounded-pill px-5 py-1.5 font-sans text-[13px] font-medium capitalize',
              'transition-all duration-200',
              sub === key
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-primary',
            ].join(' ')}
          >
            {key}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sub}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {sub === 'agenda' ? <AgendaSection /> : <InsightsSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Agenda                                                              */
/* ------------------------------------------------------------------ */

function AgendaSection() {
  const trip = useActiveTrip()
  const addSession = useTripStore((s) => s.addSession)
  const updateSession = useTripStore((s) => s.updateSession)
  const deleteSession = useTripStore((s) => s.deleteSession)

  const days = useMemo(
    () => (trip ? dateRange(trip.basics.startDate, trip.basics.endDate) : []),
    [trip],
  )

  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<Session, 'id'>>(() => emptySession(''))
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set())
  const [openDesc, setOpenDesc] = useState<Set<string>>(new Set())

  if (!trip) return null

  const byTime = (a: Session, b: Session) =>
    `${a.day} ${a.startTime}`.localeCompare(`${b.day} ${b.startTime}`)

  const mustAttend = trip.sessions.filter((s) => s.mustAttend).sort(byTime)

  // Sessions whose day falls outside the trip range still need a home.
  const grouped = days.map((day, index) => ({
    day,
    dayNumber: index + 1,
    sessions: trip.sessions.filter((s) => s.day === day).sort(byTime),
  }))
  const unscheduled = trip.sessions.filter((s) => !days.includes(s.day)).sort(byTime)

  const openAdd = () => {
    setEditingId(null)
    setDraft(emptySession(days[0] ?? trip.basics.startDate ?? ''))
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

  const toggleIn = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  const cardProps = {
    tripId: trip.id,
    updateSession,
    deleteSession,
    onEdit: openEdit,
    descOpenIds: openDesc,
    notesOpenIds: openNotes,
    toggleDesc: (id: string) => toggleIn(openDesc, setOpenDesc, id),
    toggleNotes: (id: string) => toggleIn(openNotes, setOpenNotes, id),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-text-primary">Agenda</h2>
          <p className="mt-0.5 font-sans text-[13px] text-text-secondary">
            {trip.sessions.length} {trip.sessions.length === 1 ? 'session' : 'sessions'} ·{' '}
            {mustAttend.length} must attend
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={openAdd}>
          Add session
        </Button>
      </div>

      {/* Must attend */}
      {mustAttend.length > 0 && (
        <section className="overflow-hidden rounded-card border border-amber/30 border-l-4 border-l-amber bg-amber-light shadow-card">
          <header className="flex items-center gap-2 px-5 py-3.5">
            <Star size={16} className="text-amber" fill="#E8A838" />
            <h3 className="font-serif text-[17px] font-semibold text-text-primary">Must attend</h3>
            <span className="font-sans text-[12px] text-[#8A6015]">
              {mustAttend.length} {mustAttend.length === 1 ? 'session' : 'sessions'}
            </span>
          </header>
          <ul className="space-y-2 px-5 pb-5">
            {mustAttend.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-control border border-amber/25 bg-surface/80 px-4 py-2.5 transition-colors duration-200 hover:bg-surface"
              >
                <span className="font-mono text-[12.5px] font-medium text-primary">
                  {s.startTime} – {s.endTime}
                </span>
                <span className="min-w-0 flex-1 truncate font-serif text-[14.5px] font-semibold text-text-primary">
                  {s.title}
                </span>
                {s.speaker && (
                  <span className="font-sans text-[12.5px] text-text-secondary">{s.speaker}</span>
                )}
                {s.room && (
                  <span className="font-sans text-[12.5px] text-text-secondary">{s.room}</span>
                )}
                <span className="font-sans text-[11.5px] text-text-secondary">
                  {formatDayLabel(s.day)}
                </span>
                <button
                  type="button"
                  aria-label="Remove from must attend"
                  onClick={() => updateSession(trip.id, s.id, { mustAttend: false })}
                  className="rounded-control p-1 text-amber transition-transform duration-200 hover:scale-110"
                >
                  <Star size={15} fill="#E8A838" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* All sessions */}
      {trip.sessions.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={38} className="text-border" strokeWidth={1.5} />}
          heading="No sessions on the agenda"
          subtext="Add the talks and workshops you plan to attend. Star the unmissable ones and they will surface at the top."
          action={
            <Button icon={<Plus size={15} />} onClick={openAdd}>
              Add your first session
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped
            .filter((g) => g.sessions.length > 0)
            .map((group) => (
              <section key={group.day}>
                <h3 className="mb-4 font-serif text-[18px] font-semibold text-text-primary">
                  Day {group.dayNumber}
                  <span className="ml-2 font-sans text-[14px] font-normal text-text-secondary">
                    {formatDayLabel(group.day)}
                  </span>
                </h3>
                <div className="relative space-y-4 border-l-2 border-border">
                  <AnimatePresence initial={false}>
                    {group.sessions.map((session) => (
                      <SessionTimelineCard key={session.id} session={session} {...cardProps} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            ))}

          {unscheduled.length > 0 && (
            <section>
              <h3 className="mb-4 font-serif text-[18px] font-semibold text-text-primary">
                Outside trip dates
                <span className="ml-2 font-sans text-[13px] font-normal text-text-secondary">
                  Adjust the session day, or the trip dates in Setup
                </span>
              </h3>
              <div className="relative space-y-4 border-l-2 border-dashed border-border">
                {unscheduled.map((session) => (
                  <SessionTimelineCard key={session.id} session={session} {...cardProps} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Session panel */}
      <SidePanel
        open={panelOpen}
        title={editingId ? 'Edit session' : 'Add session'}
        onClose={() => setPanelOpen(false)}
        onSave={save}
        saveDisabled={!draft.title.trim()}
      >
        <Input
          label="Title"
          autoFocus
          placeholder="e.g. Scaling platform teams"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Track"
            placeholder="e.g. Engineering"
            value={draft.track}
            onChange={(e) => setDraft({ ...draft, track: e.target.value })}
          />
          <Input
            label="Room"
            placeholder="e.g. Hall B"
            value={draft.room}
            onChange={(e) => setDraft({ ...draft, room: e.target.value })}
          />
        </div>

        <Input
          label="Speaker"
          value={draft.speaker}
          onChange={(e) => setDraft({ ...draft, speaker: e.target.value })}
        />

        <div>
          <label
            htmlFor="session-day"
            className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary"
          >
            Day
          </label>
          <select
            id="session-day"
            value={draft.day}
            onChange={(e) => setDraft({ ...draft, day: e.target.value })}
            className="w-full cursor-pointer rounded-control border border-border bg-surface px-3 py-2 font-sans text-sm outline-none transition-all duration-200 hover:border-text-secondary/40 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
          >
            {days.length === 0 && <option value="">Set trip dates in Setup</option>}
            {days.map((d, i) => (
              <option key={d} value={d}>
                Day {i + 1} — {formatDayLabel(d)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start time"
            variant="time"
            value={draft.startTime}
            onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
          />
          <Input
            label="End time"
            variant="time"
            value={draft.endTime}
            error={
              draft.endTime && draft.startTime && draft.endTime < draft.startTime
                ? 'Ends before it starts.'
                : undefined
            }
            onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
          />
        </div>

        <Input
          variant="textarea"
          label="Description"
          rows={4}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />

        <label className="flex cursor-pointer items-center gap-3 rounded-control border border-border px-4 py-3 transition-colors duration-200 hover:border-amber/50 hover:bg-amber-light/50">
          <input
            type="checkbox"
            checked={draft.mustAttend}
            onChange={(e) => setDraft({ ...draft, mustAttend: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-amber"
          />
          <span className="font-sans text-[13px] font-medium text-text-primary">
            Must attend
            <span className="ml-1.5 font-normal text-text-secondary">
              — pins it to the top of the agenda
            </span>
          </span>
        </label>
      </SidePanel>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

const FILTERS = ['All', ...CATEGORIES, 'Starred'] as const
type InsightFilter = (typeof FILTERS)[number]

function InsightsSection() {
  const trip = useActiveTrip()
  const addInsight = useTripStore((s) => s.addInsight)
  const updateInsight = useTripStore((s) => s.updateInsight)
  const deleteInsight = useTripStore((s) => s.deleteInsight)
  const toggleStarred = useTripStore((s) => s.toggleStarred)
  const reorderInsights = useTripStore((s) => s.reorderInsights)

  const [filter, setFilter] = useState<InsightFilter>('All')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyInsight)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!trip) return null

  const sessionTitle = (id: string) =>
    trip.sessions.find((s) => s.id === id)?.title ?? ''

  const visible = trip.insights.filter((i) => {
    if (filter === 'All') return true
    if (filter === 'Starred') return i.starred
    return i.category === filter
  })

  const starred = [...trip.insights]
    .filter((i) => i.starred)
    .sort((a, b) => a.priority - b.priority)

  const openAdd = () => {
    setEditingId(null)
    setDraft(emptyInsight())
    setPanelOpen(true)
  }

  const openEdit = (insight: Insight) => {
    setEditingId(insight.id)
    setDraft({
      title: insight.title,
      body: insight.body,
      category: insight.category,
      sessionId: insight.sessionId,
      starred: insight.starred,
    })
    setPanelOpen(true)
  }

  const save = () => {
    if (!draft.title.trim()) return
    if (editingId) updateInsight(trip.id, editingId, draft)
    else addInsight(trip.id, draft)
    setPanelOpen(false)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = starred.map((i) => i.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    reorderInsights(trip.id, arrayMove(ids, from, to))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-text-primary">Insights</h2>
          <p className="mt-0.5 font-sans text-[13px] text-text-secondary">
            {trip.insights.length} captured · {starred.length} starred for the deck
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={openAdd}>
          New insight
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f
          const count =
            f === 'All'
              ? trip.insights.length
              : f === 'Starred'
                ? starred.length
                : trip.insights.filter((i) => i.category === f).length
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={[
                'inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5',
                'font-sans text-[12.5px] font-medium transition-all duration-200',
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
              ].join(' ')}
            >
              {f === 'Starred' && <Star size={12} fill={active ? 'white' : 'none'} />}
              {f}
              <span className="opacity-65">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {trip.insights.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={38} className="text-border" strokeWidth={1.5} />}
          heading="No insights yet"
          subtext="Capture what you hear as you hear it. Star the best ones and TripMind turns them into a presentation."
          action={
            <Button icon={<Plus size={15} />} onClick={openAdd}>
              Capture your first insight
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          heading={`Nothing under "${filter}"`}
          subtext="Try a different filter, or capture an insight in this category."
          action={
            <Button variant="secondary" onClick={() => setFilter('All')}>
              Show all
            </Button>
          }
        />
      ) : (
        <div className="columns-1 gap-5 tablet:columns-2 desktop:columns-3">
          <AnimatePresence initial={false}>
            {visible.map((insight) => (
              <motion.article
                key={insight.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className="mb-5 break-inside-avoid rounded-card border border-border bg-note p-4 shadow-note transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                style={{ borderLeft: `4px solid ${CATEGORY_BORDER[insight.category]}` }}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Badge tone={toneFor(insight.category) as BadgeTone}>{insight.category}</Badge>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={insight.starred ? 'Unstar insight' : 'Star insight'}
                      onClick={() => toggleStarred(trip.id, insight.id)}
                      className={[
                        'rounded-control p-1.5 transition-all duration-200 hover:scale-110',
                        insight.starred
                          ? 'text-amber'
                          : 'text-text-secondary hover:bg-amber-light hover:text-amber',
                      ].join(' ')}
                    >
                      <Star size={15} fill={insight.starred ? '#E8A838' : 'none'} />
                    </button>
                    <button
                      type="button"
                      aria-label="Edit insight"
                      onClick={() => openEdit(insight)}
                      className="rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-primary-light hover:text-primary"
                    >
                      <Pencil size={13} />
                    </button>
                    <ConfirmInline
                      onConfirm={() => deleteInsight(trip.id, insight.id)}
                      triggerLabel="Delete insight"
                    />
                  </div>
                </div>

                <h4 className="font-serif text-[16px] font-bold leading-snug text-text-primary">
                  {insight.title}
                </h4>

                {insight.body && (
                  <p className="mt-2 whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-text-primary/85">
                    {insight.body}
                  </p>
                )}

                <div className="mt-4 flex items-end justify-between gap-3">
                  {insight.sessionId && sessionTitle(insight.sessionId) ? (
                    <p className="min-w-0 flex-1 truncate font-sans text-[11.5px] text-text-secondary">
                      From: {sessionTitle(insight.sessionId)}
                    </p>
                  ) : (
                    <span className="flex-1" />
                  )}
                  <span
                    className="shrink-0 font-sans text-[11px] text-text-secondary"
                    style={{ transform: 'rotate(-2deg)' }}
                  >
                    {formatStamp(insight.timestamp)}
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Top insights — drag to prioritise */}
      {starred.length > 0 && (
        <section className="rounded-card border border-border bg-surface shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
            <div>
              <h3 className="font-serif text-[18px] font-semibold text-text-primary">
                Top insights
              </h3>
              <p className="mt-0.5 font-sans text-[12.5px] text-text-secondary">
                Drag to set the order — this is the order they appear in your presentation.
              </p>
            </div>
            <Badge tone="amber" size="md">
              {starred.length} starred
            </Badge>
          </header>

          <div className="p-5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={starred.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {starred.map((insight, index) => (
                    <SortableInsightRow key={insight.id} insight={insight} index={index} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </section>
      )}

      {/* Insight panel */}
      <SidePanel
        open={panelOpen}
        title={editingId ? 'Edit insight' : 'New insight'}
        description="Stamped with the current date and time when you save."
        onClose={() => setPanelOpen(false)}
        onSave={save}
        saveDisabled={!draft.title.trim()}
      >
        <Input
          label="Title"
          autoFocus
          placeholder="The one-line version"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />

        <Input
          variant="textarea"
          label="Body"
          rows={6}
          placeholder="What was said, why it matters, what you would do about it…"
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />

        <div>
          <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
            Category
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = draft.category === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraft({ ...draft, category: c })}
                  className={[
                    'rounded-pill border px-3.5 py-1.5 font-sans text-[12.5px] font-medium transition-all duration-200',
                    active
                      ? 'text-white shadow-sm'
                      : 'border-border bg-surface text-text-secondary hover:text-text-primary',
                  ].join(' ')}
                  style={
                    active
                      ? { backgroundColor: CATEGORY_BORDER[c], borderColor: CATEGORY_BORDER[c] }
                      : undefined
                  }
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="insight-session"
            className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary"
          >
            Source session
          </label>
          <select
            id="insight-session"
            value={draft.sessionId}
            onChange={(e) => setDraft({ ...draft, sessionId: e.target.value })}
            className="w-full cursor-pointer rounded-control border border-border bg-surface px-3 py-2 font-sans text-sm outline-none transition-all duration-200 hover:border-text-secondary/40 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
          >
            <option value="">No session</option>
            {trip.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-control border border-border px-4 py-3 transition-colors duration-200 hover:border-amber/50 hover:bg-amber-light/50">
          <input
            type="checkbox"
            checked={draft.starred}
            onChange={(e) => setDraft({ ...draft, starred: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-amber"
          />
          <span className="font-sans text-[13px] font-medium text-text-primary">
            Star for the presentation
          </span>
        </label>
      </SidePanel>
    </div>
  )
}

function SortableInsightRow({ insight, index }: { insight: Insight; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: insight.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderLeft: `4px solid ${CATEGORY_BORDER[insight.category]}`,
      }}
      className={[
        'flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5',
        'transition-shadow duration-200',
        isDragging ? 'z-10 scale-[1.02] shadow-card-hover' : 'shadow-card hover:shadow-card-hover',
      ].join(' ')}
    >
      <button
        type="button"
        aria-label={`Reorder ${insight.title}`}
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-control p-1 text-text-secondary transition-colors duration-200 hover:bg-black/[0.05] hover:text-text-primary active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>

      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light font-sans text-[12.5px] font-semibold text-primary">
        {index + 1}
      </span>

      <span className="min-w-0 flex-1 truncate font-serif text-[14.5px] font-semibold text-text-primary">
        {insight.title}
      </span>

      <Badge tone={toneFor(insight.category) as BadgeTone}>{insight.category}</Badge>
    </li>
  )
}

/* ------------------------------------------------------------------ */

interface SessionCardProps {
  session: Session
  tripId: string
  updateSession: (tripId: string, sessionId: string, updates: Partial<Session>) => void
  deleteSession: (tripId: string, sessionId: string) => void
  onEdit: (session: Session) => void
  descOpenIds: Set<string>
  notesOpenIds: Set<string>
  toggleDesc: (id: string) => void
  toggleNotes: (id: string) => void
}

/**
 * Kept at module scope on purpose: defining it inside AgendaSection would give
 * it a new identity on every render, remounting the notes textarea and dropping
 * focus after each keystroke.
 */
function SessionTimelineCard({
  session,
  tripId,
  updateSession,
  deleteSession,
  onEdit,
  descOpenIds,
  notesOpenIds,
  toggleDesc,
  toggleNotes,
}: SessionCardProps) {
  const descOpen = descOpenIds.has(session.id)
  const notesOpen = notesOpenIds.has(session.id)

  return (
    <motion.article
    layout
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.97 }}
    transition={{ duration: 0.2 }}
    className="relative ml-6 rounded-card border border-border bg-surface p-4 shadow-card transition-all duration-200 hover:border-primary/25 hover:shadow-card-hover"
  >
    {/* timeline node */}
    <span
      aria-hidden="true"
      className="absolute -left-[28px] top-6 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary ring-2 ring-primary/25"
    />

    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[12.5px] font-medium tracking-tight text-primary">
          {session.startTime} – {session.endTime}
        </p>
        <h4 className="mt-1 font-serif text-[15px] font-semibold leading-snug text-text-primary">
          {session.title}
        </h4>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[12.5px] text-text-secondary">
          {session.track && <Badge tone="primary">{session.track}</Badge>}
          {session.speaker && (
            <span className="inline-flex items-center gap-1.5">
              <User size={12} />
              {session.speaker}
            </span>
          )}
          {session.room && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={12} />
              {session.room}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          aria-label={session.mustAttend ? 'Remove from must attend' : 'Mark as must attend'}
          title={session.mustAttend ? 'Remove from must attend' : 'Mark as must attend'}
          onClick={() => updateSession(tripId, session.id, { mustAttend: !session.mustAttend })}
          className={[
            'rounded-control p-1.5 transition-all duration-200 hover:scale-110',
            session.mustAttend
              ? 'text-amber'
              : 'text-text-secondary hover:bg-amber-light hover:text-amber',
          ].join(' ')}
        >
          <Star size={15} fill={session.mustAttend ? '#E8A838' : 'none'} />
        </button>
        <button
          type="button"
          aria-label="Edit session"
          onClick={() => onEdit(session)}
          className="rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-primary-light hover:text-primary"
        >
          <Pencil size={14} />
        </button>
        <ConfirmInline
          onConfirm={() => deleteSession(tripId, session.id)}
          triggerLabel="Delete session"
        />
      </div>
    </div>

    {session.description && (
      <button
        type="button"
        onClick={() => toggleDesc(session.id)}
        className="mt-3 block w-full text-left font-sans text-[13px] leading-relaxed text-text-secondary transition-colors duration-200 hover:text-text-primary"
      >
        <span className={descOpen ? '' : 'line-clamp-2'}>{session.description}</span>
        <span className="mt-0.5 block text-[11.5px] font-medium text-primary">
          {descOpen ? 'Show less' : 'Show more'}
        </span>
      </button>
    )}

    <div className="mt-3 border-t border-border pt-3">
      {notesOpen || session.notes ? (
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 font-sans text-[11.5px] font-medium uppercase tracking-[0.06em] text-text-secondary">
            <MessageSquare size={12} /> My notes
          </label>
          <textarea
            rows={notesOpen ? 3 : 2}
            value={session.notes}
            onFocus={() => toggleNotes(session.id)}
            placeholder="What did you take away from this session?"
            onChange={(e) => updateSession(tripId, session.id, { notes: e.target.value })}
            className="w-full resize-y rounded-control border border-border bg-background/50 px-3 py-2 font-sans text-[13px] leading-relaxed outline-none transition-all duration-200 placeholder:text-text-secondary/55 hover:border-text-secondary/40 focus:border-primary focus:bg-surface focus:ring-[3px] focus:ring-primary/15"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => toggleNotes(session.id)}
          className="inline-flex items-center gap-1.5 font-sans text-[12.5px] font-medium text-text-secondary transition-colors duration-200 hover:text-primary"
        >
          <MessageSquare size={13} /> Add notes
        </button>
      )}
    </div>
    </motion.article>
  )
}
