import { useState, useEffect, useMemo } from 'react'
import { calcQuantity, formatQty, formatNumber, buildSummaryText } from '../data/materials'

const WASTE_OPTIONS = [
  { value: 0, label: 'Sin desperdicio' },
  { value: 0.05, label: '5%' },
  { value: 0.10, label: '10%' },
  { value: 0.15, label: '15%' },
  { value: 0.20, label: '20%' },
]

const QUICK_M2 = [10, 20, 30, 50, 100]

export default function Calculator({ type, title, subtitle, materials, storageKey }) {
  const [m2, setM2] = useState('')
  const [waste, setWaste] = useState(0.10)
  const [prices, setPrices] = useState({})
  const [copied, setCopied] = useState(false)

  // Load saved prices
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setPrices(JSON.parse(saved))
    } catch {}
  }, [storageKey])

  // Save prices on change
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(prices)) } catch {}
  }, [prices, storageKey])

  const m2Num = parseFloat(m2) || 0
  const effectiveM2 = m2Num * (1 + waste)

  const results = useMemo(() => {
    if (m2Num <= 0) return null
    let total = 0
    const rows = materials.map((mat) => {
      const qty = calcQuantity(effectiveM2 * mat.perM2, mat.round)
      const price = prices[mat.id] || 0
      const subtotal = qty * price
      total += subtotal
      return { ...mat, qty, price, subtotal }
    })
    return { rows, total }
  }, [m2Num, effectiveM2, materials, prices])

  useEffect(() => {
    if (!results) return
    try {
      localStorage.setItem('nz_last_budget', JSON.stringify({
        type,
        title,
        m2: m2Num,
        waste,
        rows: results.rows,
        total: results.total,
        date: new Date().toLocaleDateString('es-AR'),
      }))
    } catch {}
  }, [results])

  function updatePrice(id, value) {
    setPrices((prev) => ({ ...prev, [id]: parseFloat(value) || 0 }))
  }

  function reset() {
    setM2('')
    setWaste(0.10)
    setPrices({})
  }

  function copyToClipboard() {
    const text = buildSummaryText(type, m2Num, waste, materials, prices)
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function getWhatsAppLink() {
    const text = buildSummaryText(type, m2Num, waste, materials, prices)
    return `https://wa.me/?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 pb-20">
      {/* Page header */}
      <div className="pt-24 pb-8 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(29,185,84,0.06)_0%,transparent_70%)] pointer-events-none" />
        <a href="https://nzsoluciones.web.app" className="relative inline-flex items-center gap-1.5 text-nz-text2 no-underline text-[13px] mb-5 hover:text-nz-green transition-colors">
          ← Volver al inicio
        </a>
        <h1 className="relative text-[clamp(28px,5vw,42px)] font-extrabold tracking-tight mb-2">{title}</h1>
        <p className="relative text-nz-text2 text-base">{subtitle}</p>
      </div>

      {/* M² input */}
      <div className="bg-nz-surface border border-nz-border rounded-xl p-7 mb-4 animate-[fade-up_0.4s_ease_both]">
        <div className="font-mono text-[11px] tracking-[3px] uppercase text-nz-text2 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-nz-green rounded-full shadow-[0_0_8px_var(--color-nz-green)]" />
          Superficie a cubrir
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center bg-nz-surface2 border-2 border-nz-border rounded-xl p-1 transition-all focus-within:border-nz-green focus-within:shadow-[0_0_0_4px_var(--color-nz-green-glow)]">
            <input
              type="number"
              value={m2}
              onChange={(e) => setM2(e.target.value)}
              placeholder="0"
              min="0"
              step="0.5"
              className="bg-transparent border-none text-nz-text font-mono text-[28px] font-bold w-[120px] text-center outline-none p-2 placeholder:text-nz-border-light"
            />
            <span className="font-mono text-base text-nz-text2 pr-3">m²</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4 justify-center flex-wrap">
          {QUICK_M2.map((v) => (
            <button
              key={v}
              onClick={() => setM2(String(v))}
              className="bg-nz-surface2 border border-nz-border rounded-lg text-nz-text2 text-[13px] px-3.5 py-1.5 cursor-pointer transition-all hover:bg-nz-green hover:text-nz-bg hover:border-nz-green"
            >
              {v} m²
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-4 justify-center flex-wrap">
          <label className="text-sm text-nz-text2">Desperdicio:</label>
          <select
            value={waste}
            onChange={(e) => setWaste(parseFloat(e.target.value))}
            className="bg-nz-surface2 border border-nz-border rounded-lg text-nz-text text-sm py-2 px-3 outline-none cursor-pointer focus:border-nz-green"
          >
            {WASTE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Prices */}
      <div className="bg-nz-surface border border-nz-border rounded-xl p-7 mb-4 animate-[fade-up_0.4s_ease_both_0.06s]">
        <div className="font-mono text-[11px] tracking-[3px] uppercase text-nz-text2 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-nz-green rounded-full shadow-[0_0_8px_var(--color-nz-green)]" />
          Precios unitarios
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-0 text-sm">
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-nz-text2 px-3 py-2 border-b border-nz-border">Material</div>
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-nz-text2 px-3 py-2 border-b border-nz-border">Precio</div>
          <div className="font-mono text-[10px] tracking-[2px] uppercase text-nz-text2 px-3 py-2 border-b border-nz-border hidden sm:block">Unidad</div>
        </div>

        {/* Rows */}
        {materials.map((mat) => (
          <div key={mat.id} className="grid grid-cols-[1fr_auto_auto] gap-0 text-sm">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-nz-border/50 font-medium">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: mat.color }} />
              {mat.name}
            </div>
            <div className="flex items-center px-3 py-2.5 border-b border-nz-border/50">
              <input
                type="number"
                value={prices[mat.id] || ''}
                onChange={(e) => updatePrice(mat.id, e.target.value)}
                placeholder="0"
                min="0"
                className="bg-nz-surface2 border border-nz-border rounded-lg text-nz-text font-mono text-[13px] py-1.5 px-2.5 w-[110px] text-right outline-none transition-all focus:border-nz-green focus:shadow-[0_0_0_3px_var(--color-nz-green-glow)]"
              />
            </div>
            <div className="items-center px-3 py-2.5 border-b border-nz-border/50 hidden sm:flex">
              <span className="text-[11px] text-nz-text2 ml-1">/ {mat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="bg-nz-surface border border-nz-border rounded-xl p-7 animate-[fade-up_0.4s_ease_both_0.12s]">
        <div className="font-mono text-[11px] tracking-[3px] uppercase text-nz-text2 mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-nz-green rounded-full shadow-[0_0_8px_var(--color-nz-green)]" />
          Detalle de materiales
        </div>

        {!results ? (
          <div className="text-center py-10 text-nz-text2">
            <div className="text-5xl mb-3 opacity-30">📐</div>
            <p>Ingresá los m² para calcular</p>
          </div>
        ) : (
          <>
            {/* Results header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-0 text-sm">
              <div className="font-mono text-[10px] tracking-[2px] uppercase text-nz-text2 px-3 py-2 border-b border-nz-border">Material</div>
              <div className="font-mono text-[10px] tracking-[2px] uppercase text-nz-text2 px-3 py-2 border-b border-nz-border">Cantidad</div>
              <div className="font-mono text-[10px] tracking-[2px] uppercase text-nz-text2 px-3 py-2 border-b border-nz-border text-right">Subtotal</div>
            </div>

            {results.rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_auto_auto] gap-0 text-sm">
                <div className="flex items-center gap-2 px-3 py-3 border-b border-nz-border/50 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  {r.name}
                </div>
                <div className="flex items-center px-3 py-3 border-b border-nz-border/50 font-mono font-bold text-nz-green">
                  {formatQty(r.qty, r.unit)} {r.unit === 'unidad' ? 'u.' : r.unit}
                </div>
                <div className="flex items-center justify-end px-3 py-3 border-b border-nz-border/50 font-mono font-semibold">
                  {r.price > 0 ? `$${formatNumber(r.subtotal)}` : '—'}
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center bg-gradient-to-br from-nz-green/8 to-nz-green/3 border border-nz-green/25 rounded-xl px-6 py-5 mt-5">
              <div className="text-base font-semibold text-nz-green">TOTAL PRESUPUESTO</div>
              <div className="text-right">
                <div className="font-mono text-[28px] font-bold text-nz-green">
                  ${formatNumber(results.total)}
                </div>
                {m2Num > 0 && (
                  <div className="text-[13px] text-nz-text2 mt-0.5">
                    ${formatNumber(results.total / m2Num)} / m²
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-5 flex-wrap no-print">
        <button
          onClick={copyToClipboard}
          disabled={!results}
          className="flex-1 min-w-[140px] px-5 py-3.5 rounded-xl bg-nz-green text-nz-bg font-semibold text-sm border-none cursor-pointer transition-all hover:bg-[#23d660] disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2"
        >
          {copied ? '✅ Copiado' : '📋 Copiar resumen'}
        </button>

        <a
          href={results ? getWhatsAppLink() : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 min-w-[140px] px-5 py-3.5 rounded-xl bg-nz-wa text-white font-semibold text-sm no-underline transition-all flex items-center justify-center gap-2 ${
            !results ? 'opacity-40 pointer-events-none' : 'hover:bg-[#20bd5a] hover:-translate-y-0.5'
          }`}
        >
          💬 Enviar por WhatsApp
        </a>

        <button
          onClick={() => window.print()}
          className="flex-1 min-w-[140px] px-5 py-3.5 rounded-xl bg-nz-surface2 text-nz-text font-semibold text-sm border border-nz-border cursor-pointer transition-all hover:border-nz-green flex items-center justify-center gap-2"
        >
          🖨️ Imprimir
        </button>

        <button
          onClick={reset}
          className="flex-1 min-w-[140px] px-5 py-3.5 rounded-xl bg-nz-red/10 text-nz-red font-semibold text-sm border border-nz-red/25 cursor-pointer transition-all hover:bg-nz-red/[0.18] flex items-center justify-center gap-2"
        >
          ↺ Limpiar
        </button>
      </div>
    </div>
  )
}
