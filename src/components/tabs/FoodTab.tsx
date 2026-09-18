import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Map,
  MapPin,
  Pencil,

  Plus,
  Star,
  UtensilsCrossed,
} from 'lucide-react'

function cabFare(d: number) {
  const low = Math.max(7, Math.round(2.5 + d * 1.9))
  return { low, high: Math.round(low * 1.3) }
}
function walkTime(d: number) { return Math.max(5, Math.round(d * 12)) }
function cabTime(d: number) { return Math.max(7, Math.round(d * 2.7)) }
function uberUrl(name: string) {
  return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[nickname]=${encodeURIComponent(name + ', London')}`
}
function boltUrl(name: string) {
  return `https://bolt.eu/en-gb/ride/?destination=${encodeURIComponent(name + ', London')}`
}
function googleMapsUrl(name: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', London')}`
}
function appleMapsUrl(name: string) {
  return `https://maps.apple.com/?q=${encodeURIComponent(name + ', London')}`
}
import type { MealType, Restaurant } from '../../types'
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

const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

/** Stable identity so the stats useMemo below is not defeated on every render. */
const NO_DAYS: never[] = []

const emptyRestaurant = (): Omit<Restaurant, 'id'> => ({
  name: '',
  cuisine: '',
  meal: 'Lunch',
  distanceKm: 0,
  costLocal: 0,
  rating: 0,
  hours: '',
  address: '',
  notes: '',
  visited: false,
})

interface EditTarget {
  date: string
  restaurantId: string | null
}

