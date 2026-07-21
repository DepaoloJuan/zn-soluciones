import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard, getTrabajos, getVapidPublicKey, suscribirPush } from '../lib/api'
import { activarNotificaciones } from '../lib/push'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const ESTADO_LABEL = {
  evaluado: 'Evaluado',
  cotizado: 'Cotizado',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  por_cobrar: 'Por cobrar',
  cobrado: 'Cobrado',
  rechazado: 'Rechazado',
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [proximos, setProximos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hidden, setHidden] = useState(false)
  const [notifStatus, setNotifStatus] = useState('idle')
  const [notifError, setNotifError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [dashRes, trabajosRes] = await Promise.all([getDashboard(), getTrabajos()])
        setData(dashRes)

        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const prox = trabajosRes.trabajos
          .filter((t) => t.fecha_trabajo && new Date(t.fecha_trabajo) >= hoy && t.estado !== 'rechazado')
          .sort((a, b) => new Date(a.fecha_trabajo) - new Date(b.fecha_trabajo))
          .slice(0, 5)
        setProximos(prox)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleActivarNotificaciones() {
    setNotifStatus('cargando')
    setNotifError('')
    try {
      const { publicKey } = await getVapidPublicKey()
      const subscription = await activarNotificaciones(publicKey)
      await suscribirPush(subscription)
      setNotifStatus('activado')
    } catch (err) {
      setNotifError(err.message)
      setNotifStatus('error')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-nz-text2">Cargando...</div>
  }

  if (error || !data) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 text-sm">{error}</div>
  }

  const ESTADO_COLOR_HEX = {
    evaluado: '#6b7280',
    cotizado: '#3b82f6',
    enviado: '#eab308',
    aceptado: '#1db954',
    por_cobrar: '#f97316',
    cobrado: '#10b981',
    rechazado: '#ef4444',
  }

  const chartData = Object.entries(data.estados).map(([estado, cantidad]) => ({
    estado: ESTADO_LABEL[estado],
    cantidad,
    color: ESTADO_COLOR_HEX[estado],
  }))

  return (
    <div className="min-h-screen px-6 pt-28 pb-20 max-w-[700px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <button
          onClick={() => setHidden((h) => !h)}
          className="flex items-center gap-2 text-xs font-medium text-nz-text2 bg-nz-surface border border-nz-border px-3 py-2 rounded-lg hover:border-nz-green hover:text-nz-green transition-all cursor-pointer"
        >
          {hidden ? '👁 Mostrar números' : '🙈 Ocultar números'}
        </button>
      </div>

      {notifStatus !== 'activado' && (
        <div className="bg-nz-surface border border-nz-border rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm text-nz-text2">Activá las notificaciones para recordatorios de trabajos y agenda.</span>
          <button
            onClick={handleActivarNotificaciones}
            disabled={notifStatus === 'cargando'}
            className="bg-nz-green text-black font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {notifStatus === 'cargando' && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {notifStatus === 'cargando' ? 'Activando...' : 'Activar notificaciones'}
          </button>
        </div>
      )}
      {notifError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 mb-6 text-sm">{notifError}</div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-nz-surface border border-nz-border rounded-xl p-4">
          <div className="text-xs text-nz-text2 mb-1">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-500">
            {hidden ? '••••' : data.pendientes}
          </div>
        </div>
        <div className="bg-nz-surface border border-nz-border rounded-xl p-4">
          <div className="text-xs text-nz-text2 mb-1">Próximos 7 días</div>
          <div className="text-2xl font-bold text-nz-green">
            {hidden ? '••••' : data.proximos_7_dias}
          </div>
        </div>
        <div className="bg-nz-surface border border-nz-border rounded-xl p-4 col-span-2">
          <div className="text-xs text-nz-text2 mb-1">Ganancia neta (trabajos aceptados)</div>
          <div className="text-2xl font-bold text-nz-green">
            {hidden ? '$ ••••••' : `$${data.ganancia_neta}`}
          </div>
        </div>
      </div>

      {/* Desglose por estado */}
      <h2 className="text-lg font-bold mb-3">Trabajos por estado</h2>
      <div className="bg-nz-surface border border-nz-border rounded-xl p-5 mb-8 relative overflow-hidden" style={{ height: 240 }}>
        {hidden && (
          <div className="absolute inset-0 bg-nz-surface/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <span className="text-nz-text2 text-sm">Números ocultos</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="estado" tick={{ fill: '#8b949e', fontSize: 12 }} axisLine={{ stroke: '#30363d' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#8b949e', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: '#e6edf3' }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Próximos trabajos */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Próximos trabajos</h2>
        <Link to="/agenda" className="text-nz-green text-xs font-medium no-underline hover:underline">
          Ver agenda completa →
        </Link>
      </div>
      <div className="bg-nz-surface border border-nz-border rounded-xl overflow-hidden">
        {proximos.length === 0 && (
          <div className="p-6 text-center text-nz-text2 text-sm">No hay trabajos próximos.</div>
        )}
        {proximos.map((t) => (
          <Link
            key={t.id}
            to={`/trabajos/${t.id}`}
            className="flex items-center justify-between px-4 py-3 border-b border-nz-border/50 last:border-b-0 no-underline text-nz-text hover:bg-nz-green-glow transition-all"
          >
            <div>
              <div className="text-sm font-medium">{t.cliente_nombre}</div>
              <div className="text-xs text-nz-text2">{new Date(t.fecha_trabajo).toLocaleDateString('es-AR')}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
