import { neon } from '@neondatabase/serverless'

export const preciosTools = [
  {
    name: 'buscar_precio',
    description: 'Busca si ya se cobró antes por un ítem o material similar, para sugerir reutilizar el mismo precio. Usar SIEMPRE antes de calcular un presupuesto libre o cuando el usuario mencione un ítem con precio.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string', description: 'Descripción del ítem o material, ej: "arreglo de grifería"' },
      },
      required: ['descripcion'],
    },
  },
  {
    name: 'guardar_precio',
    description: 'Guarda o actualiza el precio de un ítem o material. Usar cuando el usuario confirma un precio nuevo, o confirma que quiere actualizar uno existente.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string' },
        precio: { type: 'number' },
      },
      required: ['descripcion', 'precio'],
    },
  },
]

export async function executePreciosTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'buscar_precio') {
    const { descripcion } = input
    const rows = await sql`
      SELECT * FROM precios_items
      WHERE LOWER(descripcion) LIKE LOWER(${'%' + descripcion + '%'})
      ORDER BY updated_at DESC
      LIMIT 5
    `
    return { resultados: rows }
  }

  if (name === 'guardar_precio') {
    const { descripcion, precio } = input
    const existente = await sql`
      SELECT id FROM precios_items WHERE LOWER(descripcion) = LOWER(${descripcion})
    `
    let result
    if (existente.length > 0) {
      result = await sql`
        UPDATE precios_items SET ultimo_precio = ${precio}, updated_at = NOW()
        WHERE id = ${existente[0].id} RETURNING *
      `
    } else {
      result = await sql`
        INSERT INTO precios_items (descripcion, ultimo_precio) VALUES (${descripcion}, ${precio}) RETURNING *
      `
    }
    return { item: result[0] }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
