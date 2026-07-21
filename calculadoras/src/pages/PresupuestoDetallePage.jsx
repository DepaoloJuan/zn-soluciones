import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPresupuesto, getSetting, updatePresupuesto } from '../lib/api'
import { formatQty, formatNumber, calcQuantity, recommendMasilla, recommendCinta } from '../data/materials'

const formatCantidad = (r, materials) => {
  if (r.id === 'masilla' && materials.masillaRecomendacion?.length > 0) {
    return materials.masillaRecomendacion.map(b => `${b.cantidad} × ${b.label} (${b.kg} kg)`).join(' + ')
  }
  if (r.id === 'cinta' && materials.cintaRecomendacion?.length > 0) {
    return materials.cintaRecomendacion.map(b => `${b.cantidad} × ${b.label}`).join(' + ')
  }
  return `${formatQty(r.qty, r.unit)} ${r.unit === 'unidad' ? 'u.' : r.unit}`
}

export default function PresupuestoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [presupuesto, setPresupuesto] = useState(null)
  const [condiciones, setCondiciones] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(false)
  const [m2Edit, setM2Edit] = useState('')
  const [wasteEdit, setWasteEdit] = useState('')
  const [preciosEdit, setPreciosEdit] = useState({})
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getPresupuesto(id)
        setPresupuesto(res.presupuesto)
        setM2Edit(String(res.presupuesto.m2))
        setWasteEdit(String(res.presupuesto.waste))
        if (res.presupuesto.category !== 'libre') {
          if (!res.presupuesto.materials?.rows) {
            setError('Este presupuesto tiene datos incompletos (guardado con una versión anterior). Contactá al desarrollador para corregirlo.')
            setLoading(false)
            return
          }
          const precios = {}
          res.presupuesto.materials.rows.forEach((r) => { precios[r.id] = r.price })
          setPreciosEdit(precios)
        }

        if (res.presupuesto.category !== 'libre') {
          try {
            const cond = await getSetting(`condiciones_${res.presupuesto.category}`)
            setCondiciones(cond.value)
          } catch {
            setCondiciones('')
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleGuardarEdicion() {
    setGuardandoEdicion(true)
    setError('')
    try {
      const m2Num = parseFloat(m2Edit)
      const wasteNum = parseFloat(wasteEdit)
      const effectiveM2 = m2Num * (1 + wasteNum)

      let total = 0
      const newRows = presupuesto.materials.rows.map((r) => {
        const qty = calcQuantity(effectiveM2 * r.perM2, r.round)
        const price = preciosEdit[r.id] || 0
        const subtotal = qty * price
        total += subtotal
        return { ...r, qty, price, subtotal }
      })

      const masillaRow = newRows.find((r) => r.id === 'masilla')
      const cintaRow = newRows.find((r) => r.id === 'cinta')

      const newMaterials = {
        rows: newRows,
        masillaRecomendacion: masillaRow ? recommendMasilla(masillaRow.qty) : [],
        cintaRecomendacion: cintaRow ? recommendCinta(cintaRow.qty) : [],
      }

      const res = await updatePresupuesto(id, {
        m2: m2Num,
        waste: wasteNum,
        materials: newMaterials,
        total,
      })

      setPresupuesto(res.presupuesto)
      setEditando(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardandoEdicion(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Cargando...</div>
  }

  if (error || !presupuesto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32">
        <p className="text-red-500 text-sm mb-4">{error || 'Presupuesto no encontrado'}</p>
        <button onClick={() => navigate(-1)} className="text-nz-green text-sm bg-transparent border-none cursor-pointer">
          ← Volver
        </button>
      </div>
    )
  }

  if (presupuesto.category === 'libre') {
    const { cliente, descripcion, items, materiales, datosPago } = presupuesto.materials
    const fecha = new Date(presupuesto.enviado_at || presupuesto.created_at)

    return (
      <div className="max-w-[800px] mx-auto px-4 pb-20 pt-24">
        <div className="flex justify-between items-center mb-6 no-print">
          <button
            onClick={() => navigate(-1)}
            className="text-nz-text2 text-sm bg-transparent border-none cursor-pointer"
          >
            ← Volver
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-nz-green text-nz-bg font-semibold text-sm px-5 py-2.5 rounded-xl border-none cursor-pointer hover:bg-[#23d660] transition-all"
          >
            🖨️ Exportar PDF
          </button>
        </div>

        <div className="bg-white text-gray-900">
          <div className="px-8 py-6 flex items-center justify-between border-b-2 border-gray-200">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">Presupuesto</h1>
              <p className="text-sm text-gray-500 mt-1">
                {fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#1db954] to-[#1db954]/60 rounded-xl px-8 py-4 shadow-[0_0_32px_rgba(29,185,84,0.5)]">
              <img src="/logo.png" alt="NZ Soluciones" className="h-24 w-auto" />
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Presupuesto</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {cliente && (
                <div className="text-right">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cliente</div>
                  <div className="font-semibold text-gray-700">{cliente}</div>
                </div>
              )}
            </div>

            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="bg-[#1db954]">
                  <th className="text-left py-2.5 px-4 font-semibold text-white uppercase text-xs tracking-wider">Descripción</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-white uppercase text-xs tracking-wider">Jornal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#1db954]/10'}>
                    <td className="py-3 px-4 text-gray-800">{item.desc}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-gray-800">
                      {item.precio ? `$${formatNumber(parseFloat(item.precio))}` : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#1db954]/20">
                  <td className="py-3 px-4 font-bold text-gray-900">TOTAL</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">${formatNumber(presupuesto.total)}</td>
                </tr>
              </tbody>
            </table>

            {materiales.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Materiales a utilizar:</p>
                <ul className="list-disc list-inside space-y-1">
                  {materiales.map((mat, i) => (
                    <li key={i} className="text-sm text-gray-600">{mat}</li>
                  ))}
                </ul>
              </div>
            )}

            {descripcion && (
              <p className="text-sm text-gray-600 leading-relaxed mb-6">{descripcion}</p>
            )}
          </div>

          <div className="mx-8 mb-6 bg-[#1db954]/20 rounded-xl px-6 py-5 flex justify-between items-center">
            <div className="text-gray-900 font-bold text-base">TOTAL — MANO DE OBRA</div>
            <div className="text-[#1db954] font-mono font-extrabold text-3xl">${formatNumber(presupuesto.total)}</div>
          </div>

          <div className="mx-8 mb-8 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">Información para el pago</p>
              <p className="text-gray-600">Alias: <span className="font-medium text-gray-800">{datosPago.alias}</span></p>
              <p className="text-gray-600">Beneficiario: <span className="font-medium text-gray-800">{datosPago.beneficiario}</span></p>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">Datos de contacto</p>
              <p className="text-gray-600">11-6658-2889 Nicolas Zarate</p>
              <p className="text-gray-600">zaratediegonicolas@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { rows, masillaRecomendacion, cintaRecomendacion } = presupuesto.materials

  return (
    <div className="max-w-[800px] mx-auto px-4 pb-20 pt-24">
      <div className="flex justify-between items-center mb-6 no-print">
        <button
          onClick={() => navigate(-1)}
          className="text-nz-text2 text-sm bg-transparent border-none cursor-pointer"
        >
          ← Volver
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setEditando(!editando)}
            className="flex items-center gap-2 bg-nz-surface2 text-nz-text font-semibold text-sm px-5 py-2.5 rounded-xl border border-nz-border cursor-pointer hover:border-nz-green transition-all"
          >
            {editando ? 'Cancelar' : '✏️ Editar'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-nz-green text-nz-bg font-semibold text-sm px-5 py-2.5 rounded-xl border-none cursor-pointer hover:bg-[#23d660] transition-all"
          >
            🖨️ Exportar PDF
          </button>
        </div>
      </div>

      {editando && (
        <div className="bg-nz-surface border border-nz-border rounded-xl p-5 mb-6 no-print">
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-nz-text2 mb-1.5">m²</label>
              <input
                type="number"
                value={m2Edit}
                onChange={(e) => setM2Edit(e.target.value)}
                className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-nz-text2 mb-1.5">Desperdicio</label>
              <select
                value={wasteEdit}
                onChange={(e) => setWasteEdit(e.target.value)}
                className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
              >
                <option value="0">Sin desperdicio</option>
                <option value="0.05">5%</option>
                <option value="0.10">10%</option>
                <option value="0.15">15%</option>
                <option value="0.20">20%</option>
              </select>
            </div>
          </div>

          <label className="block text-xs text-nz-text2 mb-2">Precios unitarios</label>
          <div className="flex flex-col gap-2 mb-4">
            {presupuesto.materials.rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3">
                <span className="text-sm">{r.name}</span>
                <input
                  type="number"
                  value={preciosEdit[r.id] || ''}
                  onChange={(e) => setPreciosEdit((prev) => ({ ...prev, [r.id]: parseFloat(e.target.value) || 0 }))}
                  className="w-24 bg-nz-surface2 border border-nz-border rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:border-nz-green"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleGuardarEdicion}
            disabled={guardandoEdicion}
            className="w-full bg-nz-green text-black font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {guardandoEdicion && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      <div
        id="presupuesto-doc"
        className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.4)]"
      >
        <div className="bg-[#0a0c0f] px-8 py-6 flex items-center justify-between">
          <img src="/logo.png" alt="NZ Soluciones" className="h-14 w-auto" />
          <div className="text-right">
            <div className="text-white font-bold text-lg tracking-wide">NZ Soluciones</div>
            <div className="text-[#1db954] text-sm">Hacemos que funcione</div>
            <div className="text-gray-400 text-xs mt-1">WhatsApp: 1166582889</div>
          </div>
        </div>

        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Presupuesto</h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">
              {presupuesto.category} · {presupuesto.m2} m² · Desperdicio {presupuesto.waste * 100}%
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wider">
              {presupuesto.enviado_at ? 'Enviado' : 'Creado'}
            </div>
            <div className="font-semibold text-gray-700">
              {new Date(presupuesto.enviado_at || presupuesto.created_at).toLocaleDateString('es-AR')}
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">Material</th>
                <th className="text-center py-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">Cantidad</th>
                <th className="text-right py-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">Precio unit.</th>
                <th className="text-right py-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="py-3 text-center text-gray-600 font-mono">
                    {formatCantidad(r, { masillaRecomendacion, cintaRecomendacion })}
                  </td>
                  <td className="py-3 text-right text-gray-600 font-mono">
                    {r.price > 0 ? `$${formatNumber(r.price)}` : '—'}
                  </td>
                  <td className="py-3 text-right font-semibold font-mono text-gray-800">
                    {r.price > 0 ? `$${formatNumber(r.subtotal)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mx-8 mb-8 bg-[#0a0c0f] rounded-xl px-6 py-5 flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-base">TOTAL PRESUPUESTO</div>
            <div className="text-gray-400 text-xs mt-0.5">
              ${formatNumber(presupuesto.total / presupuesto.m2)} por m²
            </div>
          </div>
          <div className="text-[#1db954] font-mono font-extrabold text-3xl">
            ${formatNumber(presupuesto.total)}
          </div>
        </div>

        {condiciones && (
          <div className="mx-8 mb-6 bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 text-xs text-gray-600 leading-relaxed">
            <div className="font-semibold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">Condiciones</div>
            <ul className="list-disc list-inside space-y-1">
              {condiciones.split('\n').map((linea, i) => (
                <li key={i}>{linea}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
          Presupuesto generado por NZ Soluciones · nzsoluciones.web.app · Los precios pueden variar según disponibilidad de materiales.
        </div>
      </div>
    </div>
  )
}
