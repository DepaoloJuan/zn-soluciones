import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const gastos = new Hono<{ Bindings: Bindings }>()

// Listar gastos de un trabajo puntual
gastos.get('/trabajo/:trabajoId', requireAuth, async (c) => {
  const trabajoId = c.req.param('trabajoId')
  const sql = neon(c.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM gastos WHERE trabajo_id = ${trabajoId} ORDER BY created_at DESC`
  return c.json({ ok: true, gastos: rows })
})

// Crear un gasto para un trabajo
gastos.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const { trabajo_id, concepto, monto, categoria } = body

  if (!trabajo_id || !concepto || typeof monto !== 'number') {
    return c.json({ error: 'Faltan datos: trabajo_id, concepto y monto son obligatorios' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`
    INSERT INTO gastos (trabajo_id, concepto, monto, categoria)
    VALUES (${trabajo_id}, ${concepto}, ${monto}, ${categoria || null})
    RETURNING *
  `
  return c.json({ ok: true, gasto: result[0] }, 201)
})

// Borrar un gasto
gastos.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`DELETE FROM gastos WHERE id = ${id} RETURNING *`

  if (result.length === 0) {
    return c.json({ error: 'Gasto no encontrado' }, 404)
  }
  return c.json({ ok: true, deleted: result[0] })
})

export default gastos
