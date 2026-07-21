import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const settings = new Hono<{ Bindings: Bindings }>()

settings.get('/:key', requireAuth, async (c) => {
  const key = c.req.param('key')
  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`SELECT value FROM settings WHERE key = ${key}`

  if (result.length === 0) {
    return c.json({ error: 'No encontrado' }, 404)
  }

  return c.json({ ok: true, key, value: result[0].value })
})

settings.put('/:key', requireAuth, async (c) => {
  const key = c.req.param('key')
  const body = await c.req.json()
  const { value } = body

  if (typeof value !== 'string') {
    return c.json({ error: 'Falta el campo "value"' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const result = await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = ${value}
    RETURNING *
  `

  return c.json({ ok: true, setting: result[0] })
})

export default settings
