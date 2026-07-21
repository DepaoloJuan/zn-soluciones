import { neon } from '@neondatabase/serverless'
import { getMaterials } from '../materiales'

export const materialesTools = [
  {
    name: 'listar_materiales',
    description: 'Lista los materiales configurados para una categoría (cielorraso o tabique), con sus ratios por m².',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['cielorraso', 'tabique'] },
      },
      required: ['category'],
    },
  },
  {
    name: 'crear_material',
    description: 'Agrega un material nuevo a una categoría, con su ratio por m².',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['cielorraso', 'tabique'] },
        id: { type: 'string', description: 'Identificador corto, sin espacios, ej: "placas2"' },
        name: { type: 'string' },
        unit: { type: 'string', description: 'ej: unidad, kg, mt' },
        color: { type: 'string', description: 'Color hex, ej: #1db954' },
        per_m2: { type: 'number' },
        round_type: { type: 'string', enum: ['ceil', 'decimal'] },
      },
      required: ['category', 'id', 'name', 'unit', 'color', 'per_m2', 'round_type'],
    },
  },
  {
    name: 'actualizar_material',
    description: 'Actualiza el ratio por m² u otros datos de un material existente.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['cielorraso', 'tabique'] },
        id: { type: 'string' },
        per_m2: { type: 'number' },
        name: { type: 'string' },
      },
      required: ['category', 'id'],
    },
  },
  {
    name: 'borrar_material',
    description: 'Borra un material de una categoría de forma permanente. Acción destructiva: SIEMPRE preguntar al usuario y esperar confirmación explícita en el chat antes de llamar a esta herramienta.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['cielorraso', 'tabique'] },
        id: { type: 'string' },
      },
      required: ['category', 'id'],
    },
  },
]

export async function executeMaterialTool(name: string, input: any, databaseUrl: string) {
  const sql = neon(databaseUrl)

  if (name === 'listar_materiales') {
    const { category } = input
    const materials = await getMaterials(databaseUrl, category)
    return { materials }
  }

  if (name === 'crear_material') {
    const { category, id, name: nombreMaterial, unit, color, per_m2, round_type } = input
    try {
      const result = await sql`
        INSERT INTO materials (id, category, name, unit, color, per_m2, round_type, sort_order)
        VALUES (${id}, ${category}, ${nombreMaterial}, ${unit}, ${color}, ${per_m2}, ${round_type}, 999)
        RETURNING *
      `
      return { material: result[0] }
    } catch (err: any) {
      if (err.message?.includes('duplicate key')) {
        return { error: `Ya existe un material con id "${id}" en "${category}"` }
      }
      throw err
    }
  }

  if (name === 'actualizar_material') {
    const { category, id, ...campos } = input
    const allowedFields = ['name', 'unit', 'color', 'per_m2', 'round_type', 'sort_order']
    const updates = Object.entries(campos).filter(([key]) => allowedFields.includes(key))

    if (updates.length === 0) return { error: 'No se especificó ningún campo para actualizar' }

    const setClauses = updates.map(([key], i) => `${key} = $${i + 3}`).join(', ')
    const values = updates.map(([, value]) => value)
    const query = `UPDATE materials SET ${setClauses} WHERE category = $1 AND id = $2 RETURNING *`
    const result = await sql.query(query, [category, id, ...values])

    if (result.length === 0) return { error: 'Material no encontrado' }
    return { material: result[0] }
  }

  if (name === 'borrar_material') {
    const { category, id } = input
    const result = await sql`DELETE FROM materials WHERE category = ${category} AND id = ${id} RETURNING *`
    if (result.length === 0) return { error: 'Material no encontrado' }
    return { borrado: result[0] }
  }

  return { error: `Herramienta desconocida: ${name}` }
}
