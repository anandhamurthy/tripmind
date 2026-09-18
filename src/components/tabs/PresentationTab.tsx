import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
  ChevronLeft,
  ChevronRight,
  Download,
  GripVertical,
  Image as ImageIcon,
  Play,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import type { Insight, InsightCategory, Slide, Trip } from '../../types'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import { formatDateSpan } from '../../lib/date'
import Button from '../shared/Button'
import EmptyState from '../shared/EmptyState'

const CATEGORY_COLOR: Record<InsightCategory, string> = {
  Strategy: '#2A52BE',
  Technology: '#E8A838',
  People: '#1A7F4B',
  Risk: '#C0392B',
  Innovation: '#7C3AED',
}

const COVER_ID = 'slide-cover'
const SUMMARY_ID = 'slide-summary'
const insightSlideId = (insightId: string) => `slide-insight-${insightId}`

/** Fully resolved content for one slide, merging trip data with slide overrides. */
interface ResolvedSlide {
  id: string
  kind: Slide['kind']
  title: string
  subtitle: string
  body: string
  category?: InsightCategory
  source?: string
  insightId?: string
  imageDataUrl?: string
}

const starredInsights = (trip: Trip): Insight[] =>
  trip.insights.filter((i) => i.starred).sort((a, b) => a.priority - b.priority)

/**
 * The deck is derived from the trip (cover + one slide per starred insight +
 * summary) but the *order* and any hand-written text live in `trip.slides`.
 * This keeps the two in step without losing user edits.
 */
const reconcileDeck = (trip: Trip): Slide[] => {
  const starred = starredInsights(trip)
  const desiredIds = new Set([
    COVER_ID,
    ...starred.map((i) => insightSlideId(i.id)),
    SUMMARY_ID,
  ])

  const stored = new Map(trip.slides.map((s) => [s.id, s]))
  // Blank slides are user-authored — they are always valid.
  const kept = trip.slides.filter((s) => s.kind === 'blank' || desiredIds.has(s.id))
  const keptIds = new Set(kept.map((s) => s.id))

  const make = (id: string, kind: Slide['kind'], insightId?: string): Slide =>
    stored.get(id) ?? { id, kind, insightId, title: '', subtitle: '', body: '' }

  const result = [...kept]

  // Cover always leads.
  if (!keptIds.has(COVER_ID)) result.unshift(make(COVER_ID, 'cover'))

  // New starred insights land just before the summary slide.
  const summaryAt = () => result.findIndex((s) => s.id === SUMMARY_ID)
  starred.forEach((insight) => {
    const id = insightSlideId(insight.id)
    if (keptIds.has(id)) return
    const at = summaryAt()
    const slide = make(id, 'insight', insight.id)
    if (at === -1) result.push(slide)
    else result.splice(at, 0, slide)
  })

  if (summaryAt() === -1) result.push(make(SUMMARY_ID, 'summary'))

  return result
}

const resolve = (slide: Slide, trip: Trip): ResolvedSlide => {
  if (slide.kind === 'cover') {
    return {
      id: slide.id,
      kind: 'cover',
      title: trip.basics.eventName || 'Untitled trip',
      subtitle: slide.subtitle,
      body: [trip.basics.location, trip.basics.country].filter(Boolean).join(', '),
      imageDataUrl: slide.imageDataUrl,
    }
  }

  if (slide.kind === 'summary') {
    const top = starredInsights(trip).slice(0, 3)
    return {
      id: slide.id,
      kind: 'summary',
      title: 'Key Takeaways',
      subtitle: slide.subtitle,
      body: top.map((i, n) => `${n + 1}. ${i.title}`).join('\n'),
      imageDataUrl: slide.imageDataUrl,
    }
  }

  if (slide.kind === 'insight') {
    const insight = trip.insights.find((i) => i.id === slide.insightId)
    const session = trip.sessions.find((s) => s.id === insight?.sessionId)
    return {
      id: slide.id,
      kind: 'insight',
      title: insight?.title ?? 'Insight',
      subtitle: '',
      body: insight?.body ?? '',
      category: insight?.category,
      source: session?.title,
      insightId: insight?.id,
      imageDataUrl: slide.imageDataUrl,
    }
  }

  return {
    id: slide.id,
    kind: 'blank',
    title: slide.title,
    subtitle: slide.subtitle,
    body: slide.body,
    imageDataUrl: slide.imageDataUrl,
  }
}

