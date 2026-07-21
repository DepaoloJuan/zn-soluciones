import { neon } from '@neondatabase/serverless'

export const clientesTools = [
  {
    name: 'buscar_cliente',
    description: 'Busca un cliente por nombre (búsqueda flexible, no exacta). Usar antes de crear_trabajo si no se sabe el ID del cliente.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
      },
      required: ['nombre'],
    },
  },
  {
    name: 'crear_cliente',
    description: 'Crea un cliente nuevo. Usar cuando el usuario menciona un cliente que buscar_cliente no encontró.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        telefono: { type: 'string' },
        email: { type: 'string' },
        direccion: { type: 'string' },
      },
      required: ['nombre'],
    },
  },
  {
    name: 'actualizar_cliente',
    description: 'Actualiza los datos de contacto de un cliente existente.',
    input_schema: {
      type: 'object',
      properties: {
        cliente_id: { type: 'number' },
        nombre: { type: 'string' },
        telefono: { type: 'string' },
        email: { type: 'string' },
        direccion: { type: 'string' },
      },
      required: ['cliente_id'],
    },
  },
  {
    name: 'borrar_cliente',
    description: 'Borra un cliente y TODOS sus trabajos y presupuestos asociados de forma permanente. Acción destructiva e irreversible: SIEMPRE preguntar al usuario y esperar confirmación explícita en el chat antes de llamar a esta herramienta.',
    input_schema: {
      type: 'object',
      properties: {
        cliente_id: { type: 'number' },
      },
      required: ['cliente_id'],
    },
  },
]

export async function executeClienteTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'buscar_cliente') {
    const { nombre } = input
    const rows = await sql`
      SELECT * FROM clientes WHERE LOWER(nombre) LIKE LOWER(${'%' + nombre + '%'}) ORDER BY nombre LIMIT 5
    `
    return { resultados: rows }
  }

  if (name === 'crear_cliente') {
    const { nombre, telefono, email, direccion } = input
    const result = await sql`
      INSERT INTO clientes (nombre, telefono, email, direccion)
      VALUES (${nombre}, ${telefono || null}, ${email || null}, ${direccion || null})
      RETURNING *
    `
    return { cliente: result[0] }
  }

  if (name === 'actualizar_cliente') {
    const { cliente_id, ...campos } = input
    const allowedFields = ['nombre', 'telefono', 'email', 'direccion']
    const updates = Object.entries(campos).filter(([key]) => allowedFields.includes(key))

    if (updates.length === 0) return { error: 'No se especificó ningún campo para actualizar' }

    const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
    const values = updates.map(([, value]) => value)
    const query = `UPDATE clientes SET ${setClauses} WHERE id = $1 RETURNING *`
    const result = await sql.query(query, [cliente_id, ...values])

    if (result.length === 0) return { error: 'Cliente no encontrado' }
    return { cliente: result[0] }
  }

  if (name === 'borrar_cliente') {
    const { cliente_id } = input
    const result = await sql`DELETE FROM clientes WHERE id = ${cliente_id} RETURNING *`
    if (result.length === 0) return { error: 'Cliente no encontrado' }
    return { borrado: result[0] }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
