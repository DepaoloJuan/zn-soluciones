import { useState, useEffect } from 'react'
import { getTrabajos, getClientes, crearFlujoCompleto } from '../lib/api'
import { ESTADOS_TRABAJO_ABIERTOS } from '../lib/estados'

// Arma una descripción legible para el trabajo cuando se crea uno nuevo desde
// este modal (el formulario no pide descripción manual). crear_flujo_completo
// requiere trabajo_descripcion no vacío para poder crear el trabajo.
function descripcionTrabajo(presupuesto) {
  if (presupuesto.category === 'libre') {
    return presupuesto.materials?.descripcion?.trim() || 'Presupuesto libre'
  }
  const nombreCategoria = presupuesto.category === 'cielorraso' ? 'Cielorraso' : 'Tabique'
  return `${nombreCategoria} ${presupuesto.m2} m²`
}

export default function GuardarPresupuestoModal({
  open,
  onClose,
  buildPresupuesto,
  onSaved,
  preselectedClienteId,
  preselectedClienteNombre,
}) {
  const [trabajosList, setTrabajosList] = useState([])
  const [clientesList, setClientesList] = useState([])
  const [modo, setModo] = useState('existente')
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState('')
  const [modoCliente, setModoCliente] = useState('existente')
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [nombreClienteNuevo, setNombreClienteNuevo] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!open) return
    setSaveError('')
    getTrabajos()
      .then((res) => setTrabajosList(res.trabajos.filter((t) => ESTADOS_TRABAJO_ABIERTOS.includes(t.estado))))
      .catch((err) => setSaveError(err.message))
    getClientes()
      .then((res) => setClientesList(res.clientes))
      .catch(() => {})
  }, [open])

  if (!open) return null

  async function handleGuardar() {
    setSaving(true)
    setSaveError('')
    try {
      const presupuesto = buildPresupuesto()
      const esLibre = presupuesto.category === 'libre'
      const payload = {}

      if (modo === 'existente') {
        if (!trabajoSeleccionado) {
          setSaveError('Elegí un trabajo o creá uno nuevo')
          setSaving(false)
          return
        }
        payload.trabajo_id = Number(trabajoSeleccionado)
      } else {
        if (preselectedClienteId) {
          payload.cliente_id = preselectedClienteId
        } else if (modoCliente === 'existente') {
          if (!clienteSeleccionado) {
            setSaveError('Elegí un cliente o creá uno nuevo')
            setSaving(false)
            return
          }
          payload.cliente_id = Number(clienteSeleccionado)
        } else {
          if (!nombreClienteNuevo.trim()) {
            setSaveError('Ingresá el nombre del cliente')
            setSaving(false)
            return
          }
          payload.cliente_nombre = nombreClienteNuevo.trim()
        }

        payload.trabajo_descripcion = descripcionTrabajo(presupuesto)
      }

      // El backend recalcula el presupuesto a partir de categoria+m2+waste
      // (misma lógica que calcular_presupuesto), salvo en modo "libre" donde
      // ya viene armado con materials/total y no hay nada que recalcular.
      if (esLibre) {
        payload.categoria = 'libre'
        payload.materials = presupuesto.materials
        payload.total = presupuesto.total
      } else {
        payload.categoria = presupuesto.category
        payload.m2 = presupuesto.m2
        payload.waste = presupuesto.waste
      }

      const resultado = await crearFlujoCompleto(payload)

      onSaved(resultado.trabajo.id, resultado.presupuesto?.id)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 no-print" onClick={onClose}>
      <div
        className="bg-nz-surface border border-nz-border rounded-xl p-6 w-full max-w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Guardar presupuesto</h3>

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
            {saveError}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setModo('existente')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
              modo === 'existente' ? 'bg-nz-green text-black border-nz-green' : 'bg-nz-surface2 text-nz-text2 border-nz-border'
            }`}
          >
            Trabajo existente
          </button>
          <button
            onClick={() => setModo('nuevo')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
              modo === 'nuevo' ? 'bg-nz-green text-black border-nz-green' : 'bg-nz-surface2 text-nz-text2 border-nz-border'
            }`}
          >
            Trabajo nuevo
          </button>
        </div>

        {modo === 'existente' ? (
          <select
            value={trabajoSeleccionado}
            onChange={(e) => setTrabajoSeleccionado(e.target.value)}
            className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green mb-4"
          >
            <option value="">Elegí un trabajo...</option>
            {trabajosList.map((t) => (
              <option key={t.id} value={t.id}>{t.cliente_nombre} ({t.estado})</option>
            ))}
          </select>
        ) : preselectedClienteId ? (
          <div className="mb-4 text-sm text-nz-text2">
            Se va a crear un trabajo nuevo para <span className="text-nz-text font-medium">{preselectedClienteNombre}</span>.
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setModoCliente('existente')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  modoCliente === 'existente' ? 'bg-nz-green text-black border-nz-green' : 'bg-nz-surface2 text-nz-text2 border-nz-border'
                }`}
              >
                Cliente existente
              </button>
              <button
                onClick={() => setModoCliente('nuevo')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  modoCliente === 'nuevo' ? 'bg-nz-green text-black border-nz-green' : 'bg-nz-surface2 text-nz-text2 border-nz-border'
                }`}
              >
                Cliente nuevo
              </button>
            </div>

            {modoCliente === 'existente' ? (
              <select
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value)}
                className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
              >
                <option value="">Elegí un cliente...</option>
                {clientesList.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Nombre del cliente"
                value={nombreClienteNuevo}
                onChange={(e) => setNombreClienteNuevo(e.target.value)}
                className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
              />
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-nz-surface2 text-nz-text2 border border-nz-border"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-nz-green text-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
