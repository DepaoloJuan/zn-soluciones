import { neon } from '@neondatabase/serverless'

export const dashboardTools = [
  {
    name: 'ver_resumen',
    description: 'Trae un resumen general: trabajos pendientes, próximos 7 días, ganancia neta de trabajos aceptados, y cantidad de trabajos por estado. Usar para preguntas generales como "cómo viene todo" o "qué tengo pendiente".',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
]

export async function executeDashboardTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'ver_resumen') {
    const resumen = await sql`
      SELECT
        (SELECT COUNT(*) FROM trabajos WHERE estado = 'enviado') AS pendientes,
        (SELECT COUNT(*) FROM trabajos WHERE fecha_trabajo BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND estado != 'rechazado') AS proximos_7_dias,
        (SELECT COALESCE(SUM(monto_cobrado), 0) FROM trabajos WHERE estado = 'cobrado') AS total_cobrado,
        (SELECT COALESCE(SUM(g.monto), 0) FROM gastos g JOIN trabajos t ON t.id = g.trabajo_id WHERE t.estado = 'cobrado') AS total_gastos
    `
    const estadosRows = await sql`SELECT estado, COUNT(*) as cantidad FROM trabajos GROUP BY estado`
    const estados: Record<string, number> = { evaluado: 0, cotizado: 0, enviado: 0, aceptado: 0, por_cobrar: 0, cobrado: 0, rechazado: 0 }
    for (const row of estadosRows) {
      estados[row.estado as string] = Number(row.cantidad)
    }

    const r = resumen[0]
    return {
      pendientes: Number(r.pendientes),
      proximos_7_dias: Number(r.proximos_7_dias),
      ganancia_neta: Number(r.total_cobrado) - Number(r.total_gastos),
      estados,
    }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
