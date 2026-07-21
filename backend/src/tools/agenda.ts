import { neon } from '@neondatabase/serverless'

export const agendaTools = [
  {
    name: 'listar_agenda_dia',
    description: 'Trae los ítems de agenda (anotaciones, con hora si tienen) de una fecha puntual (ej: "cómo tengo distribuido mañana"), junto con los trabajos agendados ese día.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Formato YYYY-MM-DD' },
      },
      required: ['fecha'],
    },
  },
  {
    name: 'crear_agenda_item',
    description: 'Crea una anotación nueva de agenda para un día (ej: "14hs visita a obra de Pérez"). A diferencia de la nota vieja, esto AGREGA un ítem más, no reemplaza los que ya existían ese día — se puede llamar varias veces para el mismo día. Opcionalmente se puede asociar a un trabajo existente si corresponde.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Formato YYYY-MM-DD' },
        texto: { type: 'string' },
        hora: { type: 'string', description: 'Formato HH:MM (24hs), opcional' },
        trabajo_id: { type: 'number', description: 'Opcional, si la anotación corresponde a un trabajo existente' },
      },
      required: ['fecha', 'texto'],
    },
  },
  {
    name: 'borrar_agenda_item',
    description: 'Borra una anotación de agenda puntual por su id.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
      required: ['id'],
    },
  },
]

export async function executeAgendaTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'listar_agenda_dia') {
    const { fecha } = input
    const itemsRows = await sql`
      SELECT ai.*, t.cliente_id AS trabajo_cliente_id, c.nombre AS trabajo_cliente_nombre
      FROM agenda_items ai
      LEFT JOIN trabajos t ON t.id = ai.trabajo_id
      LEFT JOIN clientes c ON c.id = t.cliente_id
      WHERE ai.fecha = ${fecha}
      ORDER BY ai.hora NULLS LAST, ai.created_at
    `
    const trabajosRows = await sql`
      SELECT t.*, c.nombre AS cliente_nombre FROM trabajos t
      JOIN clientes c ON c.id = t.cliente_id
      WHERE t.fecha_trabajo = ${fecha} AND t.estado != 'rechazado'
    `
    return { items: itemsRows, trabajos: trabajosRows }
  }

  if (name === 'crear_agenda_item') {
    const { fecha, texto, hora, trabajo_id } = input
    if (hora && !/^\d{2}:\d{2}$/.test(hora)) {
      return { error: 'Formato de hora inválido, usá HH:MM' }
    }
    try {
      const result = await sql`
        INSERT INTO agenda_items (fecha, hora, texto, trabajo_id)
        VALUES (${fecha}, ${hora || null}, ${texto}, ${trabajo_id || null})
        RETURNING *
      `
      return { item: result[0] }
    } catch (err: any) {
      console.error('Error creando ítem de agenda (tool crear_agenda_item):', err)
      return { error: `No se pudo crear el ítem de agenda: ${err.message || err}` }
    }
  }

  if (name === 'borrar_agenda_item') {
    const { id } = input
    const result = await sql`DELETE FROM agenda_items WHERE id = ${id} RETURNING *`
    if (result.length === 0) return { error: 'Ítem no encontrado' }
    return { borrado: result[0] }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
