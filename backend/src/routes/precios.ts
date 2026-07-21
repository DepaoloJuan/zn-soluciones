import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const precios = new Hono<{ Bindings: Bindings }>()

// Buscar un precio por descripción (búsqueda flexible, no exacta)
precios.get('/buscar', requireAuth, async (c) => {
  const q = c.req.query('q')
  if (!q) return c.json({ error: 'Falta el parámetro q' }, 400)

  const sql = neon(c.env.DATABASE_URL)
  const rows = await sql`
    SELECT * FROM precios_items
    WHERE LOWER(descripcion) LIKE LOWER(${'%' + q + '%'})
    ORDER BY updated_at DESC
    LIMIT 5
  `
  return c.json({ ok: true, resultados: rows })
})

// Guardar o actualizar un precio
precios.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const { descripcion, precio } = body

  if (!descripcion || typeof precio !== 'number') {
    return c.json({ error: 'Faltan datos: descripcion y precio son obligatorios' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)

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

  return c.json({ ok: true, item: result[0] })
})

export default precios
