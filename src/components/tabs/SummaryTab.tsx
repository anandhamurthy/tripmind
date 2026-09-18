import { useMemo, type ReactNode } from 'react'
import { Plane, Printer } from 'lucide-react'
import { useActiveTrip } from '../../store/useTripStore'
import { formatDateSpan, formatDateTime, formatDayLabel, nightsBetween } from '../../lib/date'
import Button from '../shared/Button'
import Badge, { toneFor } from '../shared/Badge'
import CurrencyDisplay from '../shared/CurrencyDisplay'
import ProgressBar from '../shared/ProgressBar'

const PURPOSE_LABEL = { business: 'Business', leisure: 'Leisure', both: 'Both' } as const

export default function SummaryTab() {
  const trip = useActiveTrip()

  const totals = useMemo(() => {
    if (!trip) return null
    const places = trip.sightseeing.days.flatMap((d) => d.places)
    const meals = trip.restaurants.days.flatMap((d) => d.meals)
    const sightseeing = places.reduce((n, p) => n + (p.entryFee || 0), 0)
    const cabs = trip.sightseeing.days.reduce((n, d) => n + (d.cabBudget || 0), 0)
    const food = meals.filter((m) => m.visited).reduce((n, m) => n + (m.costLocal || 0), 0)
    const items = trip.packing.sections.flatMap((s) => s.items)

    return {
      places,
      meals,
      items,
      sightseeing,
      cabs,
      food,
      grand: sightseeing + cabs + food,
      placesVisited: places.filter((p) => p.visited).length,
      mealsVisited: meals.filter((m) => m.visited).length,
      itemsPacked: items.filter((i) => i.packed).length,
    }
  }, [trip])

  if (!trip || !totals) return null

  const { basics, hotel, currency, flights } = trip
  const starred = [...trip.insights].filter((i) => i.starred).sort((a, b) => a.priority - b.priority)

  const money = (amount: number, size: 'sm' | 'md' = 'sm') => (
    <CurrencyDisplay
      size={size}
      amount={amount}
      currencySymbol={currency.symbol}
      currencyCode={currency.code}
      inrRate={currency.inrRate}
    />
  )

  return (
    <div className="mx-auto max-w-[980px] space-y-6">
      <div className="no-print flex items-center justify-end">
        <Button variant="secondary" icon={<Printer size={15} />} onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {/* 1 — Header */}
      <section className="rounded-card border border-border bg-surface p-6 shadow-card print-block">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[28px] font-semibold leading-tight text-text-primary">
              {basics.eventName || 'Untitled trip'}
            </h1>
            <p className="mt-1.5 font-sans text-[14px] text-text-secondary">
              {[basics.location, basics.country].filter(Boolean).join(', ') ||
                'Destination not set'}
            </p>
            <p className="mt-0.5 font-sans text-[13px] text-text-secondary">
              {formatDateSpan(basics.startDate, basics.endDate)}
              {basics.startDate && basics.endDate && (
                <span className="ml-1.5">
                  · {nightsBetween(basics.startDate, basics.endDate)} nights
                </span>
              )}
            </p>
          </div>
          <Badge tone="primary" size="md">
            {PURPOSE_LABEL[basics.purpose]}
          </Badge>
        </div>
      </section>

      {/* 2 — Flights */}
      <Block title="Flights" empty={flights.length === 0} emptyText="No flights recorded.">
        <ul className="divide-y divide-border">
          {flights.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-x-5 gap-y-1.5 py-3">
              <Badge tone="neutral">{f.type}</Badge>
              <span className="font-sans text-[13.5px] font-semibold text-text-primary">
                {f.airline || '—'}
              </span>
              <span className="font-mono text-[12.5px] text-text-secondary">{f.flightNo}</span>
              <span className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-text-primary">
                {f.depAirport || '???'}
                <Plane size={13} className="text-primary" />
                {f.arrAirport || '???'}
              </span>
              <span className="flex-1 font-sans text-[12.5px] text-text-secondary">
                {formatDateTime(f.depDateTime)} → {formatDateTime(f.arrDateTime)}
              </span>
              {f.seat && (
                <span className="font-sans text-[12.5px] text-text-secondary">
                  Seat <strong className="text-text-primary">{f.seat}</strong>
                </span>
              )}
            </li>
          ))}
        </ul>
      </Block>

      {/* 3 — Hotel */}
      <Block title="Hotel" empty={!hotel.name} emptyText="No hotel recorded.">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 tablet:grid-cols-2">
          <Field label="Name" value={hotel.name} />
          <Field label="Confirmation" value={hotel.confirmationNo} mono />
          <Field label="Address" value={hotel.address} span />
          <Field label="Check-in" value={formatDateTime(hotel.checkIn)} />
          <Field label="Check-out" value={formatDateTime(hotel.checkOut)} />
        </dl>
      </Block>

      {/* 4 — Budget */}
      <Block title="Budget overview">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left font-sans text-[11.5px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                Category
              </th>
              <th className="pb-2 text-right font-sans text-[11.5px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Sightseeing — entry fees', value: totals.sightseeing },
              { label: 'Cabs', value: totals.cabs },
              { label: 'Food — meals visited', value: totals.food },
            ].map((row) => (
              <tr key={row.label} className="border-b border-border">
                <td className="py-2.5 font-sans text-[13.5px] text-text-primary">{row.label}</td>
                <td className="py-2.5 text-right">{money(row.value)}</td>
              </tr>
            ))}
            <tr>
              <td className="pt-3 font-serif text-[16px] font-semibold text-text-primary">
                Grand total
              </td>
              <td className="pt-3 text-right">{money(totals.grand, 'md')}</td>
            </tr>
          </tbody>
        </table>
      </Block>

      {/* 5 — Top insights */}
      <Block
        title="Top insights"
        empty={starred.length === 0}
        emptyText="No insights starred yet."
      >
        <ol className="space-y-3">
          {starred.map((insight, index) => (
            <li key={insight.id} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light font-sans text-[12px] font-semibold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[14.5px] font-semibold leading-snug text-text-primary">
                  {insight.title}
                </p>
                {insight.body && (
                  <p className="mt-0.5 font-sans text-[12.5px] text-text-secondary">
                    {insight.body.slice(0, 50)}
                    {insight.body.length > 50 && '…'}
                  </p>
                )}
              </div>
              <Badge tone={toneFor(insight.category)}>{insight.category}</Badge>
            </li>
          ))}
        </ol>
      </Block>

      {/* 6 — Sightseeing */}
      <Block
        title="Sightseeing"
        subtitle={`${totals.placesVisited} of ${totals.places.length} places visited`}
        empty={totals.places.length === 0}
        emptyText="No places planned."
      >
        <ProgressBar
          className="mb-4"
          labelPosition="none"
          height={8}
          tone="success"
          value={totals.placesVisited}
          max={totals.places.length || 1}
        />
        {totals.placesVisited === 0 ? (
          <p className="font-sans text-[13px] text-text-secondary">Nothing ticked off yet.</p>
        ) : (
          <ul className="space-y-2">
            {trip.sightseeing.days.map((day) =>
              day.places
                .filter((p) => p.visited)
                .map((place) => (
                  <li
                    key={place.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-2 last:border-0"
                  >
                    <Badge tone={toneFor(place.category)}>{place.category}</Badge>
                    <span className="flex-1 font-sans text-[13.5px] font-medium text-text-primary">
                      {place.name}
                    </span>
                    <span className="font-sans text-[12px] text-text-secondary">
                      {formatDayLabel(day.date)}
                    </span>
                    {place.entryFee > 0 && money(place.entryFee)}
                  </li>
                )),
            )}
          </ul>
        )}
      </Block>

      {/* 7 — Restaurants */}
      <Block
        title="Restaurants"
        subtitle={`${totals.mealsVisited} of ${totals.meals.length} visited`}
        empty={totals.meals.length === 0}
        emptyText="No meals planned."
      >
        <ProgressBar
          className="mb-4"
          labelPosition="none"
          height={8}
          tone="success"
          value={totals.mealsVisited}
          max={totals.meals.length || 1}
        />
        {totals.mealsVisited === 0 ? (
          <p className="font-sans text-[13px] text-text-secondary">Nothing ticked off yet.</p>
        ) : (
          <ul className="space-y-2">
            {trip.restaurants.days.map((day) =>
              day.meals
                .filter((m) => m.visited)
                .map((meal) => (
                  <li
                    key={meal.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-2 last:border-0"
                  >
                    <Badge tone={toneFor(meal.meal)}>{meal.meal}</Badge>
                    <span className="flex-1 font-sans text-[13.5px] font-medium text-text-primary">
                      {meal.name}
                      {meal.cuisine && (
                        <span className="ml-2 font-normal text-text-secondary">{meal.cuisine}</span>
                      )}
                    </span>
                    <span className="font-sans text-[12px] text-text-secondary">
                      {formatDayLabel(day.date)}
                    </span>
                    {money(meal.costLocal)}
                  </li>
                )),
            )}
          </ul>
        )}
      </Block>

      {/* 8 — Packing */}
      <Block
        title="Packing"
        subtitle={`${totals.itemsPacked} of ${totals.items.length} items packed`}
        empty={totals.items.length === 0}
        emptyText="No packing list generated."
      >
        <ProgressBar
          labelPosition="none"
          height={8}
          value={totals.itemsPacked}
          max={totals.items.length || 1}
          tone={
            totals.items.length > 0 && totals.itemsPacked === totals.items.length
              ? 'success'
              : 'primary'
          }
        />
        <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 tablet:grid-cols-2">
          {trip.packing.sections
            .filter((s) => s.items.length > 0)
            .map((section) => {
              const packed = section.items.filter((i) => i.packed).length
              return (
                <li
                  key={section.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-2"
                >
                  <span className="font-sans text-[13.5px] text-text-primary">{section.name}</span>
                  <span
                    className={`font-sans text-[12.5px] font-medium ${
                      packed === section.items.length ? 'text-success' : 'text-text-secondary'
                    }`}
                  >
                    {packed}/{section.items.length}
                  </span>
                </li>
              )
            })}
        </ul>
      </Block>

      {/* 9 — Distances */}
      <Block title="Key distances">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 tablet:grid-cols-2">
          <Field
            label="Airport → Hotel"
            value={`${basics.distanceAirportToHotel} km · ${basics.travelTimeAirportToHotel} min`}
          />
          <Field
            label="Hotel → Event venue"
            value={`${basics.distanceHotelToVenue} km · ${basics.travelTimeHotelToVenue} min`}
          />
        </dl>
      </Block>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Block({
  title,
  subtitle,
  empty = false,
  emptyText = 'Nothing here yet.',
  children,
}: {
  title: string
  subtitle?: string
  empty?: boolean
  emptyText?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card print-block">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-[19px] font-semibold text-text-primary">{title}</h2>
        {subtitle && <span className="font-sans text-[12.5px] text-text-secondary">{subtitle}</span>}
      </div>
      {empty ? <p className="font-sans text-[13px] text-text-secondary">{emptyText}</p> : children}
    </section>
  )
}

function Field({
  label,
  value,
  span = false,
  mono = false,
}: {
  label: string
  value: string
  span?: boolean
  mono?: boolean
}) {
  return (
    <div className={span ? 'tablet:col-span-2' : ''}>
      <dt className="font-sans text-[11.5px] uppercase tracking-[0.06em] text-text-secondary">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-[13.5px] text-text-primary ${mono ? 'font-mono uppercase' : 'font-sans'}`}
      >
        {value || '—'}
      </dd>
    </div>
  )
}
