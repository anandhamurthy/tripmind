import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownWideNarrow,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Map,
  MapPin,
  Pencil,
  Plus,
} from 'lucide-react'
import type { PlaceCategory, SightseeingPlace } from '../../types'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import Button from '../shared/Button'
import Input from '../shared/Input'
import Badge, { toneFor } from '../shared/Badge'
import CurrencyDisplay from '../shared/CurrencyDisplay'
import ConfirmInline from '../shared/ConfirmInline'
import DayColumn from '../shared/DayColumn'
import EmptyState from '../shared/EmptyState'
import ProgressBar from '../shared/ProgressBar'
import SidePanel from '../layout/SidePanel'

const CATEGORIES: PlaceCategory[] = [
  'Museum',
  'Landmark',
  'Market',
  'Nature',
  'Restaurant',
  'Shopping',
  'Other',
]

/** Stable identity so the stats useMemo below is not defeated on every render. */
const NO_DAYS: never[] = []

/** London Uber X estimate: £2.50 base + £1.90/km. Low = direct; high = +30% for traffic/surge. */
function cabFare(distanceKm: number): { low: number; high: number } {
  const base = 2.5
  const low = Math.max(7, Math.round(base + distanceKm * 1.9))
  return { low, high: Math.round(low * 1.3) }
}

/** Walk time at 5 km/h (12 min/km). Minimum 5 min. */
function walkTime(distanceKm: number): number {
  return Math.max(5, Math.round(distanceKm * 12))
}

/** Cab time at ~22 km/h average London traffic. Minimum 7 min. */
function cabTime(distanceKm: number): number {
  return Math.max(7, Math.round(distanceKm * 2.7))
}

function uberUrl(placeName: string): string {
  const dest = encodeURIComponent(placeName + ', London')
  return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[nickname]=${dest}`
}

function boltUrl(placeName: string): string {
  const dest = encodeURIComponent(placeName + ', London')
  return `https://bolt.eu/en-gb/ride/?destination=${dest}`
}

function googleMapsUrl(placeName: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + ', London')}`
}

function appleMapsUrl(placeName: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(placeName + ', London')}`
}

const emptyPlace = (): Omit<SightseeingPlace, 'id'> => ({
  name: '',
  category: 'Landmark',
  distanceKm: 0,
  travelMin: 0,
  entryFee: 0,
  hours: '',
  notes: '',
  visited: false,
})

interface EditTarget {
  date: string
  placeId: string | null
}

