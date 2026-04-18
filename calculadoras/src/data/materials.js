export const CIELORRASO_MATERIALS = [
  { id: 'placas',     name: 'Placas de yeso (1,20×2,40)',        unit: 'unidad', color: '#1db954', perM2: 0.4,  round: 'ceil' },
  { id: 't2',         name: 'Tornillos T2',                       unit: 'unidad', color: '#8b5cf6', perM2: 10,   round: 'ceil' },
  { id: 't1',         name: 'Tornillos T1',                       unit: 'unidad', color: '#a855f7', perM2: 6,    round: 'ceil' },
  { id: 'montantes',  name: 'Montantes (2,60 m)',                 unit: 'unidad', color: '#06b6d4', perM2: 2.1,  round: 'ceil' },
  { id: 'soleras',    name: 'Soleras (2,60 m)',                   unit: 'unidad', color: '#14b8a6', perM2: 0.7,  round: 'ceil' },
  { id: 'cinta',      name: 'Cinta papel (juntas compartidas)',   unit: 'mt',     color: '#f59e0b', perM2: 2.5,  round: 'decimal' },
  { id: 'fijaciones', name: 'Fijaciones',                         unit: 'unidad', color: '#ef4444', perM2: 8,    round: 'ceil' },
  { id: 'masilla',    name: 'Masilla (juntas compartidas)',        unit: 'kg',     color: '#22c55e', perM2: 2.5,  round: 'decimal' },
]

// Placeholder — se completa cuando el amigo pase los ratios
export const TABIQUE_MATERIALS = []

export function calcQuantity(rawQty, roundType) {
  if (roundType === 'decimal') return Math.ceil(rawQty * 10) / 10
  return Math.ceil(rawQty)
}

export function formatQty(qty, unit) {
  if (unit === 'kg' || unit === 'mt') return qty.toFixed(1)
  return String(Math.ceil(qty))
}

export function formatNumber(n) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function buildSummaryText(type, m2, waste, materials, prices) {
  if (m2 <= 0) return ''
  const eff = m2 * (1 + waste)
  let total = 0
  const typeLabel = type === 'cielorraso' ? 'CIELORRASO' : 'TABIQUE'

  const lines = [
    `*PRESUPUESTO ${typeLabel} DURLOCK*`,
    `📐 ${m2} m² | Desperdicio: ${waste * 100}%`,
    `Tipo: Placa simple · Juntas compartidas`,
    '',
  ]

  materials.forEach((m) => {
    const qty = calcQuantity(eff * m.perM2, m.round)
    const price = prices[m.id] || 0
    const sub = qty * price
    total += sub
    const u = m.unit === 'unidad' ? 'u.' : m.unit
    lines.push(`• ${m.name}: *${formatQty(qty, m.unit)} ${u}*${price > 0 ? ' → $' + formatNumber(sub) : ''}`)
  })

  lines.push('', `💰 *TOTAL: $${formatNumber(total)}*`, `📊 Costo por m²: $${formatNumber(total / m2)}`, '', '_Calculado con NZ Soluciones_')
  return lines.join('\n')
}
