import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padded?: boolean
  children: ReactNode
}

export default function Card({
  hoverable = false,
  padded = true,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={[
        'bg-surface border border-border rounded-card shadow-card transition-all duration-200',
        padded ? 'p-4' : '',
        hoverable ? 'hover:shadow-card-hover hover:border-text-secondary/25' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

/** Section wrapper used across the tabs: serif title, optional action, 24px rhythm. */
export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`bg-surface border border-border rounded-card shadow-card print-block ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-[19px] font-semibold leading-tight text-text-primary">
            {title}
          </h2>
          {description && (
            <p className="mt-1 font-sans text-[13px] text-text-secondary">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}
