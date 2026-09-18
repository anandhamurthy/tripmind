import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Button from '../shared/Button'

interface SidePanelProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  onSave?: () => void
  saveLabel?: string
  saveDisabled?: boolean
  children: ReactNode
}

/** Right-hand slide-in form panel. All create/edit forms in the app use it. */
export default function SidePanel({
  open,
  title,
  description,
  onClose,
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  children,
}: SidePanelProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1A1A]/35 backdrop-blur-[2px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="relative flex h-full w-full max-w-[440px] flex-col bg-surface shadow-panel"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h2 className="font-serif text-[21px] font-semibold leading-tight text-text-primary">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 font-sans text-[13px] text-text-secondary">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="-mr-1 rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-black/[0.05] hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </header>

            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onSave?.()
                }}
                className="space-y-4"
              >
                {children}
                {/* Lets Enter submit the form without a visible duplicate button. */}
                <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
              </form>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border bg-background/60 px-6 py-4">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {onSave && (
                <Button onClick={onSave} disabled={saveDisabled}>
                  {saveLabel}
                </Button>
              )}
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
