import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white border border-primary hover:bg-[#22449f] hover:border-[#22449f] shadow-sm hover:shadow-md',
  secondary:
    'bg-surface text-text-primary border border-border hover:border-primary hover:text-primary hover:bg-primary-light/50',
  ghost:
    'bg-transparent text-text-secondary border border-transparent hover:bg-black/[0.04] hover:text-text-primary',
  danger: 'bg-surface text-danger border border-danger/40 hover:bg-danger hover:text-white hover:border-danger',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-[13px] px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-[15px] px-5 py-2.5 gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-control font-sans font-medium',
        'transition-all duration-200 active:scale-[0.98] select-none',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
