import { useState } from 'react'
import { Flag, Pencil, Plus, Star, Target } from 'lucide-react'
import type { CompetitorClaim, CompetitiveStatus, CompetitiveTopic, MEProduct } from '../../types'
import { useActiveTrip, useTripStore } from '../../store/useTripStore'
import Button from '../shared/Button'
import Input from '../shared/Input'
import EmptyState from '../shared/EmptyState'
import ConfirmInline from '../shared/ConfirmInline'
import SidePanel from '../layout/SidePanel'

const TOPICS: CompetitiveTopic[] = [
  'NHI', 'GRC & Compliance', 'Zero Trust', 'AI & Agentic',
  'Cloud IGA', 'TPRM', 'PQC', 'Privileged Access', 'Other',
]

const ME_PRODUCTS: MEProduct[] = [
  'ADManager Plus', 'PAM360', 'Identity360', 'AD360', 'ADAudit Plus', 'Multiple', 'None',
]

const STATUS_CONFIG: Record<CompetitiveStatus, { label: string; color: string; bg: string; dot: string }> = {
  'Have It': { label: 'Have It', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  'Enhance':  { label: 'Enhance', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-500'   },
  'Gap':      { label: 'Gap',     color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',     dot: 'bg-rose-500'    },
}

const TOPIC_COLORS: Record<CompetitiveTopic, string> = {
  'NHI':             'bg-violet-100 text-violet-700',
  'GRC & Compliance':'bg-orange-100 text-orange-700',
  'Zero Trust':      'bg-sky-100 text-sky-700',
  'AI & Agentic':    'bg-purple-100 text-purple-700',
  'Cloud IGA':       'bg-teal-100 text-teal-700',
  'TPRM':            'bg-rose-100 text-rose-700',
  'PQC':             'bg-indigo-100 text-indigo-700',
  'Privileged Access':'bg-amber-100 text-amber-700',
  'Other':           'bg-slate-100 text-slate-600',
}

const emptyForm = (): Omit<CompetitorClaim, 'id' | 'timestamp'> => ({
  competitor: '',
  claim: '',
  topic: 'Other',
  status: 'Have It',
  meProduct: 'ADManager Plus',
  ourResponse: '',
  notes: '',
  starred: false,
})

export default function CompetitiveTab() {
  const trip = useActiveTrip()
  const { addClaim, updateClaim, deleteClaim, toggleClaimStarred } = useTripStore()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CompetitiveStatus | 'All'>('All')
  const [filterTopic, setFilterTopic] = useState<CompetitiveTopic | 'All'>('All')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<CompetitorClaim | null>(null)
  const [form, setForm] = useState(emptyForm())

  if (!trip) return null

  const all = trip.competitive?.claims ?? []
  const haveCount = all.filter((c) => c.status === 'Have It').length
  const enhanceCount = all.filter((c) => c.status === 'Enhance').length
  const gapCount = all.filter((c) => c.status === 'Gap').length
  const starredCount = all.filter((c) => c.starred).length

  const filtered = all.filter((c) => {
    const matchSearch =
      !search ||
      c.competitor.toLowerCase().includes(search.toLowerCase()) ||
      c.claim.toLowerCase().includes(search.toLowerCase()) ||
      c.topic.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || c.status === filterStatus
    const matchTopic = filterTopic === 'All' || c.topic === filterTopic
    return matchSearch && matchStatus && matchTopic
  })

  const starred = filtered.filter((c) => c.starred)
  const rest = filtered.filter((c) => !c.starred)

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setPanelOpen(true) }
  const openEdit = (c: CompetitorClaim) => { setEditing(c); setForm({ ...c }); setPanelOpen(true) }

  const save = () => {
    if (!form.competitor.trim() || !form.claim.trim()) return
    if (editing) updateClaim(trip.id, editing.id, form)
    else addClaim(trip.id, form)
    setPanelOpen(false)
  }

  const pf = (updates: Partial<typeof form>) => setForm((f) => ({ ...f, ...updates }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-text-primary">Competitive Intel</h2>
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            <span className="text-emerald-600 font-medium">{haveCount} Have It</span>
            <span className="text-amber-600 font-medium">{enhanceCount} Enhance</span>
            <span className="text-rose-600 font-medium">{gapCount} Gaps</span>
            {starredCount > 0 && <span className="text-amber-500 font-medium">{starredCount} starred</span>}
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <Plus size={15} />
          Log Claim
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search competitor, claim, topic…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <div className="flex gap-1.5">
          {(['All', 'Have It', 'Enhance', 'Gap'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={[
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filterStatus === s
                  ? s === 'All'
                    ? 'border-primary bg-primary text-white'
                    : s === 'Have It'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : s === 'Enhance'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-rose-500 bg-rose-500 text-white'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-primary',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value as CompetitiveTopic | 'All')}
          className="rounded-control border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:border-primary focus:outline-none"
        >
          <option value="All">All topics</option>
          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Claims */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Target size={28} />}
          heading="No claims logged yet"
          subtext="When a competitor mentions a feature, log it here to track Have It / Enhance / Gap."
        />
      ) : (
        <div className="space-y-6">
          {starred.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-amber-600">
                <Star size={13} className="fill-amber-500 text-amber-500" />
                Starred — For Product Team
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {starred.map((c) => (
                  <ClaimCard
                    key={c.id}
                    claim={c}
                    onEdit={() => openEdit(c)}
                    onDelete={() => deleteClaim(trip.id, c.id)}
                    onToggleStar={() => toggleClaimStarred(trip.id, c.id)}
                  />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {starred.length > 0 && (
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-text-secondary">
                  All Claims
                </h3>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((c) => (
                  <ClaimCard
                    key={c.id}
                    claim={c}
                    onEdit={() => openEdit(c)}
                    onDelete={() => deleteClaim(trip.id, c.id)}
                    onToggleStar={() => toggleClaimStarred(trip.id, c.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Side panel */}
      <SidePanel
        open={panelOpen}
        title={editing ? 'Edit Claim' : 'Log Competitor Claim'}
        onClose={() => setPanelOpen(false)}
      >
        <div className="space-y-4 p-4">
          <Input
            label="Competitor"
            value={form.competitor}
            onChange={(e) => pf({ competitor: e.target.value })}
            placeholder="e.g. SailPoint, CyberArk"
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">Their Claim</label>
            <textarea
              value={form.claim}
              onChange={(e) => pf({ claim: e.target.value })}
              rows={3}
              placeholder="What did they say or demo?"
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">Topic</label>
            <select
              value={form.topic}
              onChange={(e) => pf({ topic: e.target.value as CompetitiveTopic })}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">ME Status</label>
            <div className="flex gap-2">
              {(['Have It', 'Enhance', 'Gap'] as CompetitiveStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => pf({ status: s })}
                  className={[
                    'flex-1 rounded-control border py-1.5 text-xs font-semibold transition-colors',
                    form.status === s
                      ? STATUS_CONFIG[s].bg + ' ' + STATUS_CONFIG[s].color + ' border-current'
                      : 'border-border text-text-secondary hover:border-primary/50',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">ME Product</label>
            <select
              value={form.meProduct}
              onChange={(e) => pf({ meProduct: e.target.value as MEProduct })}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              {ME_PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">Our Response</label>
            <textarea
              value={form.ourResponse}
              onChange={(e) => pf({ ourResponse: e.target.value })}
              rows={3}
              placeholder="How did you respond, or what should the response be?"
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-text-primary">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => pf({ notes: e.target.value })}
              rows={2}
              placeholder="Context, follow-up actions, product team feedback…"
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={form.starred}
              onChange={(e) => pf({ starred: e.target.checked })}
              className="h-4 w-4 rounded accent-primary"
            />
            <Star size={13} className={form.starred ? 'fill-amber-500 text-amber-500' : 'text-text-secondary'} />
            Flag for product team
          </label>

          <div className="flex gap-2 pt-2">
            <Button variant="primary" size="sm" onClick={save} className="flex-1">
              {editing ? 'Save Changes' : 'Log Claim'}
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
  claim: CompetitorClaim
  onEdit: () => void
  onDelete: () => void
  onToggleStar: () => void
}

function ClaimCard({ claim: c, onEdit, onDelete, onToggleStar }: CardProps) {
  const cfg = STATUS_CONFIG[c.status]
  return (
    <div
      className={[
        'group relative flex flex-col gap-2.5 rounded-card border p-4 transition-shadow hover:shadow-sm',
        cfg.bg,
      ].join(' ')}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-sans text-[13px] font-semibold text-text-primary">{c.competitor}</span>
            <span className={['rounded px-1.5 py-px text-[10px] font-semibold', TOPIC_COLORS[c.topic]].join(' ')}>
              {c.topic}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <span className={['h-1.5 w-1.5 rounded-full', cfg.dot].join(' ')} />
            <span className={['text-[11px] font-semibold', cfg.color].join(' ')}>{c.status}</span>
            {c.meProduct !== 'None' && (
              <span className="ml-1 text-[11px] text-text-secondary">· {c.meProduct}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onToggleStar}
            title={c.starred ? 'Unstar' : 'Flag for product team'}
            className="rounded p-1 text-text-secondary hover:bg-black/5 hover:text-amber-500"
          >
            <Star size={13} className={c.starred ? 'fill-amber-500 text-amber-500' : ''} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className="rounded p-1 text-text-secondary hover:bg-black/5 hover:text-primary"
          >
            <Pencil size={13} />
          </button>
          <ConfirmInline onConfirm={onDelete} message={`Delete this claim?`} />
        </div>
      </div>

      {/* Their claim */}
      <p className="text-[12px] font-medium leading-relaxed text-text-primary">
        <span className="mr-1 text-text-secondary">They said:</span>
        {c.claim}
      </p>

      {/* Our response */}
      {c.ourResponse && (
        <p className="rounded bg-white/60 px-2 py-1.5 text-[11px] leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">ME: </span>
          {c.ourResponse}
        </p>
      )}

      {/* Notes */}
      {c.notes && (
        <p className="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700">{c.notes}</p>
      )}

      {c.starred && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
          <Flag size={10} />
          Product team feedback
        </div>
      )}
    </div>
  )
}
