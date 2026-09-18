import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  FileDown,
  GripVertical,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DayPlanDay, DayPlanItem, DayPlanSlot, PackingSection } from '../../types'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import { exportDayPlanPDF } from '../../lib/pdfExport'
import Button from '../shared/Button'

/* ── Constants ─────────────────────────────────────────────────────────────── */

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night', 'All Day']

const TIME_COLORS: Record<string, string> = {
  Morning:   'bg-amber-light  border-amber/30   text-amber',
  Afternoon: 'bg-blue-50      border-blue-200   text-blue-600',
  Evening:   'bg-purple-50    border-purple-200 text-purple-600',
  Night:     'bg-slate-100    border-slate-300  text-slate-600',
  'All Day': 'bg-green-50     border-green-200  text-green-600',
}

const timeColor = (t: string) =>
  TIME_COLORS[t] ?? 'bg-gray-100 border-gray-200 text-gray-600'

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

/* ── Active-drag state ─────────────────────────────────────────────────────── */

interface ActiveDrag {
  srcType: 'checklist' | 'day-item' | 'slot'
  label: string
  qty: number
}

/* ── Main view ─────────────────────────────────────────────────────────────── */

export default function DayPlanView() {
  const trip = useActiveTrip()
  const initDayPlan         = useTripStore((s) => s.initDayPlan)
  const addDayPlanSlot      = useTripStore((s) => s.addDayPlanSlot)
  const updateDayPlanSlot   = useTripStore((s) => s.updateDayPlanSlot)
  const deleteDayPlanSlot   = useTripStore((s) => s.deleteDayPlanSlot)
  const addDayPlanItem      = useTripStore((s) => s.addDayPlanItem)
  const updateDayPlanItem   = useTripStore((s) => s.updateDayPlanItem)
  const deleteDayPlanItem   = useTripStore((s) => s.deleteDayPlanItem)
  const reorderDayPlanItems = useTripStore((s) => s.reorderDayPlanItems)
  const reorderDayPlanSlots = useTripStore((s) => s.reorderDayPlanSlots)

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!trip) return null
  if (!trip.dayPlan?.days?.length) {
    initDayPlan(trip.id)
    return null
  }

  const days = trip.dayPlan.days
  const sections = trip.packing.sections

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  /* ── Drag handlers ── */

  const handleDragStart = (event: DragStartEvent) => {
    const d = event.active.data.current
    if (!d) return
    setActiveDrag({ srcType: d.srcType, label: d.label ?? '', qty: d.qty ?? 1 })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return

    const activeSrcType = active.data.current?.srcType
    const overData = over.data.current

    /* checklist → slot */
    if (activeSrcType === 'checklist') {
      const targetDayId: string | undefined = overData?.dayId
      const targetSlotId: string | undefined =
        overData?.srcType === 'slot' ? String(over.id) : overData?.slotId
      if (targetDayId && targetSlotId) {
        addDayPlanItem(
          trip.id,
          targetDayId,
          targetSlotId,
          active.data.current?.label ?? '',
          active.data.current?.qty ?? 1,
        )
      }
      return
    }

    /* reorder items within a slot */
    if (activeSrcType === 'day-item') {
      const fromDayId: string = active.data.current?.dayId
      const fromSlotId: string = active.data.current?.slotId
      if (overData?.srcType === 'day-item' && overData.slotId === fromSlotId) {
        const day = days.find((d) => d.id === fromDayId)
        const slot = day?.slots.find((s) => s.id === fromSlotId)
        if (slot) {
          const oldIdx = slot.items.findIndex((i) => i.id === String(active.id))
          const newIdx = slot.items.findIndex((i) => i.id === String(over.id))
          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx)
            reorderDayPlanItems(trip.id, fromDayId, fromSlotId, arrayMove(slot.items, oldIdx, newIdx))
        }
      }
      return
    }

    /* reorder slots within a day */
    if (activeSrcType === 'slot') {
      const dayId: string = active.data.current?.dayId
      if (overData?.srcType === 'slot' && overData.dayId === dayId) {
        const day = days.find((d) => d.id === dayId)
        if (day) {
          const oldIdx = day.slots.findIndex((s) => s.id === String(active.id))
          const newIdx = day.slots.findIndex((s) => s.id === String(over.id))
          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx)
            reorderDayPlanSlots(trip.id, dayId, arrayMove(day.slots, oldIdx, newIdx))
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-sans text-[13px] text-text-secondary">
          {days.length} day{days.length !== 1 ? 's' : ''} · {days.reduce((n, d) => n + d.slots.length, 0)} slots
        </p>
        <Button
          variant="secondary"
          size="sm"
          icon={<FileDown size={14} />}
          disabled={days.length === 0}
          onClick={() => exportDayPlanPDF(trip)}
        >
          Export PDF
        </Button>
      </div>

      {/* ── Checklist source panel ── */}
      <ChecklistPanel sections={sections} />

      {/* ── Day cards ── */}
      <div className="space-y-4">
        {days.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            collapsed={collapsed.has(day.id)}
            onToggle={() => toggleCollapse(day.id)}
            onAddSlot={(time, location) => addDayPlanSlot(trip.id, day.id, time, location)}
            onUpdateSlot={(slotId, u) => updateDayPlanSlot(trip.id, day.id, slotId, u)}
            onDeleteSlot={(slotId) => deleteDayPlanSlot(trip.id, day.id, slotId)}
            onAddItem={(slotId, label, qty) => addDayPlanItem(trip.id, day.id, slotId, label, qty)}
            onUpdateItem={(slotId, itemId, u) => updateDayPlanItem(trip.id, day.id, slotId, itemId, u)}
            onDeleteItem={(slotId, itemId) => deleteDayPlanItem(trip.id, day.id, slotId, itemId)}
          />
        ))}
      </div>

      {/* ── Drag overlay ── */}
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {activeDrag && (
          <div className={[
            'flex items-center gap-2 rounded-pill border px-3 py-1.5 font-sans text-[13px] font-medium shadow-lg',
            activeDrag.srcType === 'checklist'
              ? 'border-primary/30 bg-primary-light text-primary'
              : 'border-border bg-white text-text-primary',
          ].join(' ')}>
            {activeDrag.label}
            {activeDrag.qty > 1 && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-sans text-[11px] font-bold text-primary">
                ×{activeDrag.qty}
              </span>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

/* ── Checklist source panel ─────────────────────────────────────────────────── */

function ChecklistPanel({ sections }: { sections: PackingSection[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const allItems = sections.flatMap((s) => s.items)

  if (allItems.length === 0) return null

  const toggleSection = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="rounded-card border border-primary/20 bg-primary-light/30 p-4 shadow-sm">
      <p className="mb-3 font-sans text-[12.5px] font-semibold uppercase tracking-wide text-primary/70">
        Drag items from your checklist into a day slot ↓
      </p>

      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="mb-1.5 flex items-center gap-1.5 font-sans text-[12px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
            >
              <motion.span animate={{ rotate: collapsed.has(section.id) ? -90 : 0 }} transition={{ duration: 0.15 }}>
                <ChevronDown size={13} />
              </motion.span>
              {section.name}
              <span className="rounded-full bg-border px-1.5 py-0.5 font-sans text-[10px] text-text-secondary">
                {section.items.length}
              </span>
            </button>

            {!collapsed.has(section.id) && (
              <div className="flex flex-wrap gap-2 pl-3">
                {section.items.map((item) => (
                  <DraggableChecklistChip
                    key={item.id}
                    id={`cl-${item.id}`}
                    label={item.label}
                    qty={item.qty ?? 1}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DraggableChecklistChip({
  id,
  label,
  qty,
}: {
  id: string
  label: string
  qty: number
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { srcType: 'checklist', label, qty },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className="flex cursor-grab touch-none select-none items-center gap-1.5 rounded-pill border border-border bg-surface px-2.5 py-1 font-sans text-[12.5px] text-text-primary shadow-sm transition-shadow hover:border-primary/30 hover:shadow-md active:cursor-grabbing"
    >
      <GripVertical size={11} className="text-text-secondary/50" />
      {label}
      {qty > 1 && (
        <span className="rounded-full bg-primary/10 px-1.5 font-sans text-[10.5px] font-bold text-primary">
          ×{qty}
        </span>
      )}
    </div>
  )
}

/* ── Day card ────────────────────────────────────────────────────────────── */

function DayCard({
  day,
  collapsed,
  onToggle,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: {
  day: DayPlanDay
  collapsed: boolean
  onToggle: () => void
  onAddSlot: (time: string, location: string) => void
  onUpdateSlot: (slotId: string, u: Partial<DayPlanSlot>) => void
  onDeleteSlot: (slotId: string) => void
  onAddItem: (slotId: string, label: string, qty: number) => void
  onUpdateItem: (slotId: string, itemId: string, u: Partial<DayPlanItem>) => void
  onDeleteItem: (slotId: string, itemId: string) => void
}) {
  const [addingSlot, setAddingSlot] = useState(false)
  const [newTime, setNewTime] = useState('Morning')
  const [newLocation, setNewLocation] = useState('')

  const totalItems = day.slots.reduce((n, s) => n + s.items.length, 0)

  const submitSlot = () => {
    const loc = newLocation.trim()
    if (!loc) return
    onAddSlot(newTime, loc)
    setNewLocation('')
    setNewTime('Morning')
    setAddingSlot(false)
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Day header */}
      <header className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <motion.span animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-text-secondary">
            <ChevronDown size={18} />
          </motion.span>
          <div className="min-w-0">
            <h3 className="font-serif text-[17px] font-semibold text-text-primary">{day.label}</h3>
            {day.date && (
              <p className="mt-0.5 font-sans text-[12px] text-text-secondary">{formatDate(day.date)}</p>
            )}
          </div>
          <span className="shrink-0 rounded-pill border border-black/[0.06] bg-black/[0.04] px-2.5 py-[3px] font-sans text-[11.5px] font-medium text-text-secondary">
            {day.slots.length} slot{day.slots.length !== 1 ? 's' : ''} · {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setAddingSlot(true); if (collapsed) onToggle() }}
          aria-label="Add slot"
          className="shrink-0 rounded-control p-1.5 text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
        >
          <Plus size={16} />
        </button>
      </header>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border"
          >
            <div className="divide-y divide-border">
              {/* Slots (sortable by drag handle) */}
              <SortableContext items={day.slots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {day.slots.map((slot) => (
                  <SlotRow
                    key={slot.id}
                    slot={slot}
                    dayId={day.id}
                    onUpdate={(u) => onUpdateSlot(slot.id, u)}
                    onDelete={() => onDeleteSlot(slot.id)}
                    onAddItem={(label, qty) => onAddItem(slot.id, label, qty)}
                    onUpdateItem={(itemId, u) => onUpdateItem(slot.id, itemId, u)}
                    onDeleteItem={(itemId) => onDeleteItem(slot.id, itemId)}
                  />
                ))}
              </SortableContext>

              {day.slots.length === 0 && !addingSlot && (
                <p className="px-5 py-4 font-sans text-[13px] text-text-secondary">
                  No slots yet.{' '}
                  <button type="button" onClick={() => setAddingSlot(true)} className="font-medium text-primary hover:underline">
                    Add a slot
                  </button>
                  {' '}or drag an item from the checklist above.
                </p>
              )}

              {/* Add slot form */}
              {addingSlot && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2 rounded-control border border-primary/25 bg-primary-light/40 p-2.5">
                    <select
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="rounded-control border border-border bg-surface px-2 py-1.5 font-sans text-[13px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      autoFocus
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitSlot(); if (e.key === 'Escape') setAddingSlot(false) }}
                      placeholder="Location, e.g. Chennai Airport"
                      className="min-w-[200px] flex-1 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-[13px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                    />
                    <Button size="sm" onClick={submitSlot} disabled={!newLocation.trim()}>Add</Button>
                    <button type="button" onClick={() => setAddingSlot(false)} className="rounded-control p-1.5 text-text-secondary hover:text-text-primary">
                      <X size={15} />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Slot row ────────────────────────────────────────────────────────────── */

function SlotRow({
  slot,
  dayId,
  onUpdate,
  onDelete,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: {
  slot: DayPlanSlot
  dayId: string
  onUpdate: (u: Partial<DayPlanSlot>) => void
  onDelete: () => void
  onAddItem: (label: string, qty: number) => void
  onUpdateItem: (itemId: string, u: Partial<DayPlanItem>) => void
  onDeleteItem: (itemId: string) => void
}) {
  const [addingItem, setAddingItem] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newQty, setNewQty] = useState(1)
  const [editingTime, setEditingTime] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)

  // Slot is sortable (for reordering slots within a day)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver: isSlotOver } =
    useSortable({ id: slot.id, data: { srcType: 'slot', dayId } })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const submitItem = () => {
    const label = newLabel.trim()
    if (!label) return
    onAddItem(label, newQty)
    setNewLabel('')
    setNewQty(1)
    setAddingItem(false)
  }

  return (
    <div ref={setNodeRef} style={style} className="group/slot">
      <div className={[
        'flex transition-colors duration-150',
        isSlotOver ? 'bg-primary-light/50' : '',
      ].join(' ')}>
        {/* Slot drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag slot to reorder"
          className="flex w-8 shrink-0 cursor-grab touch-none items-start justify-center pt-4 text-text-secondary/30 opacity-0 transition-all group-hover/slot:opacity-100 hover:text-text-secondary active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </button>

        <div className="flex-1 py-3 pr-4">
          {/* Slot header */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time badge */}
            {editingTime ? (
              <select
                autoFocus
                value={slot.time}
                onChange={(e) => { onUpdate({ time: e.target.value }); setEditingTime(false) }}
                onBlur={() => setEditingTime(false)}
                className="rounded-pill border border-primary bg-surface px-2 py-0.5 font-sans text-[11.5px] font-semibold outline-none ring-[3px] ring-primary/15"
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setEditingTime(true)}
                title="Click to change time"
                className={`rounded-pill border px-2.5 py-0.5 font-sans text-[11.5px] font-semibold transition-all hover:ring-2 hover:ring-primary/20 ${timeColor(slot.time)}`}
              >
                {slot.time}
              </button>
            )}

            {/* Location */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <MapPin size={13} className="shrink-0 text-text-secondary/60" />
              {editingLocation ? (
                <input
                  autoFocus
                  value={slot.location}
                  onChange={(e) => onUpdate({ location: e.target.value })}
                  onBlur={() => setEditingLocation(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingLocation(false) }}
                  className="min-w-0 flex-1 rounded-control border border-primary bg-surface px-2 py-0.5 font-sans text-[13.5px] font-medium outline-none ring-[3px] ring-primary/15"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingLocation(true)}
                  title="Click to edit location"
                  className="truncate text-left font-sans text-[13.5px] font-medium text-text-primary transition-colors hover:text-primary"
                >
                  {slot.location}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setAddingItem(true)}
                aria-label="Add item"
                className="rounded-control p-1.5 text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete slot"
                className="rounded-control p-1.5 text-text-secondary opacity-0 transition-all hover:bg-[#FBEDEB] hover:text-danger focus-visible:opacity-100 group-hover/slot:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Items drop zone + chips */}
          <div className={[
            'mt-2 min-h-[32px] rounded-control pl-1 transition-all duration-150',
            isSlotOver ? 'ring-2 ring-primary/30' : '',
          ].join(' ')}>
            <SortableContext items={slot.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence initial={false}>
                  {slot.items.map((item) => (
                    <SortableOutfitChip
                      key={item.id}
                      item={item}
                      dayId={dayId}
                      slotId={slot.id}
                      onUpdate={(u) => onUpdateItem(item.id, u)}
                      onDelete={() => onDeleteItem(item.id)}
                    />
                  ))}
                </AnimatePresence>

                {slot.items.length === 0 && !addingItem && (
                  <span className="flex items-center gap-1.5 font-sans text-[12px] text-text-secondary/50 italic">
                    Drop items here or{' '}
                    <button type="button" onClick={() => setAddingItem(true)} className="font-medium not-italic text-primary hover:underline">
                      add manually
                    </button>
                  </span>
                )}
              </div>
            </SortableContext>

            {/* Add item inline form */}
            {addingItem && (
              <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitItem(); if (e.key === 'Escape') setAddingItem(false) }}
                  placeholder="Item name"
                  className="min-w-[150px] flex-1 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-[13px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                />
                <div className="flex items-center">
                  <button type="button" onClick={() => setNewQty((q) => Math.max(1, q - 1))} className="flex h-8 w-7 items-center justify-center rounded-l-control border border-border bg-surface font-sans text-[14px] text-text-secondary hover:bg-primary-light hover:text-primary">−</button>
                  <span className="flex h-8 min-w-[32px] items-center justify-center border-y border-border bg-surface px-1 font-sans text-[13px] font-semibold text-text-primary">{newQty}</span>
                  <button type="button" onClick={() => setNewQty((q) => q + 1)} className="flex h-8 w-7 items-center justify-center rounded-r-control border border-border bg-surface font-sans text-[14px] text-text-secondary hover:bg-primary-light hover:text-primary">+</button>
                </div>
                <Button size="sm" onClick={submitItem} disabled={!newLabel.trim()}>Add</Button>
                <button type="button" onClick={() => setAddingItem(false)} className="rounded-control p-1.5 text-text-secondary hover:text-text-primary"><X size={14} /></button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Outfit chip (sortable) ─────────────────────────────────────────────── */

function SortableOutfitChip({
  item,
  dayId,
  slotId,
  onUpdate,
  onDelete,
}: {
  item: DayPlanItem
  dayId: string
  slotId: string
  onUpdate: (u: Partial<DayPlanItem>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { srcType: 'day-item', dayId, slotId, label: item.label, qty: item.qty },
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className="group/chip flex items-center gap-1.5 rounded-pill border border-border bg-background px-2.5 py-1"
    >
      <button type="button" {...attributes} {...listeners} aria-label="Drag" className="cursor-grab touch-none text-text-secondary/30 opacity-0 transition-opacity group-hover/chip:opacity-100 active:cursor-grabbing">
        <GripVertical size={12} />
      </button>

      {editing ? (
        <input
          autoFocus
          value={item.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false) }}
          className="w-28 rounded border border-primary bg-surface px-1 py-0.5 font-sans text-[12.5px] outline-none ring-[2px] ring-primary/15"
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)} title="Click to rename" className="font-sans text-[12.5px] text-text-primary hover:text-primary">
          {item.label}
        </button>
      )}

      {/* Qty stepper */}
      <div className="flex items-center">
        <button type="button" onClick={() => onUpdate({ qty: Math.max(1, item.qty - 1) })} className="flex h-4 w-4 items-center justify-center rounded-l-[3px] border border-border bg-surface font-sans text-[11px] text-text-secondary hover:border-primary hover:text-primary">−</button>
        <span className="flex h-4 min-w-[20px] items-center justify-center border-y border-border bg-surface px-0.5 font-sans text-[11px] font-semibold text-text-primary">{item.qty}</span>
        <button type="button" onClick={() => onUpdate({ qty: item.qty + 1 })} className="flex h-4 w-4 items-center justify-center rounded-r-[3px] border border-border bg-surface font-sans text-[11px] text-text-secondary hover:border-primary hover:text-primary">+</button>
      </div>

      <button type="button" onClick={onDelete} aria-label="Remove" className="ml-0.5 rounded-full p-0.5 text-text-secondary/40 opacity-0 transition-all hover:bg-[#FBEDEB] hover:text-danger group-hover/chip:opacity-100">
        <X size={11} />
      </button>
    </motion.div>
  )
}
