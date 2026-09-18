import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { Trip, TripBasics, TripPurpose } from '../../types'
import { useTripStore } from '../../store/useTripStore'
import Button from '../shared/Button'
import Input from '../shared/Input'

const PURPOSES: { value: TripPurpose; label: string }[] = [
  { value: 'business', label: 'Business' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'both', label: 'Both' },
]

const blank = {
  eventName: '',
  location: '',
  country: '',
  startDate: '',
  endDate: '',
  purpose: 'business' as TripPurpose,
}

interface NewTripModalProps {
  open: boolean
  /** When set, the modal edits this trip instead of creating a new one. */
  editing?: Trip | null
  onClose: () => void
}

export default function NewTripModal({ open, editing, onClose }: NewTripModalProps) {
  const createTrip = useTripStore((s) => s.createTrip)
  const updateBasics = useTripStore((s) => s.updateBasics)
  const setActiveTrip = useTripStore((s) => s.setActiveTrip)

  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      editing
        ? {
            eventName: editing.basics.eventName,
            location: editing.basics.location,
            country: editing.basics.country,
            startDate: editing.basics.startDate,
            endDate: editing.basics.endDate,
            purpose: editing.basics.purpose,
          }
        : blank,
    )
  }, [open, editing])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const set = <K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.eventName.trim()) next.eventName = 'Give the trip a name so you can find it later.'
    if (!form.location.trim()) next.location = 'Where are you heading?'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = 'End date cannot be before the start date.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = () => {
    if (!validate()) return
    const basics: Partial<TripBasics> = {
      eventName: form.eventName.trim(),
      location: form.location.trim(),
      country: form.country.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      purpose: form.purpose,
    }

    if (editing) {
      updateBasics(editing.id, basics)
    } else {
      const id = createTrip(basics)
      setActiveTrip(id) // lands on the Setup tab
    }
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1A1A]/35 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={editing ? 'Edit trip' : 'New trip'}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-[520px] overflow-hidden rounded-card border border-border bg-surface shadow-card-hover"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h2 className="font-serif text-[22px] font-semibold leading-tight text-text-primary">
                  {editing ? 'Edit trip' : 'Plan a new trip'}
                </h2>
                <p className="mt-1 font-sans text-[13px] text-text-secondary">
                  {editing
                    ? 'Update the basics — everything else stays as it is.'
                    : 'Start with the essentials. You can fill in the rest as you go.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-black/[0.05] hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </header>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="space-y-4 px-6 py-5"
            >
              <Input
                label="Event name"
                autoFocus
                serif
                className="text-[16px]"
                placeholder="e.g. Web Summit 2026"
                value={form.eventName}
                error={errors.eventName}
                onChange={(e) => set('eventName', e.target.value)}
              />

              <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
                <Input
                  label="Destination city"
                  placeholder="e.g. Lisbon"
                  value={form.location}
                  error={errors.location}
                  onChange={(e) => set('location', e.target.value)}
                />
                <Input
                  label="Country"
                  placeholder="e.g. Portugal"
                  hint="Drives the packing list"
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
                <Input
                  label="Start date"
                  variant="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                />
                <Input
                  label="End date"
                  variant="date"
                  value={form.endDate}
                  error={errors.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </div>

              <div>
                <span className="mb-1.5 block font-sans text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                  Purpose
                </span>
                <div className="flex gap-2">
                  {PURPOSES.map((p) => {
                    const active = form.purpose === p.value
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => set('purpose', p.value)}
                        className={[
                          'flex-1 rounded-pill border px-4 py-2 font-sans text-[13px] font-medium',
                          'transition-all duration-200',
                          active
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
                        ].join(' ')}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" size="lg">
                  {editing ? 'Save changes' : 'Create trip'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
