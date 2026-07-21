import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const trabajos = new Hono<{ Bindings: Bindings }>()

// Listar trabajos, opcionalmente filtrados por estado (?estado=pendiente)
trabajos.get('/', requireAuth, async (c) => {
  const estado = c.req.query('estado')
  const sql = neon(c.env.DATABASE_URL)

  const rows = estado
    ? await sql`
        SELECT t.*, c.nombre AS cliente_nombre
        FROM trabajos t JOIN clientes c ON c.id = t.cliente_id
        WHERE t.estado = ${estado} ORDER BY fecha_trabajo ASC NULLS LAST
      `
    : await sql`
        SELECT t.*, c.nombre AS cliente_nombre
        FROM trabajos t JOIN clientes c ON c.id = t.cliente_id
        ORDER BY t.created_at DESC
      `

  return c.json({ ok: true, trabajos: rows })
})

// Crear un trabajo nuevo (arranca en estado "borrador")
trabajos.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const { cliente_id, descripcion } = body

  if (!cliente_id) {
    return c.json({ error: 'Falta cliente_id' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`
    INSERT INTO trabajos (cliente_id, descripcion)
    VALUES (${cliente_id}, ${descripcion || null})
    RETURNING *
  `
  return c.json({ ok: true, trabajo: result[0] }, 201)
})

// Ver un trabajo con sus presupuestos
trabajos.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)

  const trabajoRows = await sql`
    SELECT t.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
    FROM trabajos t
    JOIN clientes c ON c.id = t.cliente_id
    WHERE t.id = ${id}
  `
  if (trabajoRows.length === 0) {
    return c.json({ error: 'Trabajo no encontrado' }, 404)
  }

  const presupuestos = await sql`
    SELECT id, category, m2, total, enviado_at, created_at
    FROM presupuestos WHERE trabajo_id = ${id} ORDER BY created_at DESC
  `

  return c.json({ ok: true, trabajo: trabajoRows[0], presupuestos })
})

// Actualizar campos del trabajo (estado, fecha, cobro, etc.)
trabajos.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  const allowedFields = ['nombre_cliente', 'descripcion', 'fecha_trabajo', 'estado', 'forma_pago', 'monto_cobrado']
  const updates = Object.entries(body).filter(([key]) => allowedFields.includes(key))

  if (updates.length === 0) {
    return c.json({ error: 'No se enviaron campos válidos' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
  const values = updates.map(([, value]) => value)

  const query = `UPDATE trabajos SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`
  const result = await sql.query(query, [id, ...values])

  if (result.length === 0) {
    return c.json({ error: 'Trabajo no encontrado' }, 404)
  }

  return c.json({ ok: true, trabajo: result[0] })
})

export default trabajos
