import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTrabajos, createTrabajo, getClientes, createCliente } from '../lib/api'

const ESTADO_COLOR = {
  evaluado: 'bg-gray-500/20 text-gray-400',
  cotizado: 'bg-blue-500/20 text-blue-400',
  enviado: 'bg-yellow-500/20 text-yellow-500',
  aceptado: 'bg-nz-green/20 text-nz-green',
  por_cobrar: 'bg-orange-500/20 text-orange-400',
  cobrado: 'bg-emerald-500/20 text-emerald-400',
  rechazado: 'bg-red-500/20 text-red-500',
}

export default function TrabajosPage() {
  const [trabajos, setTrabajos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [creating, setCreating] = useState(false)
  const [clientesList, setClientesList] = useState([])
  const [modoCliente, setModoCliente] = useState('existente')
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [nombreClienteNuevo, setNombreClienteNuevo] = useState('')
  const [telefonoClienteNuevo, setTelefonoClienteNuevo] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getTrabajos()
      setTrabajos(res.trabajos)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    getClientes().then((res) => setClientesList(res.clientes)).catch(() => {})
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      let clienteId = clienteSeleccionado

      if (modoCliente === 'nuevo') {
        if (!nombreClienteNuevo.trim()) {
          setError('Ingresá el nombre del cliente')
          setCreating(false)
          return
        }
        const nuevo = await createCliente({ nombre: nombreClienteNuevo, telefono: telefonoClienteNuevo || null })
        clienteId = nuevo.cliente.id
      }

      if (!clienteId) {
        setError('Elegí un cliente o creá uno nuevo')
        setCreating(false)
        return
      }

      await createTrabajo({ cliente_id: clienteId, descripcion })
      setNombreClienteNuevo('')
      setTelefonoClienteNuevo('')
      setClienteSeleccionado('')
      setDescripcion('')
      setShowForm(false)
      await load()

      const res = await getClientes()
      setClientesList(res.clientes)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Cargando...</div>
  }

  return (
    <div className="min-h-screen px-6 pt-28 pb-20 max-w-[700px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Trabajos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-nz-green text-black font-semibold rounded-lg px-4 py-2 text-sm"
        >
          + Nuevo trabajo
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-nz-surface border border-nz-border rounded-xl p-5 mb-6 flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModoCliente('existente')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                modoCliente === 'existente' ? 'bg-nz-green text-black border-nz-green' : 'bg-nz-surface2 text-nz-text2 border-nz-border'
              }`}
            >
              Cliente existente
            </button>
            <button
              type="button"
              onClick={() => setModoCliente('nuevo')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
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
              className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
            >
              <option value="">Elegí un cliente...</option>
              {clientesList.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          ) : (
            <>
              <input
                placeholder="Nombre del cliente"
                value={nombreClienteNuevo}
                onChange={(e) => setNombreClienteNuevo(e.target.value)}
                className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
              />
              <input
                placeholder="Teléfono (opcional)"
                value={telefonoClienteNuevo}
                onChange={(e) => setTelefonoClienteNuevo(e.target.value)}
                className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
              />
            </>
          )}

          <input
            placeholder="Descripción (ej: Cielorraso living)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-nz-green text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {creating ? 'Creando...' : 'Crear trabajo'}
          </button>
        </form>
      )}

      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden">
        {trabajos.length === 0 && (
          <div className="p-6 text-center text-nz-text2 text-sm">Todavía no hay trabajos cargados.</div>
        )}
        {trabajos.map((t) => (
          <Link
            key={t.id}
            to={`/trabajos/${t.id}`}
            className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0 no-underline text-nz-text hover:bg-nz-green-glow transition-all"
          >
            <div>
              <div className="font-medium text-sm">{t.cliente_nombre}</div>
              {t.descripcion && <div className="text-xs text-nz-text2">{t.descripcion}</div>}
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_COLOR[t.estado] || ''}`}>
              {t.estado}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
