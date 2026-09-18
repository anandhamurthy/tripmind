import type { Trip } from '../types'

/* ── Shared print helpers ───────────────────────────────────────────────── */

function printWindow(html: string, filename: string) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Please allow pop-ups to export PDF.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  // Give images / fonts a moment then print
  setTimeout(() => {
    win.print()
    // Don't close — user may cancel print and want to retry
  }, 400)
  // Set document title so "Save as PDF" uses a sensible filename
  win.document.title = filename
}

const BASE_STYLE = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
       color:#111;background:#fff;padding:28px 32px;font-size:13px;line-height:1.5}
  h1{font-family:Georgia,serif;font-size:26px;font-weight:700;margin-bottom:3px}
  h2{font-family:Georgia,serif;font-size:17px;font-weight:600;margin:18px 0 6px}
  h3{font-size:13px;font-weight:600;color:#444;margin:10px 0 4px}
  .meta{color:#666;font-size:12px;margin-bottom:18px}
  .badge{display:inline-block;border-radius:99px;padding:1px 7px;font-size:11px;font-weight:600}
  .badge-own{background:#E8F4EE;color:#16a34a;border:1px solid #bbf7d0}
  .badge-buy{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
  .divider{border:none;border-top:1px solid #e5e7eb;margin:14px 0}
  @media print{
    body{padding:12px 18px}
    .no-print{display:none}
    @page{margin:1.2cm 1.4cm}
  }
`

/* ── Checklist PDF ──────────────────────────────────────────────────────── */

export function exportChecklistPDF(trip: Trip) {
  const { eventName, startDate, endDate } = trip.basics
  const sections = trip.packing.sections
  const allItems = sections.flatMap((s) => s.items)
  const packed = allItems.filter((i) => i.packed).length
  const total = allItems.length
  const pct = total ? Math.round((packed / total) * 100) : 0
  const needToBuy = allItems.filter((i) => i.owned === false).length

  const sectionHTML = sections.map((sec) => {
    const secPacked = sec.items.filter((i) => i.packed).length
    const rows = sec.items.map((item) => {
      const qtyText = (item.qty ?? 1) > 1 ? `×${item.qty}` : ''
      const extraText = (item.additionalQty ?? 0) > 0 ? ` +${item.additionalQty} extra` : ''
      const ownedBadge =
        item.owned === true
          ? '<span class="badge badge-own">✓ Own</span>'
          : item.owned === false
            ? '<span class="badge badge-buy">🛒 Buy</span>'
            : ''
      const packedStyle = item.packed ? 'text-decoration:line-through;color:#9ca3af' : ''
      const checkStyle = item.packed
        ? 'background:#2563eb;border-color:#2563eb'
        : ''
      const checkMark = item.packed
        ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : ''
      return `
        <tr>
          <td style="width:22px;padding:5px 6px 5px 0;vertical-align:top">
            <div style="width:15px;height:15px;border:1.5px solid #9ca3af;border-radius:4px;display:flex;align-items:center;justify-content:center;${checkStyle}">
              ${checkMark}
            </div>
          </td>
          <td style="padding:5px 8px 5px 0;${packedStyle}">${item.label}</td>
          <td style="padding:5px 8px 5px 0;color:#6b7280;font-size:12px;white-space:nowrap">${qtyText}${extraText}</td>
          <td style="padding:5px 0;white-space:nowrap">${ownedBadge}</td>
          <td style="padding:5px 0 5px 8px;color:#9ca3af;font-size:11px">${item.note ?? ''}</td>
        </tr>`
    }).join('')

    return `
      <div style="margin-bottom:18px;page-break-inside:avoid">
        <div style="display:flex;align-items:center;gap:8px;border-bottom:1.5px solid #e5e7eb;padding-bottom:5px;margin-bottom:6px">
          <span style="font-family:Georgia,serif;font-size:15px;font-weight:700">${sec.name}</span>
          <span style="color:#9ca3af;font-size:11px">${secPacked}/${sec.items.length} packed</span>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tbody>${rows}</tbody>
        </table>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Packing Checklist — ${eventName}</title>
  <style>
    ${BASE_STYLE}
    .prog-track{background:#e5e7eb;border-radius:4px;height:8px;margin-bottom:20px}
    .prog-bar{background:#2563eb;height:8px;border-radius:4px;width:${pct}%}
  </style>
</head>
<body>
  <h1>Packing Checklist</h1>
  <p class="meta">
    ${eventName}
    ${startDate ? ` · ${startDate}` : ''}${endDate ? ` → ${endDate}` : ''}
    · <strong>${packed}/${total}</strong> packed (${pct}%)
    ${needToBuy > 0 ? ` · <span style="color:#d97706;font-weight:600">${needToBuy} to buy</span>` : ''}
  </p>
  <div class="prog-track"><div class="prog-bar"></div></div>
  ${sectionHTML}
</body>
</html>`

  printWindow(html, `Packing Checklist — ${eventName}.pdf`)
}

/* ── Day Plan PDF ───────────────────────────────────────────────────────── */

const TIME_BG: Record<string, string> = {
  Morning:   'background:#fffbeb;color:#d97706;border:1px solid #fde68a',
  Afternoon: 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe',
  Evening:   'background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe',
  Night:     'background:#f1f5f9;color:#475569;border:1px solid #cbd5e1',
  'All Day': 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0',
}

function timeStyle(t: string) {
  return TIME_BG[t] ?? 'background:#f3f4f6;color:#374151;border:1px solid #e5e7eb'
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function exportDayPlanPDF(trip: Trip) {
  const { eventName, startDate, endDate } = trip.basics
  const days = trip.dayPlan?.days ?? []

  const daysHTML = days.map((day) => {
    const slotsHTML = day.slots.map((slot) => {
      const itemsHTML = slot.items.map((item) =>
        `<span style="display:inline-flex;align-items:center;gap:4px;border:1px solid #e5e7eb;border-radius:99px;padding:2px 10px;font-size:12px;margin:2px">
          ${item.label}
          ${item.qty > 1 ? `<strong style="font-size:11px;color:#2563eb">×${item.qty}</strong>` : ''}
        </span>`
      ).join(' ')

      return `
        <div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start">
          <span style="flex-shrink:0;border-radius:99px;padding:2px 10px;font-size:11px;font-weight:600;${timeStyle(slot.time)}">${slot.time}</span>
          <div>
            <div style="font-weight:600;font-size:13px;margin-bottom:4px">${slot.location}</div>
            <div style="display:flex;flex-wrap:wrap;gap:2px">${itemsHTML || '<span style="color:#9ca3af;font-size:12px;font-style:italic">No items</span>'}</div>
          </div>
        </div>`
    }).join('')

    return `
      <div style="margin-bottom:22px;page-break-inside:avoid">
        <div style="display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #111;padding-bottom:5px;margin-bottom:10px">
          <span style="font-family:Georgia,serif;font-size:18px;font-weight:700">${day.label}</span>
          ${day.date ? `<span style="color:#6b7280;font-size:12px">${fmtDate(day.date)}</span>` : ''}
        </div>
        ${slotsHTML || '<p style="color:#9ca3af;font-style:italic;font-size:12px">No slots planned.</p>'}
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Day Plan — ${eventName}</title>
  <style>${BASE_STYLE}</style>
</head>
<body>
  <h1>Day Plan</h1>
  <p class="meta">
    ${eventName}
    ${startDate ? ` · ${startDate}` : ''}${endDate ? ` → ${endDate}` : ''}
    · ${days.length} day${days.length !== 1 ? 's' : ''}
  </p>
  <hr class="divider" style="margin-bottom:20px">
  ${daysHTML}
</body>
</html>`

  printWindow(html, `Day Plan — ${eventName}.pdf`)
}
