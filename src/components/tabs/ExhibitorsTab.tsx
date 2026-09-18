import { useState } from 'react'
import {
  BookMarked,
  Check,
  ExternalLink,
  Pencil,
  Plus,
  Star,
} from 'lucide-react'
import type { Exhibitor, ExhibitorCategory, SponsorTier } from '../../types'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import Button from '../shared/Button'
import Input from '../shared/Input'
import EmptyState from '../shared/EmptyState'
import ConfirmInline from '../shared/ConfirmInline'
import SidePanel from '../layout/SidePanel'
import ProgressBar from '../shared/ProgressBar'

const CATEGORIES: ExhibitorCategory[] = [
  'SIEM & SOC',
  'Endpoint & XDR',
  'Identity & Access',
  'Cloud Security',
  'Network Security',
  'GRC & Risk',
  'Threat Intelligence',
  'Data Security',
  'Other',
]

const CATEGORY_COLORS: Record<ExhibitorCategory, string> = {
  'SIEM & SOC': 'bg-violet-100 text-violet-700 border-violet-200',
  'Endpoint & XDR': 'bg-rose-100 text-rose-700 border-rose-200',
  'Identity & Access': 'bg-amber-100 text-amber-700 border-amber-200',
  'Cloud Security': 'bg-sky-100 text-sky-700 border-sky-200',
  'Network Security': 'bg-teal-100 text-teal-700 border-teal-200',
  'GRC & Risk': 'bg-orange-100 text-orange-700 border-orange-200',
  'Threat Intelligence': 'bg-red-100 text-red-700 border-red-200',
  'Data Security': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Other: 'bg-slate-100 text-slate-600 border-slate-200',
}

const SPONSOR_TIERS: SponsorTier[] = ['Premier Plus', 'Premier', 'Platinum', 'Silver', 'Other']

const TIER_COLORS: Record<SponsorTier, string> = {
  'Premier Plus': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Premier':      'bg-purple-100 text-purple-700 border-purple-200',
  'Platinum':     'bg-slate-100 text-slate-600 border-slate-300',
  'Silver':       'bg-gray-100 text-gray-500 border-gray-300',
  'Other':        'bg-white text-gray-400 border-gray-200',
}

const emptyForm = (): Omit<Exhibitor, 'id'> => ({
  name: '',
  category: 'Other',
  sponsorTier: 'Other',
  description: '',
  website: '',
  boothNumber: '',
  visited: false,
  interested: false,
  notes: '',
})

