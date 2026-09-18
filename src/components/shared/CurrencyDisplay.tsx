import { toINR } from '../../store/useTripStore'

interface CurrencyDisplayProps {
  amount: number
  currencySymbol: string
  currencyCode?: string
  inrRate: number
  size?: 'sm' | 'md' | 'lg'
  /** Show the ISO code ("USD 45") instead of the symbol ("$ 45"). */
  useCode?: boolean
  className?: string
}

const SIZES = {
  sm: { local: 'text-[13px]', inr: 'text-[11.5px]' },
  md: { local: 'text-[15px]', inr: 'text-[12.5px]' },
  lg: { local: 'text-[20px]', inr: 'text-[13px]' },
}

/** Renders "USD 45 / ₹3,780" — local amount in a heavier weight, INR muted. */
export default function CurrencyDisplay({
  amount,
  currencySymbol,
  currencyCode,
  inrRate,
  size = 'sm',
  useCode = true,
  className = '',
}: CurrencyDisplayProps) {
  const s = SIZES[size]
  const unit = useCode && currencyCode ? currencyCode : currencySymbol
  const local = (Number(amount) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })

  return (
    <span className={`inline-flex items-baseline gap-1.5 font-sans ${className}`}>
      <span className={`${s.local} font-semibold text-text-primary`}>
        {unit} {local}
      </span>
      <span className={`${s.inr} text-text-secondary`}>/ ₹{toINR(amount, inrRate)}</span>
    </span>
  )
}
