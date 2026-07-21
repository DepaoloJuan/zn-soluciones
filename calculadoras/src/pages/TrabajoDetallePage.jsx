import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTrabajo, updateTrabajo, enviarPresupuesto, getGastos, createGasto, deleteGasto } from '../lib/api'
import ConfirmModal from '../components/ConfirmModal'

const ESTADOS = ['evaluado', 'cotizado', 'enviado', 'aceptado', 'por_cobrar', 'cobrado', 'rechazado']

export default function TrabajoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trabajo, setTrabajo] = useState(null)
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [estadoInput, setEstadoInput] = useState('')
  const [fechaInput, setFechaInput] = useState('')
  const [formaPagoInput, setFormaPagoInput] = useState('')
  const [montoInput, setMontoInput] = useState('')
  const [senaInput, setSenaInput] = useState(false)
  const [gastosList, setGastosList] = useState([])
  const [concepto, setConcepto] = useState('')
  const [montoGasto, setMontoGasto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [creandoGasto, setCreandoGasto] = useState(false)
  const [gastoABorrar, setGastoABorrar] = useState(null)
  const [borrandoGasto, setBorrandoGasto] = useState(false)
  const [enviandoId, setEnviandoId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getTrabajo(id)
      setTrabajo(res.trabajo)
      setPresupuestos(res.presupuestos)
      setEstadoInput(res.trabajo.estado)
      setFechaInput(res.trabajo.fecha_trabajo ? res.trabajo.fecha_trabajo.slice(0, 10) : '')
      setFormaPagoInput(res.trabajo.forma_pago || '')
      setMontoInput(res.trabajo.monto_cobrado || '')
      setSenaInput(res.trabajo.sena_pagada || false)
      const gastosRes = await getGastos(id)
      setGastosList(gastosRes.gastos)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function handleGuardar() {
    setSaving(true)
    setError('')
    try {
      await updateTrabajo(id, {
        estado: estadoInput,
        fecha_trabajo: fechaInput || null,
        forma_pago: formaPagoInput || null,
        monto_cobrado: montoInput ? parseFloat(montoInput) : null,
        sena_pagada: senaInput,
      })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAgregarGasto(e) {
    e.preventDefault()
    setCreandoGasto(true)
    setError('')
    try {
      await createGasto({
        trabajo_id: id,
        concepto,
        monto: parseFloat(montoGasto),
        categoria: categoria || null,
      })
      setConcepto('')
      setMontoGasto('')
      setCategoria('')
      const gastosRes = await getGastos(id)
      setGastosList(gastosRes.gastos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreandoGasto(false)
    }
  }

  async function confirmarBorrarGasto() {
    setBorrandoGasto(true)
    try {
      await deleteGasto(gastoABorrar.id)
      setGastoABorrar(null)
      const gastosRes = await getGastos(id)
      setGastosList(gastosRes.gastos)
    } catch (err) {
      setError(err.message)
    } finally {
      setBorrandoGasto(false)
    }
  }

  async function handleEnviar(presupuestoId) {
    setEnviandoId(presupuestoId)
    try {
      await enviarPresupuesto(presupuestoId)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviandoId(null)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Cargando...</div>
  }

  if (!trabajo) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Trabajo no encontrado</div>
  }

  return (
    <div className="min-h-screen px-6 pt-28 pb-20 max-w-[700px] mx-auto">
      <button
        onClick={() => navigate('/trabajos')}
        className="text-nz-text2 text-sm mb-4 bg-transparent border-none cursor-pointer"
      >
        ← Volver a trabajos
      </button>

      <h1 className="text-2xl font-extrabold mb-1">{trabajo.nombre_cliente}</h1>
      {trabajo.descripcion && <p className="text-nz-text2 text-sm mb-6">{trabajo.descripcion}</p>}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-nz-surface border border-nz-border rounded-xl p-5 mb-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-nz-text2 mb-1.5">Estado</label>
          <select
            value={estadoInput}
            onChange={(e) => setEstadoInput(e.target.value)}
            className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-nz-text2 mb-1.5">Fecha del trabajo</label>
          <input
            type="date"
            value={fechaInput}
            onChange={(e) => setFechaInput(e.target.value)}
            className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
        </div>

        <div>
          <label className="block text-xs text-nz-text2 mb-1.5">Forma de pago</label>
          <select
            value={formaPagoInput}
            onChange={(e) => setFormaPagoInput(e.target.value)}
            className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          >
            <option value="">Sin especificar</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-nz-text2 mb-1.5">Monto cobrado</label>
          <input
            type="number"
            value={montoInput}
            onChange={(e) => setMontoInput(e.target.value)}
            placeholder="0"
            className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={senaInput}
            onChange={(e) => setSenaInput(e.target.checked)}
            className="w-4 h-4 accent-nz-green cursor-pointer"
          />
          Seña del 30% cobrada
        </label>

        <button
          onClick={handleGuardar}
          disabled={saving}
          className="bg-nz-green text-black font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving && (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          )}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <h2 className="text-lg font-bold mb-3">Presupuestos</h2>
      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden">
        {presupuestos.length === 0 && (
          <div className="p-6 text-center text-nz-text2 text-sm">
            Todavía no hay presupuestos para este trabajo.
          </div>
        )}
        {presupuestos.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0">
            <Link to={`/presupuestos/${p.id}`} className="flex-1 no-underline text-nz-text">
              <div className="text-sm font-medium capitalize">{p.category} · {p.m2} m²</div>
              <div className="text-xs text-nz-text2">
                ${p.total} {p.enviado_at ? `· enviado ${new Date(p.enviado_at).toLocaleDateString('es-AR')}` : '· sin enviar'}
              </div>
            </Link>
            {!p.enviado_at && (
              <button
                onClick={() => handleEnviar(p.id)}
                disabled={enviandoId === p.id}
                className="text-xs bg-nz-green text-black font-semibold rounded-lg px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
              >
                {enviandoId === p.id && (
                  <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                )}
                {enviandoId === p.id ? 'Enviando...' : 'Marcar enviado'}
              </button>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-3 mt-8">Gastos</h2>
      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden mb-4">
        {gastosList.length === 0 && (
          <div className="p-6 text-center text-nz-text2 text-sm">Todavía no hay gastos cargados.</div>
        )}
        {gastosList.map((g) => (
          <div key={g.id} className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0">
            <div>
              <div className="text-sm font-medium">{g.concepto}</div>
              {g.categoria && <div className="text-xs text-nz-text2">{g.categoria}</div>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono">${g.monto}</span>
              <button
                onClick={() => setGastoABorrar(g)}
                className="text-red-500 text-xs bg-transparent border-none cursor-pointer"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAgregarGasto} className="bg-nz-surface border border-nz-border rounded-xl p-5 mb-6 flex flex-col gap-3">
        <input
          placeholder="Concepto (ej: Placas de yeso)"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          required
          className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
        />
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Monto"
            value={montoGasto}
            onChange={(e) => setMontoGasto(e.target.value)}
            required
            className="flex-1 bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
          <input
            placeholder="Categoría (opcional)"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="flex-1 bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
        </div>
        <button
          type="submit"
          disabled={creandoGasto}
          className="bg-nz-green text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {creandoGasto && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          {creandoGasto ? 'Agregando...' : 'Agregar gasto'}
        </button>
      </form>

      {montoInput && (
        <div className="bg-nz-surface2 border border-nz-border rounded-xl px-5 py-4 mb-6 flex justify-between items-center">
          <span className="text-sm text-nz-text2">Ganancia neta</span>
          <span className="font-mono font-bold text-lg text-nz-green">
            ${(parseFloat(montoInput) - gastosList.reduce((acc, g) => acc + parseFloat(g.monto), 0)).toFixed(0)}
          </span>
        </div>
      )}

      <ConfirmModal
        open={!!gastoABorrar}
        title="Borrar gasto"
        message={`¿Seguro que querés borrar "${gastoABorrar?.concepto}"?`}
        confirmLabel="Borrar"
        danger
        loading={borrandoGasto}
        onConfirm={confirmarBorrarGasto}
        onCancel={() => setGastoABorrar(null)}
      />
    </div>
  )
}