export default function ExhibitorsTab() {
  const trip = useActiveTrip()
  const { addExhibitor, updateExhibitor, deleteExhibitor, toggleExhibitorVisited, toggleExhibitorInterested } =
    useTripStore()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<ExhibitorCategory | 'All'>('All')
  const [filterInterested, setFilterInterested] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Exhibitor | null>(null)
  const [form, setForm] = useState(emptyForm())

  if (!trip) return null

  const all = trip.exhibitors?.exhibitors ?? []
  const visitedCount = all.filter((e) => e.visited).length
  const interestedCount = all.filter((e) => e.interested).length

  const filtered = all.filter((e) => {
    const matchSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'All' || e.category === filterCategory
    const matchInterested = !filterInterested || e.interested
    return matchSearch && matchCategory && matchInterested
  })

  // Group by category
  const grouped: Record<string, Exhibitor[]> = {}
  for (const e of filtered) {
    if (!grouped[e.category]) grouped[e.category] = []
    grouped[e.category].push(e)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm())
    setPanelOpen(true)
  }

  const openEdit = (e: Exhibitor) => {
    setEditing(e)
    setForm({ ...e })
    setPanelOpen(true)
  }

  const save = () => {
    if (!form.name.trim()) return
    if (editing) {
      updateExhibitor(trip.id, editing.id, form)
    } else {
      addExhibitor(trip.id, form)
    }
    setPanelOpen(false)
  }

  const pf = (updates: Partial<typeof form>) => setForm((f) => ({ ...f, ...updates }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-text-primary">Exhibitors</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            {all.length} vendors · {visitedCount} visited · {interestedCount} interested
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <Plus size={15} />
          Add Exhibitor
        </Button>
      </div>

      {/* Progress bar */}
      {all.length > 0 && (
        <ProgressBar value={visitedCount} max={all.length} label="visited" />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search exhibitors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-52"
        />
        <div className="flex flex-wrap gap-1.5">
          {(['All', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={[
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filterCategory === cat
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-primary',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFilterInterested((v) => !v)}
          className={[
            'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            filterInterested
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-border bg-surface text-text-secondary hover:border-amber-300 hover:text-amber-600',
          ].join(' ')}
        >
          <Star size={12} className={filterInterested ? 'fill-amber-500 text-amber-500' : ''} />
          Interested only
        </button>
      </div>

      {/* Grouped list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={28} />}
          heading="No exhibitors found"
          description="Add exhibitors or adjust your filters."
        />
      ) : (
        <div className="space-y-6">
          {CATEGORIES.filter((cat) => grouped[cat]?.length).map((cat) => (
            <section key={cat}>
              <h3 className="mb-3 flex items-center gap-2 font-sans text-[13px] font-semibold uppercase tracking-wider text-text-secondary">
                <span
                  className={[
                    'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                    CATEGORY_COLORS[cat],
                  ].join(' ')}
                >
                  {cat}
                </span>
                <span className="text-text-secondary/50">{grouped[cat].length}</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[cat].map((e) => (
                  <ExhibitorCard
                    key={e.id}
                    exhibitor={e}
                    onEdit={() => openEdit(e)}
                    onDelete={() => deleteExhibitor(trip.id, e.id)}
                    onToggleVisited={() => toggleExhibitorVisited(trip.id, e.id)}
                    onToggleInterested={() => toggleExhibitorInterested(trip.id, e.id)}
                  />
                ))}
              </div>
            </section>
          ))}
          {/* Ungrouped "Other" or unknown categories */}
          {grouped['Other']?.length && filterCategory !== 'All' ? null : null}
        </div>
      )}

      {/* Side panel */}
      <SidePanel
        open={panelOpen}
        title={editing ? 'Edit Exhibitor' : 'Add Exhibitor'}
        onClose={() => setPanelOpen(false)}
      >
        <div className="space-y-4 p-4">
          <Input
            label="Company Name"
            value={form.name}
            onChange={(e) => pf({ name: e.target.value })}
            placeholder="e.g. CrowdStrike"
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">Category</label>
            <select
              value={form.category}
              onChange={(e) => pf({ category: e.target.value as ExhibitorCategory })}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">Sponsor Tier</label>
            <select
              value={form.sponsorTier}
              onChange={(e) => pf({ sponsorTier: e.target.value as SponsorTier })}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              {SPONSOR_TIERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <Input
            label="Booth Number"
            value={form.boothNumber ?? ''}
            onChange={(e) => pf({ boothNumber: e.target.value })}
            placeholder="e.g. B12"
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => pf({ description: e.target.value })}
              rows={3}
              placeholder="What does this vendor do?"
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

          <Input
            label="Website"
            value={form.website}
            onChange={(e) => pf({ website: e.target.value })}
            placeholder="https://..."
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => pf({ notes: e.target.value })}
              rows={2}
              placeholder="Questions to ask, follow-ups…"
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={form.interested}
                onChange={(e) => pf({ interested: e.target.checked })}
                className="h-4 w-4 rounded accent-primary"
              />
              Interested
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={form.visited}
                onChange={(e) => pf({ visited: e.target.checked })}
                className="h-4 w-4 rounded accent-primary"
              />
              Visited
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="primary" size="sm" onClick={save} className="flex-1">
              {editing ? 'Save Changes' : 'Add Exhibitor'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </SidePanel>
    </div>
  )
}

interface CardProps {
  exhibitor: Exhibitor
  onEdit: () => void
  onDelete: () => void
  onToggleVisited: () => void
  onToggleInterested: () => void
}

function ExhibitorCard({ exhibitor: e, onEdit, onDelete, onToggleVisited, onToggleInterested }: CardProps) {
  return (
    <div
      className={[
        'group relative flex flex-col gap-2 rounded-card border bg-surface p-4 transition-shadow hover:shadow-sm',
        e.visited ? 'border-emerald-200 bg-emerald-50/30' : 'border-border',
      ].join(' ')}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-sans text-[14px] font-semibold text-text-primary">{e.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {e.sponsorTier && e.sponsorTier !== 'Other' && (
              <span className={['rounded border px-1.5 py-px text-[10px] font-semibold', TIER_COLORS[e.sponsorTier]].join(' ')}>
                {e.sponsorTier}
              </span>
            )}
            {e.boothNumber && (
              <span className="text-[11px] text-text-secondary">Booth {e.boothNumber}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className="rounded p-1 text-text-secondary hover:bg-black/5 hover:text-primary"
          >
            <Pencil size={13} />
          </button>
          <ConfirmInline onConfirm={onDelete} message={`Delete ${e.name}?`} />
        </div>
      </div>

      {/* Description */}
      {e.description && (
        <p className="line-clamp-2 text-[12px] leading-relaxed text-text-secondary">{e.description}</p>
      )}

      {/* Notes */}
      {e.notes && (
        <p className="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700">{e.notes}</p>
      )}

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onToggleInterested}
          title={e.interested ? 'Remove interest' : 'Mark interested'}
          className={[
            'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
            e.interested
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-border text-text-secondary hover:border-amber-300 hover:text-amber-600',
          ].join(' ')}
        >
          <Star size={10} className={e.interested ? 'fill-amber-500 text-amber-500' : ''} />
          {e.interested ? 'Interested' : 'Interest'}
        </button>

        <button
          type="button"
          onClick={onToggleVisited}
          title={e.visited ? 'Mark unvisited' : 'Mark visited'}
          className={[
            'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
            e.visited
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-border text-text-secondary hover:border-emerald-300 hover:text-emerald-600',
          ].join(' ')}
        >
          <Check size={10} />
          {e.visited ? 'Visited' : 'Visit'}
        </button>

        {e.website && (
          <a
            href={e.website}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            <ExternalLink size={10} />
            Website
          </a>
        )}
      </div>

    </div>
  )
}
