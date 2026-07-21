import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const notas = new Hono<{ Bindings: Bindings }>()

// Traer todas las notas de un mes (para pintar el calendario)
notas.get('/mes/:year/:month', requireAuth, async (c) => {
  const year = c.req.param('year')
  const month = c.req.param('month')
  const sql = neon(c.env.DATABASE_URL)

  const rows = await sql`
    SELECT * FROM notas_agenda
    WHERE EXTRACT(YEAR FROM fecha) = ${year} AND EXTRACT(MONTH FROM fecha) = ${month}
  `
  return c.json({ ok: true, notas: rows })
})

// Traer (o no) la nota de un día puntual
notas.get('/:fecha', requireAuth, async (c) => {
  const fecha = c.req.param('fecha')
  const sql = neon(c.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM notas_agenda WHERE fecha = ${fecha}`
  return c.json({ ok: true, nota: rows[0] || null })
})

// Crear o actualizar la nota de un día
notas.put('/:fecha', requireAuth, async (c) => {
  const fecha = c.req.param('fecha')
  const body = await c.req.json()
  const { nota } = body

  if (!nota) return c.json({ error: 'Falta el texto de la nota' }, 400)

  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`
    INSERT INTO notas_agenda (fecha, nota) VALUES (${fecha}, ${nota})
    ON CONFLICT (fecha) DO UPDATE SET nota = ${nota}, updated_at = NOW()
    RETURNING *
  `
  return c.json({ ok: true, nota: result[0] })
})

export default notas
