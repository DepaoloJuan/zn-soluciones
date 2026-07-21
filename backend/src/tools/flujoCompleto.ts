import { neon } from '@neondatabase/serverless'
import { calcularPresupuestoCore } from './presupuestos'

// ─────────────────────────────────────────────────────────────────────────
// Tool combinado "todo en uno": cliente + trabajo + presupuesto + agenda,
// en una única sentencia SQL atómica (WITH ... CTEs encadenados).
//
// Por qué no usamos sql.transaction() de @neondatabase/serverless:
// ese driver es HTTP-based (sin conexión TCP persistente, ideal para
// Cloudflare Workers), y su método `.transaction()` solo acepta un array
// de queries ya construidas (o una función que devuelve ese mismo array
// de forma síncrona) — todas se arman en JS ANTES de que se ejecute la
// primera, así que no hay forma de tomar un id generado por RETURNING en
// una query y usarlo como input de la siguiente dentro de esa misma
// llamada. Sirve para queries independientes en batch, no para un flujo
// imperativo con valores intermedios.
//
// La solución correcta para dependencias encadenadas (cliente → trabajo →
// presupuesto/agenda) es armar una única sentencia SQL con múltiples CTEs
// (`WITH nuevo_cliente AS (INSERT ... RETURNING id), nuevo_trabajo AS
// (INSERT ... VALUES ((SELECT id FROM nuevo_cliente), ...) RETURNING id), ...`).
// Una sola sentencia es atómica por definición en Postgres: si cualquier
// parte falla, TODA la sentencia se revierte automáticamente, sin necesidad
// de BEGIN/COMMIT/ROLLBACK manual ni de sql.transaction().
// ─────────────────────────────────────────────────────────────────────────

export const flujoCompletoTools = [
  {
    name: 'crear_flujo_completo',
    description:
      'Crea de una sola vez, en una única transacción atómica, cualquier combinación de: cliente + trabajo + presupuesto calculado y guardado + ítem de agenda. ' +
      'Usar cuando el pedido del dueño combina varios pasos en una sola vez (ej. "creame un cliente nuevo, Fulano, con un trabajo de cielorraso de 20 metros para el martes a las 10"). ' +
      'Es atómico: si cualquier paso falla, no se guarda nada (ni el cliente, ni el trabajo, ni el presupuesto, ni la agenda quedan a medias). ' +
      'Para pedidos de un solo paso (ej. "agregame un cliente nuevo" solo), usar los tools individuales (crear_cliente, crear_trabajo, calcular_presupuesto + guardar_presupuesto, crear_agenda_item) en su lugar: son más simples para ese caso.\n\n' +
      'Todos los bloques son opcionales de forma independiente — se ejecuta solo lo que tenga datos:\n' +
      '- Cliente: pasar cliente_id si ya existe (resolvelo antes con buscar_cliente), O cliente_nombre (+ cliente_telefono opcional) para crear uno nuevo. Mutuamente excluyentes: si vienen los dos, se usa cliente_id y se ignora cliente_nombre.\n' +
      '- Trabajo: pasar trabajo_id si ya existe, O trabajo_descripcion para crear uno nuevo (requiere un cliente resuelto, existente o creado en este mismo llamado). Mutuamente excluyentes igual que cliente: si vienen los dos, se usa trabajo_id.\n' +
      '- Presupuesto: pasar categoria + m2 (waste opcional, default 0.10) para calcular y guardar un presupuesto. Requiere un trabajo resuelto (trabajo_id o trabajo_descripcion en este mismo llamado).\n' +
      '- Agenda: pasar agenda_fecha + agenda_texto (agenda_hora opcional) para crear un ítem de agenda. Se asocia automáticamente al trabajo resuelto en este llamado, si hay uno.',
    input_schema: {
      type: 'object',
      properties: {
        cliente_id: { type: 'number', description: 'ID de un cliente ya existente. Prioridad sobre cliente_nombre si vienen ambos.' },
        cliente_nombre: { type: 'string', description: 'Nombre para crear un cliente nuevo (ignorado si viene cliente_id).' },
        cliente_telefono: { type: 'string', description: 'Teléfono del cliente nuevo, opcional.' },
        trabajo_id: { type: 'number', description: 'ID de un trabajo ya existente. Prioridad sobre trabajo_descripcion si vienen ambos.' },
        trabajo_descripcion: { type: 'string', description: 'Descripción para crear un trabajo nuevo, ej: "Cielorraso living". Ignorado si viene trabajo_id.' },
        categoria: { type: 'string', enum: ['cielorraso', 'tabique', 'libre'], description: 'Tipo de trabajo, para calcular y guardar un presupuesto. "libre" no se calcula: requiere materials y total ya armados (uso interno del frontend web para presupuestos de texto libre, no usar en conversación normal).' },
        m2: { type: 'number', description: 'Metros cuadrados a cubrir, para el presupuesto (no aplica si categoria es "libre").' },
        waste: { type: 'number', description: 'Porcentaje de desperdicio como decimal (ej: 0.10). Default 0.10 si no se especifica (no aplica si categoria es "libre").' },
        materials: { description: 'Solo junto con categoria "libre": objeto de ítems del presupuesto ya armado, tal cual se guarda sin recalcular.' },
        total: { type: 'number', description: 'Solo junto con categoria "libre": total del presupuesto ya calculado.' },
        agenda_fecha: { type: 'string', description: 'Formato YYYY-MM-DD, para crear un ítem de agenda.' },
        agenda_hora: { type: 'string', description: 'Formato HH:MM (24hs), opcional.' },
        agenda_texto: { type: 'string', description: 'Texto de la anotación de agenda.' },
      },
    },
  },
]

