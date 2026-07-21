import { neon } from '@neondatabase/serverless'

export const trabajosTools = [
  {
    name: 'crear_trabajo',
    description: 'Crea un trabajo nuevo para un cliente, en estado "borrador". Requiere el ID del cliente (usar buscar_cliente o crear_cliente antes si hace falta).',
    input_schema: {
      type: 'object',
      properties: {
        cliente_id: { type: 'number' },
        descripcion: { type: 'string', description: 'Ej: "Cielorraso living"' },
      },
      required: ['cliente_id'],
    },
  },
  {
    name: 'actualizar_trabajo',
    description: 'Actualiza el estado, fecha, forma de pago o monto cobrado de un trabajo existente.',
    input_schema: {
      type: 'object',
      properties: {
        trabajo_id: { type: 'number' },
        estado: { type: 'string', enum: ['evaluado', 'cotizado', 'enviado', 'aceptado', 'por_cobrar', 'cobrado', 'rechazado'] },
        fecha_trabajo: { type: 'string', description: 'Formato YYYY-MM-DD' },
        forma_pago: { type: 'string', enum: ['efectivo', 'transferencia', 'mercadopago'] },
        monto_cobrado: { type: 'number' },
        sena_pagada: { type: 'boolean' },
      },
      required: ['trabajo_id'],
    },
  },
  {
    name: 'consultar_trabajos',
    description: 'Lista los trabajos, opcionalmente filtrados por estado. Útil para responder preguntas como "qué tengo pendiente" o ver la agenda.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', enum: ['evaluado', 'cotizado', 'enviado', 'aceptado', 'por_cobrar', 'cobrado', 'rechazado'] },
      },
    },
  },
  {
    name: 'ver_trabajo',
    description: 'Trae el detalle completo de un trabajo puntual, incluidos sus presupuestos.',
    input_schema: {
      type: 'object',
      properties: {
        trabajo_id: { type: 'number' },
      },
      required: ['trabajo_id'],
    },
  },
]

export async function executeTrabajoTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'crear_trabajo') {
    const { cliente_id, descripcion } = input
    const result = await sql`
      INSERT INTO trabajos (cliente_id, descripcion) VALUES (${cliente_id}, ${descripcion || null}) RETURNING *
    `
    return { trabajo: result[0] }
  }

  if (name === 'actualizar_trabajo') {
    const { trabajo_id, ...campos } = input
    const allowedFields = ['estado', 'fecha_trabajo', 'forma_pago', 'monto_cobrado', 'sena_pagada']
    const updates = Object.entries(campos).filter(([key]) => allowedFields.includes(key))

    if (updates.length === 0) return { error: 'No se especificó ningún campo para actualizar' }

    const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
    const values = updates.map(([, value]) => value)
    const query = `UPDATE trabajos SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`
    const result = await sql.query(query, [trabajo_id, ...values])

    if (result.length === 0) return { error: 'Trabajo no encontrado' }
    return { trabajo: result[0] }
  }

  if (name === 'consultar_trabajos') {
    const { estado } = input
    const rows = estado
      ? await sql`
          SELECT t.*, c.nombre AS cliente_nombre FROM trabajos t
          JOIN clientes c ON c.id = t.cliente_id
          WHERE t.estado = ${estado} ORDER BY fecha_trabajo ASC NULLS LAST
        `
      : await sql`
          SELECT t.*, c.nombre AS cliente_nombre FROM trabajos t
          JOIN clientes c ON c.id = t.cliente_id
          ORDER BY t.created_at DESC
        `
    return { trabajos: rows }
  }

  if (name === 'ver_trabajo') {
    const { trabajo_id } = input
    const trabajoRows = await sql`
      SELECT t.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
      FROM trabajos t JOIN clientes c ON c.id = t.cliente_id
      WHERE t.id = ${trabajo_id}
    `
    if (trabajoRows.length === 0) return { error: 'Trabajo no encontrado' }

    const presupuestos = await sql`
      SELECT id, category, m2, total, enviado_at, created_at FROM presupuestos
      WHERE trabajo_id = ${trabajo_id} ORDER BY created_at DESC
    `
    return { trabajo: trabajoRows[0], presupuestos }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
