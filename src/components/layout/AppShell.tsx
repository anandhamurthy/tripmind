import type { ComponentType } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import { formatDateSpan } from '../../lib/date'
import TabBar from './TabBar'
import OverviewTab from '../tabs/OverviewTab'
import OnboardingTab from '../tabs/OnboardingTab'
import SessionsTab from '../tabs/SessionsTab'
import SightseeingTab from '../tabs/SightseeingTab'
import BusinessTab from '../tabs/BusinessTab'
import PresentationTab from '../tabs/PresentationTab'
import FoodTab from '../tabs/FoodTab'
import PackingTab from '../tabs/PackingTab'
import ExhibitorsTab from '../tabs/ExhibitorsTab'
import SummaryTab from '../tabs/SummaryTab'

const TAB_COMPONENTS: Record<string, ComponentType> = {
  overview: OverviewTab,
  setup: OnboardingTab,
  sessions: SessionsTab,
  sightseeing: SightseeingTab,
  business: BusinessTab,
  presentation: PresentationTab,
  food: FoodTab,
  packing: PackingTab,
  exhibitors: ExhibitorsTab,
  summary: SummaryTab,
}

export default function AppShell() {
  const trip = useActiveTrip()
  const activeTab = useTripStore((s) => s.activeTab)
  const setActiveTrip = useTripStore((s) => s.setActiveTrip)

  if (!trip) return null

  const ActiveTab = TAB_COMPONENTS[activeTab] ?? OnboardingTab
  const goHome = () => setActiveTrip(null)

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 tablet:px-6">
          <button
            type="button"
            onClick={goHome}
            aria-label="Back to all trips"
            title="Back to all trips"
            className="rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-black/[0.05] hover:text-primary"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            type="button"
            onClick={goHome}
            className="font-serif text-[19px] font-semibold tracking-tight text-primary transition-opacity duration-200 hover:opacity-75"
          >
            TripMind
          </button>

          <span className="hidden h-5 w-px bg-border tablet:block" aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-[16px] font-semibold leading-tight text-text-primary">
              {trip.basics.eventName || 'Untitled trip'}
            </h1>
            <p className="truncate font-sans text-[12px] text-text-secondary">
              {trip.basics.location || 'Destination not set'}
              <span className="mx-1.5">·</span>
              {formatDateSpan(trip.basics.startDate, trip.basics.endDate)}
            </p>
          </div>
        </div>
      </header>

      <div className="no-print sticky top-[57px] z-20">
        <TabBar />
      </div>

      <main className="mx-auto max-w-[1400px] px-4 py-6 tablet:px-6 tablet:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveTab />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
