import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Pencil, Plane, Plus, Sparkles } from 'lucide-react'
import type { Flight, FlightType, TripPurpose } from '../../types'
import {
  CURRENCIES,
  DEFAULT_RATES,
  toINR,
  useActiveTrip,
  useTripStore,
} from '../../store/useTripStore'
import { formatDateTime } from '../../lib/date'
import { CLIMATE_LABEL, resolveClimate } from '../../lib/packing'
import { monthOf } from '../../lib/date'
import { SectionCard } from '../shared/Card'
import Button from '../shared/Button'
import Input from '../shared/Input'
import Badge, { type BadgeTone } from '../shared/Badge'
import ConfirmInline from '../shared/ConfirmInline'
import EmptyState from '../shared/EmptyState'
import SidePanel from '../layout/SidePanel'

const PURPOSES: { value: TripPurpose; label: string }[] = [
  { value: 'business', label: 'Business' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'both', label: 'Both' },
]

const FLIGHT_TYPES: { value: FlightType; label: string }[] = [
  { value: 'outbound', label: 'Outbound' },
  { value: 'return', label: 'Return' },
  { value: 'connection', label: 'Connection' },
]

const FLIGHT_TONE: Record<FlightType, BadgeTone> = {
  outbound: 'primary',
  return: 'success',
  connection: 'amber',
}

const emptyFlight = (): Omit<Flight, 'id'> => ({
  airline: '',
  flightNo: '',
  depAirport: '',
  arrAirport: '',
  depDateTime: '',
  arrDateTime: '',
  seat: '',
  bookingRef: '',
  type: 'outbound',
})

