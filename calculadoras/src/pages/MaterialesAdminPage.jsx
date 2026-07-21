import { useState, useEffect } from 'react'
import { getMaterials, updateMaterial, createMaterial, deleteMaterial, getSetting, updateSetting } from '../lib/api'
import ConfirmModal from '../components/ConfirmModal'

// TODO: cuando Tabique deje de ser un placeholder, esto debe volverse un selector/prop
// (ej. leer ?category= de la URL) en vez de una categoría fija.
const CATEGORY = 'cielorraso'

export default function MaterialesAdminPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [condiciones, setCondiciones] = useState('')
  const [savingCondiciones, setSavingCondiciones] = useState(false)
  const [materialABorrar, setMaterialABorrar] = useState(null)
  const [borrandoMaterial, setBorrandoMaterial] = useState(false)
  const [editedValues, setEditedValues] = useState({})
  const [editedPrices, setEditedPrices] = useState({})
  const [savingPriceId, setSavingPriceId] = useState(null)

  const [newMaterial, setNewMaterial] = useState({
    id: '', name: '', unit: 'unidad', color: '#1db954', per_m2: '', round_type: 'ceil', price: '',
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getMaterials(CATEGORY)
      setMaterials(res.materials)
      const cond = await getSetting('condiciones_cielorraso')
      setCondiciones(cond.value)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleUpdatePerM2(id) {
    setSavingId(id)
    try {
      await updateMaterial(CATEGORY, id, { per_m2: parseFloat(editedValues[id]) })
      setEditedValues((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleUpdatePrice(id) {
    setSavingPriceId(id)
    try {
      await updateMaterial(CATEGORY, id, { price: parseFloat(editedPrices[id]) })
      setEditedPrices((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPriceId(null)
    }
  }

  async function confirmarBorrarMaterial() {
    setBorrandoMaterial(true)
    try {
      await deleteMaterial(CATEGORY, materialABorrar.id)
      setMaterialABorrar(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBorrandoMaterial(false)
    }
  }

  async function handleSaveCondiciones() {
    setSavingCondiciones(true)
    try {
      await updateSetting('condiciones_cielorraso', condiciones)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingCondiciones(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createMaterial(CATEGORY, {
        ...newMaterial,
        per_m2: parseFloat(newMaterial.per_m2),
        price: parseFloat(newMaterial.price) || 0,
      })
      setNewMaterial({ id: '', name: '', unit: 'unidad', color: '#1db954', per_m2: '', round_type: 'ceil', price: '' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Cargando...</div>
  }

  return (
    <div className="min-h-screen px-6 pt-28 pb-20 max-w-[700px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Materiales — Cielorraso</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden mb-8">
        {materials.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-nz-border/50 last:border-b-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
            <span className="flex-1 text-sm">{m.name}</span>
            <input
              type="number"
              step="0.01"
              value={editedValues[m.id] ?? m.perM2}
              onChange={(e) => setEditedValues((prev) => ({ ...prev, [m.id]: e.target.value }))}
              disabled={savingId === m.id}
              className="w-24 bg-nz-surface2 border border-nz-border rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:border-nz-green"
            />
            <span className="text-xs text-nz-text2 w-16">/{m.unit}</span>
            {editedValues[m.id] !== undefined && editedValues[m.id] !== String(m.perM2) && (
              <button
                onClick={() => handleUpdatePerM2(m.id)}
                disabled={savingId === m.id}
                className="text-xs bg-nz-green text-black font-semibold rounded-lg px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
              >
                {savingId === m.id && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                {savingId === m.id ? '...' : 'Actualizar'}
              </button>
            )}

            <span className="text-xs text-nz-text2">$</span>
            <input
              type="number"
              step="0.01"
              value={editedPrices[m.id] ?? m.price}
              onChange={(e) => setEditedPrices((prev) => ({ ...prev, [m.id]: e.target.value }))}
              disabled={savingPriceId === m.id}
              className="w-24 bg-nz-surface2 border border-nz-border rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:border-nz-green"
            />
            {editedPrices[m.id] !== undefined && editedPrices[m.id] !== String(m.price) && (
              <button
                onClick={() => handleUpdatePrice(m.id)}
                disabled={savingPriceId === m.id}
                className="text-xs bg-nz-green text-black font-semibold rounded-lg px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
              >
                {savingPriceId === m.id && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                {savingPriceId === m.id ? '...' : 'Actualizar precio'}
              </button>
            )}

            <button
              onClick={() => setMaterialABorrar(m)}
              className="text-red-500 text-sm bg-transparent border-none cursor-pointer px-2"
            >
              Borrar
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-3">Condiciones del presupuesto</h2>
      <div className="bg-nz-surface border border-nz-border rounded-xl p-5 mb-8">
        <textarea
          value={condiciones}
          onChange={(e) => setCondiciones(e.target.value)}
          rows={4}
          className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green resize-none"
        />
        <p className="text-xs text-nz-text2 mt-2 mb-3">Cada línea aparece como un punto separado en el presupuesto.</p>
        <button
          onClick={handleSaveCondiciones}
          disabled={savingCondiciones}
          className="bg-nz-green text-black font-semibold rounded-lg px-5 py-2 text-sm disabled:opacity-50"
        >
          {savingCondiciones ? 'Guardando...' : 'Guardar condiciones'}
        </button>
      </div>

      <h2 className="text-lg font-bold mb-3">Agregar material</h2>
      <form onSubmit={handleCreate} className="bg-nz-surface border border-nz-border rounded-xl p-5 flex flex-col gap-3">
        <input
          placeholder="id (ej: placas2)"
          value={newMaterial.id}
          onChange={(e) => setNewMaterial({ ...newMaterial, id: e.target.value })}
          required
          className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
        />
        <input
          placeholder="Nombre"
          value={newMaterial.name}
          onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
          required
          className="bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
        />
        <div className="flex gap-3">
          <input
            placeholder="Unidad (unidad/kg/mt)"
            value={newMaterial.unit}
            onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
            required
            className="flex-1 bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Ratio por m²"
            value={newMaterial.per_m2}
            onChange={(e) => setNewMaterial({ ...newMaterial, per_m2: e.target.value })}
            required
            className="flex-1 bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Precio unitario"
            value={newMaterial.price}
            onChange={(e) => setNewMaterial({ ...newMaterial, price: e.target.value })}
            className="flex-1 bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          />
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={newMaterial.color}
            onChange={(e) => setNewMaterial({ ...newMaterial, color: e.target.value })}
            className="w-10 h-10 bg-transparent border border-nz-border rounded-lg cursor-pointer"
          />
          <select
            value={newMaterial.round_type}
            onChange={(e) => setNewMaterial({ ...newMaterial, round_type: e.target.value })}
            className="flex-1 bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green"
          >
            <option value="ceil">Entero</option>
            <option value="decimal">Decimal</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-nz-green text-black font-semibold rounded-lg py-2.5 mt-2"
        >
          Agregar
        </button>
      </form>

      <ConfirmModal
        open={!!materialABorrar}
        title="Borrar material"
        message={`¿Seguro que querés borrar "${materialABorrar?.name || materialABorrar?.id}"?`}
        confirmLabel="Borrar"
        danger
        loading={borrandoMaterial}
        onConfirm={confirmarBorrarMaterial}
        onCancel={() => setMaterialABorrar(null)}
      />
    </div>
  )
}