export async function executeFlujoCompletoTool(name: string, input: any, databaseUrl: string) {
  if (name !== 'crear_flujo_completo') {
    return { error: `Herramienta desconocida: ${name}` }
  }

  const sql = neon(databaseUrl)

  const {
    cliente_id,
    cliente_nombre,
    cliente_telefono,
    trabajo_id,
    trabajo_descripcion,
    categoria,
    m2,
    waste,
    materials,
    total,
    agenda_fecha,
    agenda_hora,
    agenda_texto,
  } = input

  const crearCliente = !cliente_id && !!cliente_nombre
  const usaClienteExistente = !!cliente_id
  const hayCliente = crearCliente || usaClienteExistente

  const crearTrabajo = !trabajo_id && !!trabajo_descripcion
  const usaTrabajoExistente = !!trabajo_id
  const hayTrabajo = crearTrabajo || usaTrabajoExistente

  const esLibre = categoria === 'libre'
  const crearPresupuestoCalculado = !!categoria && !esLibre && typeof m2 === 'number'
  const crearPresupuestoLibre = esLibre && materials != null && typeof total === 'number'
  const crearPresupuesto = crearPresupuestoCalculado || crearPresupuestoLibre
  const crearAgenda = !!agenda_fecha && !!agenda_texto

  // ── Validaciones previas: nada se toca en la base si falta algo ──
  if (crearTrabajo && !hayCliente) {
    return { error: 'Para crear un trabajo hace falta un cliente: pasá cliente_id (uno existente) o cliente_nombre (para crear uno nuevo). No se guardó nada.' }
  }
  if ((agenda_fecha && !agenda_texto) || (!agenda_fecha && agenda_texto)) {
    return { error: 'Para crear un ítem de agenda hacen falta agenda_fecha y agenda_texto juntos. No se guardó nada.' }
  }
  if (categoria && !esLibre && typeof m2 !== 'number') {
    return { error: 'Para calcular un presupuesto hace falta m2 además de categoria. No se guardó nada.' }
  }
  if (esLibre && !crearPresupuestoLibre) {
    return { error: 'Para un presupuesto libre hacen falta materials y total ya armados. No se guardó nada.' }
  }
  if (crearPresupuesto && !hayTrabajo) {
    return { error: 'Para calcular y guardar un presupuesto hace falta un trabajo: pasá trabajo_id (uno existente) o trabajo_descripcion (+ cliente) para crear uno nuevo. No se guardó nada.' }
  }
  if (!crearCliente && !crearTrabajo && !crearPresupuesto && !crearAgenda) {
    return { error: 'No se especificó ningún dato para crear (cliente, trabajo, presupuesto o agenda). Este tool es para crear varias cosas encadenadas en un solo paso; si solo querés consultar un cliente o trabajo existente, usá buscar_cliente o ver_trabajo. No se guardó nada.' }
  }

  // ── Pre-cálculo del presupuesto (lectura de catálogo, sin escrituras) ──
  let presupuestoCalc: { materialsToStore: any; total: number; wasteFinal: number; categoriaFinal: string; m2Final: number } | null = null
  if (crearPresupuestoCalculado) {
    const wasteFinal = typeof waste === 'number' ? waste : 0.10
    const { materials: calculados, total: totalCalculado } = await calcularPresupuestoCore(databaseUrl, categoria, m2, wasteFinal)
    if (calculados.length === 0) {
      return { error: `No hay materiales configurados para "${categoria}". No se guardó nada.` }
    }
    const masillaRecomendacion = calculados.find((m: any) => m.id === 'masilla')?.recommendation || []
    const cintaRecomendacion = calculados.find((m: any) => m.id === 'cinta')?.recommendation || []
    presupuestoCalc = {
      materialsToStore: { rows: calculados, masillaRecomendacion, cintaRecomendacion },
      total: totalCalculado,
      wasteFinal,
      categoriaFinal: categoria,
      m2Final: m2,
    }
  } else if (crearPresupuestoLibre) {
    // Presupuesto "libre" (uso del frontend web): materials/total ya vienen armados,
    // no se recalculan desde el catálogo de materiales.
    presupuestoCalc = {
      materialsToStore: materials,
      total,
      wasteFinal: typeof waste === 'number' ? waste : 0,
      categoriaFinal: 'libre',
      m2Final: typeof m2 === 'number' ? m2 : 0,
    }
  }

  // ── Construcción dinámica de la sentencia SQL atómica (CTEs encadenados) ──
  const ctes: string[] = []
  const finalSelect: string[] = []
  const params: any[] = []
  const ph = (value: any) => {
    params.push(value)
    return `$${params.length}`
  }

  let clienteIdExpr = ''
  if (crearCliente) {
    ctes.push(`nuevo_cliente AS (
      INSERT INTO clientes (nombre, telefono)
      VALUES (${ph(cliente_nombre)}, ${ph(cliente_telefono || null)})
      RETURNING *
    )`)
    clienteIdExpr = '(SELECT id FROM nuevo_cliente)'
    finalSelect.push(`(SELECT row_to_json(nc) FROM nuevo_cliente nc) AS cliente`)
  } else if (usaClienteExistente) {
    clienteIdExpr = ph(cliente_id)
  }

  let trabajoIdExpr = ''
  if (crearTrabajo) {
    ctes.push(`nuevo_trabajo AS (
      INSERT INTO trabajos (cliente_id, descripcion)
      VALUES (${clienteIdExpr}, ${ph(trabajo_descripcion)})
      RETURNING *
    )`)
    trabajoIdExpr = '(SELECT id FROM nuevo_trabajo)'
    finalSelect.push(`(SELECT row_to_json(nt) FROM nuevo_trabajo nt) AS trabajo`)
  } else if (usaTrabajoExistente) {
    trabajoIdExpr = ph(trabajo_id)
  }

  if (presupuestoCalc) {
    const { materialsToStore, total, wasteFinal, categoriaFinal, m2Final } = presupuestoCalc

    ctes.push(`nuevo_presupuesto AS (
      INSERT INTO presupuestos (trabajo_id, category, m2, waste, materials, total)
      VALUES (${trabajoIdExpr}, ${ph(categoriaFinal)}, ${ph(m2Final)}, ${ph(wasteFinal)}, ${ph(JSON.stringify(materialsToStore))}::jsonb, ${ph(total)})
      RETURNING *
    )`)
    finalSelect.push(`(SELECT row_to_json(np) FROM nuevo_presupuesto np) AS presupuesto`)

    // Mismo comportamiento que guardar_presupuesto: si el trabajo estaba "evaluado", pasa a "cotizado".
    ctes.push(`trabajo_cotizado AS (
      UPDATE trabajos SET estado = 'cotizado', updated_at = NOW()
      WHERE id = (SELECT trabajo_id FROM nuevo_presupuesto) AND estado = 'evaluado'
      RETURNING id
    )`)
    finalSelect.push(`(SELECT count(*) FROM trabajo_cotizado)::int AS _trabajo_cotizado`)
  }

  if (crearAgenda) {
    ctes.push(`nuevo_agenda_item AS (
      INSERT INTO agenda_items (fecha, hora, texto, trabajo_id)
      VALUES (${ph(agenda_fecha)}, ${ph(agenda_hora || null)}, ${ph(agenda_texto)}, ${trabajoIdExpr || 'NULL'})
      RETURNING *
    )`)
    finalSelect.push(`(SELECT row_to_json(nai) FROM nuevo_agenda_item nai) AS agenda_item`)
  }

  const query = `WITH ${ctes.join(',\n')} SELECT ${finalSelect.join(', ')}`

  try {
    const rows = await sql.query(query, params) as any[]
    const row = rows[0] || {}
    delete row._trabajo_cotizado

    const respuesta: any = {}
    if (row.cliente) respuesta.cliente = row.cliente
    else if (usaClienteExistente) respuesta.cliente = { id: cliente_id }

    if (row.trabajo) respuesta.trabajo = row.trabajo
    else if (usaTrabajoExistente) respuesta.trabajo = { id: trabajo_id }

    if (row.presupuesto) respuesta.presupuesto = row.presupuesto
    if (row.agenda_item) respuesta.agenda_item = row.agenda_item

    return respuesta
  } catch (err: any) {
    console.error('Error ejecutando crear_flujo_completo:', err)
    return { error: `No se pudo completar el flujo, no se guardó nada: ${err.message || err}` }
  }
}
