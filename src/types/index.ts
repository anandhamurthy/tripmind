export type TripPurpose = 'business' | 'leisure' | 'both'

export interface TripBasics {
  eventName: string
  location: string
  country: string
  startDate: string
  endDate: string
  purpose: TripPurpose
  distanceAirportToHotel: number
  distanceHotelToVenue: number
  travelTimeAirportToHotel: number
  travelTimeHotelToVenue: number
}

export type FlightType = 'outbound' | 'return' | 'connection'

export interface Flight {
  id: string
  airline: string
  flightNo: string
  depAirport: string
  arrAirport: string
  depDateTime: string
  arrDateTime: string
  seat: string
  bookingRef: string
  type: FlightType
}

export interface Hotel {
  name: string
  address: string
  checkIn: string
  checkOut: string
  confirmationNo: string
}

export interface CurrencyConfig {
  code: string
  symbol: string
  inrRate: number
}

export type PlaceCategory =
  | 'Museum'
  | 'Landmark'
  | 'Market'
  | 'Nature'
  | 'Restaurant'
  | 'Shopping'
  | 'Other'

export interface SightseeingPlace {
  id: string
  name: string
  category: PlaceCategory
  distanceKm: number
  travelMin: number
  distanceFromVenueKm?: number
  travelFromVenueMin?: number
  tubeRoute?: string
  entryFee: number
  hours: string
  notes: string
  visited: boolean
  bookingUrl?: string   // ticket booking or official website
}

export interface SightseeingDay {
  date: string
  cabBudget: number
  places: SightseeingPlace[]
}

export interface SightseeingData {
  totalBudget: number
  days: SightseeingDay[]
}

export interface Session {
  id: string
  title: string
  track: string
  speaker: string
  startTime: string
  endTime: string
  room: string
  description: string
  mustAttend: boolean
  notes: string
  day: string
}

export type InsightCategory = 'Strategy' | 'Technology' | 'People' | 'Risk' | 'Innovation'

export interface Insight {
  id: string
  title: string
  body: string
  category: InsightCategory
  sessionId: string
  timestamp: string
  starred: boolean
  priority: number
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  meal: MealType
  distanceKm: number
  distanceFromVenueKm?: number
  costLocal: number
  rating: number
  hours: string
  address: string
  notes: string
  visited: boolean
}

export interface RestaurantDay {
  date: string
  dailyBudget: number
  meals: Restaurant[]
}

export interface RestaurantData {
  totalBudget: number
  days: RestaurantDay[]
}

export interface PackingItem {
  id: string
  label: string
  note: string
  packed: boolean
  qty?: number
  additionalQty?: number
  owned?: boolean   // true = already own, false = need to purchase, undefined = not set
}

export interface PackingSection {
  id: string
  name: string
  items: PackingItem[]
}

export interface PackingData {
  sections: PackingSection[]
}

export interface Slide {
  id: string
  kind: 'cover' | 'insight' | 'summary' | 'blank'
  insightId?: string
  title: string
  subtitle: string
  body: string
  imageDataUrl?: string
}

/* ── Day Plan ── */

export interface DayPlanItem {
  id: string
  label: string
  qty: number
}

export interface DayPlanSlot {
  id: string
  time: string      // e.g. "Morning", "Afternoon", "Evening", "Night"
  location: string  // e.g. "Chennai Airport", "Hotel Premier Inn"
  items: DayPlanItem[]
}

export interface DayPlanDay {
  id: string
  date: string   // ISO date
  label: string  // "Day 1", "Day 2", …
  slots: DayPlanSlot[]
}

export interface DayPlan {
  days: DayPlanDay[]
}

/* ── Exhibitors ── */

export type ExhibitorCategory =
  | 'SIEM & SOC'
  | 'Endpoint & XDR'
  | 'Identity & Access'
  | 'Cloud Security'
  | 'Network Security'
  | 'GRC & Risk'
  | 'Threat Intelligence'
  | 'Data Security'
  | 'Other'

export interface Exhibitor {
  id: string
  name: string
  category: ExhibitorCategory
  description: string
  website: string
  boothNumber?: string
  visited: boolean
  interested: boolean
  notes: string
}

export interface ExhibitorsData {
  exhibitors: Exhibitor[]
}

export interface Trip {
  id: string
  basics: TripBasics
  flights: Flight[]
  hotel: Hotel
  currency: CurrencyConfig
  sightseeing: SightseeingData
  sessions: Session[]
  insights: Insight[]
  restaurants: RestaurantData
  packing: PackingData
  dayPlan: DayPlan
  exhibitors: ExhibitorsData
  slides: Slide[]
  createdAt: string
  updatedAt: string
}

export type TripStatus = 'Upcoming' | 'Active' | 'Completed'