export default function OnboardingTab() {
  const trip = useActiveTrip()
  const updateBasics = useTripStore((s) => s.updateBasics)
  const addFlight = useTripStore((s) => s.addFlight)
  const updateFlight = useTripStore((s) => s.updateFlight)
  const deleteFlight = useTripStore((s) => s.deleteFlight)
  const updateHotel = useTripStore((s) => s.updateHotel)
  const updateCurrency = useTripStore((s) => s.updateCurrency)
  const generateDefaultPacking = useTripStore((s) => s.generateDefaultPacking)
  const setActiveTab = useTripStore((s) => s.setActiveTab)

  const [panelOpen, setPanelOpen] = useState(false)
  const [draft, setDraft] = useState<Omit<Flight, 'id'>>(emptyFlight)
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null)
  const [packingDone, setPackingDone] = useState(false)

  if (!trip) return null
  const { basics, flights, hotel, currency } = trip

  const setBasic = <K extends keyof typeof basics>(key: K, value: (typeof basics)[K]) =>
    updateBasics(trip.id, { [key]: value } as never)

  const num = (v: string) => (v === '' ? 0 : Number(v))

  const openFlightPanel = () => {
    setDraft(emptyFlight())
    setPanelOpen(true)
  }

  const saveFlight = () => {
    if (!draft.airline.trim() && !draft.flightNo.trim()) return
    addFlight(trip.id, draft)
    setPanelOpen(false)
  }

  const handleGeneratePacking = () => {
    generateDefaultPacking(basics.country)
    setPackingDone(true)
    window.setTimeout(() => setPackingDone(false), 2600)
  }

  const climate = resolveClimate(basics.country, monthOf(basics.startDate))

  return (
    <div className="space-y-6">
      {/* ---------------- Section 1 — Trip details ---------------- */}
      <SectionCard
        title="Trip details"
        description="Everything here saves as you type. Dates drive the day columns in Sightseeing and Food."
      >
        <div className="space-y-5">
          <Input
            label="Event name"
            serif
            className="text-[18px] py-2.5"
            placeholder="e.g. Web Summit 2026"
            value={basics.eventName}
            onChange={(e) => setBasic('eventName', e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
            <Input
              label="Event location"
              placeholder="e.g. Lisbon"
              value={basics.location}
              onChange={(e) => setBasic('location', e.target.value)}
            />
            <Input
              label="Country"
              placeholder="e.g. Portugal"
              hint={basics.country ? `Packing profile: ${CLIMATE_LABEL[climate]}` : 'Sets the packing climate profile'}
              value={basics.country}
              onChange={(e) => setBasic('country', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
            <Input
              label="Start date"
              variant="date"
              value={basics.startDate}
              onChange={(e) => setBasic('startDate', e.target.value)}
            />
            <Input
              label="End date"
              variant="date"
              value={basics.endDate}
              error={
                basics.startDate && basics.endDate && basics.endDate < basics.startDate
                  ? 'End date is before the start date.'
                  : undefined
              }
              onChange={(e) => setBasic('endDate', e.target.value)}
            />
          </div>

          <div>
            <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
              Purpose
            </span>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map((p) => {
                const active = basics.purpose === p.value
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setBasic('purpose', p.value)}
                    className={[
                      'rounded-pill border px-5 py-2 font-sans text-[13px] font-medium',
                      'transition-all duration-200',
                      active
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
                    ].join(' ')}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-border pt-5 tablet:grid-cols-2">
            <fieldset>
              <legend className="mb-2.5 font-sans text-[13px] font-semibold text-text-primary">
                Airport → Hotel
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Distance"
                  variant="number"
                  min={0}
                  suffix="km"
                  value={basics.distanceAirportToHotel || ''}
                  onChange={(e) => setBasic('distanceAirportToHotel', num(e.target.value))}
                />
                <Input
                  label="Travel time"
                  variant="number"
                  min={0}
                  suffix="min"
                  value={basics.travelTimeAirportToHotel || ''}
                  onChange={(e) => setBasic('travelTimeAirportToHotel', num(e.target.value))}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2.5 font-sans text-[13px] font-semibold text-text-primary">
                Hotel → Event venue
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Distance"
                  variant="number"
                  min={0}
                  suffix="km"
                  value={basics.distanceHotelToVenue || ''}
                  onChange={(e) => setBasic('distanceHotelToVenue', num(e.target.value))}
                />
                <Input
                  label="Travel time"
                  variant="number"
                  min={0}
                  suffix="min"
                  value={basics.travelTimeHotelToVenue || ''}
                  onChange={(e) => setBasic('travelTimeHotelToVenue', num(e.target.value))}
                />
              </div>
            </fieldset>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-background/70 px-4 py-3.5">
            <Sparkles size={17} className="text-amber" />
            <div className="flex-1 min-w-[200px]">
              <p className="font-sans text-[13px] font-medium text-text-primary">
                Generate a climate-aware packing list
              </p>
              <p className="font-sans text-[12px] text-text-secondary">
                {basics.country
                  ? `${basics.country} → ${CLIMATE_LABEL[climate]}. Already-packed items keep their tick.`
                  : 'Add a country above to unlock this.'}
              </p>
            </div>
            <Button
              variant={packingDone ? 'secondary' : 'primary'}
              disabled={!basics.country.trim()}
              icon={packingDone ? <Check size={15} /> : undefined}
              onClick={handleGeneratePacking}
            >
              {packingDone ? 'List generated' : 'Generate packing list'}
            </Button>
            {packingDone && (
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('packing')}>
                View
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ---------------- Section 2 — Flights ---------------- */}
      <SectionCard
        title="Flights"
        description="Click a flight to edit it inline."
        action={
          <Button variant="secondary" icon={<Plus size={15} />} onClick={openFlightPanel}>
            Add flight
          </Button>
        }
      >
        {flights.length === 0 ? (
          <EmptyState
            compact
            icon={<Plane size={38} className="text-border" strokeWidth={1.5} />}
            heading="No flights added"
            subtext="Add your outbound leg first — connections and the return can follow."
            action={
              <Button icon={<Plus size={15} />} onClick={openFlightPanel}>
                Add flight
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {flights.map((flight) => {
              const expanded = expandedFlight === flight.id
              return (
                <li
                  key={flight.id}
                  className="rounded-card border border-border bg-surface shadow-card transition-all duration-200 hover:border-primary/25 hover:shadow-card-hover"
                >
                  <div
                    className="flex cursor-pointer flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3.5"
                    onClick={() => setExpandedFlight(expanded ? null : flight.id)}
                  >
                    <Badge tone={FLIGHT_TONE[flight.type]}>{flight.type}</Badge>

                    <div className="min-w-[130px]">
                      <p className="font-sans text-[13.5px] font-semibold text-text-primary">
                        {flight.airline || 'Airline'}
                      </p>
                      <p className="font-mono text-[12px] text-text-secondary">
                        {flight.flightNo || '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 font-sans">
                      <span className="text-[15px] font-semibold tracking-wide text-text-primary">
                        {flight.depAirport || '???'}
                      </span>
                      <Plane size={14} className="text-primary" />
                      <span className="text-[15px] font-semibold tracking-wide text-text-primary">
                        {flight.arrAirport || '???'}
                      </span>
                    </div>

                    <div className="flex-1 font-sans text-[12.5px] text-text-secondary">
                      {formatDateTime(flight.depDateTime)}
                      <span className="mx-1.5">→</span>
                      {formatDateTime(flight.arrDateTime)}
                    </div>

                    <div className="flex items-center gap-3 font-sans text-[12px] text-text-secondary">
                      {flight.seat && (
                        <span>
                          Seat <strong className="text-text-primary">{flight.seat}</strong>
                        </span>
                      )}
                      {flight.bookingRef && (
                        <span className="font-mono uppercase">{flight.bookingRef}</span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <button
                        type="button"
                        aria-label={expanded ? 'Close editor' : 'Edit flight'}
                        onClick={() => setExpandedFlight(expanded ? null : flight.id)}
                        className={[
                          'rounded-control p-1.5 transition-colors duration-200',
                          expanded
                            ? 'bg-primary-light text-primary'
                            : 'text-text-secondary hover:bg-primary-light hover:text-primary',
                        ].join(' ')}
                      >
                        <Pencil size={14} />
                      </button>
                      <ConfirmInline
                        onConfirm={() => deleteFlight(trip.id, flight.id)}
                        triggerLabel="Delete flight"
                      />
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-4 border-t border-border bg-background/50 px-4 py-4 tablet:grid-cols-2 desktop:grid-cols-4">
                          <Input
                            label="Airline"
                            value={flight.airline}
                            onChange={(e) =>
                              updateFlight(trip.id, flight.id, { airline: e.target.value })
                            }
                          />
                          <Input
                            label="Flight no."
                            value={flight.flightNo}
                            onChange={(e) =>
                              updateFlight(trip.id, flight.id, { flightNo: e.target.value })
                            }
                          />
                          <Input
                            label="From (IATA)"
                            maxLength={4}
                            className="uppercase"
                            value={flight.depAirport}
                            onChange={(e) =>
                              updateFlight(trip.id, flight.id, {
                                depAirport: e.target.value.toUpperCase(),
                              })
                            }
                          />
                          <Input
                            label="To (IATA)"
                            maxLength={4}
                            className="uppercase"
                            value={flight.arrAirport}
                            onChange={(e) =>
                              updateFlight(trip.id, flight.id, {
                                arrAirport: e.target.value.toUpperCase(),
                              })
                            }
                          />
                          <Input
                            label="Departure"
                            variant="datetime-local"
                            value={flight.depDateTime}
                            onChange={(e) =>
                              updateFlight(trip.id, flight.id, { depDateTime: e.target.value })
                            }
                          />
                          <Input
                            label="Arrival"
                            variant="datetime-local"
                            value={flight.arrDateTime}
                            onChange={(e) =>
                              updateFlight(trip.id, flight.id, { arrDateTime: e.target.value })
                            }
                          />
                          <Input
                            label="Seat"
                            value={flight.seat}
                            onChange={(e) =>
                              updateFlight(trip.id, flight.id, { seat: e.target.value })
                            }
                          />
                          <Input
                            label="Booking ref"
                            value={flight.bookingRef}
                            onChange={(e) =>
                              updateFlight(trip.id, flight.id, { bookingRef: e.target.value })
                            }
                          />
                          <div className="desktop:col-span-4">
                            <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                              Type
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {FLIGHT_TYPES.map((t) => (
                                <button
                                  key={t.value}
                                  type="button"
                                  onClick={() =>
                                    updateFlight(trip.id, flight.id, { type: t.value })
                                  }
                                  className={[
                                    'rounded-pill border px-4 py-1.5 font-sans text-[12.5px] font-medium transition-all duration-200',
                                    flight.type === t.value
                                      ? 'border-primary bg-primary text-white'
                                      : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
                                  ].join(' ')}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      {/* ---------------- Section 3 — Hotel ---------------- */}
      <SectionCard title="Hotel" description="Where you are based for the trip.">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          <Input
            containerClassName="tablet:col-span-2"
            label="Hotel name"
            placeholder="e.g. The Ivens"
            value={hotel.name}
            onChange={(e) => updateHotel(trip.id, { name: e.target.value })}
          />
          <Input
            containerClassName="tablet:col-span-2"
            label="Address"
            placeholder="Street, area, city"
            value={hotel.address}
            onChange={(e) => updateHotel(trip.id, { address: e.target.value })}
          />
          <Input
            label="Check-in"
            variant="datetime-local"
            value={hotel.checkIn}
            onChange={(e) => updateHotel(trip.id, { checkIn: e.target.value })}
          />
          <Input
            label="Check-out"
            variant="datetime-local"
            value={hotel.checkOut}
            onChange={(e) => updateHotel(trip.id, { checkOut: e.target.value })}
          />
          <Input
            containerClassName="tablet:col-span-2"
            label="Confirmation number"
            value={hotel.confirmationNo}
            onChange={(e) => updateHotel(trip.id, { confirmationNo: e.target.value })}
          />
        </div>
      </SectionCard>

      {/* ---------------- Section 4 — Currency ---------------- */}
      <SectionCard
        title="Currency"
        description="Every amount in the app is shown in the local currency and in INR."
      >
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
          <div>
            <label
              htmlFor="currency-code"
              className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary"
            >
              Currency
            </label>
            <select
              id="currency-code"
              value={currency.code}
              onChange={(e) => {
                const code = e.target.value
                updateCurrency(trip.id, {
                  code,
                  symbol: CURRENCIES[code],
                  inrRate: DEFAULT_RATES[code] ?? currency.inrRate,
                })
              }}
              className="w-full cursor-pointer rounded-control border border-border bg-surface px-3 py-2 font-sans text-sm outline-none transition-all duration-200 hover:border-text-secondary/40 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
            >
              {Object.keys(CURRENCIES).map((code) => (
                <option key={code} value={code}>
                  {code} — {CURRENCIES[code]}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Symbol"
            value={currency.symbol}
            hint="Auto-filled, editable"
            onChange={(e) => updateCurrency(trip.id, { symbol: e.target.value })}
          />

          <Input
            label="INR exchange rate"
            variant="number"
            min={0}
            step="0.01"
            suffix="₹"
            value={currency.inrRate || ''}
            onChange={(e) => updateCurrency(trip.id, { inrRate: Number(e.target.value) || 0 })}
          />
        </div>

        <div className="mt-4 inline-flex items-baseline gap-2 rounded-control bg-primary-light px-4 py-2.5">
          <span className="font-sans text-[13px] text-text-secondary">Live preview</span>
          <span className="font-sans text-[15px] font-semibold text-primary">
            1 {currency.code} = ₹{currency.inrRate.toLocaleString('en-IN')}
          </span>
          <span className="font-sans text-[12.5px] text-text-secondary">
            · 100 {currency.code} = ₹{toINR(100, currency.inrRate)}
          </span>
        </div>
      </SectionCard>

      {/* ---------------- Add-flight panel ---------------- */}
      <SidePanel
        open={panelOpen}
        title="Add flight"
        description="Only the airline or flight number is required — fill in the rest whenever you have it."
        onClose={() => setPanelOpen(false)}
        onSave={saveFlight}
        saveLabel="Add flight"
        saveDisabled={!draft.airline.trim() && !draft.flightNo.trim()}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Airline"
            autoFocus
            value={draft.airline}
            onChange={(e) => setDraft({ ...draft, airline: e.target.value })}
          />
          <Input
            label="Flight no."
            placeholder="e.g. AI 131"
            value={draft.flightNo}
            onChange={(e) => setDraft({ ...draft, flightNo: e.target.value })}
          />
          <Input
            label="From (IATA)"
            maxLength={4}
            className="uppercase"
            placeholder="BLR"
            value={draft.depAirport}
            onChange={(e) => setDraft({ ...draft, depAirport: e.target.value.toUpperCase() })}
          />
          <Input
            label="To (IATA)"
            maxLength={4}
            className="uppercase"
            placeholder="LIS"
            value={draft.arrAirport}
            onChange={(e) => setDraft({ ...draft, arrAirport: e.target.value.toUpperCase() })}
          />
        </div>

        <Input
          label="Departure"
          variant="datetime-local"
          value={draft.depDateTime}
          onChange={(e) => setDraft({ ...draft, depDateTime: e.target.value })}
        />
        <Input
          label="Arrival"
          variant="datetime-local"
          value={draft.arrDateTime}
          onChange={(e) => setDraft({ ...draft, arrDateTime: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Seat"
            placeholder="e.g. 14A"
            value={draft.seat}
            onChange={(e) => setDraft({ ...draft, seat: e.target.value })}
          />
          <Input
            label="Booking ref"
            className="uppercase"
            value={draft.bookingRef}
            onChange={(e) => setDraft({ ...draft, bookingRef: e.target.value.toUpperCase() })}
          />
        </div>

        <div>
          <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
            Type
          </span>
          <div className="flex flex-wrap gap-2">
            {FLIGHT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setDraft({ ...draft, type: t.value })}
                className={[
                  'rounded-pill border px-4 py-1.5 font-sans text-[12.5px] font-medium transition-all duration-200',
                  draft.type === t.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </SidePanel>
    </div>
  )
}
