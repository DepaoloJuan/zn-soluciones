import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'
import { getMaterials } from '../materiales'

const materiales = new Hono<{ Bindings: Bindings }>()

materiales.get('/:category', requireAuth, async (c) => {
  const category = c.req.param('category')
  const materials = await getMaterials(c.env.DATABASE_URL, category)
  return c.json({ ok: true, category, materials })
})

materiales.patch('/:category/:id', requireAuth, async (c) => {
  const category = c.req.param('category')
  const id = c.req.param('id')
  const body = await c.req.json()

  const allowedFields = ['name', 'unit', 'color', 'per_m2', 'round_type', 'sort_order']
  const updates = Object.entries(body).filter(([key]) => allowedFields.includes(key))

  if (updates.length === 0) {
    return c.json({ error: 'No se enviaron campos válidos para actualizar' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const setClauses = updates.map(([key], i) => `${key} = $${i + 3}`).join(', ')
  const values = updates.map(([, value]) => value)

  const query = `UPDATE materials SET ${setClauses} WHERE category = $1 AND id = $2 RETURNING *`
  const result = await sql.query(query, [category, id, ...values])

  if (result.length === 0) {
    return c.json({ error: 'Material no encontrado' }, 404)
  }

  return c.json({ ok: true, material: result[0] })
})

materiales.post('/:category', requireAuth, async (c) => {
  const category = c.req.param('category')
  const body = await c.req.json()
  const { id, name, unit, color, per_m2, round_type, sort_order } = body

  if (!id || !name || !unit || !color || typeof per_m2 !== 'number' || !round_type) {
    return c.json({ error: 'Faltan datos obligatorios: id, name, unit, color, per_m2, round_type' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)

  try {
    const result = await sql`
      INSERT INTO materials (id, category, name, unit, color, per_m2, round_type, sort_order)
      VALUES (${id}, ${category}, ${name}, ${unit}, ${color}, ${per_m2}, ${round_type}, ${sort_order ?? 999})
      RETURNING *
    `
    return c.json({ ok: true, material: result[0] }, 201)
  } catch (err: any) {
    if (err.message?.includes('duplicate key')) {
      return c.json({ error: `Ya existe un material con id "${id}" en "${category}"` }, 409)
    }
    throw err
  }
})

materiales.delete('/:category/:id', requireAuth, async (c) => {
  const category = c.req.param('category')
  const id = c.req.param('id')

  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`
    DELETE FROM materials WHERE category = ${category} AND id = ${id} RETURNING *
  `

  if (result.length === 0) {
    return c.json({ error: 'Material no encontrado' }, 404)
  }

  return c.json({ ok: true, deleted: result[0] })
})

export default materiales
