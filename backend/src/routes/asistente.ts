import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'
import { allTools, executeTool } from '../tools'

const asistente = new Hono<{ Bindings: Bindings }>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateConversacion(sql: any) {
  const existentes = await sql`SELECT id FROM conversaciones ORDER BY created_at DESC LIMIT 1` as Record<string, any>[]
  if (existentes.length > 0) return existentes[0].id

  const nueva = await sql`INSERT INTO conversaciones DEFAULT VALUES RETURNING id` as Record<string, any>[]
  return nueva[0].id
}

// Traer el historial de la conversación actual
asistente.get('/historial', requireAuth, async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const conversacionId = await getOrCreateConversacion(sql)
  const limit = Number(c.req.query('limit')) || 20

  const mensajes = await sql`
    SELECT rol, contenido, created_at FROM mensajes
    WHERE conversacion_id = ${conversacionId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  const total = await sql`
    SELECT COUNT(*) as cantidad FROM mensajes WHERE conversacion_id = ${conversacionId}
  `

  return c.json({
    ok: true,
    conversacion_id: conversacionId,
    mensajes: (mensajes as Record<string, any>[]).reverse(),
    total: Number((total as Record<string, any>[])[0].cantidad),
  })
})

const SYSTEM_INSTRUCTION = `Sos el asistente de NZ Soluciones, una empresa de construcción en seco y mantenimiento integral en Argentina. Hablás en español rioplatense, de forma natural y directa, como si fueras un compañero de trabajo de Nico (el dueño de la empresa).

Tenés acceso a herramientas para consultar y modificar trabajos, presupuestos, clientes, materiales, gastos y notas de agenda. Usalas activamente para responder con datos reales en vez de inventar información.

Para acciones destructivas (borrar algo), siempre confirmá antes de ejecutar.

IMPORTANTE: Nico nunca sabe ni va a decirte IDs internos (de trabajo, cliente o presupuesto). Cuando necesites un ID:
1. Si menciona un cliente por nombre, usá buscar_cliente.
2. Si te habla de un trabajo sin ID, usá consultar_trabajos o ver_trabajo para encontrarlo por nombre/fecha/descripción.
3. Nunca le pidas a Nico que te diga un número de ID directamente.

Si Nico te pide varias cosas encadenadas en un solo pedido (ej: "creame un cliente nuevo, Fulano, con un trabajo de cielorraso de 20 metros para el martes a las 10"), no vayas llamando cliente → trabajo → presupuesto → agenda una por una: usá crear_flujo_completo, que hace todo junto en una sola operación atómica (si algo falla, no queda nada guardado a medias). Reservá los tools sueltos (crear_cliente, crear_trabajo, calcular_presupuesto, guardar_presupuesto, crear_agenda_item, etc.) para cuando el pedido sea de un solo paso, por ejemplo "agregame un cliente nuevo" y nada más.`

const geminiTools = [
  {
    functionDeclarations: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    })),
  },
]

async function llamarGemini(contents: any[], apiKey: string) {
  const modelo = 'gemini-3.6-flash' // confirmado GA vigente (ai.google.dev/gemini-api/docs/latest-model) — gemini-2.5-flash fue retirado por Google
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      tools: geminiTools,
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Error de Gemini: ${res.status} - ${errBody}`)
  }

  return res.json() as Promise<any>
}

// Enviar un mensaje nuevo
asistente.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  const { mensaje } = body

  if (!mensaje) {
    return c.json({ error: 'Falta el mensaje' }, 400)
  }

  const sql = neon(c.env.DATABASE_URL)
  const conversacionId = await getOrCreateConversacion(sql)

  await sql`
    INSERT INTO mensajes (conversacion_id, rol, contenido)
    VALUES (${conversacionId}, 'usuario', ${mensaje})
  `

  // Traemos el historial reciente para darle contexto a Gemini
  const historialRows = await sql`
    SELECT rol, contenido FROM mensajes
    WHERE conversacion_id = ${conversacionId}
    ORDER BY created_at DESC
    LIMIT 20
  ` as Record<string, any>[]

  const contents: any[] = historialRows.reverse().map((m) => ({
    role: m.rol === 'usuario' ? 'user' : 'model',
    parts: [{ text: m.contenido }],
  }))

  let respuestaFinal = ''
  let vueltas = 0

  try {
    while (vueltas < 5) {
      vueltas++
      const data = await llamarGemini(contents, c.env.GEMINI_API_KEY)
      const parts = data.candidates?.[0]?.content?.parts || []

      const functionCalls = parts.filter((p: any) => p.functionCall)

      if (functionCalls.length === 0) {
        respuestaFinal = parts.map((p: any) => p.text || '').join('')
        break
      }

      contents.push({ role: 'model', parts })

      const functionResponseParts = []
      for (const fcPart of functionCalls) {
        const { name, args } = fcPart.functionCall
        const resultado = await executeTool(name, args, c.env.DATABASE_URL)
        functionResponseParts.push({ functionResponse: { name, response: resultado } })
      }
      contents.push({ role: 'user', parts: functionResponseParts })
    }
  } catch (err: any) {
    console.error('Error en el loop de function-calling del asistente:', err)
    respuestaFinal = `Perdón, tuve un problema procesando tu pedido: ${err.message || err}. Probá de nuevo.`
  }

  if (!respuestaFinal) {
    respuestaFinal = 'Perdón, tuve un problema procesando tu pedido. Probá de nuevo.'
  }

  await sql`
    INSERT INTO mensajes (conversacion_id, rol, contenido)
    VALUES (${conversacionId}, 'asistente', ${respuestaFinal})
  `

  return c.json({ ok: true, respuesta: respuestaFinal })
})

// Empezar una conversación nueva (borra el hilo actual, arranca de cero)
asistente.post('/nueva', requireAuth, async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const nueva = await sql`INSERT INTO conversaciones DEFAULT VALUES RETURNING id`
  return c.json({ ok: true, conversacion_id: nueva[0].id })
})

// Borrar todo el historial de verdad
asistente.delete('/historial', requireAuth, async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  await sql`DELETE FROM conversaciones`
  const nueva = await sql`INSERT INTO conversaciones DEFAULT VALUES RETURNING id` as Record<string, any>[]
  return c.json({ ok: true, conversacion_id: nueva[0].id })
})

export default asistente
