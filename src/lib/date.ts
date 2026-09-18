/** Date helpers. All trip dates are stored as `YYYY-MM-DD` strings. */

export const toISODate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parses `YYYY-MM-DD` as a *local* date (avoids the UTC shift of `new Date(str)`). */
export const parseISODate = (s: string): Date | null => {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

export const todayISO = (): string => toISODate(new Date())

/** Inclusive list of `YYYY-MM-DD` between start and end. Capped at 60 days. */
export const dateRange = (start: string, end: string): string[] => {
  const s = parseISODate(start)
  const e = parseISODate(end)
  if (!s || !e || e < s) return s ? [toISODate(s)] : []
  const out: string[] = []
  const cursor = new Date(s)
  while (cursor <= e && out.length < 60) {
    out.push(toISODate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

/** "Mon 22 Sep" */
export const formatDayLabel = (iso: string): string => {
  const d = parseISODate(iso)
  if (!d) return iso
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** "22 Sep 2026" */
export const formatLongDate = (iso: string): string => {
  const d = parseISODate(iso)
  if (!d) return iso || '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "22 Sep 2026 → 25 Sep 2026" */
export const formatDateSpan = (start: string, end: string): string => {
  if (!start && !end) return 'Dates not set'
  if (!end) return formatLongDate(start)
  if (!start) return formatLongDate(end)
  return `${formatLongDate(start)} → ${formatLongDate(end)}`
}

/** `datetime-local` value → "22 Sep, 14:30" */
export const formatDateTime = (value: string): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatStamp = (iso: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const nightsBetween = (start: string, end: string): number => {
  const s = parseISODate(start)
  const e = parseISODate(end)
  if (!s || !e) return 0
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000))
}

/** 1-based month of a trip start date, or null. */
export const monthOf = (iso: string): number | null => {
  const d = parseISODate(iso)
  return d ? d.getMonth() + 1 : null
}
