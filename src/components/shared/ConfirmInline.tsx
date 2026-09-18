import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface ConfirmInlineProps {
  onConfirm: () => void
  /** Copy shown while confirming. Default: "Delete?" */
  message?: string
  /** Accessible label for the trigger. */
  triggerLabel?: string
  /** Renders text instead of the default icon-only trigger. */
  triggerText?: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Swaps a delete trigger for an inline "Delete? Yes / Cancel" prompt.
 * Used everywhere in place of window.confirm().
 */
export default function ConfirmInline({
  onConfirm,
  message = 'Delete?',
  triggerLabel = 'Delete',
  triggerText,
  size = 'sm',
  className = '',
}: ConfirmInlineProps) {
  const [confirming, setConfirming] = useState(false)
  const timer = useRef<number | null>(null)

  // Auto-dismiss so a stray click doesn't leave the prompt hanging open.
  useEffect(() => {
    if (!confirming) return
    timer.current = window.setTimeout(() => setConfirming(false), 4000)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [confirming])

  const iconSize = size === 'sm' ? 14 : 16

  return (
    <span className={`inline-flex items-center ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.span
            key="confirm"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5 rounded-pill border border-danger/25 bg-[#FBEDEB] px-2 py-[3px]"
          >
            <span className="font-sans text-[11.5px] font-medium text-danger">{message}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setConfirming(false)
                onConfirm()
              }}
              className="rounded-pill bg-danger px-2 py-[1px] font-sans text-[11px] font-semibold text-white transition-colors duration-200 hover:bg-[#a5301f]"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setConfirming(false)
              }}
              className="rounded-pill px-1.5 py-[1px] font-sans text-[11px] font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary"
            >
              Cancel
            </button>
          </motion.span>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            aria-label={triggerLabel}
            title={triggerLabel}
            onClick={(e) => {
              e.stopPropagation()
              setConfirming(true)
            }}
            className={
              triggerText
                ? 'inline-flex items-center gap-1.5 rounded-control border border-danger/40 px-3 py-1.5 font-sans text-[13px] font-medium text-danger transition-colors duration-200 hover:bg-danger hover:text-white'
                : 'inline-flex items-center justify-center rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-[#FBEDEB] hover:text-danger'
            }
          >
            <Trash2 size={iconSize} />
            {triggerText}
          </motion.button>
        )}
      </AnimatePresence>
    </span>
  )
}
