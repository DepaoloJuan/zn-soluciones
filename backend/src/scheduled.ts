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
  try {
    const trabajosManana = await sql`
      SELECT t.*, c.nombre AS cliente_nombre FROM trabajos t
      JOIN clientes c ON c.id = t.cliente_id
      WHERE t.fecha_trabajo::date = ${mananaStr}::date AND t.estado != 'rechazado'
    `

    if (trabajosManana.length > 0) {
      const itemsRows = await sql`
        SELECT hora, texto FROM agenda_items WHERE fecha = ${mananaStr}::date ORDER BY hora NULLS LAST, created_at
      `
      const nombresClientes = trabajosManana.map((t) => t.cliente_nombre).join(', ')
      let body = `Mañana (${formatFechaCorta(manana)}): ${nombresClientes}.`
      if (itemsRows.length > 0) {
        const agendaTexto = itemsRows.map((r) => (r.hora ? `${r.hora} ${r.texto}` : r.texto)).join('; ')
        body += ` Agenda: ${agendaTexto}`
      }

      await enviarPushATodos(env.DATABASE_URL, env.VAPID_PRIVATE_KEY, {
        title: 'Recordatorio de mañana',
        body,
        url: '/agenda',
      })
    }
  } catch (err) {
    console.error('Error en scheduled check de trabajos de mañana:', err)
  }

  // 2. Trabajos vencidos sin actualizar
  try {
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
  } catch (err) {
    console.error('Error en scheduled check de trabajos vencidos:', err)
  }
}
