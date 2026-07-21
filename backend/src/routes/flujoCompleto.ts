import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'
import { executeFlujoCompletoTool } from '../tools/flujoCompleto'

const flujoCompleto = new Hono<{ Bindings: Bindings }>()

// Crea, en una única transacción atómica, cualquier combinación de
// cliente + trabajo + presupuesto + agenda. Pensado para el frontend web
// (GuardarPresupuestoModal): reemplaza la secuencia createCliente →
// createTrabajo → createPresupuesto por un solo request sin riesgo de
// dejar datos huérfanos si un paso intermedio falla.
flujoCompleto.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const resultado = await executeFlujoCompletoTool('crear_flujo_completo', body, c.env.DATABASE_URL)

  if (resultado.error) {
    return c.json({ error: resultado.error }, 400)
  }

  return c.json({ ok: true, ...resultado })
})

export default flujoCompleto
