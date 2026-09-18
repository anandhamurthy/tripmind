import { useMemo, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { ME_PRODUCT_META, PRODUCT_FEATURES } from '../../data/meProducts'
import type { MEProductKey } from '../../data/meProducts'
import Input from '../shared/Input'

const ALL_PRODUCTS = Object.keys(ME_PRODUCT_META) as MEProductKey[]

const ALL_TAGS = [
  'NHI', 'GRC & Compliance', 'Zero Trust', 'AI & Agentic',
  'Cloud IGA', 'Privileged Access', 'TPRM', 'PQC', 'IGA',
  'Endpoint', 'Data Security', 'Threat Intelligence', 'DevSecOps',
]

export default function ProductsTab() {
  const [search, setSearch] = useState('')
  const [activeProduct, setActiveProduct] = useState<MEProductKey | 'All'>('All')
  const [activeTag, setActiveTag] = useState<string>('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return PRODUCT_FEATURES.filter((f) => {
      const matchProduct = activeProduct === 'All' || f.product === activeProduct
      const matchTag = activeTag === 'All' || f.tags.includes(activeTag)
      const matchSearch =
        !q ||
        f.feature.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
      return matchProduct && matchTag && matchSearch
    })
  }, [search, activeProduct, activeTag])

  // Group by product → category
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, typeof filtered>> = {}
    for (const f of filtered) {
      if (!map[f.product]) map[f.product] = {}
      if (!map[f.product][f.category]) map[f.product][f.category] = []
      map[f.product][f.category].push(f)
    }
    return map
  }, [filtered])

  const productOrder: MEProductKey[] = activeProduct === 'All'
    ? ALL_PRODUCTS.filter((p) => grouped[p])
    : [activeProduct]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-semibold text-text-primary">ME Product Features</h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          {filtered.length} features across {Object.keys(grouped).length} products — searchable reference for competitive conversations
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search feature, capability, keyword…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md"
      />

      {/* Product filter */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(['All', ...ALL_PRODUCTS] as const).map((p) => {
            const meta = p === 'All' ? null : ME_PRODUCT_META[p]
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActiveProduct(p)}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  activeProduct === p
                    ? p === 'All'
                      ? 'border-primary bg-primary text-white'
                      : meta!.bg + ' ' + meta!.color + ' border-current'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-primary',
                ].join(' ')}
              >
                {p === 'All' ? 'All Products' : ME_PRODUCT_META[p].name}
              </button>
            )
          })}
        </div>

        {/* Topic tag filter */}
        <div className="flex flex-wrap gap-1.5">
          {(['All', ...ALL_TAGS]).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={[
                'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                activeTag === tag
                  ? 'border-slate-600 bg-slate-700 text-white'
                  : 'border-border bg-surface text-text-secondary hover:border-slate-400 hover:text-slate-700',
              ].join(' ')}
            >
              {tag === 'All' ? 'All topics' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-text-secondary">
          <BookOpen size={28} className="opacity-40" />
          <p className="text-sm">No features match your search.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {productOrder.map((productKey) => {
            const meta = ME_PRODUCT_META[productKey]
            const categories = grouped[productKey]
            if (!categories) return null
            return (
              <section key={productKey}>
                {/* Product heading */}
                <div className={['mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1', meta.bg].join(' ')}>
                  <span className={['text-[13px] font-bold', meta.color].join(' ')}>{meta.name}</span>
                  <span className={['text-[11px] opacity-70', meta.color].join(' ')}>
                    {Object.values(categories).flat().length} features
                  </span>
                </div>

                <div className="space-y-5">
                  {Object.entries(categories).map(([category, features]) => (
                    <div key={category}>
                      <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-text-secondary">
                        {category}
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feat) => (
                          <div
                            key={feat.id}
                            className="rounded-card border border-border bg-surface p-3 transition-shadow hover:shadow-sm"
                          >
                            <p className="text-[13px] font-semibold text-text-primary leading-snug">
                              {feat.feature}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                              {feat.description}
                            </p>
                            {feat.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {feat.tags.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => { setActiveTag(tag); setActiveProduct('All') }}
                                    className="rounded bg-slate-100 px-1.5 py-px text-[10px] text-slate-600 hover:bg-slate-200"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
