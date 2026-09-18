import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, MapPin, Pencil } from 'lucide-react'
import type { Trip, TripStatus } from '../../types'
import { tripStatus, useTripStore } from '../../store/useTripStore'
import { formatDateSpan } from '../../lib/date'
import Badge, { type BadgeTone } from '../shared/Badge'
import ConfirmInline from '../shared/ConfirmInline'

const STATUS_TONE: Record<TripStatus, BadgeTone> = {
  Upcoming: 'primary',
  Active: 'success',
  Completed: 'neutral',
}

const PURPOSE_LABEL = {
  business: 'Business',
  leisure: 'Leisure',
  both: 'Both',
} as const

export default function TripCard({ trip, onEdit }: { trip: Trip; onEdit: (trip: Trip) => void }) {
  const setActiveTrip = useTripStore((s) => s.setActiveTrip)
  const deleteTrip = useTripStore((s) => s.deleteTrip)

  const status = tripStatus(trip)
  const open = () => setActiveTrip(trip.id)

  const starredCount = trip.insights.filter((i) => i.starred).length
  const placeCount = trip.sightseeing.days.reduce((n, d) => n + d.places.length, 0)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      className={[
        'group cursor-pointer rounded-card border border-border bg-surface p-5 shadow-card',
        'transition-all duration-200 hover:scale-[1.01] hover:shadow-card-hover',
        'hover:border-primary/25 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25',
      ].join(' ')}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={STATUS_TONE[status]}>{status}</Badge>
          <Badge tone="neutral">{PURPOSE_LABEL[trip.basics.purpose]}</Badge>
        </div>
      </div>

      <h3 className="font-serif text-[20px] font-semibold leading-snug text-text-primary transition-colors duration-200 group-hover:text-primary">
        {trip.basics.eventName || 'Untitled trip'}
      </h3>

      <div className="mt-2.5 space-y-1.5 font-sans text-[13px] text-text-secondary">
        <p className="flex items-center gap-1.5">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">
            {trip.basics.location || 'No destination'}
            {trip.basics.country && `, ${trip.basics.country}`}
          </span>
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarDays size={13} className="shrink-0" />
          {formatDateSpan(trip.basics.startDate, trip.basics.endDate)}
        </p>
      </div>

      <div className="mt-4 flex gap-4 border-t border-border pt-3 font-sans text-[11.5px] uppercase tracking-[0.05em] text-text-secondary">
        <span>
          <strong className="font-semibold text-text-primary">{trip.sessions.length}</strong> sessions
        </span>
        <span>
          <strong className="font-semibold text-text-primary">{placeCount}</strong> places
        </span>
        <span>
          <strong className="font-semibold text-text-primary">{starredCount}</strong> starred
        </span>
      </div>

      <div
        className="mt-3 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(trip)}
            aria-label="Edit trip details"
            title="Edit trip details"
            className="rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-primary-light hover:text-primary"
          >
            <Pencil size={14} />
          </button>
          <ConfirmInline onConfirm={() => deleteTrip(trip.id)} triggerLabel="Delete trip" />
        </div>

        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 font-sans text-[13px] font-medium text-primary transition-all duration-200 hover:gap-2.5 hover:bg-primary-light"
        >
          Open
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.article>
  )
}