/* ------------------------------------------------------------------ */

export default function PresentationTab() {
  const trip = useActiveTrip()
  const setSlides = useTripStore((s) => s.setSlides)
  const updateSlide = useTripStore((s) => s.updateSlide)
  const updateInsight = useTripStore((s) => s.updateInsight)
  const addBlankSlide = useTripStore((s) => s.addBlankSlide)
  const deleteSlide = useTripStore((s) => s.deleteSlide)
  const setActiveTab = useTripStore((s) => s.setActiveTab)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [presentIndex, setPresentIndex] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const deck = useMemo(() => (trip ? reconcileDeck(trip) : []), [trip])

  // Persist the reconciled deck whenever it drifts from what is stored.
  useEffect(() => {
    if (!trip) return
    const storedIds = trip.slides.map((s) => s.id).join('|')
    const deckIds = deck.map((s) => s.id).join('|')
    if (storedIds !== deckIds) setSlides(trip.id, deck)
  }, [trip, deck, setSlides])

  const resolved = useMemo(
    () => (trip ? deck.map((s) => resolve(s, trip)) : []),
    [deck, trip],
  )

  const selected =
    resolved.find((s) => s.id === selectedId) ?? resolved[0] ?? null
  const selectedSlide = deck.find((s) => s.id === selected?.id) ?? null

  if (!trip) return null

  const starred = starredInsights(trip)

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = deck.map((s) => s.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    setSlides(trip.id, arrayMove(deck, from, to))
  }

  const startPresenting = () => {
    setPresentIndex(Math.max(0, resolved.findIndex((s) => s.id === selected?.id)))
    setPresenting(true)
  }

  const exportDeck = () => exportSlidesToHtml(resolved, trip)

  if (starred.length === 0) {
    return (
      <EmptyState
        icon={<Star size={38} className="text-border" strokeWidth={1.5} />}
        heading="Star a few insights first"
        subtext="Your deck writes itself from the insights you starred in the Business tab — one slide each, in your priority order, wrapped in a cover and a takeaways slide."
        action={
          <Button icon={<Star size={15} />} onClick={() => setActiveTab('business')}>
            Go to Insights
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-text-primary">Presentation</h2>
          <p className="mt-0.5 font-sans text-[13px] text-text-secondary">
            {resolved.length} slides · built from {starred.length} starred{' '}
            {starred.length === 1 ? 'insight' : 'insights'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Download size={15} />} onClick={exportDeck}>
            Export
          </Button>
          <Button icon={<Play size={15} />} onClick={startPresenting}>
            Present
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 desktop:grid-cols-3">
        {/* -------- Slide list -------- */}
        <aside className="desktop:col-span-1">
          <div className="rounded-card border border-border bg-surface shadow-card">
            <header className="border-b border-border px-4 py-3">
              <h3 className="font-serif text-[15px] font-semibold text-text-primary">Slides</h3>
              <p className="mt-0.5 font-sans text-[12px] text-text-secondary">Drag to reorder</p>
            </header>

            <div className="scrollbar-thin max-h-[560px] overflow-y-auto p-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={deck.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2">
                    {resolved.map((slide, index) => (
                      <SortableSlideRow
                        key={slide.id}
                        slide={slide}
                        index={index}
                        active={slide.id === selected?.id}
                        onSelect={() => setSelectedId(slide.id)}
                        onDelete={
                          slide.kind === 'blank'
                            ? () => deleteSlide(trip.id, slide.id)
                            : undefined
                        }
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>

            <footer className="border-t border-border p-3">
              <Button
                variant="secondary"
                fullWidth
                icon={<Plus size={15} />}
                onClick={() => addBlankSlide(trip.id)}
              >
                Add blank slide
              </Button>
            </footer>
          </div>
        </aside>

        {/* -------- Editor -------- */}
        <section className="desktop:col-span-2">
          {selected && selectedSlide && (
            <div className="space-y-4">
              <div className="rounded-card border border-border bg-surface p-4 shadow-card tablet:p-6">
                <SlideCanvas
                  slide={selected}
                  index={resolved.findIndex((s) => s.id === selected.id)}
                  total={resolved.length}
                  trip={trip}
                />
              </div>

              <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                <h4 className="mb-3 font-serif text-[16px] font-semibold text-text-primary">
                  Edit this slide
                </h4>

                {selected.kind === 'cover' && (
                  <div className="space-y-4">
                    <FieldNote>
                      The title and date come from your trip details in Setup.
                    </FieldNote>
                    <LabelledInput
                      label="Subtitle"
                      placeholder="e.g. Field notes for the leadership team"
                      value={selectedSlide.subtitle}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { subtitle: v })}
                    />
                    <ImageUpload
                      value={selectedSlide.imageDataUrl}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { imageDataUrl: v })}
                    />
                  </div>
                )}

                {selected.kind === 'insight' && selected.insightId && (
                  <div className="space-y-4">
                    <FieldNote>
                      Editing here updates the insight itself, so your notes and the deck never
                      drift apart.
                    </FieldNote>
                    <LabelledInput
                      label="Title"
                      value={selected.title}
                      onChange={(v) =>
                        updateInsight(trip.id, selected.insightId!, { title: v })
                      }
                    />
                    <LabelledTextarea
                      label="Body"
                      rows={5}
                      value={selected.body}
                      onChange={(v) => updateInsight(trip.id, selected.insightId!, { body: v })}
                    />
                    <ImageUpload
                      value={selectedSlide.imageDataUrl}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { imageDataUrl: v })}
                    />
                  </div>
                )}

                {selected.kind === 'summary' && (
                  <div className="space-y-4">
                    <FieldNote>
                      The takeaways list is generated from your top three starred insights. Reorder
                      them in the Business tab.
                    </FieldNote>
                    <LabelledInput
                      label="Subtitle"
                      placeholder="Optional line under the heading"
                      value={selectedSlide.subtitle}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { subtitle: v })}
                    />
                    <ImageUpload
                      value={selectedSlide.imageDataUrl}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { imageDataUrl: v })}
                    />
                  </div>
                )}

                {selected.kind === 'blank' && (
                  <div className="space-y-4">
                    <LabelledInput
                      label="Title"
                      value={selectedSlide.title}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { title: v })}
                    />
                    <LabelledInput
                      label="Subtitle"
                      value={selectedSlide.subtitle}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { subtitle: v })}
                    />
                    <LabelledTextarea
                      label="Body"
                      rows={5}
                      value={selectedSlide.body}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { body: v })}
                    />
                    <ImageUpload
                      value={selectedSlide.imageDataUrl}
                      onChange={(v) => updateSlide(trip.id, selectedSlide.id, { imageDataUrl: v })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <PresentMode
        open={presenting}
        slides={resolved}
        trip={trip}
        index={presentIndex}
        setIndex={setPresentIndex}
        onClose={() => setPresenting(false)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Slide rendering                                                     */
/* ------------------------------------------------------------------ */

function SlideCanvas({
  slide,
  index,
  total,
  trip,
  fullscreen = false,
}: {
  slide: ResolvedSlide
  index: number
  total: number
  trip: Trip
  fullscreen?: boolean
}) {
  const scale = fullscreen ? 1.9 : 1
  const px = (n: number) => `${Math.round(n * scale)}px`
  const hasImage = Boolean(slide.imageDataUrl)

  return (
    <div
      className={[
        'relative flex aspect-video w-full overflow-hidden bg-surface',
        fullscreen ? 'rounded-none' : 'rounded-[10px] border border-border shadow-card',
      ].join(' ')}
    >
      {/* ── Content (left column, or full width when no image) ── */}
      <div className={['flex min-w-0 flex-col', hasImage ? 'flex-1' : 'flex-1'].join(' ')}>
        {slide.kind === 'cover' ? (
          <div
            className={[
              'flex flex-1 flex-col justify-center px-[8%]',
              hasImage ? 'items-start text-left' : 'items-center text-center',
            ].join(' ')}
          >
            <h1
              className="font-serif font-semibold leading-tight text-text-primary"
              style={{ fontSize: px(hasImage ? 30 : 36) }}
            >
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="mt-4 font-sans text-text-secondary" style={{ fontSize: px(16) }}>
                {slide.subtitle}
              </p>
            )}
            <p className="mt-6 font-sans text-text-secondary" style={{ fontSize: px(13) }}>
              {[slide.body, formatDateSpan(trip.basics.startDate, trip.basics.endDate)]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {!hasImage && (
              <span
                className="absolute inset-x-[8%] bottom-[9%] block bg-primary"
                style={{ height: px(2) }}
              />
            )}
            {hasImage && (
              <span
                className="mt-6 block bg-primary"
                style={{ height: px(2), width: px(48) }}
              />
            )}
          </div>
        ) : slide.kind === 'summary' ? (
          <div className="flex flex-1 flex-col justify-center px-[9%]">
            <h2
              className="font-serif font-semibold leading-tight text-text-primary"
              style={{ fontSize: px(hasImage ? 24 : 30) }}
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="mt-2 font-sans text-text-secondary" style={{ fontSize: px(13) }}>
                {slide.subtitle}
              </p>
            )}
            <ol className="mt-5 space-y-3">
              {starredInsights(trip)
                .slice(0, 3)
                .map((insight, n) => (
                  <li key={insight.id} className="flex items-start gap-3">
                    <span
                      className="flex shrink-0 items-center justify-center rounded-full bg-primary-light font-sans font-semibold text-primary"
                      style={{ fontSize: px(11), width: px(22), height: px(22), lineHeight: 1 }}
                    >
                      {n + 1}
                    </span>
                    <span
                      className="font-sans leading-snug text-text-primary"
                      style={{ fontSize: px(hasImage ? 13 : 16) }}
                    >
                      {insight.title}
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        ) : (
          <div className="flex flex-1 flex-col px-[8%] py-[6%]">
            <div className="flex items-start justify-between gap-4">
              <span className="font-sans text-text-secondary" style={{ fontSize: px(11) }}>
                {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
              {slide.category && (
                <span
                  className="rounded-pill px-3 py-1 font-sans font-medium uppercase tracking-[0.05em] text-white"
                  style={{ fontSize: px(10), backgroundColor: CATEGORY_COLOR[slide.category] }}
                >
                  {slide.category}
                </span>
              )}
            </div>

            <h2
              className="mt-[4%] font-serif font-semibold leading-tight text-text-primary"
              style={{ fontSize: px(hasImage ? 22 : 28) }}
            >
              {slide.title || 'Untitled slide'}
            </h2>

            {slide.subtitle && (
              <p className="mt-2 font-sans text-text-secondary" style={{ fontSize: px(13) }}>
                {slide.subtitle}
              </p>
            )}

            <p
              className="mt-[4%] whitespace-pre-wrap font-sans leading-relaxed text-text-primary/85"
              style={{ fontSize: px(hasImage ? 13 : 16) }}
            >
              {slide.body}
            </p>

            {slide.source && (
              <p
                className="mt-auto pt-4 font-sans text-text-secondary"
                style={{ fontSize: px(11) }}
              >
                From: {slide.source}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Image right panel ── */}
      {hasImage && (
        <div className="relative shrink-0 overflow-hidden" style={{ width: '42%' }}>
          <img
            src={slide.imageDataUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  )
}

/** Miniature of a slide used in the left-hand list. */
function SlideThumb({ slide }: { slide: ResolvedSlide }) {
  const accent =
    slide.kind === 'insight' && slide.category ? CATEGORY_COLOR[slide.category] : '#2A52BE'

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[4px] border border-border bg-surface">
      {slide.kind === 'cover' ? (
        <div className="flex h-full flex-col items-center justify-center px-2 text-center">
          <span className="line-clamp-2 font-serif text-[7px] font-semibold leading-tight text-text-primary">
            {slide.title}
          </span>
          <span className="mt-[3px] h-[1.5px] w-6 bg-primary" />
        </div>
      ) : (
        <div className="flex h-full flex-col px-2 py-1.5">
          <span
            className="mb-1 h-[2px] w-4 rounded-pill"
            style={{ backgroundColor: accent }}
          />
          <span className="line-clamp-2 font-serif text-[6.5px] font-semibold leading-tight text-text-primary">
            {slide.title || 'Untitled'}
          </span>
          <span className="mt-1 space-y-[2px]">
            <span className="block h-[1.5px] w-full rounded bg-border" />
            <span className="block h-[1.5px] w-4/5 rounded bg-border" />
            <span className="block h-[1.5px] w-3/5 rounded bg-border" />
          </span>
        </div>
      )}
    </div>
  )
}

function SortableSlideRow({
  slide,
  index,
  active,
  onSelect,
  onDelete,
}: {
  slide: ResolvedSlide
  index: number
  active: boolean
  onSelect: () => void
  onDelete?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  })

  const KIND_LABEL: Record<Slide['kind'], string> = {
    cover: 'Cover',
    insight: 'Insight',
    summary: 'Summary',
    blank: 'Blank',
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'flex items-center gap-2.5 rounded-control border p-2 transition-all duration-200',
        active
          ? 'border-primary bg-primary-light'
          : 'border-border bg-surface hover:border-primary/30 hover:bg-background/60',
        isDragging ? 'z-10 scale-[1.03] shadow-card-hover' : '',
      ].join(' ')}
    >
      <button
        type="button"
        aria-label="Reorder slide"
        {...attributes}
        {...listeners}
        className="cursor-grab rounded p-0.5 text-text-secondary transition-colors duration-200 hover:text-text-primary active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>

      <span className="w-4 shrink-0 text-center font-sans text-[11px] font-semibold text-text-secondary">
        {index + 1}
      </span>

      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <span className="w-[72px] shrink-0">
          <SlideThumb slide={slide} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans text-[12.5px] font-medium text-text-primary">
            {slide.title || 'Untitled'}
          </span>
          <span className="block font-sans text-[10.5px] uppercase tracking-[0.05em] text-text-secondary">
            {KIND_LABEL[slide.kind]}
          </span>
        </span>
      </button>

      {onDelete && (
        <button
          type="button"
          aria-label="Delete slide"
          onClick={onDelete}
          className="rounded p-1 text-text-secondary transition-colors duration-200 hover:bg-[#FBEDEB] hover:text-danger"
        >
          <Trash2 size={13} />
        </button>
      )}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Present mode                                                        */
/* ------------------------------------------------------------------ */

function PresentMode({
  open,
  slides,
  trip,
  index,
  setIndex,
  onClose,
}: {
  open: boolean
  slides: ResolvedSlide[]
  trip: Trip
  index: number
  setIndex: (n: number) => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        setIndex(Math.min(slides.length - 1, index + 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        setIndex(Math.max(0, index - 1))
      }
    }

    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, index, slides.length, setIndex, onClose])

  const slide = slides[index]

  return createPortal(
    <AnimatePresence>
      {open && slide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background p-6"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit present mode (Esc)"
            className="absolute right-6 top-6 rounded-control border border-border bg-surface p-2 text-text-secondary shadow-card transition-colors duration-200 hover:text-danger"
          >
            <X size={18} />
          </button>

          <div className="w-full max-w-[1240px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-card border border-border shadow-card-hover"
              >
                <SlideCanvas
                  fullscreen
                  slide={slide}
                  index={index}
                  total={slides.length}
                  trip={trip}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center gap-5">
            <button
              type="button"
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={index === 0}
              aria-label="Previous slide"
              className="rounded-full border border-border bg-surface p-3 text-text-primary shadow-card transition-all duration-200 hover:border-primary hover:text-primary disabled:opacity-35 disabled:hover:border-border disabled:hover:text-text-primary"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="font-sans text-[14px] font-medium text-text-secondary">
              <span className="text-text-primary">{index + 1}</span> / {slides.length}
            </span>

            <button
              type="button"
              onClick={() => setIndex(Math.min(slides.length - 1, index + 1))}
              disabled={index === slides.length - 1}
              aria-label="Next slide"
              className="rounded-full border border-border bg-surface p-3 text-text-primary shadow-card transition-all duration-200 hover:border-primary hover:text-primary disabled:opacity-35 disabled:hover:border-border disabled:hover:text-text-primary"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <p className="mt-3 font-sans text-[12px] text-text-secondary">
            ← → to navigate · Esc to exit
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function exportSlidesToHtml(slides: ResolvedSlide[], trip: Trip) {
  const dates = formatDateSpan(trip.basics.startDate, trip.basics.endDate)

  const slideHtml = slides
    .map((slide, index) => {
      const number = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`

      const imgPanel = slide.imageDataUrl
        ? `<div class="slide-img"><img src="${slide.imageDataUrl}" alt=""></div>`
        : ''
      const hasImg = Boolean(slide.imageDataUrl)

      if (slide.kind === 'cover') {
        const content = `
  <div class="slide-content${hasImg ? ' cover-content' : ''}">
    <h1>${escapeHtml(slide.title)}</h1>
    ${slide.subtitle ? `<p class="subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <p class="meta">${escapeHtml([slide.body, dates].filter(Boolean).join(' · '))}</p>
    ${hasImg ? '<span class="rule-short"></span>' : '<span class="rule"></span>'}
  </div>`
        return `<section class="slide cover${hasImg ? ' has-image' : ''}">
${content}
  ${imgPanel}
</section>`
      }

      if (slide.kind === 'summary') {
        const items = starredInsights(trip)
          .slice(0, 3)
          .map((i, n) => `<li><span class="num">${n + 1}</span>${escapeHtml(i.title)}</li>`)
          .join('\n      ')
        return `<section class="slide${hasImg ? ' has-image' : ''}">
  <div class="slide-content">
    <h2>${escapeHtml(slide.title)}</h2>
    ${slide.subtitle ? `<p class="subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <ol class="takeaways">
      ${items}
    </ol>
  </div>
  ${imgPanel}
</section>`
      }

      const badge =
        slide.category && slide.kind === 'insight'
          ? `<span class="badge" style="background:${CATEGORY_COLOR[slide.category]}">${escapeHtml(slide.category)}</span>`
          : ''

      return `<section class="slide${hasImg ? ' has-image' : ''}">
  <div class="slide-content">
    <div class="slide-top"><span class="num-label">${number}</span>${badge}</div>
    <h2>${escapeHtml(slide.title || 'Untitled slide')}</h2>
    ${slide.subtitle ? `<p class="subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <p class="body">${escapeHtml(slide.body)}</p>
    ${slide.source ? `<p class="source">From: ${escapeHtml(slide.source)}</p>` : ''}
  </div>
  ${imgPanel}
</section>`
    })
    .join('\n')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(trip.basics.eventName || 'TripMind deck')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: 297mm 167mm; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #F7F5F2;
    font-family: 'DM Sans', system-ui, sans-serif;
    color: #1A1A1A;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .deck { padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 22px; }
  .slide {
    position: relative;
    width: 100%;
    max-width: 1120px;
    aspect-ratio: 16 / 9;
    background: #FFFFFF;
    border: 1px solid #E4E2DE;
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .slide:not(.has-image) { padding: 6% 8%; }
  .slide.cover { align-items: center; justify-content: center; text-align: center; }
  .slide.has-image { flex-direction: row; }
  .slide-content { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 6% 8%; }
  .slide.cover .slide-content { justify-content: center; }
  .slide.cover.has-image .slide-content { align-items: flex-start; text-align: left; }
  .slide:not(.has-image) .slide-content { padding: 0; }
  .slide-img { flex: 0 0 42%; overflow: hidden; position: relative; }
  .slide-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  h1 { font-family: 'Fraunces', Georgia, serif; font-size: 40px; font-weight: 600; margin: 0; line-height: 1.15; }
  h2 { font-family: 'Fraunces', Georgia, serif; font-size: 30px; font-weight: 600; margin: 16px 0 0; line-height: 1.2; }
  .subtitle { font-size: 17px; color: #6B6B66; margin: 14px 0 0; }
  .meta { font-size: 14px; color: #6B6B66; margin: 22px 0 0; }
  .rule { position: absolute; left: 8%; right: 8%; bottom: 9%; height: 2px; background: #2A52BE; }
  .rule-short { display: block; margin-top: 24px; width: 48px; height: 2px; background: #2A52BE; }
  .slide-top { display: flex; align-items: center; justify-content: space-between; }
  .num-label { font-size: 11px; color: #6B6B66; letter-spacing: 0.05em; }
  .badge {
    display: inline-block; color: #fff; font-size: 10px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 999px;
  }
  .body { font-size: 16px; line-height: 1.65; color: rgba(26,26,26,0.85); margin: 5% 0 0; white-space: pre-wrap; }
  .source { margin-top: auto; padding-top: 16px; font-size: 11px; color: #6B6B66; }
  .takeaways { list-style: none; padding: 0; margin: 26px 0 0; }
  .takeaways li { display: flex; align-items: flex-start; gap: 14px; font-size: 17px; margin-bottom: 16px; line-height: 1.35; }
  .num {
    flex: 0 0 auto; width: 26px; height: 26px; border-radius: 999px;
    background: #EEF1FB; color: #2A52BE; font-size: 13px; font-weight: 600;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .hint {
    font-size: 12.5px; color: #6B6B66; text-align: center; padding: 4px 0 14px;
  }
  @media print {
    body { background: #FFFFFF; }
    .deck { padding: 0; gap: 0; }
    .hint { display: none; }
    .slide {
      max-width: none; width: 100%; height: 100vh; aspect-ratio: auto;
      border: none; border-radius: 0; box-shadow: none;
      break-after: page; page-break-after: always;
    }
    .slide:last-child { break-after: auto; page-break-after: auto; }
  }
</style>
</head>
<body>
<div class="deck">
<p class="hint">${slides.length} slides · Print or save as PDF to share (Cmd/Ctrl + P)</p>
${slideHtml}
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    // Popup blocked — fall back to a downloadable file.
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(trip.basics.eventName || 'tripmind-deck').replace(/\s+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

/* ------------------------------------------------------------------ */
/* Image helpers                                                       */
/* ------------------------------------------------------------------ */

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1200
      const scale = img.width > MAX ? MAX / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('load failed')) }
    img.src = URL.createObjectURL(file)
  })
}

function ImageUpload({
  value,
  onChange,
}: {
  value?: string
  onChange: (dataUrl: string | undefined) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (file: File) => {
    setLoading(true)
    try {
      const dataUrl = await compressImage(file)
      onChange(dataUrl)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
        Image (right panel)
      </span>
      {value ? (
        <div className="relative overflow-hidden rounded-control border border-border">
          <img src={value} alt="Slide image" className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-colors duration-200 hover:bg-black/70"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-control border border-dashed border-border bg-background/70 px-3 py-5 font-sans text-[13px] text-text-secondary transition-colors duration-200 hover:border-primary/50 hover:text-primary disabled:opacity-50"
        >
          <ImageIcon size={16} />
          {loading ? 'Compressing…' : 'Attach image'}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Small form helpers                                                  */
/* ------------------------------------------------------------------ */

function FieldNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-control border border-border bg-background/70 px-3 py-2 font-sans text-[12.5px] leading-relaxed text-text-secondary">
      {children}
    </p>
  )
}

function LabelledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-control border border-border bg-surface px-3 py-2 font-sans text-sm outline-none transition-all duration-200 placeholder:text-text-secondary/55 hover:border-text-secondary/40 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
      />
    </label>
  )
}

function LabelledTextarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-control border border-border bg-surface px-3 py-2 font-sans text-sm leading-relaxed outline-none transition-all duration-200 hover:border-text-secondary/40 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
      />
    </label>
  )
}
