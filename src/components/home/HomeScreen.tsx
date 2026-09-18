import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Plus, Search } from 'lucide-react'
import type { Trip, TripStatus } from '../../types'
import { tripStatus, useTripStore } from '../../store/useTripStore'
import TripCard from './TripCard'
import NewTripModal from './NewTripModal'
import Button from '../shared/Button'
import EmptyState from '../shared/EmptyState'

const FILTERS = ['All', 'Upcoming', 'Active', 'Completed'] as const
type Filter = (typeof FILTERS)[number]

export default function HomeScreen() {
  const trips = useTripStore((s) => s.trips)
  const loadTemplate = useTripStore((s) => s.loadTemplate)
  const setActiveTrip = useTripStore((s) => s.setActiveTrip)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Trip | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  const handleLoadTemplate = () => {
    setLoadingTemplate(true)
    const id = loadTemplate('gartner-srm-2026')
    setActiveTrip(id)
    setLoadingTemplate(false)
  }

  const counts = useMemo(() => {
    const base: Record<TripStatus, number> = { Upcoming: 0, Active: 0, Completed: 0 }
    trips.forEach((t) => {
      base[tripStatus(t)] += 1
    })
    return base
  }, [trips])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return trips.filter((t) => {
      if (filter !== 'All' && tripStatus(t) !== filter) return false
      if (!q) return true
      return [t.basics.eventName, t.basics.location, t.basics.country]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [trips, query, filter])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (trip: Trip) => {
    setEditing(trip)
    setModalOpen(true)
  }

  return (
    <div className="hero-wash min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-12 tablet:px-8 tablet:py-16">
        <header className="mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="font-serif text-[42px] font-semibold leading-none tracking-tight text-primary tablet:text-[56px]"
          >
            TripMind
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="mt-3 max-w-xl font-sans text-[15px] leading-relaxed text-text-secondary tablet:text-[16px]"
          >
            Your smart business travel companion. Plan the flights, run the conference, capture what
            matters — and walk out with the deck already written.
          </motion.p>

          {trips.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                icon={<Download size={15} />}
                onClick={handleLoadTemplate}
                loading={loadingTemplate}
              >
                Load Gartner SRM 2026
              </Button>
              <div className="relative flex-1 tablet:max-w-[320px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search trips…"
                  aria-label="Search trips"
                  className="w-full rounded-control border border-border bg-surface py-2 pl-9 pr-3 font-sans text-sm outline-none transition-all duration-200 placeholder:text-text-secondary/55 hover:border-text-secondary/40 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => {
                  const active = filter === f
                  const count = f === 'All' ? trips.length : counts[f]
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={[
                        'rounded-pill border px-3.5 py-1.5 font-sans text-[12.5px] font-medium',
                        'transition-all duration-200',
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
                      ].join(' ')}
                    >
                      {f}
                      <span className={active ? 'ml-1.5 opacity-70' : 'ml-1.5 opacity-60'}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </header>

        {trips.length === 0 ? (
          <EmptyState
            heading="No trips yet"
            subtext="Create your first trip and TripMind will build out the day columns, packing list and presentation deck as you go."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" icon={<Plus size={17} />} onClick={openCreate}>
                  Plan your first trip
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  icon={<Download size={17} />}
                  onClick={handleLoadTemplate}
                  loading={loadingTemplate}
                >
                  Load Gartner SRM 2026
                </Button>
              </div>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            compact
            heading="Nothing matches that"
            subtext="Try a different search term, or clear the status filter."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setFilter('All')
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-5 tablet:grid-cols-2 desktop:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {visible.map((trip) => (
                <TripCard key={trip.id} trip={trip} onEdit={openEdit} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <motion.button
        type="button"
        onClick={openCreate}
        aria-label="New trip"
        title="New trip"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="fixed bottom-7 right-7 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_24px_rgba(42,82,190,0.38)] transition-colors duration-200 hover:bg-[#22449f]"
      >
        <Plus size={26} />
      </motion.button>

      <NewTripModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
    </div>
  )
}
