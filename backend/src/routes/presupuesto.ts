import { Hono } from 'hono'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'
import { getMaterials, calcQuantity, recommendMasilla, recommendCinta } from '../materiales'

const presupuesto = new Hono<{ Bindings: Bindings }>()

presupuesto.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const { category, m2, waste } = body

  if (!category || typeof m2 !== 'number' || m2 <= 0) {
    return c.json({ error: 'Faltan datos: category y m2 son obligatorios' }, 400)
  }

  const wasteValue = typeof waste === 'number' ? waste : 0.10
  const materials = await getMaterials(c.env.DATABASE_URL, category)

  if (materials.length === 0) {
    return c.json({ error: `No hay materiales configurados para "${category}"` }, 404)
  }

  const effectiveM2 = m2 * (1 + wasteValue)

  const result = materials.map((mat) => {
    const rawQty = effectiveM2 * mat.perM2
    const qty = calcQuantity(rawQty, mat.round)

    let recommendation = null
    if (mat.id === 'masilla') recommendation = recommendMasilla(qty)
    if (mat.id === 'cinta') recommendation = recommendCinta(qty)

    return { ...mat, qty, recommendation }
  })

  return c.json({ ok: true, category, m2, waste: wasteValue, materials: result })
})

export default presupuesto
