import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getTrabajos, getNotasMes, guardarNotaDia } from '../lib/api'

const ESTADO_COLOR = {
  evaluado: 'bg-gray-500/20 text-gray-400',
  cotizado: 'bg-blue-500/20 text-blue-400',
  enviado: 'bg-yellow-500/20 text-yellow-500',
  aceptado: 'bg-nz-green/20 text-nz-green',
  por_cobrar: 'bg-orange-500/20 text-orange-400',
  cobrado: 'bg-emerald-500/20 text-emerald-400',
  rechazado: 'bg-red-500/20 text-red-500',
}

const DOT_COLOR = {
  evaluado: '#6b7280',
  cotizado: '#3b82f6',
  enviado: '#eab308',
  aceptado: '#1db954',
  por_cobrar: '#f97316',
  cobrado: '#10b981',
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function fechaKey(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function formatFecha(fechaStr) {
  const fecha = new Date(fechaStr)
  return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function AgendaPage() {
  const [trabajos, setTrabajos] = useState([])
  const [sinFecha, setSinFecha] = useState([])
  const [notas, setNotas] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cursor, setCursor] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [notaTexto, setNotaTexto] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)

  const year = cursor.getFullYear()
  const month = cursor.getMonth() + 1

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [trabajosRes, notasRes] = await Promise.all([getTrabajos(), getNotasMes(year, month)])
      setTrabajos(trabajosRes.trabajos.filter((t) => t.fecha_trabajo && t.estado !== 'rechazado'))
      setSinFecha(trabajosRes.trabajos.filter((t) => !t.fecha_trabajo && ['evaluado', 'enviado'].includes(t.estado)))

      const notasMap = {}
      notasRes.notas.forEach((n) => {
        notasMap[n.fecha.slice(0, 10)] = n.nota
      })
      setNotas(notasMap)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [year, month])

  const trabajosPorDia = useMemo(() => {
    const map = {}
    trabajos.forEach((t) => {
      const key = t.fecha_trabajo.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [trabajos])

  const celdas = useMemo(() => {
    const primerDiaMes = new Date(year, month - 1, 1)
    const offset = (primerDiaMes.getDay() + 6) % 7 // Lunes = 0
    const diasEnMes = new Date(year, month, 0).getDate()

    const celdas = []
    for (let i = 0; i < offset; i++) celdas.push(null)
    for (let d = 1; d <= diasEnMes; d++) celdas.push(d)
    return celdas
  }, [year, month])

  function cambiarMes(delta) {
    setCursor(new Date(year, month - 1 + delta, 1))
  }

  function abrirDia(d) {
    const key = fechaKey(year, month, d)
    setDiaSeleccionado(key)
    setNotaTexto(notas[key] || '')
  }

  async function handleGuardarNota() {
    setGuardandoNota(true)
    try {
      await guardarNotaDia(diaSeleccionado, notaTexto)
      setNotas((prev) => ({ ...prev, [diaSeleccionado]: notaTexto }))
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardandoNota(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Cargando...</div>
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const ordenados = [...trabajos].sort((a, b) => new Date(a.fecha_trabajo) - new Date(b.fecha_trabajo))
  const vencidos = ordenados.filter((t) => new Date(t.fecha_trabajo) < hoy)
  const proximos = ordenados.filter((t) => new Date(t.fecha_trabajo) >= hoy)

  const diaSeleccionadoTrabajos = diaSeleccionado ? (trabajosPorDia[diaSeleccionado] || []) : []
  const hoyKey = fechaKey(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate())

  return (
    <div className="min-h-screen px-6 pt-28 pb-20 max-w-[700px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Agenda</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Calendario */}
      <div className="bg-nz-surface border border-nz-border rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => cambiarMes(-1)} className="text-nz-text2 hover:text-nz-green bg-transparent border-none cursor-pointer text-lg px-2">‹</button>
          <span className="font-semibold text-sm capitalize">
            {cursor.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => cambiarMes(1)} className="text-nz-text2 hover:text-nz-green bg-transparent border-none cursor-pointer text-lg px-2">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DIAS.map((d) => (
            <div key={d} className="text-center text-[10px] text-nz-text2 uppercase tracking-wide py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celdas.map((d, i) => {
            if (!d) return <div key={i} />

            const key = fechaKey(year, month, d)
            const trabajosDia = trabajosPorDia[key] || []
            const tieneNota = !!notas[key]
            const confirmado = trabajosDia.some((t) => ['aceptado', 'por_cobrar', 'cobrado'].includes(t.estado))
            const pendiente = !confirmado && trabajosDia.some((t) => ['enviado', 'cotizado'].includes(t.estado))
            const esHoy = key === hoyKey

            let bg = 'bg-nz-surface2 hover:bg-nz-green-glow'
            if (confirmado) bg = 'bg-nz-green/20 hover:bg-nz-green/30'
            else if (pendiente) bg = 'bg-yellow-500/15 hover:bg-yellow-500/25'

            return (
              <button
                key={i}
                onClick={() => abrirDia(d)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border-none cursor-pointer transition-all relative ${bg} ${
                  esHoy ? 'ring-1 ring-nz-green' : ''
                }`}
              >
                <span className="text-xs font-medium">{d}</span>
                {trabajosDia.length > 0 && (
                  <div className="flex gap-0.5">
                    {trabajosDia.slice(0, 3).map((t, j) => (
                      <span key={j} className="w-1 h-1 rounded-full" style={{ background: DOT_COLOR[t.estado] }} />
                    ))}
                  </div>
                )}
                {tieneNota && <span className="absolute top-0.5 right-0.5 text-[8px]">📝</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Panel del día seleccionado */}
      {diaSeleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setDiaSeleccionado(null)}>
          <div
            className="bg-nz-surface border border-nz-border rounded-xl p-6 w-full max-w-[420px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 capitalize">{formatFecha(diaSeleccionado)}</h3>

            {diaSeleccionadoTrabajos.length > 0 && (
              <div className="mb-4 flex flex-col gap-2">
                {diaSeleccionadoTrabajos.map((t) => (
                  <Link
                    key={t.id}
                    to={`/trabajos/${t.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-nz-surface2 no-underline text-nz-text hover:bg-nz-green-glow transition-all"
                  >
                    <span className="text-sm">{t.cliente_nombre}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[t.estado] || ''}`}>
                      {t.estado}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <label className="block text-xs text-nz-text2 mb-1.5">Nota del día</label>
            <textarea
              value={notaTexto}
              onChange={(e) => setNotaTexto(e.target.value)}
              rows={4}
              placeholder="Ej: medio día en lo de Pérez, medio día en lo de Gómez"
              className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 text-sm outline-none focus:border-nz-green resize-none mb-3"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setDiaSeleccionado(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-nz-surface2 text-nz-text2 border border-nz-border"
              >
                Cerrar
              </button>
              <button
                onClick={handleGuardarNota}
                disabled={guardandoNota}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-nz-green text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {guardandoNota && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                {guardandoNota ? 'Guardando...' : 'Guardar nota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seguimiento pendiente */}
      {sinFecha.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-nz-text2 mb-2 uppercase tracking-wide">Seguimiento pendiente (sin fecha)</h2>
          <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden mb-6">
            {sinFecha.map((t) => (
              <Link
                key={t.id}
                to={`/trabajos/${t.id}`}
                className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0 no-underline text-nz-text hover:bg-nz-green-glow transition-all"
              >
                <div>
                  <div className="text-sm font-medium">{t.cliente_nombre}</div>
                  {t.descripcion && <div className="text-xs text-nz-text2">{t.descripcion}</div>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_COLOR[t.estado] || ''}`}>
                  {t.estado}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Listas de vencidos/próximos */}
      {vencidos.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-wide">Vencidos</h2>
          <div className="bg-nz-surface border border-red-500/30 rounded-xl overflow-hidden mb-6">
            {vencidos.map((t) => (
              <Link
                key={t.id}
                to={`/trabajos/${t.id}`}
                className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0 no-underline text-nz-text hover:bg-nz-green-glow transition-all"
              >
                <div>
                  <div className="text-sm font-medium capitalize">{formatFecha(t.fecha_trabajo)}</div>
                  <div className="text-xs text-nz-text2">{t.cliente_nombre} {t.descripcion ? `· ${t.descripcion}` : ''}</div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_COLOR[t.estado] || ''}`}>
                  {t.estado}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-bold text-nz-text2 mb-2 uppercase tracking-wide">Próximos</h2>
      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden">
        {proximos.length === 0 && (
          <div className="p-6 text-center text-nz-text2 text-sm">No hay trabajos con fecha próxima.</div>
        )}
        {proximos.map((t) => (
          <Link
            key={t.id}
            to={`/trabajos/${t.id}`}
            className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0 no-underline text-nz-text hover:bg-nz-green-glow transition-all"
          >
            <div>
              <div className="text-sm font-medium capitalize">{formatFecha(t.fecha_trabajo)}</div>
              <div className="text-xs text-nz-text2">{t.cliente_nombre} {t.descripcion ? `· ${t.descripcion}` : ''}</div>
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
