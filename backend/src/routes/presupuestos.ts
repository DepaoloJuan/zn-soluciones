import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const presupuestos = new Hono<{ Bindings: Bindings }>()

// Guardar un presupuesto calculado, asociado a un trabajo
presupuestos.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const { trabajo_id, category, m2, waste, materials, total } = body

  if (!trabajo_id || !category || typeof m2 !== 'number' || !materials || typeof total !== 'number') {
    return c.json({ error: 'Faltan datos obligatorios' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`
    INSERT INTO presupuestos (trabajo_id, category, m2, waste, materials, total)
    VALUES (${trabajo_id}, ${category}, ${m2}, ${waste}, ${JSON.stringify(materials)}, ${total})
    RETURNING *
  `

  // Si el trabajo todavía está en "evaluado", avanza a "cotizado"
  await sql`
    UPDATE trabajos SET estado = 'cotizado', updated_at = NOW()
    WHERE id = ${trabajo_id} AND estado = 'evaluado'
  `

  return c.json({ ok: true, presupuesto: result[0] }, 201)
})

// Ver un presupuesto puntual
presupuestos.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`SELECT * FROM presupuestos WHERE id = ${id}`

  if (result.length === 0) {
    return c.json({ error: 'Presupuesto no encontrado' }, 404)
  }
  return c.json({ ok: true, presupuesto: result[0] })
})

// Editar un presupuesto (libre, sin restricción de estado)
presupuestos.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  const allowedFields = ['category', 'm2', 'waste', 'materials', 'total']
  const updates = Object.entries(body).filter(([key]) => allowedFields.includes(key))

  if (updates.length === 0) {
    return c.json({ error: 'No se enviaron campos válidos' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
  const values = updates.map(([key, value]) => (key === 'materials' ? JSON.stringify(value) : value))

  const query = `UPDATE presupuestos SET ${setClauses} WHERE id = $1 RETURNING *`
  const result = await sql.query(query, [id, ...values])

  if (result.length === 0) {
    return c.json({ error: 'Presupuesto no encontrado' }, 404)
  }
  return c.json({ ok: true, presupuesto: result[0] })
})

// Marcar como enviado — y de paso, pasar el trabajo a estado "pendiente"
presupuestos.post('/:id/enviar', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)

  const result = await sql`
    UPDATE presupuestos SET enviado_at = NOW() WHERE id = ${id} RETURNING *
  `
  if (result.length === 0) {
    return c.json({ error: 'Presupuesto no encontrado' }, 404)
  }

  const trabajoId = result[0].trabajo_id
  await sql`
    UPDATE trabajos SET estado = 'enviado', updated_at = NOW() WHERE id = ${trabajoId}
  `

  return c.json({ ok: true, presupuesto: result[0] })
})

export default presupuestos
