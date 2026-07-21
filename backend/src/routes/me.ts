import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const me = new Hono<{ Bindings: Bindings }>()

me.get('/', requireAuth, (c) => {
  const user = c.get('user')
  return c.json({ ok: true, user })
})

export default me
