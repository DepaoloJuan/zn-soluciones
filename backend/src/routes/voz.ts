import { Hono } from 'hono'
import type { Bindings } from '../types'
import { allTools, executeTool } from '../tools'

const voz = new Hono<{ Bindings: Bindings }>()

// Endpoint de prueba: valida que el WebSocket del cliente conecta
// y que el Worker puede abrir un WebSocket saliente hacia Gemini Live.
// Todavía es solo plumbing, sin procesar audio real ni tools.
voz.get('/', async (c) => {
  const upgradeHeader = c.req.header('Upgrade')
  if (upgradeHeader !== 'websocket') {
    return c.text('Esta ruta espera una conexión WebSocket', 426)
  }

  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair)
  server.accept()

  // OJO: confirmar el nombre exacto del modelo Live vigente en la doc de
  // Google AI antes de probar esto — el string del modelo cambia seguido.
  const modelo = 'models/gemini-2.5-flash-native-audio-preview-09-2025'
  const geminiUrl = `https://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${c.env.GEMINI_API_KEY}`

  const geminiResp = await fetch(geminiUrl, { headers: { Upgrade: 'websocket' } })
  const geminiSocket = geminiResp.webSocket

  if (!geminiSocket) {
    server.close(1011, 'No se pudo conectar con Gemini Live')
    return new Response(null, { status: 500 })
  }
  geminiSocket.accept()

  const geminiTools = [
    {
      functionDeclarations: allTools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      })),
    },
  ]

  const systemInstruction = {
    parts: [{
      text: `Sos el asistente de voz de NZ Soluciones, una empresa de construcción en seco y mantenimiento integral en Argentina. Hablás en español rioplatense, de forma natural y directa, como si fueras un compañero de trabajo de Nico (el dueño de la empresa).

Tenés acceso a herramientas para consultar y modificar trabajos, presupuestos, clientes, materiales, gastos y notas de agenda. Usalas activamente para responder con datos reales en vez de inventar información.

Para acciones destructivas (borrar algo), siempre confirmá antes de ejecutar.

IMPORTANTE: Nico nunca sabe ni va a decirte IDs internos (de trabajo, cliente o presupuesto) — esos son detalles de la base de datos que él no maneja. Cuando necesites un ID para usar una herramienta:
1. Si menciona un cliente por nombre, usá buscar_cliente para encontrarlo.
2. Si te habla de un trabajo sin ID (ej: "el último presupuesto", "el trabajo de García"), usá listar_trabajos para ver la lista y encontrar el que corresponde por nombre de cliente, descripción o fecha.
3. Solo si hay ambigüedad real (por ejemplo, dos trabajos del mismo cliente) preguntale a Nico cuál de los dos es, describiéndoselo por cliente/fecha/descripción — nunca por ID.
4. Nunca le pidas a Nico que te diga un número de ID directamente.

Cuando Nico te pida ver, pasarte o mostrar un trabajo o presupuesto específico (frases como "pasamelo", "mostrámelo", "quiero verlo", "ese"), aunque ya tengas esa información de una consulta anterior en la misma conversación, SIEMPRE volvé a llamar a ver_trabajo para ese trabajo puntual antes de responder. Eso hace que aparezca visualmente en la pantalla, no solo que lo digas por voz.`,
    }],
  }

  geminiSocket.send(JSON.stringify({
    setup: {
      model: modelo,
      generationConfig: {
        responseModalities: ['AUDIO'],
      },
      systemInstruction,
      tools: geminiTools,
    },
  }))

  server.addEventListener('message', (event) => {
    geminiSocket.send(event.data)
  })

  geminiSocket.addEventListener('message', async (event) => {
    let contenido = event.data
    if (contenido instanceof Blob) {
      contenido = await contenido.text()
    }

    let msg
    try {
      msg = JSON.parse(contenido)
    } catch {
      server.send(contenido)
      return
    }

    if (msg.toolCall) {
      const functionResponses = []
      for (const fc of msg.toolCall.functionCalls) {
        const resultado = await executeTool(fc.name, fc.args, c.env.DATABASE_URL)
        functionResponses.push({ id: fc.id, name: fc.name, response: resultado })

        if (fc.name === 'ver_trabajo' && resultado.trabajo) {
          server.send(JSON.stringify({ nzEvento: { tipo: 'trabajo', item: resultado.trabajo } }))
          for (const p of resultado.presupuestos || []) {
            server.send(JSON.stringify({ nzEvento: { tipo: 'presupuesto', item: p } }))
          }
        }

        if ((fc.name === 'guardar_presupuesto' || fc.name === 'marcar_presupuesto_enviado') && resultado.presupuesto) {
          server.send(JSON.stringify({ nzEvento: { tipo: 'presupuesto', item: resultado.presupuesto } }))
        }
      }
      geminiSocket.send(JSON.stringify({ toolResponse: { functionResponses } }))
      return
    }

    server.send(contenido)
  })

  server.addEventListener('close', () => geminiSocket.close())
  geminiSocket.addEventListener('close', () => server.close())

  return new Response(null, { status: 101, webSocket: client })
})

export default voz
