import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Download,
  FileDown,
  GripVertical,
  Luggage,
  Plus,
  ShoppingCart,
  Sparkles,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import type { PackingItem, PackingSection } from '../../types'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import { CLIMATE_LABEL, resolveClimate } from '../../lib/packing'
import { monthOf } from '../../lib/date'
import { exportChecklistPDF } from '../../lib/pdfExport'
import Button from '../shared/Button'
import ConfirmInline from '../shared/ConfirmInline'
import EmptyState from '../shared/EmptyState'
import ProgressBar from '../shared/ProgressBar'
import DayPlanView from './DayPlanView'

type PackingView = 'checklist' | 'dayplan'

export default function PackingTab() {
  const trip = useActiveTrip()
  const addPackingSection = useTripStore((s) => s.addPackingSection)
  const deletePackingSection = useTripStore((s) => s.deletePackingSection)
  const addPackingItem = useTripStore((s) => s.addPackingItem)
  const updatePackingItem = useTripStore((s) => s.updatePackingItem)
  const togglePackingItem = useTripStore((s) => s.togglePackingItem)
  const deletePackingItem = useTripStore((s) => s.deletePackingItem)
  const setAllPacked = useTripStore((s) => s.setAllPacked)
  const generateDefaultPacking = useTripStore((s) => s.generateDefaultPacking)
  const importPacking = useTripStore((s) => s.importPacking)
  const reorderPackingSections = useTripStore((s) => s.reorderPackingSections)
  const reorderPackingItems = useTripStore((s) => s.reorderPackingItems)

  const [view, setView] = useState<PackingView>('checklist')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [addingSection, setAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [confirmingCheckAll, setConfirmingCheckAll] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  if (!trip) return null

  const sections = trip.packing.sections
  const allItems = sections.flatMap((s) => s.items)
  const packedCount = allItems.filter((i) => i.packed).length
  const totalCount = allItems.length
  const needToBuyCount = allItems.filter((i) => i.owned === false).length
  const climate = resolveClimate(trip.basics.country, monthOf(trip.basics.startDate))

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const submitSection = () => {
    const name = newSectionName.trim()
    if (!name) return
    addPackingSection(trip.id, name)
    setNewSectionName('')
    setAddingSection(false)
  }

  /* ── Export ── */
  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      tripName: trip.basics.eventName,
      sections: sections.map((s) => ({
        name: s.name,
        items: s.items.map(({ label, note, packed, qty, additionalQty, owned }) => ({
          label, note, packed, qty, additionalQty, owned,
        })),
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `packing-${trip.basics.eventName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Import ── */
  const handleImport = (file: File) => {
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string)
        const rawSections = Array.isArray(raw) ? raw : raw?.sections
        if (!Array.isArray(rawSections)) throw new Error()
        const newSections: PackingSection[] = rawSections.map(
          (s: { name?: string; items?: { label?: string; note?: string; packed?: boolean; qty?: number; additionalQty?: number; owned?: boolean }[] }) => ({
            id: crypto.randomUUID(),
            name: String(s.name ?? 'Unnamed'),
            items: Array.isArray(s.items)
              ? s.items.map((i) => ({
                  id: crypto.randomUUID(),
                  label: String(i.label ?? ''),
                  note: String(i.note ?? ''),
                  packed: Boolean(i.packed),
                  qty: i.qty ?? 1,
                  additionalQty: i.additionalQty,
                  owned: i.owned,
                }))
              : [],
          }),
        )
        importPacking(trip.id, newSections)
      } catch {
        setImportError('Invalid file — export a packing list from TripMind first.')
      }
    }
    reader.readAsText(file)
  }

  /* ── Section drag end ── */
  const sectionSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = sections.findIndex((s) => s.id === active.id)
      const newIdx = sections.findIndex((s) => s.id === over.id)
      reorderPackingSections(trip.id, arrayMove(sections, oldIdx, newIdx))
    }
  }

  return (
    <div className="space-y-6">
      {/* ── View toggle ── */}
      <div className="flex items-center gap-1 rounded-control border border-border bg-surface p-1 shadow-sm w-fit">
        {([
          { id: 'checklist', label: '📦 Checklist' },
          { id: 'dayplan',   label: '📅 Day Plan'  },
        ] as { id: PackingView; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={[
              'rounded-[6px] px-4 py-1.5 font-sans text-[13px] font-medium transition-all duration-150',
              view === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Day Plan view ── */}
      {view === 'dayplan' && <DayPlanView />}

      {/* ── Checklist view ── */}
      {view === 'checklist' && <>

      {/* ── Progress ── */}
      <div className="rounded-card border border-border bg-surface p-5 shadow-card print-block">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[220px] flex-1">
            <h2 className="font-serif text-[22px] font-semibold text-text-primary">Packing</h2>
            <p className="mt-0.5 font-sans text-[13px] text-text-secondary">
              {totalCount === 0
                ? 'Nothing on the list yet.'
                : `${packedCount} of ${totalCount} packed`}
              {trip.basics.country && (
                <> · {trip.basics.country} — {CLIMATE_LABEL[climate]}</>
              )}
              {needToBuyCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-pill bg-amber-light px-2 py-0.5 font-sans text-[11px] font-semibold text-amber">
                  <ShoppingCart size={10} /> {needToBuyCount} to buy
                </span>
              )}
            </p>
          </div>

          <div className="no-print flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<FileDown size={14} />} disabled={totalCount === 0} onClick={() => exportChecklistPDF(trip)}>
              PDF
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} disabled={totalCount === 0} onClick={handleExport}>
              Export JSON
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file)
                  e.target.value = ''
                }}
              />
              <span className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-[13px] font-medium text-text-secondary shadow-sm transition-colors duration-200 hover:border-primary/30 hover:text-primary">
                <Upload size={14} /> Import
              </span>
            </label>
            {importError && (
              <span className="flex items-center gap-1.5 rounded-control border border-danger/30 bg-[#FDECEA] px-3 py-1.5 font-sans text-[12px] text-danger">
                {importError}
                <button type="button" onClick={() => setImportError(null)} className="ml-1 hover:opacity-70"><X size={12} /></button>
              </span>
            )}
            <span className="h-6 w-px self-center bg-border" />
            {confirmingCheckAll ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 rounded-control border border-primary/30 bg-primary-light px-3 py-1.5">
                <span className="font-sans text-[12.5px] font-medium text-primary">Mark all {totalCount} packed?</span>
                <Button size="sm" onClick={() => { setAllPacked(trip.id, true); setConfirmingCheckAll(false) }}>Yes</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmingCheckAll(false)}>Cancel</Button>
              </motion.div>
            ) : (
              <Button variant="secondary" size="sm" icon={<Check size={14} />} disabled={totalCount === 0} onClick={() => setConfirmingCheckAll(true)}>
                Check all
              </Button>
            )}
            <Button variant="ghost" size="sm" icon={<Square size={14} />} disabled={packedCount === 0} onClick={() => setAllPacked(trip.id, false)}>
              Uncheck all
            </Button>
          </div>
        </div>

        <ProgressBar className="mt-5" value={packedCount} max={totalCount || 1} labelPosition="none" height={12} tone={totalCount > 0 && packedCount === totalCount ? 'success' : 'primary'} />
        <p className="mt-2 font-sans text-[12.5px] text-text-secondary">
          {totalCount > 0 && packedCount === totalCount ? 'Everything packed. Have a good trip.' : `${totalCount - packedCount} still to go`}
        </p>
      </div>

      {/* ── Empty state ── */}
      {totalCount === 0 && sections.every((s) => s.items.length === 0) && (
        <EmptyState
          icon={<Luggage size={38} className="text-border" strokeWidth={1.5} />}
          heading="Your bag is empty"
          subtext={trip.basics.country ? `Generate a ${CLIMATE_LABEL[climate].toLowerCase()} kit for ${trip.basics.country}, or add items below.` : 'Add a destination country in Setup to generate a climate kit.'}
          action={<Button icon={<Sparkles size={15} />} disabled={!trip.basics.country.trim()} onClick={() => generateDefaultPacking(trip.basics.country)}>Generate packing list</Button>}
        />
      )}

      {/* ── Sections (sortable) ── */}
      <DndContext sensors={sectionSensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                collapsed={collapsed.has(section.id)}
                onToggleCollapse={() => toggleCollapse(section.id)}
                onAddItem={(label, note, qty, additionalQty) => addPackingItem(trip.id, section.id, label, note, qty, additionalQty)}
                onUpdateItem={(itemId, updates) => updatePackingItem(trip.id, section.id, itemId, updates)}
                onToggleItem={(itemId) => togglePackingItem(trip.id, section.id, itemId)}
                onDeleteItem={(itemId) => deletePackingItem(trip.id, section.id, itemId)}
                onDeleteSection={() => deletePackingSection(trip.id, section.id)}
                onReorderItems={(items) => reorderPackingItems(trip.id, section.id, items)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* ── Add section ── */}
      <div className="no-print">
        {addingSection ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface p-4 shadow-card">
            <input
              autoFocus

              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSection()
                if (e.key === 'Escape') setAddingSection(false)
              }}
              placeholder="Section name, e.g. Gym kit"
              className="min-w-[200px] flex-1 rounded-control border border-border bg-surface px-3 py-2 font-sans text-sm outline-none transition-all duration-200 placeholder:text-text-secondary/55 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
            />
            <Button onClick={submitSection} disabled={!newSectionName.trim()}>Add section</Button>
            <Button variant="ghost" onClick={() => setAddingSection(false)}>Cancel</Button>
          </motion.div>
        ) : (
          <Button variant="secondary" icon={<Plus size={15} />} onClick={() => setAddingSection(true)}>
            Add section
          </Button>
        )}
      </div>

      {/* end checklist view */}
      </>}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */

function SectionBlock({
  section,
  collapsed,
  onToggleCollapse,
  onAddItem,
  onUpdateItem,
  onToggleItem,
  onDeleteItem,
  onDeleteSection,
  onReorderItems,
}: {
  section: PackingSection
  collapsed: boolean
  onToggleCollapse: () => void
  onAddItem: (label: string, note: string, qty?: number, additionalQty?: number) => void
  onUpdateItem: (itemId: string, updates: Partial<PackingItem>) => void
  onToggleItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onDeleteSection: () => void
  onReorderItems: (items: PackingItem[]) => void
}) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')
  const [qty, setQty] = useState(1)
  const [additionalQty, setAdditionalQty] = useState(0)

  const packed = section.items.filter((i) => i.packed).length
  const total = section.items.length
  const complete = total > 0 && packed === total

  const submit = () => {
    const value = label.trim()
    if (!value) return
    onAddItem(value, note.trim(), qty, additionalQty || undefined)
    setLabel('')
    setNote('')
    setQty(1)
    setAdditionalQty(0)
  }

  /* Section-level sortable */
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const sectionStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  /* Item-level dnd */
  const itemSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = section.items.findIndex((i) => i.id === active.id)
      const newIdx = section.items.findIndex((i) => i.id === over.id)
      onReorderItems(arrayMove(section.items, oldIdx, newIdx))
    }
  }

  return (
    <section ref={setNodeRef} style={sectionStyle} className="overflow-hidden rounded-card border border-border bg-surface shadow-card print-block">
      <header className="flex items-center gap-2 px-5 py-3.5">
        {/* Section drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder section"
          className="no-print cursor-grab touch-none rounded p-1 text-text-secondary/40 transition-colors hover:text-text-secondary active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <motion.span animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }} className="text-text-secondary">
            <ChevronDown size={17} />
          </motion.span>
          <h3 className="truncate font-serif text-[17px] font-semibold text-text-primary">{section.name}</h3>
          <span className={['shrink-0 rounded-pill border px-2.5 py-[3px] font-sans text-[11.5px] font-medium transition-colors duration-200', complete ? 'border-success/25 bg-[#E8F4EE] text-success' : 'border-black/[0.06] bg-black/[0.04] text-text-secondary'].join(' ')}>
            {packed}/{total} packed
          </span>
        </button>

        <div className="no-print flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => { setAdding(true); if (collapsed) onToggleCollapse() }}
            aria-label={`Add item to ${section.name}`}
            className="rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:bg-primary-light hover:text-primary"
          >
            <Plus size={15} />
          </button>
          <ConfirmInline onConfirm={onDeleteSection} message="Delete section?" triggerLabel={`Delete ${section.name}`} />
        </div>
      </header>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: 'easeInOut' }} className="print-expand overflow-hidden">
            <div className="border-t border-border px-5 py-3">
              {section.items.length === 0 && !adding && (
                <p className="py-3 font-sans text-[13px] text-text-secondary">
                  Nothing here yet.{' '}
                  <button type="button" onClick={() => setAdding(true)} className="font-medium text-primary hover:underline">Add an item</button>
                </p>
              )}

              <DndContext sensors={itemSensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={handleItemDragEnd}>
                <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <ul>
                    <AnimatePresence initial={false}>
                      {section.items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          onToggle={() => onToggleItem(item.id)}
                          onUpdate={(updates) => onUpdateItem(item.id, updates)}
                          onDelete={() => onDeleteItem(item.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </SortableContext>
              </DndContext>

              {/* Add item form */}
              <div className="no-print mt-2">
                {adding ? (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 rounded-control border border-primary/25 bg-primary-light/40 p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        autoFocus
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
                        placeholder="Item name"
                        className="min-w-[160px] flex-1 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                      />
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
                        placeholder="Note (optional)"
                        className="min-w-[130px] flex-1 rounded-control border border-border bg-surface px-3 py-1.5 font-sans text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 font-sans text-[12px] text-text-secondary">
                        Must qty
                        <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="w-14 rounded-control border border-border bg-surface px-2 py-1 font-sans text-[13px] font-semibold text-text-primary outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15" />
                      </label>
                      <label className="flex items-center gap-1.5 font-sans text-[12px] text-text-secondary">
                        Additional
                        <input type="number" min={0} value={additionalQty} onChange={(e) => setAdditionalQty(Math.max(0, Number(e.target.value) || 0))} className="w-14 rounded-control border border-border bg-surface px-2 py-1 font-sans text-[13px] font-semibold text-text-primary outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15" />
                      </label>
                      <Button size="sm" onClick={submit} disabled={!label.trim()}>Add</Button>
                      <button type="button" onClick={() => setAdding(false)} aria-label="Cancel" className="rounded-control p-1.5 text-text-secondary transition-colors duration-200 hover:text-text-primary">
                        <X size={15} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  section.items.length > 0 && (
                    <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 font-sans text-[12.5px] font-medium text-text-secondary transition-colors duration-200 hover:bg-primary-light hover:text-primary">
                      <Plus size={14} /> Add item
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */

function ItemRow({
  item,
  onToggle,
  onUpdate,
  onDelete,
}: {
  item: PackingItem
  onToggle: () => void
  onUpdate: (updates: Partial<PackingItem>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const cycleOwned = () => {
    if (item.owned === undefined) onUpdate({ owned: true })
    else if (item.owned === true) onUpdate({ owned: false })
    else onUpdate({ owned: undefined })
  }

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6, height: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex items-start gap-2 rounded-control px-1 py-2 transition-colors duration-200 hover:bg-background/70"
    >
      {/* Item drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="no-print mt-0.5 cursor-grab touch-none rounded p-0.5 text-text-secondary/30 opacity-0 transition-all group-hover:opacity-100 hover:text-text-secondary active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>

      {/* Packed checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={item.packed}
        onClick={onToggle}
        className={['mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200', item.packed ? 'border-primary bg-primary text-white' : 'border-border bg-surface hover:border-primary'].join(' ')}
      >
        <AnimatePresence>
          {item.packed && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
              <Check size={12} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Label + counters */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <input
              autoFocus
              value={item.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false) }}
              className="flex-1 rounded-control border border-primary bg-surface px-2 py-1 font-sans text-[13.5px] outline-none ring-[3px] ring-primary/15"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Click to rename"
              className={['text-left font-sans text-[13.5px] transition-colors duration-200', item.packed ? 'text-text-secondary line-through' : 'text-text-primary hover:text-primary'].join(' ')}
            >
              {item.label}
            </button>
          )}

          {/* Must qty stepper */}
          <div className="flex items-center">
            <button type="button" onClick={() => onUpdate({ qty: Math.max(1, (item.qty ?? 1) - 1) })} className="flex h-5 w-5 items-center justify-center rounded-l-[5px] border border-border bg-background font-sans text-[13px] text-text-secondary transition-colors hover:bg-primary-light hover:text-primary">−</button>
            <span className={['flex h-5 min-w-[28px] items-center justify-center border-y border-border bg-background px-1.5 font-sans text-[12px] font-semibold', item.packed ? 'text-text-secondary' : 'text-text-primary'].join(' ')}>{item.qty ?? 1}</span>
            <button type="button" onClick={() => onUpdate({ qty: (item.qty ?? 1) + 1 })} className="flex h-5 w-5 items-center justify-center rounded-r-[5px] border border-border bg-background font-sans text-[13px] text-text-secondary transition-colors hover:bg-primary-light hover:text-primary">+</button>
          </div>

          {/* Additional qty */}
          {(item.additionalQty ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-sans text-[10.5px] text-text-secondary">+extra</span>
              <button type="button" onClick={() => onUpdate({ additionalQty: Math.max(0, (item.additionalQty ?? 0) - 1) })} className="flex h-4 w-4 items-center justify-center rounded-l-[4px] border border-border bg-background font-sans text-[11px] text-text-secondary hover:border-danger hover:text-danger">−</button>
              <span className="flex h-4 min-w-[22px] items-center justify-center border-y border-border bg-background px-1 font-sans text-[11px] font-semibold text-text-secondary">{item.additionalQty}</span>
              <button type="button" onClick={() => onUpdate({ additionalQty: (item.additionalQty ?? 0) + 1 })} className="flex h-4 w-4 items-center justify-center rounded-r-[4px] border border-border bg-background font-sans text-[11px] text-text-secondary hover:border-primary hover:text-primary">+</button>
            </div>
          )}

          {/* Own / Buy toggle */}
          <button
            type="button"
            onClick={cycleOwned}
            title="Click to toggle: Already Own → Need to Buy → Not set"
            className={[
              'shrink-0 rounded-pill border px-2.5 py-0.5 font-sans text-[10.5px] font-semibold transition-all duration-150',
              item.owned === true
                ? 'border-success/40 bg-[#E8F4EE] text-success'
                : item.owned === false
                  ? 'border-amber/50 bg-amber-light text-amber'
                  : 'border-dashed border-border bg-transparent text-text-secondary/60 hover:border-text-secondary/40 hover:text-text-secondary',
            ].join(' ')}
          >
            {item.owned === true ? '✓ Own' : item.owned === false ? '🛒 Buy' : 'Own / Buy?'}
          </button>
        </div>

        {item.note && (
          <p className={`mt-0.5 font-sans text-[11.5px] ${item.packed ? 'text-text-secondary/60' : 'text-text-secondary'}`}>
            {item.note}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${item.label}`}
        className="no-print rounded-control p-1.5 text-text-secondary opacity-0 transition-all duration-200 hover:bg-[#FBEDEB] hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </motion.li>
  )
}
