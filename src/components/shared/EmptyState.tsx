import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  heading: string
  subtext: string
  action?: ReactNode
  compact?: boolean
  icon?: ReactNode
}

/** Neutral line-art placeholder — a folded map with a route across it. */
function MapDoodle() {
  return (
    <svg width="112" height="80" viewBox="0 0 112 80" fill="none" aria-hidden="true">
      <path
        d="M4 16 36 6l40 10 32-10v58L76 74 36 64 4 74V16Z"
        fill="#FFFFFF"
        stroke="#E4E2DE"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M36 6v58M76 16v58" stroke="#E4E2DE" strokeWidth="2" strokeDasharray="4 4" />
      <path
        d="M20 56c10-4 8-16 18-19s14 6 24 1 10-18 22-19"
        stroke="#2A52BE"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="5 5"
        opacity="0.85"
      />
      <circle cx="20" cy="56" r="4" fill="#2A52BE" />
      <circle cx="84" cy="19" r="4" fill="#E8A838" />
    </svg>
  )
}

export default function EmptyState({
  heading,
  subtext,
  action,
  compact = false,
  icon,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={[
        'flex flex-col items-center justify-center rounded-card border border-dashed border-border',
        'bg-surface/60 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
      ].join(' ')}
    >
      <div className="mb-4 opacity-95">{icon ?? <MapDoodle />}</div>
      <h3 className="font-serif text-[18px] font-semibold text-text-primary">{heading}</h3>
      <p className="mt-1.5 max-w-sm font-sans text-[13.5px] leading-relaxed text-text-secondary">
        {subtext}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
