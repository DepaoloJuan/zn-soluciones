import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const dashboard = new Hono<{ Bindings: Bindings }>()

dashboard.get('/', requireAuth, async (c) => {
  const sql = neon(c.env.DATABASE_URL)

  const resumen = await sql`
    SELECT
      (SELECT COUNT(*) FROM trabajos WHERE estado = 'enviado') AS pendientes,
      (SELECT COUNT(*) FROM trabajos WHERE fecha_trabajo BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND estado != 'rechazado') AS proximos_7_dias,
      (SELECT COALESCE(SUM(monto_cobrado), 0) FROM trabajos WHERE estado = 'cobrado') AS total_cobrado,
      (SELECT COALESCE(SUM(g.monto), 0) FROM gastos g JOIN trabajos t ON t.id = g.trabajo_id WHERE t.estado = 'cobrado') AS total_gastos
  `

  const estadosRows = await sql`SELECT estado, COUNT(*) as cantidad FROM trabajos GROUP BY estado`
  const estados = { evaluado: 0, cotizado: 0, enviado: 0, aceptado: 0, por_cobrar: 0, cobrado: 0, rechazado: 0 }
  for (const row of estadosRows) {
    estados[row.estado as keyof typeof estados] = Number(row.cantidad)
  }

  const r = resumen[0]
  return c.json({
    ok: true,
    pendientes: Number(r.pendientes),
    proximos_7_dias: Number(r.proximos_7_dias),
    ganancia_neta: Number(r.total_cobrado) - Number(r.total_gastos),
    estados,
  })
})

export default dashboard
