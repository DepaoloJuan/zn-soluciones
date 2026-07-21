import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getClientes, createCliente } from '../lib/api'

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getClientes()
      setClientes(res.clientes)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await createCliente({ nombre, telefono: telefono || null, email: email || null, direccion: direccion || null })
      setNombre('')
      setTelefono('')
      setEmail('')
      setDireccion('')
      setShowForm(false)
      await load()
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
        <h1 className="text-2xl font-extrabold">Clientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-nz-green text-black font-semibold rounded-lg px-4 py-2 text-sm"
        >
          + Nuevo cliente
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-nz-surface border border-nz-border rounded-xl p-5 mb-6 flex flex-col gap-3">
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
          <input
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
          <input
            placeholder="Email (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
          <input
            placeholder="Dirección (opcional)"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-nz-green text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {creating ? 'Creando...' : 'Crear cliente'}
          </button>
        </form>
      )}

      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden">
        {clientes.length === 0 && (
          <div className="p-6 text-center text-nz-text2 text-sm">Todavía no hay clientes cargados.</div>
        )}
        {clientes.map((c) => (
          <Link
            key={c.id}
            to={`/clientes/${c.id}`}
            className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0 no-underline text-nz-text hover:bg-nz-green-glow transition-all"
          >
            <div>
              <div className="font-medium text-sm">{c.nombre}</div>
              {c.telefono && <div className="text-xs text-nz-text2">{c.telefono}</div>}
            </div>
            <span className="text-nz-text2 text-sm">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
