import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type BaseProps = {
  label?: string
  error?: string
  hint?: string
  prefix?: string
  suffix?: string
  serif?: boolean
  containerClassName?: string
}

type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
    variant?: 'text' | 'number' | 'date' | 'time' | 'datetime-local'
  }

type TextareaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'prefix'> & { variant: 'textarea' }

const fieldBase = [
  'w-full bg-surface text-text-primary rounded-control border',
  'font-sans text-sm placeholder:text-text-secondary/55',
  'transition-all duration-200 outline-none',
  'px-3 py-2',
].join(' ')

const stateClasses = (hasError: boolean) =>
  hasError
    ? 'border-danger focus:border-danger focus:ring-[3px] focus:ring-danger/15'
    : 'border-border hover:border-text-secondary/40 focus:border-primary focus:ring-[3px] focus:ring-primary/15'

function Label({ label, htmlFor }: { label?: string; htmlFor?: string }) {
  if (!label) return null
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary"
    >
      {label}
    </label>
  )
}

function Footnote({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <p className="mt-1.5 font-sans text-[12px] text-danger">{error}</p>
  if (hint) return <p className="mt-1.5 font-sans text-[12px] text-text-secondary">{hint}</p>
  return null
}

export default function Input(props: InputProps | TextareaProps) {
  if (props.variant === 'textarea') {
    const {
      label,
      error,
      hint,
      serif,
      containerClassName = '',
      className = '',
      // `variant`, `prefix` and `suffix` are not valid on a <textarea>.
      variant: _variant,
      prefix: _prefix,
      suffix: _suffix,
      ...rest
    } = props

    return (
      <div className={containerClassName}>
        <Label label={label} htmlFor={rest.id} />
        <textarea
          {...rest}
          className={[
            fieldBase,
            stateClasses(Boolean(error)),
            serif ? 'font-serif' : '',
            'resize-y leading-relaxed',
            className,
          ].join(' ')}
        />
        <Footnote error={error} hint={hint} />
      </div>
    )
  }

  const {
    label,
    error,
    hint,
    prefix,
    suffix,
    serif,
    containerClassName = '',
    className = '',
    variant = 'text',
    ...rest
  } = props

  return (
    <div className={containerClassName}>
      <Label label={label} htmlFor={rest.id} />
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-text-secondary">
            {prefix}
          </span>
        )}
        <input
          {...rest}
          type={variant}
          className={[
            fieldBase,
            stateClasses(Boolean(error)),
            serif ? 'font-serif' : '',
            prefix ? 'pl-9' : '',
            suffix ? 'pr-12' : '',
            className,
          ].join(' ')}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[12px] text-text-secondary">
            {suffix}
          </span>
        )}
      </div>
      <Footnote error={error} hint={hint} />
    </div>
  )
}
