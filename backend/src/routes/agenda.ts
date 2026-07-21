import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const agenda = new Hono<{ Bindings: Bindings }>()

// Traer todos los ítems de un mes (para pintar el calendario)
agenda.get('/mes/:year/:month', requireAuth, async (c) => {
  const year = c.req.param('year')
  const month = c.req.param('month')
  const sql = neon(c.env.DATABASE_URL)

  const rows = await sql`
    SELECT ai.*, t.cliente_id AS trabajo_cliente_id, c.nombre AS trabajo_cliente_nombre, t.estado AS trabajo_estado
    FROM agenda_items ai
    LEFT JOIN trabajos t ON t.id = ai.trabajo_id
    LEFT JOIN clientes c ON c.id = t.cliente_id
    WHERE EXTRACT(YEAR FROM ai.fecha) = ${year} AND EXTRACT(MONTH FROM ai.fecha) = ${month}
    ORDER BY ai.fecha, ai.hora NULLS LAST, ai.created_at
  `
  return c.json({ ok: true, items: rows })
})

// Traer los ítems de un día puntual
agenda.get('/:fecha', requireAuth, async (c) => {
  const fecha = c.req.param('fecha')
  const sql = neon(c.env.DATABASE_URL)
  const rows = await sql`
    SELECT ai.*, t.cliente_id AS trabajo_cliente_id, c.nombre AS trabajo_cliente_nombre, t.estado AS trabajo_estado
    FROM agenda_items ai
    LEFT JOIN trabajos t ON t.id = ai.trabajo_id
    LEFT JOIN clientes c ON c.id = t.cliente_id
    WHERE ai.fecha = ${fecha}
    ORDER BY ai.hora NULLS LAST, ai.created_at
  `
  return c.json({ ok: true, items: rows })
})

// Crear un ítem de agenda
agenda.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const { fecha, texto, hora, trabajo_id } = body

  if (!fecha || !texto) {
    return c.json({ error: 'Faltan fecha o texto' }, 400)
  }

  if (hora && !/^\d{2}:\d{2}$/.test(hora)) {
    return c.json({ error: 'Formato de hora inválido, usá HH:MM' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  try {
    const result = await sql`
      INSERT INTO agenda_items (fecha, hora, texto, trabajo_id)
      VALUES (${fecha}, ${hora || null}, ${texto}, ${trabajo_id || null})
      RETURNING *
    `
    return c.json({ ok: true, item: result[0] })
  } catch (err) {
    console.error('Error creando ítem de agenda:', err)
    return c.json({ error: 'No se pudo crear el ítem de agenda' }, 500)
  }
})

// Actualizar un ítem de agenda
agenda.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const allowedFields = ['fecha', 'hora', 'texto', 'trabajo_id']
  const updates = Object.entries(body).filter(([key]) => allowedFields.includes(key))

  if (updates.length === 0) return c.json({ error: 'No se especificó ningún campo para actualizar' }, 400)

  const sql = neon(c.env.DATABASE_URL)
  const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
  const values = updates.map(([, value]) => value)
  const query = `UPDATE agenda_items SET ${setClauses} WHERE id = $1 RETURNING *`
  const result = await sql.query(query, [id, ...values])

  if (result.length === 0) return c.json({ error: 'Ítem no encontrado' }, 404)
  return c.json({ ok: true, item: result[0] })
})

// Borrar un ítem de agenda
agenda.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`DELETE FROM agenda_items WHERE id = ${id} RETURNING *`
  if (result.length === 0) return c.json({ error: 'Ítem no encontrado' }, 404)
  return c.json({ ok: true, borrado: result[0] })
})

export default agenda
