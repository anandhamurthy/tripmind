import { motion } from 'framer-motion'

export type ProgressTone = 'primary' | 'success' | 'amber' | 'danger'

const TONES: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  amber: 'bg-amber',
  danger: 'bg-danger',
}

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  hint?: string
  tone?: ProgressTone
  /** 'above' puts the label in a row above the track, 'inside' overlays it. */
  labelPosition?: 'above' | 'inside' | 'none'
  height?: number
  className?: string
}

export default function ProgressBar({
  value,
  max,
  label,
  hint,
  tone = 'primary',
  labelPosition = 'above',
  height = 10,
  className = '',
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 0
  const pct = safeMax === 0 ? 0 : Math.min(100, Math.round((value / safeMax) * 100))

  return (
    <div className={className}>
      {labelPosition === 'above' && (label || hint) && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label && (
            <span className="font-sans text-[13px] font-medium text-text-primary">{label}</span>
          )}
          {hint && <span className="font-sans text-[12px] text-text-secondary">{hint}</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="relative w-full overflow-hidden rounded-pill bg-black/[0.06]"
        style={{ height: labelPosition === 'inside' ? Math.max(height, 22) : height }}
      >
        <motion.div
          className={`h-full rounded-pill ${TONES[tone]}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        />
        {labelPosition === 'inside' && (
          <span className="absolute inset-0 flex items-center justify-center font-sans text-[11.5px] font-semibold text-text-primary mix-blend-luminosity">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
