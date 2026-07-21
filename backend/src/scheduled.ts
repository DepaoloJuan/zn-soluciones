import { neon } from '@neondatabase/serverless'
import { enviarPushATodos } from './push'
import type { Bindings } from './types'

function formatFechaCorta(fecha: Date) {
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

export async function runScheduledChecks(env: Bindings) {
  const sql = neon(env.DATABASE_URL)

  const hoy = new Date()
  const manana = new Date(hoy)
  manana.setDate(hoy.getDate() + 1)
  const mananaStr = manana.toISOString().slice(0, 10)

  // 1. Trabajos programados para mañana
  const trabajosManana = await sql`
    SELECT t.*, c.nombre AS cliente_nombre FROM trabajos t
    JOIN clientes c ON c.id = t.cliente_id
    WHERE t.fecha_trabajo::date = ${mananaStr}::date AND t.estado != 'rechazado'
  `

  if (trabajosManana.length > 0) {
    const notaRows = await sql`SELECT nota FROM notas_agenda WHERE fecha = ${mananaStr}`
    const nombresClientes = trabajosManana.map((t) => t.cliente_nombre).join(', ')
    let body = `Mañana (${formatFechaCorta(manana)}): ${nombresClientes}.`
    if (notaRows.length > 0) {
      body += ` Nota: ${notaRows[0].nota}`
    }

    await enviarPushATodos(env.DATABASE_URL, env.VAPID_PRIVATE_KEY, {
      title: 'Recordatorio de mañana',
      body,
      url: '/agenda',
    })
  }

  // 2. Trabajos vencidos sin actualizar
  const vencidos = await sql`
    SELECT t.*, c.nombre AS cliente_nombre FROM trabajos t
    JOIN clientes c ON c.id = t.cliente_id
    WHERE t.fecha_trabajo::date < CURRENT_DATE
      AND t.estado NOT IN ('aceptado', 'por_cobrar', 'cobrado', 'rechazado')
  `

  if (vencidos.length > 0) {
    const nombresClientes = vencidos.map((t) => t.cliente_nombre).join(', ')
    await enviarPushATodos(env.DATABASE_URL, env.VAPID_PRIVATE_KEY, {
      title: 'Trabajos vencidos sin actualizar',
      body: `Tenés ${vencidos.length} trabajo(s) con fecha pasada sin marcar: ${nombresClientes}.`,
      url: '/agenda',
    })
  }
}
