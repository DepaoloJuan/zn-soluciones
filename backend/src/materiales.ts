import { neon } from '@neondatabase/serverless'

export type RoundType = 'ceil' | 'decimal'

export interface Material {
  id: string
  name: string
  unit: string
  color: string
  perM2: number
  round: RoundType
}

export function calcQuantity(rawQty: number, roundType: RoundType): number {
  if (roundType === 'decimal') return Math.ceil(rawQty * 10) / 10
  return Math.ceil(rawQty)
}

export function formatQty(qty: number, unit: string): string {
  if (unit === 'kg' || unit === 'mt') return qty.toFixed(1)
  return String(Math.ceil(qty))
}

// ── Recomendador de baldes de masilla ──────────────────────────────────────
const MASILLA_BALDES = [
  { label: 'Balde grande',  kg: 32 },
  { label: 'Balde mediano', kg: 15 },
  { label: 'Balde chico',   kg: 7  },
]

export function recommendMasilla(totalKg: number) {
  let restante = totalKg
  const resultado: { label: string; kg: number; cantidad: number }[] = []
  for (const balde of MASILLA_BALDES) {
    const cantidad = Math.floor(restante / balde.kg)
    if (cantidad > 0) {
      resultado.push({ ...balde, cantidad })
      restante = Math.round((restante - cantidad * balde.kg) * 100) / 100
    }
  }
  if (restante > 0) {
    const ultimo = resultado[resultado.length - 1]
    const menor = MASILLA_BALDES[MASILLA_BALDES.length - 1]
    if (ultimo && ultimo.kg === menor.kg) {
      ultimo.cantidad += 1
    } else {
      resultado.push({ ...menor, cantidad: 1 })
    }
  }
  return resultado
}

// ── Recomendador de rollos de cinta ───────────────────────────────────────
const CINTA_ROLLOS = [
  { label: 'Rollo 150 mts', metros: 150 },
  { label: 'Rollo 75 mts',  metros: 75  },
  { label: 'Rollo 20 mts',  metros: 20  },
]

export function recommendCinta(totalMetros: number) {
  let restante = totalMetros
  const resultado: { label: string; metros: number; cantidad: number }[] = []
  for (const rollo of CINTA_ROLLOS) {
    const cantidad = Math.floor(restante / rollo.metros)
    if (cantidad > 0) {
      resultado.push({ ...rollo, cantidad })
      restante = Math.round((restante - cantidad * rollo.metros) * 100) / 100
    }
  }
  if (restante > 0) {
    const ultimo = resultado[resultado.length - 1]
    const menor = CINTA_ROLLOS[CINTA_ROLLOS.length - 1]
    if (ultimo && ultimo.metros === menor.metros) {
      ultimo.cantidad += 1
    } else {
      resultado.push({ ...menor, cantidad: 1 })
    }
  }
  return resultado
}

export async function getMaterials(databaseUrl: string, category: string): Promise<Material[]> {
  const sql = neon(databaseUrl)
  const rows = await sql`
    SELECT id, name, unit, color, per_m2 as "perM2", round_type as round
    FROM materials
    WHERE category = ${category}
    ORDER BY sort_order
  `
  return rows.map((r: any) => ({
    ...r,
    perM2: Number(r.perM2),
  })) as Material[]
}