import type { ReactNode } from 'react'
import { formatDayLabel } from '../../lib/date'

interface DayColumnProps {
  /** 1-based day number within the trip. */
  index: number
  date: string
  /** Right-hand controls: budget input, sort, add buttons. */
  actions?: ReactNode
  /** Summary line under the heading, e.g. spend for the day. */
  meta?: ReactNode
  children: ReactNode
}

/**
 * One day's section, shared by the Sightseeing and Food tabs so both
 * render identical "Day 1 — Mon 22 Sep" headers off the trip's date range.
 */
export default function DayColumn({ index, date, actions, meta, children }: DayColumnProps) {
  return (
    <section className="rounded-card border border-border bg-surface shadow-card print-block">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-baseline gap-3">
          <h3 className="font-serif text-[17px] font-semibold text-text-primary">
            Day {index}
            <span className="mx-2 font-sans text-[15px] font-normal text-text-secondary">—</span>
            <span className="font-sans text-[14px] font-medium text-text-secondary">
              {formatDayLabel(date)}
            </span>
          </h3>
          {meta}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}