export default function SightseeingTab() {
  const trip = useActiveTrip()
  const setSightseeingBudget = useTripStore((s) => s.setSightseeingBudget)
  const updateCabBudget = useTripStore((s) => s.updateCabBudget)
  const addPlace = useTripStore((s) => s.addPlace)
  const updatePlace = useTripStore((s) => s.updatePlace)
  const deletePlace = useTripStore((s) => s.deletePlace)
  const toggleVisited = useTripStore((s) => s.toggleVisited)
  const sortPlacesByDistance = useTripStore((s) => s.sortPlacesByDistance)
  const setActiveTab = useTripStore((s) => s.setActiveTab)

  const [target, setTarget] = useState<EditTarget | null>(null)
  const [draft, setDraft] = useState<Omit<SightseeingPlace, 'id'>>(emptyPlace)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [mapsOpen, setMapsOpen] = useState<string | null>(null)
  const [transportFrom, setTransportFrom] = useState<'hotel' | 'venue'>('hotel')

  const days = trip?.sightseeing.days ?? NO_DAYS

  const stats = useMemo(() => {
    const places = days.flatMap((d) => d.places)
    return {
      entryTotal: places.reduce((n, p) => n + (p.entryFee || 0), 0),
      cabTotal: days.reduce((n, d) => n + (d.cabBudget || 0), 0),
      spent: places.filter((p) => p.visited).reduce((n, p) => n + (p.entryFee || 0), 0),
      planned: places.length,
      visited: places.filter((p) => p.visited).length,
    }
  }, [days])

  if (!trip) return null
  const { currency } = trip

  const budget = trip.sightseeing.totalBudget
  const committed = stats.entryTotal + stats.cabTotal
  const remaining = budget - committed

  const openAdd = (date: string) => {
    setDraft(emptyPlace())
    setTarget({ date, placeId: null })
  }

  const openEdit = (date: string, place: SightseeingPlace) => {
    const { id: _id, ...rest } = place
    void _id
    setDraft(rest)
    setTarget({ date, placeId: place.id })
  }

  const savePlace = () => {
    if (!target || !draft.name.trim()) return
    if (target.placeId) {
      updatePlace(trip.id, target.date, target.placeId, draft)
    } else {
      addPlace(trip.id, target.date, draft)
    }
    setTarget(null)
  }

  const toggleNote = (id: string) =>
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (days.length === 0) {
    return (
      <EmptyState
        heading="Set your trip dates first"
        subtext="Sightseeing days are generated from the trip's start and end dates. Add them in Setup and the day columns appear here automatically."
        action={
          <Button icon={<CalendarDays size={15} />} onClick={() => setActiveTab('setup')}>
            Go to Setup
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* ---------------- Summary bar ---------------- */}
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="font-sans text-[11.5px] uppercase tracking-[0.06em] text-text-secondary">
            Total budget
          </p>
          <Input
            variant="number"
            min={0}
            prefix={currency.symbol}
            containerClassName="mt-2"
            className="text-[16px] font-semibold"
            value={budget || ''}
            placeholder="0"
            onChange={(e) => setSightseeingBudget(trip.id, Number(e.target.value) || 0)}
          />
          <p className="mt-1.5 font-sans text-[12px] text-text-secondary">
            ₹{(budget * currency.inrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="font-sans text-[11.5px] uppercase tracking-[0.06em] text-text-secondary">
            Planned spend
          </p>
          <div className="mt-2.5">
            <CurrencyDisplay
              size="lg"
              amount={committed}
              currencySymbol={currency.symbol}
              currencyCode={currency.code}
              inrRate={currency.inrRate}
            />
          </div>
          <p className="mt-1.5 font-sans text-[12px] text-text-secondary">
            {currency.code} {stats.entryTotal.toLocaleString()} entry ·{' '}
            {currency.code} {stats.cabTotal.toLocaleString()} cabs
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="font-sans text-[11.5px] uppercase tracking-[0.06em] text-text-secondary">
            Remaining
          </p>
          <div className="mt-2.5">
            <span
              className={`font-sans text-[20px] font-semibold ${
                remaining < 0 ? 'text-danger' : 'text-success'
              }`}
            >
              {currency.code} {remaining.toLocaleString()}
            </span>
            <span className="ml-1.5 font-sans text-[13px] text-text-secondary">
              / ₹
              {Math.round(remaining * currency.inrRate).toLocaleString('en-IN')}
            </span>
          </div>
          <ProgressBar
            className="mt-3"
            labelPosition="none"
            height={6}
            value={committed}
            max={budget || committed || 1}
            tone={remaining < 0 ? 'danger' : 'primary'}
          />
        </div>

        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="font-sans text-[11.5px] uppercase tracking-[0.06em] text-text-secondary">
            Places
          </p>
          <p className="mt-2.5 font-sans text-[20px] font-semibold text-text-primary">
            {stats.visited}
            <span className="font-normal text-text-secondary"> of {stats.planned} visited</span>
          </p>
          <ProgressBar
            className="mt-3"
            labelPosition="none"
            height={6}
            tone="success"
            value={stats.visited}
            max={stats.planned || 1}
          />
        </div>
      </div>

      {/* ---------------- Days ---------------- */}
      {days.map((day, index) => {
        const dayEntry = day.places.reduce((n, p) => n + (p.entryFee || 0), 0)
        return (
          <DayColumn
            key={day.date}
            index={index + 1}
            date={day.date}
            meta={
              day.places.length > 0 ? (
                <span className="font-sans text-[12px] text-text-secondary">
                  {day.places.length} {day.places.length === 1 ? 'place' : 'places'} ·{' '}
                  {currency.code} {(dayEntry + day.cabBudget).toLocaleString()}
                </span>
              ) : undefined
            }
            actions={
              <>
                <label className="flex items-center gap-2 rounded-control border border-border bg-background/60 px-3 py-1.5">
                  <span className="font-sans text-[12px] text-text-secondary">Cab budget</span>
                  <span className="font-sans text-[12px] text-text-secondary">
                    {currency.symbol}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={day.cabBudget || ''}
                    placeholder="0"
                    onChange={(e) =>
                      updateCabBudget(trip.id, day.date, Number(e.target.value) || 0)
                    }
                    className="w-20 bg-transparent font-sans text-[13px] font-semibold text-text-primary outline-none"
                  />
                </label>

                {day.places.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowDownWideNarrow size={14} />}
                    onClick={() => sortPlacesByDistance(trip.id, day.date)}
                  >
                    Sort by distance
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => openAdd(day.date)}
                >
                  Add place
                </Button>
              </>
            }
          >
            {day.places.length === 0 ? (
              <EmptyState
                compact
                icon={<MapPin size={34} className="text-border" strokeWidth={1.5} />}
                heading="Nothing planned yet"
                subtext="Add the first stop for this day — museums, markets, viewpoints, anything."
                action={
                  <Button size="sm" icon={<Plus size={14} />} onClick={() => openAdd(day.date)}>
                    Add place
                  </Button>
                }
              />
            ) : (
              <div className="scrollbar-thin -mx-1 flex gap-4 overflow-x-auto px-1 pb-3">
                <AnimatePresence initial={false}>
                  {day.places.map((place) => {
                    const noteOpen = expandedNotes.has(place.id)
                    return (
                      <motion.article
                        key={place.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.22 }}
                        className={[
                          'flex w-[290px] shrink-0 flex-col rounded-card border bg-surface p-4',
                          'shadow-card transition-all duration-200 hover:shadow-card-hover',
                          place.visited
                            ? 'border-success/40 bg-[#F6FBF8]'
                            : 'border-border hover:border-primary/25',
                        ].join(' ')}
                      >
                        <div className="mb-2.5 flex items-start justify-between gap-2">
                          <Badge tone={toneFor(place.category)}>{place.category}</Badge>
                          <div className="flex items-center gap-0.5">
                            {/* Maps dropdown — click-toggle */}
                            <div className="relative">
                              <button
                                type="button"
                                aria-label="Open in maps"
                                onClick={() => setMapsOpen(mapsOpen === place.id ? null : place.id)}
                                className={[
                                  'rounded-control p-1.5 transition-colors duration-200',
                                  mapsOpen === place.id
                                    ? 'bg-primary-light text-primary'
                                    : 'text-text-secondary hover:bg-primary-light hover:text-primary',
                                ].join(' ')}
                              >
                                <Map size={13} />
                              </button>
                              {mapsOpen === place.id && (
                                <>
                                  {/* Backdrop — closes dropdown on outside click */}
                                  <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setMapsOpen(null)}
                                  />
                                  <div className="absolute right-0 top-full z-30 mt-1 min-w-[158px] rounded-control border border-border bg-surface p-1 shadow-card-hover">
                                    <a
                                      href={googleMapsUrl(place.name)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => setMapsOpen(null)}
                                      className="flex items-center gap-2 rounded-[4px] px-2.5 py-2 font-sans text-[12.5px] text-text-secondary transition-colors duration-150 hover:bg-background hover:text-text-primary"
                                    >
                                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#4285F4] font-sans text-[9px] font-bold text-white">
                                        G
                                      </span>
                                      Google Maps
                                      <ExternalLink size={10} className="ml-auto shrink-0 opacity-50" />
                                    </a>
                                    <a
                                      href={appleMapsUrl(place.name)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => setMapsOpen(null)}
                                      className="flex items-center gap-2 rounded-[4px] px-2.5 py-2 font-sans text-[12.5px] text-text-secondary transition-colors duration-150 hover:bg-background hover:text-text-primary"
                                    >
                                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#555] font-sans text-[9px] font-bold text-white">
                                        A
                                      </span>
                                      Apple Maps
                                      <ExternalLink size={10} className="ml-auto shrink-0 opacity-50" />
                                    </a>
                                  </div>
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              aria-label="Edit place"
                              onClick={() => openEdit(day.date, place)}
                              className="rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-primary-light hover:text-primary"
                            >
                              <Pencil size={13} />
                            </button>
                            <ConfirmInline
                              onConfirm={() => deletePlace(trip.id, day.date, place.id)}
                              triggerLabel="Delete place"
                            />
                          </div>
                        </div>

                        <h4 className="font-serif text-[16px] font-semibold leading-snug text-text-primary">
                          {place.name}
                        </h4>

                        {place.hours && (
                          <p className="mt-2 flex items-center gap-1.5 font-sans text-[12.5px] text-text-secondary">
                            <Clock size={12} className="shrink-0" />
                            {place.hours}
                          </p>
                        )}

                        <div className="mt-3">
                          {place.entryFee > 0 ? (
                            <CurrencyDisplay
                              amount={place.entryFee}
                              currencySymbol={currency.symbol}
                              currencyCode={currency.code}
                              inrRate={currency.inrRate}
                            />
                          ) : (
                            <span className="font-sans text-[13px] font-medium text-success">
                              Free entry
                            </span>
                          )}
                        </div>

                        {/* ── Transport options ── */}
                        {place.distanceKm > 0 && (() => {
                          const hasVenue = Boolean(place.distanceFromVenueKm)
                          const activeDist = transportFrom === 'venue' && hasVenue
                            ? place.distanceFromVenueKm!
                            : place.distanceKm
                          const activeTravelMin = transportFrom === 'venue' && hasVenue
                            ? place.travelFromVenueMin!
                            : place.travelMin
                          const { low, high } = cabFare(activeDist)
                          const inrLow = Math.round(low * currency.inrRate)
                          const inrHigh = Math.round(high * currency.inrRate)
                          const wMin = walkTime(activeDist)
                          const cMin = cabTime(activeDist)
                          const tubeInr = Math.round(2.80 * currency.inrRate)
                          return (
                            <div className="mt-3 rounded-control border border-border bg-background/60 divide-y divide-border">
                              {/* Tab toggle */}
                              {hasVenue && (
                                <div className="flex">
                                  <button
                                    type="button"
                                    onClick={() => setTransportFrom('hotel')}
                                    className={[
                                      'flex-1 py-1.5 font-sans text-[11.5px] font-semibold rounded-tl-control transition-colors duration-150',
                                      transportFrom === 'hotel'
                                        ? 'bg-primary text-white'
                                        : 'bg-background/60 text-text-secondary hover:text-text-primary',
                                    ].join(' ')}
                                  >
                                    🏨 From Hotel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTransportFrom('venue')}
                                    className={[
                                      'flex-1 py-1.5 font-sans text-[11.5px] font-semibold rounded-tr-control transition-colors duration-150',
                                      transportFrom === 'venue'
                                        ? 'bg-primary text-white'
                                        : 'bg-background/60 text-text-secondary hover:text-text-primary',
                                    ].join(' ')}
                                  >
                                    🏛 From Venue
                                  </button>
                                </div>
                              )}
                              {/* Walk */}
                              <div className="flex items-center gap-3 px-3 py-2.5">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-[15px]">🚶</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-sans text-[12.5px] font-semibold text-text-primary leading-tight">Walk</p>
                                  <p className="font-sans text-[11.5px] text-text-secondary">{wMin} min · {activeDist} km</p>
                                </div>
                                <span className="font-sans text-[12px] font-semibold text-success shrink-0">Free</span>
                              </div>
                              {/* Cab */}
                              <div className="px-3 py-2.5">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-light text-[15px]">🚕</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-sans text-[12.5px] font-semibold text-text-primary leading-tight">Cab</p>
                                    <p className="font-sans text-[11.5px] text-text-secondary">{cMin} min · Uber X estimate</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="font-sans text-[12px] font-semibold text-text-primary">£{low}–£{high}</p>
                                    <p className="font-sans text-[10.5px] text-text-secondary">₹{inrLow.toLocaleString('en-IN')}–₹{inrHigh.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <a
                                    href={uberUrl(place.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-1 items-center justify-center gap-1 rounded-control border border-[#000] bg-[#000] px-2 py-1.5 font-sans text-[11.5px] font-medium text-white transition-opacity duration-200 hover:opacity-80"
                                  >
                                    <ExternalLink size={10} />
                                    Uber
                                  </a>
                                  <a
                                    href={boltUrl(place.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-1 items-center justify-center gap-1 rounded-control border border-[#34D186] bg-[#34D186] px-2 py-1.5 font-sans text-[11.5px] font-medium text-[#000] transition-opacity duration-200 hover:opacity-80"
                                  >
                                    <ExternalLink size={10} />
                                    Bolt
                                  </a>
                                </div>
                              </div>
                              {/* Public Transport */}
                              <div className="px-3 py-2.5">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003399]/10 text-[15px]">🚇</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-sans text-[12.5px] font-semibold text-text-primary leading-tight">Tube / Bus</p>
                                    <p className="font-sans text-[11.5px] text-text-secondary">{activeTravelMin} min · TfL Zone 1–3</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="font-sans text-[12px] font-semibold text-text-primary">~£2.80</p>
                                    <p className="font-sans text-[10.5px] text-text-secondary">~₹{tubeInr}</p>
                                  </div>
                                </div>
                                {place.tubeRoute && (
                                  <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-text-secondary pl-10">
                                    🗺 {place.tubeRoute}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })()}

                        {place.notes && (
                          <button
                            type="button"
                            onClick={() => toggleNote(place.id)}
                            className="mt-3 text-left font-sans text-[12.5px] leading-relaxed text-text-secondary transition-colors duration-200 hover:text-text-primary"
                          >
                            <span className={noteOpen ? '' : 'line-clamp-2'}>{place.notes}</span>
                            <span className="mt-0.5 block text-[11.5px] font-medium text-primary">
                              {noteOpen ? 'Show less' : 'Show more'}
                            </span>
                          </button>
                        )}

                        <div className="mt-auto space-y-2 pt-4">
                          {place.bookingUrl && (
                            <a
                              href={place.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={[
                                'flex w-full items-center justify-center gap-1.5 rounded-pill border px-4 py-2',
                                'font-sans text-[12.5px] font-medium transition-all duration-200',
                                place.entryFee > 0
                                  ? 'border-primary/30 bg-primary-light text-primary hover:bg-primary hover:text-white'
                                  : 'border-border bg-surface text-text-secondary hover:border-primary/30 hover:text-primary',
                              ].join(' ')}
                            >
                              <ExternalLink size={13} />
                              {place.entryFee > 0 ? 'Book Tickets' : 'Visit Website'}
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleVisited(trip.id, day.date, place.id)}
                            className={[
                              'flex w-full items-center justify-center gap-1.5 rounded-pill border px-4 py-2',
                              'font-sans text-[12.5px] font-medium transition-all duration-200',
                              place.visited
                                ? 'border-success/40 bg-[#E8F4EE] text-success'
                                : 'border-border bg-surface text-text-secondary hover:border-success/40 hover:text-success',
                            ].join(' ')}
                          >
                            {place.visited ? (
                              <>
                                <Check size={14} /> Visited
                              </>
                            ) : (
                              'Mark visited'
                            )}
                          </button>
                        </div>
                      </motion.article>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </DayColumn>
        )
      })}

      {/* ---------------- Place panel ---------------- */}
      <SidePanel
        open={target !== null}
        title={target?.placeId ? 'Edit place' : 'Add place'}
        description="Distances are measured from your hotel."
        onClose={() => setTarget(null)}
        onSave={savePlace}
        saveDisabled={!draft.name.trim()}
      >
        <Input
          label="Place name"
          autoFocus
          placeholder="e.g. Jerónimos Monastery"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />

        <div>
          <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
            Category
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraft({ ...draft, category: c })}
                className={[
                  'rounded-pill border px-3.5 py-1.5 font-sans text-[12.5px] font-medium transition-all duration-200',
                  draft.category === c
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
                ].join(' ')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Distance from hotel"
            variant="number"
            min={0}
            step="0.1"
            suffix="km"
            value={draft.distanceKm || ''}
            onChange={(e) => setDraft({ ...draft, distanceKm: Number(e.target.value) || 0 })}
          />
          <Input
            label="Travel time"
            variant="number"
            min={0}
            suffix="min"
            value={draft.travelMin || ''}
            onChange={(e) => setDraft({ ...draft, travelMin: Number(e.target.value) || 0 })}
          />
        </div>

        <Input
          label={`Entry fee (${currency.code})`}
          variant="number"
          min={0}
          prefix={currency.symbol}
          hint={
            draft.entryFee > 0
              ? `≈ ₹${Math.round(draft.entryFee * currency.inrRate).toLocaleString('en-IN')}`
              : 'Leave at 0 for free entry'
          }
          value={draft.entryFee || ''}
          onChange={(e) => setDraft({ ...draft, entryFee: Number(e.target.value) || 0 })}
        />

        <Input
          label="Opening hours"
          placeholder="e.g. 10:00 – 18:00, closed Mondays"
          value={draft.hours}
          onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
        />

        <Input
          label="Booking / website URL"
          placeholder="https://www.example.com/tickets"
          value={draft.bookingUrl ?? ''}
          onChange={(e) => setDraft({ ...draft, bookingUrl: e.target.value || undefined })}
        />

        <Input
          variant="textarea"
          label="Notes"
          rows={4}
          placeholder="Book ahead, best light in the morning, cash only…"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </SidePanel>
    </div>
  )
}
