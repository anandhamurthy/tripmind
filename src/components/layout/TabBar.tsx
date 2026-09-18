import { motion } from 'framer-motion'
import {
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Luggage,
  MapPin,
  Monitor,
  Target,
  UtensilsCrossed,
} from 'lucide-react'
import { useTripStore } from '../../store/useTripStore'

export const TABS = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'setup', label: 'Setup', Icon: ClipboardList },
  { id: 'sessions', label: 'Sessions', Icon: CalendarDays },
  { id: 'sightseeing', label: 'Sightseeing', Icon: MapPin },
  { id: 'business', label: 'Business', Icon: Briefcase },
  { id: 'presentation', label: 'Presentation', Icon: Monitor },
  { id: 'food', label: 'Food', Icon: UtensilsCrossed },
  { id: 'packing', label: 'Packing', Icon: Luggage },
  { id: 'exhibitors', label: 'Exhibitors', Icon: Building2 },
  { id: 'competitive', label: 'Competitive', Icon: Target },
  { id: 'summary', label: 'Summary', Icon: FileText },
] as const

export default function TabBar() {
  const activeTab = useTripStore((s) => s.activeTab)
  const setActiveTab = useTripStore((s) => s.setActiveTab)

  return (
    <nav
      aria-label="Trip sections"
      className="no-print border-b border-border bg-surface/85 backdrop-blur"
    >
      <div className="no-scrollbar mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 tablet:px-6">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={active ? 'page' : undefined}
              className={[
                'relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-3',
                'font-sans text-[13.5px] font-medium transition-colors duration-200',
                active ? 'text-primary' : 'text-text-secondary hover:text-text-primary',
              ].join(' ')}
            >
              <Icon size={16} strokeWidth={active ? 2.3 : 2} />
              {label}
              {active && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-2 -bottom-px h-[2.5px] rounded-pill bg-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
