import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const clientes = new Hono<{ Bindings: Bindings }>()

// Listar todos los clientes
clientes.get('/', requireAuth, async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM clientes ORDER BY nombre ASC`
  return c.json({ ok: true, clientes: rows })
})

// Crear un cliente nuevo
clientes.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const { nombre, telefono, email, direccion } = body

  if (!nombre) {
    return c.json({ error: 'Falta el nombre' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`
    INSERT INTO clientes (nombre, telefono, email, direccion)
    VALUES (${nombre}, ${telefono || null}, ${email || null}, ${direccion || null})
    RETURNING *
  `
  return c.json({ ok: true, cliente: result[0] }, 201)
})

// Ver un cliente con su historial de trabajos y presupuestos
clientes.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)

  const clienteRows = await sql`SELECT * FROM clientes WHERE id = ${id}`
  if (clienteRows.length === 0) {
    return c.json({ error: 'Cliente no encontrado' }, 404)
  }

  const trabajos = await sql`
    SELECT t.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', p.id, 'category', p.category, 'total', p.total, 'enviado_at', p.enviado_at))
         FROM presupuestos p WHERE p.trabajo_id = t.id),
        '[]'
      ) AS presupuestos
    FROM trabajos t
    WHERE t.cliente_id = ${id}
    ORDER BY t.created_at DESC
  `

  return c.json({ ok: true, cliente: clienteRows[0], trabajos })
})

// Editar un cliente
clientes.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  const allowedFields = ['nombre', 'telefono', 'email', 'direccion']
  const updates = Object.entries(body).filter(([key]) => allowedFields.includes(key))

  if (updates.length === 0) {
    return c.json({ error: 'No se enviaron campos válidos' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
  const values = updates.map(([, value]) => value)

  const query = `UPDATE clientes SET ${setClauses} WHERE id = $1 RETURNING *`
  const result = await sql.query(query, [id, ...values])

  if (result.length === 0) {
    return c.json({ error: 'Cliente no encontrado' }, 404)
  }
  return c.json({ ok: true, cliente: result[0] })
})

clientes.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)

  const result = await sql`DELETE FROM clientes WHERE id = ${id} RETURNING *`

  if (result.length === 0) {
    return c.json({ error: 'Cliente no encontrado' }, 404)
  }

  return c.json({ ok: true, deleted: result[0] })
})

export default clientes
