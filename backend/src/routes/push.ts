import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const push = new Hono<{ Bindings: Bindings }>()

// Devuelve la clave pública, para que el frontend la use al suscribirse
push.get('/vapid-public-key', requireAuth, async (c) => {
  return c.json({ ok: true, publicKey: c.env.VAPID_PUBLIC_KEY })
})

// Guarda la suscripción del dispositivo
push.post('/suscribir', requireAuth, async (c) => {
  const body = await c.req.json()
  const { endpoint, keys } = body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return c.json({ error: 'Suscripción inválida' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  await sql`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth)
    VALUES (${endpoint}, ${keys.p256dh}, ${keys.auth})
    ON CONFLICT (endpoint) DO NOTHING
  `
  return c.json({ ok: true })
})

export default push
