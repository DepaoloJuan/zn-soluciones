import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GuardarPresupuestoModal from '../components/GuardarPresupuestoModal'
import { uploadArchivo } from '../lib/api'
import { DATOS_PAGO } from '../data/datosPago'

const MAX_ARCHIVO_BYTES = 20 * 1024 * 1024 // 20 MB, debe coincidir con el límite del backend

export default function ImportarPresupuestoPage() {
  const navigate = useNavigate()
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [error, setError] = useState('')
  const [trabajoGuardadoId, setTrabajoGuardadoId] = useState(null)

  const montoNum = parseFloat(monto) || 0

  function abrirModalGuardar() {
    setError('')
    if (!descripcion.trim()) {
      setError('Ingresá una descripción breve del presupuesto')
      return
    }
    if (montoNum <= 0) {
      setError('Ingresá el monto del presupuesto')
      return
    }
    setShowSaveModal(true)
  }

  async function handleSaved(trabajoId, presupuestoId) {
    setShowSaveModal(false)

    if (archivo) {
      try {
        await uploadArchivo(trabajoId, archivo, { presupuestoId })
      } catch (err) {
        // El presupuesto ya se guardó igual; avisamos y dejamos que el
        // usuario decida cuándo pasar a la ficha del trabajo para reintentar
        // la subida desde ahí, en vez de navegar y perder este mensaje.
        setTrabajoGuardadoId(trabajoId)
        setError(`El presupuesto se guardó, pero el archivo no se pudo subir: ${err.message}. Podés reintentarlo desde la ficha del trabajo.`)
        return
      }
    }
    navigate(`/trabajos/${trabajoId}`)
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 pb-20 pt-24">
      <h1 className="text-2xl font-extrabold mb-1">Cargar presupuesto ya enviado</h1>
      <p className="text-nz-text2 text-sm mb-6">
        Para presupuestos que ya armaste y enviaste por fuera de la app. Elegí o creá el cliente,
        cargá el monto y, si lo tenés, subí el PDF que ya mandaste.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
          {trabajoGuardadoId && (
            <button
              onClick={() => navigate(`/trabajos/${trabajoGuardadoId}`)}
              className="block mt-2 text-nz-green font-medium bg-transparent border-none cursor-pointer p-0 underline"
            >
              Ir a la ficha del trabajo →
            </button>
          )}
        </div>
      )}

      <div className="bg-nz-surface border border-nz-border rounded-xl p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-nz-text2 mb-1.5">Descripción</label>
          <input
            type="text"
            placeholder="Ej: Cielorraso living + dormitorio"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
        </div>

        <div>
          <label className="block text-xs text-nz-text2 mb-1.5">Monto total</label>
          <input
            type="number"
            placeholder="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
        </div>

        <div>
          <label className="block text-xs text-nz-text2 mb-1.5">PDF que ya enviaste (opcional)</label>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              if (file && file.size > MAX_ARCHIVO_BYTES) {
                setError(`El archivo supera el tamaño máximo permitido (${MAX_ARCHIVO_BYTES / 1024 / 1024} MB)`)
                e.target.value = ''
                setArchivo(null)
                return
              }
              setArchivo(file)
            }}
            className="w-full text-sm text-nz-text2"
          />
        </div>

        <button
          onClick={abrirModalGuardar}
          className="bg-nz-green text-black font-semibold rounded-lg py-2.5 text-sm"
        >
          Continuar
        </button>
      </div>

      <GuardarPresupuestoModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        buildPresupuesto={() => ({
          category: 'libre',
          m2: 0,
          waste: 0,
          materials: {
            descripcion,
            items: [{ desc: descripcion, precio: montoNum }],
            materiales: [],
            datosPago: DATOS_PAGO,
          },
          total: montoNum,
        })}
        onSaved={handleSaved}
      />
    </div>
  )
}
