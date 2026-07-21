import { neon } from '@neondatabase/serverless'

export const notasTools = [
  {
    name: 'ver_nota_dia',
    description: 'Trae la nota del día para una fecha puntual (ej: "cómo tengo distribuido mañana"), junto con los trabajos agendados ese día.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Formato YYYY-MM-DD' },
      },
      required: ['fecha'],
    },
  },
  {
    name: 'guardar_nota_dia',
    description: 'Crea o actualiza la nota de un día (ej: "medio día en lo de Pérez, medio día en lo de Gómez"). Si ya existe una nota para ese día, la reemplaza.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Formato YYYY-MM-DD' },
        nota: { type: 'string' },
      },
      required: ['fecha', 'nota'],
    },
  },
]

export async function executeNotaTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'ver_nota_dia') {
    const { fecha } = input
    const notaRows = await sql`SELECT * FROM notas_agenda WHERE fecha = ${fecha}`
    const trabajosRows = await sql`
      SELECT t.*, c.nombre AS cliente_nombre FROM trabajos t
      JOIN clientes c ON c.id = t.cliente_id
      WHERE t.fecha_trabajo = ${fecha} AND t.estado != 'rechazado'
    `
    return { nota: notaRows[0] || null, trabajos: trabajosRows }
  }

  if (name === 'guardar_nota_dia') {
    const { fecha, nota } = input
    const result = await sql`
      INSERT INTO notas_agenda (fecha, nota) VALUES (${fecha}, ${nota})
      ON CONFLICT (fecha) DO UPDATE SET nota = ${nota}, updated_at = NOW()
      RETURNING *
    `
    return { nota: result[0] }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
