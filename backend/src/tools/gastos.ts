import { neon } from '@neondatabase/serverless'

export const gastosTools = [
  {
    name: 'crear_gasto',
    description: 'Registra un gasto para un trabajo (materiales, ayudantes, flete, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        trabajo_id: { type: 'number' },
        concepto: { type: 'string' },
        monto: { type: 'number' },
        categoria: { type: 'string', description: 'ej: materiales, ayudante, flete' },
      },
      required: ['trabajo_id', 'concepto', 'monto'],
    },
  },
  {
    name: 'listar_gastos',
    description: 'Lista los gastos cargados para un trabajo.',
    input_schema: {
      type: 'object',
      properties: {
        trabajo_id: { type: 'number' },
      },
      required: ['trabajo_id'],
    },
  },
  {
    name: 'borrar_gasto',
    description: 'Borra un gasto de forma permanente. Acción destructiva: SIEMPRE preguntar al usuario y esperar confirmación explícita en el chat antes de llamar a esta herramienta.',
    input_schema: {
      type: 'object',
      properties: {
        gasto_id: { type: 'number' },
      },
      required: ['gasto_id'],
    },
  },
]

export async function executeGastoTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'crear_gasto') {
    const { trabajo_id, concepto, monto, categoria } = input
    const result = await sql`
      INSERT INTO gastos (trabajo_id, concepto, monto, categoria)
      VALUES (${trabajo_id}, ${concepto}, ${monto}, ${categoria || null})
      RETURNING *
    `
    return { gasto: result[0] }
  }

  if (name === 'listar_gastos') {
    const { trabajo_id } = input
    const rows = await sql`SELECT * FROM gastos WHERE trabajo_id = ${trabajo_id} ORDER BY created_at DESC`
    return { gastos: rows }
  }

  if (name === 'borrar_gasto') {
    const { gasto_id } = input
    const result = await sql`DELETE FROM gastos WHERE id = ${gasto_id} RETURNING *`
    if (result.length === 0) return { error: 'Gasto no encontrado' }
    return { borrado: result[0] }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
