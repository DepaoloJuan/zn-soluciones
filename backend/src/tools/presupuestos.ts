import { neon } from '@neondatabase/serverless'
import { getMaterials, calcQuantity, recommendMasilla, recommendCinta } from '../materiales'

export const presupuestosTools = [
  {
    name: 'calcular_presupuesto',
    description: 'Calcula la cantidad de materiales para un presupuesto de cielorraso o tabique, según los metros cuadrados y el desperdicio. No guarda nada, solo calcula.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['cielorraso', 'tabique'], description: 'Tipo de trabajo' },
        m2: { type: 'number', description: 'Metros cuadrados a cubrir' },
        waste: { type: 'number', description: 'Porcentaje de desperdicio, como decimal (ej: 0.10 para 10%). Si no se especifica, usar 0.10' },
      },
      required: ['category', 'm2'],
    },
  },
  {
    name: 'guardar_presupuesto',
    description: 'Guarda un presupuesto ya calculado, asociado a un trabajo existente. Usar después de calcular_presupuesto si el usuario confirma que quiere guardarlo. Pasar el mismo array "materials" que devolvió calcular_presupuesto.',
    input_schema: {
      type: 'object',
      properties: {
        trabajo_id: { type: 'number', description: 'ID del trabajo al que se asocia' },
        category: { type: 'string', enum: ['cielorraso', 'tabique'] },
        m2: { type: 'number' },
        waste: { type: 'number' },
        total: { type: 'number' },
        materials: {
          type: 'array',
          description: 'El array de materiales calculados que devolvió calcular_presupuesto, tal cual (con qty y recommendation incluidos)',
          items: { type: 'object' },
        },
      },
      required: ['trabajo_id', 'category', 'm2', 'waste', 'total', 'materials'],
    },
  },
  {
    name: 'marcar_presupuesto_enviado',
    description: 'Marca un presupuesto como enviado al cliente. Esto también cambia el estado del trabajo a "enviado" automáticamente.',
    input_schema: {
      type: 'object',
      properties: {
        presupuesto_id: { type: 'number' },
      },
      required: ['presupuesto_id'],
    },
  },
]

export async function executePresupuestoTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'calcular_presupuesto') {
    const { category, m2, waste = 0.10 } = input
    const materials = await getMaterials(databaseUrl, category)

    if (materials.length === 0) {
      return { error: `No hay materiales configurados para "${category}"` }
    }

    const effectiveM2 = m2 * (1 + waste)
    const result = materials.map((mat) => {
      const rawQty = effectiveM2 * mat.perM2
      const qty = calcQuantity(rawQty, mat.round)
      let recommendation = null
      if (mat.id === 'masilla') recommendation = recommendMasilla(qty)
      if (mat.id === 'cinta') recommendation = recommendCinta(qty)
      return { ...mat, qty, recommendation }
    })

    return { category, m2, waste, materials: result }
  }

  if (name === 'guardar_presupuesto') {
    const { trabajo_id, category, m2, waste, total, materials } = input

    const masillaRecomendacion = materials.find((m: any) => m.id === 'masilla')?.recommendation || []
    const cintaRecomendacion = materials.find((m: any) => m.id === 'cinta')?.recommendation || []
    const materialsToStore = { rows: materials, masillaRecomendacion, cintaRecomendacion }

    const result = await sql`
      INSERT INTO presupuestos (trabajo_id, category, m2, waste, materials, total)
      VALUES (${trabajo_id}, ${category}, ${m2}, ${waste}, ${JSON.stringify(materialsToStore)}, ${total})
      RETURNING *
    `

    await sql`
      UPDATE trabajos SET estado = 'cotizado', updated_at = NOW()
      WHERE id = ${trabajo_id} AND estado = 'evaluado'
    `

    return { presupuesto: result[0] }
  }

  if (name === 'marcar_presupuesto_enviado') {
    const { presupuesto_id } = input
    const result = await sql`
      UPDATE presupuestos SET enviado_at = NOW() WHERE id = ${presupuesto_id} RETURNING *
    `
    if (result.length === 0) return { error: 'Presupuesto no encontrado' }

    await sql`UPDATE trabajos SET estado = 'enviado', updated_at = NOW() WHERE id = ${result[0].trabajo_id}`
    return { presupuesto: result[0] }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
