import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildGartnerTrip, defaultPackingSections } from '../data/gartnerTemplate'
import type {
  CurrencyConfig,
  DayPlanDay,
  DayPlanItem,
  DayPlanSlot,
  Flight,
  Hotel,
  Insight,
  PackingItem,
  PackingSection,
  Restaurant,
  Session,
  SightseeingPlace,
  Slide,
  Trip,
  TripBasics,
  TripStatus,
} from '../types'
import { dateRange, monthOf, parseISODate, todayISO } from '../lib/date'
import { DEFAULT_SECTION_NAMES, buildPackingKit } from '../lib/packing'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`

/** 45 → "3,780" (Indian digit grouping). */
export const toINR = (amount: number, rate: number): string =>
  Math.round((Number(amount) || 0) * (Number(rate) || 0)).toLocaleString('en-IN')

export const CURRENCIES: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  AED: 'AED',
  JPY: '¥',
  THB: '฿',
  MYR: 'RM',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
}

/** Indicative rates — the user edits these in Setup. */
export const DEFAULT_RATES: Record<string, number> = {
  USD: 84.2,
  EUR: 91.4,
  GBP: 107.5,
  SGD: 62.8,
  AED: 22.9,
  JPY: 0.56,
  THB: 2.4,
  MYR: 18.9,
  AUD: 55.1,
  CAD: 60.4,
  CHF: 97.3,
}

export const tripStatus = (trip: Trip): TripStatus => {
  const start = parseISODate(trip.basics.startDate)
  const end = parseISODate(trip.basics.endDate)
  const today = parseISODate(todayISO())!
  if (!start || !end) return 'Upcoming'
  if (today < start) return 'Upcoming'
  if (today > end) return 'Completed'
  return 'Active'
}

const emptyBasics = (): TripBasics => ({
  eventName: '',
  location: '',
  country: '',
  startDate: '',
  endDate: '',
  purpose: 'business',
  distanceAirportToHotel: 0,
  distanceHotelToVenue: 0,
  travelTimeAirportToHotel: 0,
  travelTimeHotelToVenue: 0,
})


/**
 * Keeps the per-day columns of Sightseeing and Food in sync with the trip's
 * date range. Days inside the range keep their data; days that fall outside it
 * are dropped only when they are empty, so nothing the user typed is silently lost.
 */
const reconcileDays = (trip: Trip): Trip => {
  const range = dateRange(trip.basics.startDate, trip.basics.endDate)
  if (range.length === 0) return trip

  const sightById = new Map(trip.sightseeing.days.map((d) => [d.date, d]))
  const sightDays = range.map(
    (date) => sightById.get(date) ?? { date, cabBudget: 0, places: [] },
  )
  const orphanSight = trip.sightseeing.days.filter(
    (d) => !range.includes(d.date) && d.places.length > 0,
  )

  const foodById = new Map(trip.restaurants.days.map((d) => [d.date, d]))
  const foodDays = range.map((date) => foodById.get(date) ?? { date, dailyBudget: 0, meals: [] })
  const orphanFood = trip.restaurants.days.filter(
    (d) => !range.includes(d.date) && d.meals.length > 0,
  )

  const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date)

  return {
    ...trip,
    sightseeing: { ...trip.sightseeing, days: [...sightDays, ...orphanSight].sort(byDate) },
    restaurants: { ...trip.restaurants, days: [...foodDays, ...orphanFood].sort(byDate) },
  }
}

/** Every mutation funnels through here so `updatedAt` and day columns stay correct. */
const touch = (trip: Trip): Trip => reconcileDays({ ...trip, updatedAt: new Date().toISOString() })

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface TripState {
  trips: Trip[]
  activeTripId: string | null
  activeTab: string

  createTrip: (basics: Partial<TripBasics>) => string
  updateTrip: (id: string, updates: Partial<Trip>) => void
  updateBasics: (id: string, updates: Partial<TripBasics>) => void
  deleteTrip: (id: string) => void
  setActiveTrip: (id: string | null) => void
  setActiveTab: (tab: string) => void

  addFlight: (tripId: string, flight: Omit<Flight, 'id'>) => void
  updateFlight: (tripId: string, flightId: string, updates: Partial<Flight>) => void
  deleteFlight: (tripId: string, flightId: string) => void

  updateHotel: (tripId: string, updates: Partial<Hotel>) => void
  updateCurrency: (tripId: string, updates: Partial<CurrencyConfig>) => void

  setSightseeingBudget: (tripId: string, total: number) => void
  addSightseeingDay: (tripId: string, date: string) => void
  updateCabBudget: (tripId: string, date: string, budget: number) => void
  addPlace: (tripId: string, date: string, place: Omit<SightseeingPlace, 'id'>) => void
  updatePlace: (
    tripId: string,
    date: string,
    placeId: string,
    updates: Partial<SightseeingPlace>,
  ) => void
  deletePlace: (tripId: string, date: string, placeId: string) => void
  toggleVisited: (tripId: string, date: string, placeId: string) => void
  sortPlacesByDistance: (tripId: string, date: string) => void

  addSession: (tripId: string, session: Omit<Session, 'id'>) => void
  updateSession: (tripId: string, sessionId: string, updates: Partial<Session>) => void
  deleteSession: (tripId: string, sessionId: string) => void

  addInsight: (tripId: string, insight: Omit<Insight, 'id' | 'timestamp' | 'priority'>) => void
  updateInsight: (tripId: string, insightId: string, updates: Partial<Insight>) => void
  deleteInsight: (tripId: string, insightId: string) => void
  toggleStarred: (tripId: string, insightId: string) => void
  reorderInsights: (tripId: string, orderedIds: string[]) => void

  setFoodBudget: (tripId: string, total: number) => void
  addRestaurantDay: (tripId: string, date: string) => void
  updateDailyFoodBudget: (tripId: string, date: string, budget: number) => void
  addRestaurant: (tripId: string, date: string, restaurant: Omit<Restaurant, 'id'>) => void
  updateRestaurant: (
    tripId: string,
    date: string,
    restaurantId: string,
    updates: Partial<Restaurant>,
  ) => void
  deleteRestaurant: (tripId: string, date: string, restaurantId: string) => void

  addPackingSection: (tripId: string, name: string) => void
  updatePackingSection: (tripId: string, sectionId: string, updates: Partial<PackingSection>) => void
  deletePackingSection: (tripId: string, sectionId: string) => void
  addPackingItem: (tripId: string, sectionId: string, label: string, note?: string, qty?: number, additionalQty?: number) => void
  updatePackingItem: (
    tripId: string,
    sectionId: string,
    itemId: string,
    updates: Partial<PackingItem>,
  ) => void
  togglePackingItem: (tripId: string, sectionId: string, itemId: string) => void
  deletePackingItem: (tripId: string, sectionId: string, itemId: string) => void
  setAllPacked: (tripId: string, packed: boolean) => void
  generateDefaultPacking: (country: string) => void
  importPacking: (tripId: string, sections: PackingSection[]) => void
  reorderPackingSections: (tripId: string, sections: PackingSection[]) => void
  reorderPackingItems: (tripId: string, sectionId: string, items: PackingItem[]) => void

  initDayPlan: (tripId: string) => void
  addDayPlanDay: (tripId: string, date: string, label: string) => void
  deleteDayPlanDay: (tripId: string, dayId: string) => void
  addDayPlanSlot: (tripId: string, dayId: string, time: string, location: string) => void
  updateDayPlanSlot: (tripId: string, dayId: string, slotId: string, updates: Partial<DayPlanSlot>) => void
  deleteDayPlanSlot: (tripId: string, dayId: string, slotId: string) => void
  addDayPlanItem: (tripId: string, dayId: string, slotId: string, label: string, qty?: number) => void
  updateDayPlanItem: (tripId: string, dayId: string, slotId: string, itemId: string, updates: Partial<DayPlanItem>) => void
  deleteDayPlanItem: (tripId: string, dayId: string, slotId: string, itemId: string) => void
  reorderDayPlanItems: (tripId: string, dayId: string, slotId: string, items: DayPlanItem[]) => void
  moveDayPlanItem: (tripId: string, dayId: string, fromSlotId: string, toSlotId: string, item: DayPlanItem) => void
  reorderDayPlanSlots: (tripId: string, dayId: string, slots: DayPlanSlot[]) => void

  setSlides: (tripId: string, slides: Slide[]) => void
  updateSlide: (tripId: string, slideId: string, updates: Partial<Slide>) => void
  addBlankSlide: (tripId: string) => void
  deleteSlide: (tripId: string, slideId: string) => void

  loadTemplate: (name: 'gartner-srm-2026') => string
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => {
      /** Applies `fn` to one trip and writes the result back. */
      const patch = (tripId: string, fn: (trip: Trip) => Trip) =>
        set((state) => ({
          trips: state.trips.map((t) => (t.id === tripId ? touch(fn(t)) : t)),
        }))

      const patchSightDay = (
        tripId: string,
        date: string,
        fn: (places: SightseeingPlace[]) => SightseeingPlace[],
      ) =>
        patch(tripId, (t) => ({
          ...t,
          sightseeing: {
            ...t.sightseeing,
            days: t.sightseeing.days.map((d) =>
              d.date === date ? { ...d, places: fn(d.places) } : d,
            ),
          },
        }))

      const patchFoodDay = (
        tripId: string,
        date: string,
        fn: (meals: Restaurant[]) => Restaurant[],
      ) =>
        patch(tripId, (t) => ({
          ...t,
          restaurants: {
            ...t.restaurants,
            days: t.restaurants.days.map((d) =>
              d.date === date ? { ...d, meals: fn(d.meals) } : d,
            ),
          },
        }))

      const patchSection = (
        tripId: string,
        sectionId: string,
        fn: (section: PackingSection) => PackingSection,
      ) =>
        patch(tripId, (t) => ({
          ...t,
          packing: {
            sections: t.packing.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
          },
        }))

      return {
        trips: [],
        activeTripId: null,
        activeTab: 'overview',

        /* ---------------- Trips ---------------- */

        createTrip: (basics) => {
          const id = uid()
          const now = new Date().toISOString()
          const merged: TripBasics = { ...emptyBasics(), ...basics }
          const code = 'USD'
          const trip: Trip = reconcileDays({
            id,
            basics: merged,
            flights: [],
            hotel: { name: '', address: '', checkIn: '', checkOut: '', confirmationNo: '' },
            currency: { code, symbol: CURRENCIES[code], inrRate: DEFAULT_RATES[code] },
            sightseeing: { totalBudget: 0, days: [] },
            sessions: [],
            insights: [],
            restaurants: { totalBudget: 0, days: [] },
            packing: { sections: defaultPackingSections() },
            dayPlan: { days: [] },
            slides: [],
            createdAt: now,
            updatedAt: now,
          })
          set((state) => ({ trips: [trip, ...state.trips] }))
          return id
        },

        updateTrip: (id, updates) => patch(id, (t) => ({ ...t, ...updates })),

        updateBasics: (id, updates) =>
          patch(id, (t) => ({ ...t, basics: { ...t.basics, ...updates } })),

        deleteTrip: (id) =>
          set((state) => ({
            trips: state.trips.filter((t) => t.id !== id),
            activeTripId: state.activeTripId === id ? null : state.activeTripId,
          })),

        setActiveTrip: (id) => set({ activeTripId: id, activeTab: id ? 'overview' : 'overview' }),
        setActiveTab: (tab) => set({ activeTab: tab }),

        /* ---------------- Flights & hotel ---------------- */

        addFlight: (tripId, flight) =>
          patch(tripId, (t) => ({ ...t, flights: [...t.flights, { ...flight, id: uid() }] })),

        updateFlight: (tripId, flightId, updates) =>
          patch(tripId, (t) => ({
            ...t,
            flights: t.flights.map((f) => (f.id === flightId ? { ...f, ...updates } : f)),
          })),

        deleteFlight: (tripId, flightId) =>
          patch(tripId, (t) => ({ ...t, flights: t.flights.filter((f) => f.id !== flightId) })),

        updateHotel: (tripId, updates) =>
          patch(tripId, (t) => ({ ...t, hotel: { ...t.hotel, ...updates } })),

        updateCurrency: (tripId, updates) =>
          patch(tripId, (t) => ({ ...t, currency: { ...t.currency, ...updates } })),

        /* ---------------- Sightseeing ---------------- */

        setSightseeingBudget: (tripId, total) =>
          patch(tripId, (t) => ({ ...t, sightseeing: { ...t.sightseeing, totalBudget: total } })),

        addSightseeingDay: (tripId, date) =>
          patch(tripId, (t) =>
            t.sightseeing.days.some((d) => d.date === date)
              ? t
              : {
                  ...t,
                  sightseeing: {
                    ...t.sightseeing,
                    days: [...t.sightseeing.days, { date, cabBudget: 0, places: [] }].sort((a, b) =>
                      a.date.localeCompare(b.date),
                    ),
                  },
                },
          ),

        updateCabBudget: (tripId, date, budget) =>
          patch(tripId, (t) => ({
            ...t,
            sightseeing: {
              ...t.sightseeing,
              days: t.sightseeing.days.map((d) =>
                d.date === date ? { ...d, cabBudget: budget } : d,
              ),
            },
          })),

        addPlace: (tripId, date, place) =>
          patchSightDay(tripId, date, (places) => [...places, { ...place, id: uid() }]),

        updatePlace: (tripId, date, placeId, updates) =>
          patchSightDay(tripId, date, (places) =>
            places.map((p) => (p.id === placeId ? { ...p, ...updates } : p)),
          ),

        deletePlace: (tripId, date, placeId) =>
          patchSightDay(tripId, date, (places) => places.filter((p) => p.id !== placeId)),

        toggleVisited: (tripId, date, placeId) =>
          patchSightDay(tripId, date, (places) =>
            places.map((p) => (p.id === placeId ? { ...p, visited: !p.visited } : p)),
          ),

        sortPlacesByDistance: (tripId, date) =>
          patchSightDay(tripId, date, (places) =>
            [...places].sort((a, b) => a.distanceKm - b.distanceKm),
          ),

        /* ---------------- Sessions ---------------- */

        addSession: (tripId, session) =>
          patch(tripId, (t) => ({ ...t, sessions: [...t.sessions, { ...session, id: uid() }] })),

        updateSession: (tripId, sessionId, updates) =>
          patch(tripId, (t) => ({
            ...t,
            sessions: t.sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
          })),

        deleteSession: (tripId, sessionId) =>
          patch(tripId, (t) => ({
            ...t,
            sessions: t.sessions.filter((s) => s.id !== sessionId),
            // Insights keep their text but lose the dangling session reference.
            insights: t.insights.map((i) =>
              i.sessionId === sessionId ? { ...i, sessionId: '' } : i,
            ),
          })),

        /* ---------------- Insights ---------------- */

        addInsight: (tripId, insight) =>
          patch(tripId, (t) => ({
            ...t,
            insights: [
              ...t.insights,
              {
                ...insight,
                id: uid(),
                timestamp: new Date().toISOString(),
                priority: t.insights.length,
              },
            ],
          })),

        updateInsight: (tripId, insightId, updates) =>
          patch(tripId, (t) => ({
            ...t,
            insights: t.insights.map((i) => (i.id === insightId ? { ...i, ...updates } : i)),
          })),

        deleteInsight: (tripId, insightId) =>
          patch(tripId, (t) => ({
            ...t,
            insights: t.insights.filter((i) => i.id !== insightId),
            slides: t.slides.filter((s) => s.insightId !== insightId),
          })),

        toggleStarred: (tripId, insightId) =>
          patch(tripId, (t) => ({
            ...t,
            insights: t.insights.map((i) =>
              i.id === insightId ? { ...i, starred: !i.starred } : i,
            ),
          })),

        reorderInsights: (tripId, orderedIds) =>
          patch(tripId, (t) => ({
            ...t,
            insights: t.insights.map((i) => {
              const idx = orderedIds.indexOf(i.id)
              return idx === -1 ? i : { ...i, priority: idx }
            }),
          })),

        /* ---------------- Food ---------------- */

        setFoodBudget: (tripId, total) =>
          patch(tripId, (t) => ({ ...t, restaurants: { ...t.restaurants, totalBudget: total } })),

        addRestaurantDay: (tripId, date) =>
          patch(tripId, (t) =>
            t.restaurants.days.some((d) => d.date === date)
              ? t
              : {
                  ...t,
                  restaurants: {
                    ...t.restaurants,
                    days: [...t.restaurants.days, { date, dailyBudget: 0, meals: [] }].sort((a, b) =>
                      a.date.localeCompare(b.date),
                    ),
                  },
                },
          ),

        updateDailyFoodBudget: (tripId, date, budget) =>
          patch(tripId, (t) => ({
            ...t,
            restaurants: {
              ...t.restaurants,
              days: t.restaurants.days.map((d) =>
                d.date === date ? { ...d, dailyBudget: budget } : d,
              ),
            },
          })),

        addRestaurant: (tripId, date, restaurant) =>
          patchFoodDay(tripId, date, (meals) => [...meals, { ...restaurant, id: uid() }]),

        updateRestaurant: (tripId, date, restaurantId, updates) =>
          patchFoodDay(tripId, date, (meals) =>
            meals.map((m) => (m.id === restaurantId ? { ...m, ...updates } : m)),
          ),

        deleteRestaurant: (tripId, date, restaurantId) =>
          patchFoodDay(tripId, date, (meals) => meals.filter((m) => m.id !== restaurantId)),

        /* ---------------- Packing ---------------- */

        addPackingSection: (tripId, name) =>
          patch(tripId, (t) => ({
            ...t,
            packing: { sections: [...t.packing.sections, { id: uid(), name, items: [] }] },
          })),

        updatePackingSection: (tripId, sectionId, updates) =>
          patchSection(tripId, sectionId, (s) => ({ ...s, ...updates })),

        deletePackingSection: (tripId, sectionId) =>
          patch(tripId, (t) => ({
            ...t,
            packing: { sections: t.packing.sections.filter((s) => s.id !== sectionId) },
          })),

        addPackingItem: (tripId, sectionId, label, note = '', qty = 1, additionalQty) =>
          patchSection(tripId, sectionId, (s) => ({
            ...s,
            items: [...s.items, { id: uid(), label, note, packed: false, qty, additionalQty }],
          })),

        updatePackingItem: (tripId, sectionId, itemId, updates) =>
          patchSection(tripId, sectionId, (s) => ({
            ...s,
            items: s.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
          })),

        togglePackingItem: (tripId, sectionId, itemId) =>
          patchSection(tripId, sectionId, (s) => ({
            ...s,
            items: s.items.map((i) => (i.id === itemId ? { ...i, packed: !i.packed } : i)),
          })),

        deletePackingItem: (tripId, sectionId, itemId) =>
          patchSection(tripId, sectionId, (s) => ({
            ...s,
            items: s.items.filter((i) => i.id !== itemId),
          })),

        setAllPacked: (tripId, packed) =>
          patch(tripId, (t) => ({
            ...t,
            packing: {
              sections: t.packing.sections.map((s) => ({
                ...s,
                items: s.items.map((i) => ({ ...i, packed })),
              })),
            },
          })),

        importPacking: (tripId, sections) =>
          patch(tripId, (t) => ({ ...t, packing: { sections } })),

        reorderPackingSections: (tripId, sections) =>
          patch(tripId, (t) => ({ ...t, packing: { sections } })),

        reorderPackingItems: (tripId, sectionId, items) =>
          patchSection(tripId, sectionId, (s) => ({ ...s, items })),

        /* ---------------- Day Plan ---------------- */

        initDayPlan: (tripId) =>
          patch(tripId, (t) => {
            if (t.dayPlan?.days?.length) return t
            const dates = dateRange(t.basics.startDate, t.basics.endDate)
            const days: DayPlanDay[] = dates.map((date, i) => ({
              id: uid(),
              date,
              label: `Day ${i + 1}`,
              slots: [],
            }))
            return { ...t, dayPlan: { days } }
          }),

        addDayPlanDay: (tripId, date, label) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: { days: [...(t.dayPlan?.days ?? []), { id: uid(), date, label, slots: [] }] },
          })),

        deleteDayPlanDay: (tripId, dayId) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: { days: t.dayPlan.days.filter((d) => d.id !== dayId) },
          })),

        addDayPlanSlot: (tripId, dayId, time, location) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) =>
                d.id === dayId
                  ? { ...d, slots: [...d.slots, { id: uid(), time, location, items: [] }] }
                  : d,
              ),
            },
          })),

        updateDayPlanSlot: (tripId, dayId, slotId, updates) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) =>
                d.id === dayId
                  ? { ...d, slots: d.slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)) }
                  : d,
              ),
            },
          })),

        deleteDayPlanSlot: (tripId, dayId, slotId) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) =>
                d.id === dayId ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) } : d,
              ),
            },
          })),

        addDayPlanItem: (tripId, dayId, slotId, label, qty = 1) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      slots: d.slots.map((s) =>
                        s.id === slotId
                          ? { ...s, items: [...s.items, { id: uid(), label, qty }] }
                          : s,
                      ),
                    }
                  : d,
              ),
            },
          })),

        updateDayPlanItem: (tripId, dayId, slotId, itemId, updates) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      slots: d.slots.map((s) =>
                        s.id === slotId
                          ? {
                              ...s,
                              items: s.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
                            }
                          : s,
                      ),
                    }
                  : d,
              ),
            },
          })),

        deleteDayPlanItem: (tripId, dayId, slotId, itemId) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      slots: d.slots.map((s) =>
                        s.id === slotId
                          ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
                          : s,
                      ),
                    }
                  : d,
              ),
            },
          })),

        reorderDayPlanItems: (tripId, dayId, slotId, items) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) =>
                d.id === dayId
                  ? { ...d, slots: d.slots.map((s) => (s.id === slotId ? { ...s, items } : s)) }
                  : d,
              ),
            },
          })),

        moveDayPlanItem: (tripId, dayId, fromSlotId, toSlotId, item) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      slots: d.slots.map((s) => {
                        if (s.id === fromSlotId) return { ...s, items: s.items.filter((i) => i.id !== item.id) }
                        if (s.id === toSlotId) return { ...s, items: [...s.items, { ...item, id: uid() }] }
                        return s
                      }),
                    }
                  : d,
              ),
            },
          })),

        reorderDayPlanSlots: (tripId, dayId, slots) =>
          patch(tripId, (t) => ({
            ...t,
            dayPlan: {
              days: t.dayPlan.days.map((d) => (d.id === dayId ? { ...d, slots } : d)),
            },
          })),

        generateDefaultPacking: (country) => {
          const tripId = get().activeTripId
          if (!tripId) return
          patch(tripId, (t) => {
            const kit = buildPackingKit(country, monthOf(t.basics.startDate))

            // Preserve packed state across regeneration, matched on label.
            const packedLabels = new Set(
              t.packing.sections.flatMap((s) =>
                s.items.filter((i) => i.packed).map((i) => i.label.trim().toLowerCase()),
              ),
            )

            const existing = new Map(t.packing.sections.map((s) => [s.name, s]))
            const defaults = DEFAULT_SECTION_NAMES.map((name) => {
              const items = kit
                .filter((k) => k.section === name)
                .map((k) => ({
                  id: uid(),
                  label: k.label,
                  note: k.note ?? '',
                  packed: packedLabels.has(k.label.trim().toLowerCase()),
                }))
              return { id: existing.get(name)?.id ?? uid(), name, items }
            })

            // Custom sections the user added themselves are left untouched.
            const custom = t.packing.sections.filter(
              (s) => !DEFAULT_SECTION_NAMES.includes(s.name as never),
            )
            return { ...t, packing: { sections: [...defaults, ...custom] } }
          })
        },

        /* ---------------- Slides ---------------- */

        setSlides: (tripId, slides) => patch(tripId, (t) => ({ ...t, slides })),

        updateSlide: (tripId, slideId, updates) =>
          patch(tripId, (t) => ({
            ...t,
            slides: t.slides.map((s) => (s.id === slideId ? { ...s, ...updates } : s)),
          })),

        addBlankSlide: (tripId) =>
          patch(tripId, (t) => ({
            ...t,
            slides: [
              ...t.slides,
              { id: uid(), kind: 'blank', title: 'New slide', subtitle: '', body: '' },
            ],
          })),

        deleteSlide: (tripId, slideId) =>
          patch(tripId, (t) => ({ ...t, slides: t.slides.filter((s) => s.id !== slideId) })),

        loadTemplate: (_name) => {
          const template = buildGartnerTrip()
          const existing = get().trips.find(
            (t) => t.basics.eventName === template.basics.eventName,
          )
          if (existing) {
            patch(existing.id, (t) => ({
              ...t,
              basics: {
                ...t.basics,
                startDate: template.basics.startDate,
                endDate: template.basics.endDate,
              },
              flights: template.flights,
              hotel: {
                ...t.hotel,
                name: t.hotel.name || template.hotel.name,
                address: t.hotel.address || template.hotel.address,
                checkIn: template.hotel.checkIn,
                checkOut: template.hotel.checkOut,
              },
              // Replace sightseeing only if user hasn't changed the day dates
              sightseeing: (() => {
                const existingDates = new Set(t.sightseeing.days.map((d) => d.date))
                const templateDates = new Set(template.sightseeing.days.map((d) => d.date))
                const datesChanged = [...templateDates].some((d) => !existingDates.has(d))
                return datesChanged ? template.sightseeing : t.sightseeing
              })(),
              // Replace restaurants only if all existing days are empty
              restaurants: (() => {
                const hasUserMeals = t.restaurants.days.some((d) => d.meals.length > 0)
                return hasUserMeals ? t.restaurants : template.restaurants
              })(),
            }))
            return existing.id
          }
          const trip = reconcileDays(template)
          set((state) => ({ trips: [trip, ...state.trips] }))
          return trip.id
        },
      }
    },
    {
      name: 'tripmind-store',
      version: 2,
      migrate: (persisted: unknown, fromVersion: number) => {
        const state = persisted as { trips?: Trip[] }
        if (fromVersion < 2 && Array.isArray(state.trips)) {
          state.trips = state.trips.map((t) =>
            t.dayPlan ? t : { ...t, dayPlan: { days: [] } },
          )
        }
        return state
      },
    },
  ),
)

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export const useActiveTrip = (): Trip | null =>
  useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId) ?? null)

/** Non-reactive read — for event handlers that need the latest trip. */
export const getActiveTrip = (): Trip | null => {
  const s = useTripStore.getState()
  return s.trips.find((t) => t.id === s.activeTripId) ?? null
}
