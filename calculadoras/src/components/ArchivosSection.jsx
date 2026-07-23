import { useState, useEffect, useRef } from 'react'
import { getArchivosTrabajo, uploadArchivo, deleteArchivo, descargarArchivo } from '../lib/api'
import ConfirmModal from './ConfirmModal'

const MAX_ARCHIVO_BYTES = 20 * 1024 * 1024 // 20 MB, debe coincidir con el límite del backend

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ArchivosSection({ trabajoId }) {
  const [archivosList, setArchivosList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [descargandoId, setDescargandoId] = useState(null)
  const [archivoABorrar, setArchivoABorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)
  const fileInputRef = useRef(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getArchivosTrabajo(trabajoId)
      setArchivosList(res.archivos)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [trabajoId])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_ARCHIVO_BYTES) {
      setError(`El archivo supera el tamaño máximo permitido (${MAX_ARCHIVO_BYTES / 1024 / 1024} MB)`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSubiendo(true)
    setError('')
    try {
      await uploadArchivo(trabajoId, file)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDescargar(archivo) {
    setDescargandoId(archivo.id)
    setError('')
    try {
      const { url, nombre } = await descargarArchivo(archivo.id)
      const a = document.createElement('a')
      a.href = url
      a.download = nombre
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setDescargandoId(null)
    }
  }

  async function confirmarBorrar() {
    setBorrando(true)
    try {
      await deleteArchivo(archivoABorrar.id)
      setArchivoABorrar(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-3">Archivos</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden mb-4">
        {loading && (
          <div className="p-6 text-center text-nz-text2 text-sm">Cargando...</div>
        )}
        {!loading && archivosList.length === 0 && (
          <div className="p-6 text-center text-nz-text2 text-sm">Todavía no hay archivos subidos.</div>
        )}
        {!loading && archivosList.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-nz-border/50 last:border-b-0">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{a.nombre_original}</div>
              <div className="text-xs text-nz-text2">
                {formatBytes(a.tamano_bytes)} · {new Date(a.created_at).toLocaleDateString('es-AR')}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => handleDescargar(a)}
                disabled={descargandoId === a.id}
                className="text-nz-green text-xs font-medium bg-transparent border-none cursor-pointer disabled:opacity-50"
              >
                {descargandoId === a.id ? 'Descargando...' : 'Descargar'}
              </button>
              <button
                onClick={() => setArchivoABorrar(a)}
                className="text-red-500 text-xs bg-transparent border-none cursor-pointer"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="inline-flex items-center gap-2 bg-nz-surface2 text-nz-text font-semibold text-sm px-4 py-2.5 rounded-xl border border-nz-border cursor-pointer hover:border-nz-green transition-all">
        {subiendo && <span className="w-4 h-4 border-2 border-nz-text2/30 border-t-nz-text2 rounded-full animate-spin" />}
        {subiendo ? 'Subiendo...' : '📎 Subir archivo'}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={subiendo}
          className="hidden"
        />
      </label>

      <ConfirmModal
        open={!!archivoABorrar}
        title="Borrar archivo"
        message={`¿Seguro que querés borrar "${archivoABorrar?.nombre_original}"?`}
        confirmLabel="Borrar"
        danger
        loading={borrando}
        onConfirm={confirmarBorrar}
        onCancel={() => setArchivoABorrar(null)}
      />
    </div>
  )
}
