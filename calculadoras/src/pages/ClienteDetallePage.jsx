import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCliente, updateCliente, deleteCliente } from '../lib/api'
import ConfirmModal from '../components/ConfirmModal'

const ESTADO_COLOR = {
  evaluado: 'bg-gray-500/20 text-gray-400',
  cotizado: 'bg-blue-500/20 text-blue-400',
  enviado: 'bg-yellow-500/20 text-yellow-500',
  aceptado: 'bg-nz-green/20 text-nz-green',
  por_cobrar: 'bg-orange-500/20 text-orange-400',
  cobrado: 'bg-emerald-500/20 text-emerald-400',
  rechazado: 'bg-red-500/20 text-red-500',
}

export default function ClienteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [trabajos, setTrabajos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirmEdit, setShowConfirmEdit] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getCliente(id)
      setCliente(res.cliente)
      setTrabajos(res.trabajos)
      setNombre(res.cliente.nombre)
      setTelefono(res.cliente.telefono || '')
      setEmail(res.cliente.email || '')
      setDireccion(res.cliente.direccion || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function confirmarGuardar() {
    setSaving(true)
    setError('')
    try {
      await updateCliente(id, { nombre, telefono: telefono || null, email: email || null, direccion: direccion || null })
      setEditando(false)
      setShowConfirmEdit(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function confirmarBorrado() {
    setDeleting(true)
    setError('')
    try {
      await deleteCliente(id)
      navigate('/clientes')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Cargando...</div>
  }

  if (!cliente) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Cliente no encontrado</div>
  }

  return (
    <div className="min-h-screen px-6 pt-28 pb-20 max-w-[700px] mx-auto">
      <button
        onClick={() => navigate('/clientes')}
        className="text-nz-text2 text-sm mb-4 bg-transparent border-none cursor-pointer"
      >
        ← Volver a clientes
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-nz-surface border border-nz-border rounded-xl p-5 mb-6">
        {editando ? (
          <div className="flex flex-col gap-3">
            <input
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
            />
            <input
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
            />
            <input
              placeholder="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditando(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-nz-surface2 text-nz-text2 border border-nz-border"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowConfirmEdit(true)}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-nz-green text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold mb-1">{cliente.nombre}</h1>
              {cliente.telefono && <p className="text-sm text-nz-text2">{cliente.telefono}</p>}
              {cliente.email && <p className="text-sm text-nz-text2">{cliente.email}</p>}
              {cliente.direccion && <p className="text-sm text-nz-text2">{cliente.direccion}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/trabajos', { state: { clienteId: cliente.id, clienteNombre: cliente.nombre } })}
                className="text-nz-green text-xs font-medium bg-transparent border-none cursor-pointer hover:underline"
              >
                + Nuevo trabajo
              </button>
              <button
                onClick={() => setEditando(true)}
                className="text-nz-green text-xs font-medium bg-transparent border-none cursor-pointer hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="text-red-500 text-xs font-medium bg-transparent border-none cursor-pointer hover:underline"
              >
                Borrar
              </button>
            </div>
          </div>
        )}
      </div>

      <h2 className="text-lg font-bold mb-3">Trabajos</h2>
      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden">
        {trabajos.length === 0 && (
          <div className="p-6 text-center text-nz-text2 text-sm">Todavía no hay trabajos para este cliente.</div>
        )}
        {trabajos.map((t) => (
          <Link
            key={t.id}
            to={`/trabajos/${t.id}`}
            className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0 no-underline text-nz-text hover:bg-nz-green-glow transition-all"
          >
            <div>
              <div className="text-sm font-medium">{t.descripcion || `Trabajo #${t.id}`}</div>
              <div className="text-xs text-nz-text2">
                {t.presupuestos.length} presupuesto{t.presupuestos.length !== 1 ? 's' : ''}
                {t.fecha_trabajo && ` · ${new Date(t.fecha_trabajo).toLocaleDateString('es-AR')}`}
              </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_COLOR[t.estado] || ''}`}>
              {t.estado}
            </span>
          </Link>
        ))}
      </div>
      <ConfirmModal
        open={showConfirmEdit}
        title="Guardar cambios"
        message={`¿Confirmás guardar los cambios en los datos de ${cliente.nombre}?`}
        confirmLabel="Guardar"
        loading={saving}
        onConfirm={confirmarGuardar}
        onCancel={() => setShowConfirmEdit(false)}
      />

      <ConfirmModal
        open={showConfirmDelete}
        title="Borrar cliente"
        message={`¿Seguro que querés borrar a ${cliente.nombre}? Esto también borra todos sus trabajos y presupuestos asociados. Esta acción no se puede deshacer.`}
        confirmLabel="Borrar"
        danger
        loading={deleting}
        onConfirm={confirmarBorrado}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </div>
  )
}