export default function FoodTab() {
  const trip = useActiveTrip()
  const setFoodBudget = useTripStore((s) => s.setFoodBudget)
  const updateDailyFoodBudget = useTripStore((s) => s.updateDailyFoodBudget)
  const addRestaurant = useTripStore((s) => s.addRestaurant)
  const updateRestaurant = useTripStore((s) => s.updateRestaurant)
  const deleteRestaurant = useTripStore((s) => s.deleteRestaurant)
  const setActiveTab = useTripStore((s) => s.setActiveTab)

  const [target, setTarget] = useState<EditTarget | null>(null)
  const [draft, setDraft] = useState<Omit<Restaurant, 'id'>>(emptyRestaurant)
  const [transportFrom, setTransportFrom] = useState<'hotel' | 'venue'>('hotel')
  const [mapsOpen, setMapsOpen] = useState<string | null>(null)

  const days = trip?.restaurants.days ?? NO_DAYS

  const stats = useMemo(() => {
    const meals = days.flatMap((d) => d.meals)
    return {
      planned: meals.length,
      visited: meals.filter((m) => m.visited).length,
      spent: meals.filter((m) => m.visited).reduce((n, m) => n + (m.costLocal || 0), 0),
      committed: meals.reduce((n, m) => n + (m.costLocal || 0), 0),
    }
  }, [days])

  if (!trip) return null
  const { currency } = trip

  const budget = trip.restaurants.totalBudget
  const remaining = budget - stats.spent

  const openAdd = (date: string) => {
    setDraft(emptyRestaurant())
    setTarget({ date, restaurantId: null })
  }

  const openEdit = (date: string, restaurant: Restaurant) => {
    const { id: _id, ...rest } = restaurant
    void _id
    setDraft(rest)
    setTarget({ date, restaurantId: restaurant.id })
  }

  const save = () => {
    if (!target || !draft.name.trim()) return
    if (target.restaurantId) {
      updateRestaurant(trip.id, target.date, target.restaurantId, draft)
    } else {
      addRestaurant(trip.id, target.date, draft)
    }
    setTarget(null)
  }

  if (days.length === 0) {
    return (
      <EmptyState
        heading="Set your trip dates first"
        subtext="Meal planning is laid out day by day, generated from the trip's start and end dates."
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
      {/* ---------------- Budget bar ---------------- */}
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="font-sans text-[11.5px] uppercase tracking-[0.06em] text-text-secondary">
            Food budget
          </p>
          <Input
            variant="number"
            min={0}
            prefix={currency.symbol}
            containerClassName="mt-2"
            className="text-[16px] font-semibold"
            placeholder="0"
            value={budget || ''}
            onChange={(e) => setFoodBudget(trip.id, Number(e.target.value) || 0)}
          />
          <p className="mt-1.5 font-sans text-[12px] text-text-secondary">
            ₹{Math.round(budget * currency.inrRate).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="font-sans text-[11.5px] uppercase tracking-[0.06em] text-text-secondary">
            Spent
          </p>
          <div className="mt-2.5">
            <CurrencyDisplay
              size="lg"
              amount={stats.spent}
              currencySymbol={currency.symbol}
              currencyCode={currency.code}
              inrRate={currency.inrRate}
            />
          </div>
          <p className="mt-1.5 font-sans text-[12px] text-text-secondary">
            From {stats.visited} visited {stats.visited === 1 ? 'meal' : 'meals'}
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
              / ₹{Math.round(remaining * currency.inrRate).toLocaleString('en-IN')}
            </span>
          </div>
          <ProgressBar
            className="mt-3"
            labelPosition="none"
            height={6}
            value={stats.spent}
            max={budget || stats.spent || 1}
            tone={remaining < 0 ? 'danger' : 'primary'}
          />
        </div>

        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="font-sans text-[11.5px] uppercase tracking-[0.06em] text-text-secondary">
            Meals
          </p>
          <p className="mt-2.5 font-sans text-[20px] font-semibold text-text-primary">
            {stats.visited}
            <span className="font-normal text-text-secondary"> of {stats.planned} visited</span>
          </p>
          <p className="mt-1.5 font-sans text-[12px] text-text-secondary">
            {currency.code} {stats.committed.toLocaleString()} if you eat everything planned
          </p>
        </div>
      </div>

      {/* ---------------- Days ---------------- */}
      {days.map((day, index) => {
        const dayTotal = day.meals.reduce((n, m) => n + (m.costLocal || 0), 0)
        const grouped = MEALS.map((meal) => ({
          meal,
          items: day.meals.filter((m) => m.meal === meal),
        })).filter((g) => g.items.length > 0)

        return (
          <DayColumn
            key={day.date}
            index={index + 1}
            date={day.date}
            meta={
              day.meals.length > 0 ? (
                <span className="font-sans text-[12px] text-text-secondary">
                  {day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'} ·{' '}
                  {currency.code} {dayTotal.toLocaleString()}
                  {day.dailyBudget > 0 && dayTotal > day.dailyBudget && (
                    <span className="ml-1.5 font-medium text-danger">over budget</span>
                  )}
                </span>
              ) : undefined
            }
            actions={
              <>
                <label className="flex items-center gap-2 rounded-control border border-border bg-background/60 px-3 py-1.5">
                  <span className="font-sans text-[12px] text-text-secondary">Daily budget</span>
                  <span className="font-sans text-[12px] text-text-secondary">
                    {currency.symbol}
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={day.dailyBudget || ''}
                    onChange={(e) =>
                      updateDailyFoodBudget(trip.id, day.date, Number(e.target.value) || 0)
                    }
                    className="w-20 bg-transparent font-sans text-[13px] font-semibold text-text-primary outline-none"
                  />
                </label>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => openAdd(day.date)}
                >
                  Add restaurant
                </Button>
              </>
            }
          >
            {day.meals.length === 0 ? (
              <EmptyState
                compact
                icon={<UtensilsCrossed size={34} className="text-border" strokeWidth={1.5} />}
                heading="No meals planned"
                subtext="Add the places you want to try — breakfast near the hotel, dinner after the sessions."
                action={
                  <Button size="sm" icon={<Plus size={14} />} onClick={() => openAdd(day.date)}>
                    Add restaurant
                  </Button>
                }
              />
            ) : (
              <div className="space-y-5">
                {grouped.map((group) => (
                  <div key={group.meal}>
                    <h4 className="mb-3 flex items-center gap-2 font-sans text-[12px] font-semibold uppercase tracking-[0.07em] text-text-secondary">
                      {group.meal}
                      <span className="h-px flex-1 bg-border" />
                    </h4>

                    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
                      <AnimatePresence initial={false}>
                        {group.items.map((r) => (
                          <motion.article
                            key={r.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.22 }}
                            className={[
                              'flex flex-col rounded-card border p-4 shadow-card',
                              'transition-all duration-200 hover:shadow-card-hover',
                              r.visited
                                ? 'border-success/40 bg-[#F6FBF8]'
                                : 'border-border bg-surface hover:border-primary/25',
                            ].join(' ')}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge tone={toneFor(r.meal)}>{r.meal}</Badge>
                                {r.cuisine && <Badge tone="neutral">{r.cuisine}</Badge>}
                              </div>
                              <div className="flex shrink-0 items-center gap-0.5">
                                <button
                                  type="button"
                                  aria-label="Edit restaurant"
                                  onClick={() => openEdit(day.date, r)}
                                  className="rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-primary-light hover:text-primary"
                                >
                                  <Pencil size={13} />
                                </button>
                                <ConfirmInline
                                  onConfirm={() => deleteRestaurant(trip.id, day.date, r.id)}
                                  triggerLabel="Delete restaurant"
                                />
                              </div>
                            </div>

                            <h5 className="font-serif text-[15px] font-semibold leading-snug text-text-primary">
                              {r.name}
                            </h5>

                            <StarRating
                              value={r.rating}
                              onChange={(rating) =>
                                updateRestaurant(trip.id, day.date, r.id, { rating })
                              }
                            />

                            <div className="mt-2 space-y-1 font-sans text-[12.5px] text-text-secondary">
                              {r.hours && (
                                <p className="flex items-center gap-1.5">
                                  <Clock size={12} className="shrink-0" />
                                  {r.hours}
                                </p>
                              )}
                              {r.address && (
                                <p className="flex items-start gap-1.5">
                                  <MapPin size={12} className="mt-0.5 shrink-0" />
                                  <span className="line-clamp-2">{r.address}</span>
                                </p>
                              )}
                            </div>

                            <div className="mt-3">
                              <CurrencyDisplay
                                amount={r.costLocal}
                                currencySymbol={currency.symbol}
                                currencyCode={currency.code}
                                inrRate={currency.inrRate}
                              />
                              <span className="ml-1 font-sans text-[11.5px] text-text-secondary">
                                per person
                              </span>
                            </div>

                            {/* ── Transport panel ── */}
                            {r.distanceKm > 0 && (() => {
                              const hasVenue = Boolean(r.distanceFromVenueKm)
                              const activeDist = transportFrom === 'venue' && hasVenue
                                ? r.distanceFromVenueKm!
                                : r.distanceKm
                              const { low, high } = cabFare(activeDist)
                              const inrLow = Math.round(low * currency.inrRate)
                              const inrHigh = Math.round(high * currency.inrRate)
                              const wMin = walkTime(activeDist)
                              const cMin = cabTime(activeDist)
                              const tubeMin = Math.max(8, Math.round(activeDist * 3.5))
                              const tubeInr = Math.round(2.80 * currency.inrRate)
                              return (
                                <div className="mt-3 rounded-control border border-border bg-background/60 divide-y divide-border">
                                  {hasVenue && (
                                    <div className="flex">
                                      <button
                                        type="button"
                                        onClick={() => setTransportFrom('hotel')}
                                        className={['flex-1 py-1.5 font-sans text-[11.5px] font-semibold rounded-tl-control transition-colors duration-150', transportFrom === 'hotel' ? 'bg-primary text-white' : 'bg-background/60 text-text-secondary hover:text-text-primary'].join(' ')}
                                      >🏨 From Hotel</button>
                                      <button
                                        type="button"
                                        onClick={() => setTransportFrom('venue')}
                                        className={['flex-1 py-1.5 font-sans text-[11.5px] font-semibold rounded-tr-control transition-colors duration-150', transportFrom === 'venue' ? 'bg-primary text-white' : 'bg-background/60 text-text-secondary hover:text-text-primary'].join(' ')}
                                      >🏛 From Venue</button>
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
                                      <a href={uberUrl(r.name)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1 rounded-control border border-[#000] bg-[#000] px-2 py-1.5 font-sans text-[11.5px] font-medium text-white transition-opacity duration-200 hover:opacity-80">
                                        <ExternalLink size={10} /> Uber
                                      </a>
                                      <a href={boltUrl(r.name)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1 rounded-control border border-[#34D186] bg-[#34D186] px-2 py-1.5 font-sans text-[11.5px] font-medium text-[#000] transition-opacity duration-200 hover:opacity-80">
                                        <ExternalLink size={10} /> Bolt
                                      </a>
                                    </div>
                                  </div>
                                  {/* Tube */}
                                  <div className="flex items-center gap-3 px-3 py-2.5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003399]/10 text-[15px]">🚇</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-sans text-[12.5px] font-semibold text-text-primary leading-tight">Tube / Bus</p>
                                      <p className="font-sans text-[11.5px] text-text-secondary">{tubeMin} min · TfL Zone 1–3</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="font-sans text-[12px] font-semibold text-text-primary">~£2.80</p>
                                      <p className="font-sans text-[10.5px] text-text-secondary">~₹{tubeInr}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}

                            {/* ── Maps ── */}
                            <div className="relative mt-2">
                              <button
                                type="button"
                                onClick={() => setMapsOpen(mapsOpen === r.id ? null : r.id)}
                                className="flex items-center gap-1.5 rounded-control border border-border bg-background/60 px-3 py-1.5 font-sans text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:border-primary/30 hover:text-primary"
                              >
                                <Map size={12} /> Maps
                              </button>
                              {mapsOpen === r.id && (
                                <>
                                  <div className="fixed inset-0 z-20" onClick={() => setMapsOpen(null)} />
                                  <div className="absolute left-0 top-full z-30 mt-1 min-w-[158px] rounded-control border border-border bg-surface shadow-card-hover">
                                    <a href={googleMapsUrl(r.name)} target="_blank" rel="noopener noreferrer" onClick={() => setMapsOpen(null)} className="flex items-center gap-2 px-3 py-2.5 font-sans text-[12.5px] text-text-primary transition-colors duration-150 hover:bg-primary-light">
                                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4285F4] font-sans text-[10px] font-bold text-white">G</span>
                                      Google Maps
                                    </a>
                                    <a href={appleMapsUrl(r.name)} target="_blank" rel="noopener noreferrer" onClick={() => setMapsOpen(null)} className="flex items-center gap-2 border-t border-border px-3 py-2.5 font-sans text-[12.5px] text-text-primary transition-colors duration-150 hover:bg-primary-light">
                                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#555] font-sans text-[10px] font-bold text-white">A</span>
                                      Apple Maps
                                    </a>
                                  </div>
                                </>
                              )}
                            </div>

                            {r.notes && (
                              <p className="mt-2.5 font-sans text-[12.5px] leading-relaxed text-text-secondary">
                                {r.notes}
                              </p>
                            )}

                            <div className="mt-auto pt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  updateRestaurant(trip.id, day.date, r.id, {
                                    visited: !r.visited,
                                  })
                                }
                                className={[
                                  'flex w-full items-center justify-center gap-1.5 rounded-pill border px-4 py-2',
                                  'font-sans text-[12.5px] font-medium transition-all duration-200',
                                  r.visited
                                    ? 'border-success/40 bg-[#E8F4EE] text-success'
                                    : 'border-border bg-surface text-text-secondary hover:border-success/40 hover:text-success',
                                ].join(' ')}
                              >
                                {r.visited ? (
                                  <>
                                    <Check size={14} /> Visited
                                  </>
                                ) : (
                                  'Mark visited'
                                )}
                              </button>
                            </div>
                          </motion.article>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DayColumn>
        )
      })}

      {/* ---------------- Panel ---------------- */}
      <SidePanel
        open={target !== null}
        title={target?.restaurantId ? 'Edit restaurant' : 'Add restaurant'}
        description="Cost is per person, in the trip's local currency."
        onClose={() => setTarget(null)}
        onSave={save}
        saveDisabled={!draft.name.trim()}
      >
        <Input
          label="Restaurant name"
          autoFocus
          placeholder="e.g. Time Out Market"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />

        <Input
          label="Cuisine"
          placeholder="e.g. Portuguese, Seafood"
          value={draft.cuisine}
          onChange={(e) => setDraft({ ...draft, cuisine: e.target.value })}
        />

        <div>
          <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
            Meal
          </span>
          <div className="flex flex-wrap gap-2">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDraft({ ...draft, meal: m })}
                className={[
                  'rounded-pill border px-4 py-1.5 font-sans text-[12.5px] font-medium transition-all duration-200',
                  draft.meal === m
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
                ].join(' ')}
              >
                {m}
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
            label={`Cost / person (${currency.code})`}
            variant="number"
            min={0}
            prefix={currency.symbol}
            value={draft.costLocal || ''}
            hint={
              draft.costLocal > 0
                ? `≈ ₹${Math.round(draft.costLocal * currency.inrRate).toLocaleString('en-IN')}`
                : undefined
            }
            onChange={(e) => setDraft({ ...draft, costLocal: Number(e.target.value) || 0 })}
          />
        </div>

        <div>
          <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
            Rating
          </span>
          <StarRating
            size={22}
            value={draft.rating}
            onChange={(rating) => setDraft({ ...draft, rating })}
          />
        </div>

        <Input
          label="Opening hours"
          placeholder="e.g. 12:00 – 23:00"
          value={draft.hours}
          onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
        />

        <Input
          label="Address"
          value={draft.address}
          onChange={(e) => setDraft({ ...draft, address: e.target.value })}
        />

        <Input
          variant="textarea"
          label="Notes"
          rows={3}
          placeholder="Book ahead, try the pastéis, cash only…"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </SidePanel>
    </div>
  )
}

/** Five clickable stars. Clicking the current rating again clears it. */
function StarRating({
  value,
  onChange,
  size = 15,
}: {
  value: number
  onChange: (rating: number) => void
  size?: number
}) {
  return (
    <div className="mt-2 flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        return (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} out of 5`}
            onClick={() => onChange(value === n ? 0 : n)}
            className={[
              'rounded p-0.5 transition-all duration-200 hover:scale-110',
              filled ? 'text-amber' : 'text-border hover:text-amber/60',
            ].join(' ')}
          >
            <Star size={size} fill={filled ? '#E8A838' : 'none'} />
          </button>
        )
      })}
      {value > 0 && (
        <span className="ml-1.5 font-sans text-[12px] text-text-secondary">{value}.0</span>
      )}
    </div>
  )
}
