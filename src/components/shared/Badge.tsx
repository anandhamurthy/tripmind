import type { ReactNode } from 'react'

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'amber'
  | 'success'
  | 'danger'
  | 'purple'
  | 'strategy'
  | 'technology'
  | 'people'
  | 'risk'
  | 'innovation'
  | 'museum'
  | 'landmark'
  | 'market'
  | 'nature'
  | 'restaurant'
  | 'shopping'
  | 'other'
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-black/[0.05] text-text-secondary border-black/[0.06]',
  primary: 'bg-primary-light text-primary border-primary/20',
  amber: 'bg-amber-light text-[#8A6015] border-amber/30',
  success: 'bg-[#E8F4EE] text-success border-success/25',
  danger: 'bg-[#FBEDEB] text-danger border-danger/25',
  purple: 'bg-[#F3EDFD] text-insight-innovation border-insight-innovation/25',

  strategy: 'bg-primary-light text-insight-strategy border-insight-strategy/25',
  technology: 'bg-amber-light text-[#8A6015] border-insight-tech/35',
  people: 'bg-[#E8F4EE] text-insight-people border-insight-people/25',
  risk: 'bg-[#FBEDEB] text-insight-risk border-insight-risk/25',
  innovation: 'bg-[#F3EDFD] text-insight-innovation border-insight-innovation/25',

  museum: 'bg-[#F3EDFD] text-insight-innovation border-insight-innovation/25',
  landmark: 'bg-primary-light text-primary border-primary/20',
  market: 'bg-amber-light text-[#8A6015] border-amber/30',
  nature: 'bg-[#E8F4EE] text-success border-success/25',
  restaurant: 'bg-[#FBEDEB] text-danger border-danger/25',
  shopping: 'bg-[#FDEDF6] text-[#A3327A] border-[#A3327A]/25',
  other: 'bg-black/[0.05] text-text-secondary border-black/[0.06]',

  breakfast: 'bg-amber-light text-[#8A6015] border-amber/30',
  lunch: 'bg-primary-light text-primary border-primary/20',
  dinner: 'bg-[#F3EDFD] text-insight-innovation border-insight-innovation/25',
  snack: 'bg-[#E8F4EE] text-success border-success/25',
}

const SIZES = {
  sm: 'text-[10.5px] px-2 py-[2px] gap-1',
  md: 'text-[12px] px-2.5 py-[3px] gap-1.5',
}

export const toneFor = (value: string): BadgeTone => {
  const key = value.trim().toLowerCase() as BadgeTone
  return key in TONES ? key : 'neutral'
}

export default function Badge({
  tone = 'neutral',
  size = 'sm',
  icon,
  children,
  className = '',
}: {
  tone?: BadgeTone
  size?: 'sm' | 'md'
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-pill border font-sans font-medium',
        'whitespace-nowrap uppercase tracking-[0.05em] transition-colors duration-200',
        TONES[tone],
        SIZES[size],
        className,
      ].join(' ')}
    >
      {icon}
      {children}
    </span>
  )
}
