import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Bindings } from '../types'
import { requireAuth } from '../middleware/auth'

const archivos = new Hono<{ Bindings: Bindings }>()

const MAX_ARCHIVO_BYTES = 20 * 1024 * 1024 // 20 MB

// RFC 6266: en el valor citado de filename solo hace falta escapar " y \.
function sanitizarNombreParaHeader(nombre: string) {
  return nombre.replace(/[\\"]/g, '_')
}

// Listar archivos de un trabajo puntual
archivos.get('/trabajo/:trabajoId', requireAuth, async (c) => {
  const trabajoId = c.req.param('trabajoId')
  const sql = neon(c.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM archivos WHERE trabajo_id = ${trabajoId} ORDER BY created_at DESC`
  return c.json({ ok: true, archivos: rows })
})

// Subir un archivo (ej: PDF de un presupuesto ya enviado) para un trabajo
archivos.post('/trabajo/:trabajoId', requireAuth, async (c) => {
  const trabajoId = c.req.param('trabajoId')
  const body = await c.req.parseBody()
  const archivo = body['archivo']

  if (!(archivo instanceof File)) {
    return c.json({ error: 'Falta el archivo a subir' }, 400)
  }

  if (archivo.size > MAX_ARCHIVO_BYTES) {
    return c.json({ error: `El archivo supera el tamaño máximo permitido (${MAX_ARCHIVO_BYTES / 1024 / 1024} MB)` }, 400)
  }

  const presupuestoIdRaw = body['presupuesto_id']
  const presupuestoId = presupuestoIdRaw ? Number(presupuestoIdRaw) : null

  const key = `trabajos/${trabajoId}/${crypto.randomUUID()}-${archivo.name}`

  await c.env.ARCHIVOS.put(key, await archivo.arrayBuffer(), {
    httpMetadata: { contentType: archivo.type || 'application/octet-stream' },
  })

  const sql = neon(c.env.DATABASE_URL)
  try {
    const result = await sql`
      INSERT INTO archivos (trabajo_id, presupuesto_id, nombre_original, r2_key, tamano_bytes, tipo_mime)
      VALUES (${trabajoId}, ${presupuestoId}, ${archivo.name}, ${key}, ${archivo.size}, ${archivo.type || null})
      RETURNING *
    `
    return c.json({ ok: true, archivo: result[0] }, 201)
  } catch (err) {
    // El archivo ya se subió a R2 pero no se pudo registrar en la base: lo
    // borramos para no dejarlo huérfano, y devolvemos el error original.
    await c.env.ARCHIVOS.delete(key).catch(() => {})
    console.error('Error guardando archivo en la base, se revirtió el upload a R2:', err)
    return c.json({ error: 'No se pudo guardar el archivo' }, 500)
  }
})

// Descargar un archivo
archivos.get('/:id/descargar', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM archivos WHERE id = ${id}`

  if (rows.length === 0) {
    return c.json({ error: 'Archivo no encontrado' }, 404)
  }

  const archivo = rows[0]
  const object = await c.env.ARCHIVOS.get(archivo.r2_key)

  if (!object) {
    return c.json({ error: 'El archivo no está disponible en el almacenamiento' }, 404)
  }

  c.header('Content-Type', archivo.tipo_mime || 'application/octet-stream')
  c.header('Content-Disposition', `attachment; filename="${sanitizarNombreParaHeader(archivo.nombre_original)}"`)
  return c.body(object.body)
})

// Borrar un archivo. Primero R2 y recién si eso funciona la fila de la base:
// si el borrado en R2 falla, no perdemos la referencia y se puede reintentar.
// Si en cambio falla el borrado en la base después de borrar en R2, un
// reintento del usuario simplemente vuelve a pedir el delete en R2 (idempotente
// para una key que ya no existe) y esta vez sí borra la fila.
archivos.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')
  const sql = neon(c.env.DATABASE_URL)
  const rows = await sql`SELECT * FROM archivos WHERE id = ${id}`

  if (rows.length === 0) {
    return c.json({ error: 'Archivo no encontrado' }, 404)
  }

  const archivo = rows[0]

  try {
    await c.env.ARCHIVOS.delete(archivo.r2_key)
  } catch (err) {
    console.error('Error borrando archivo de R2:', err)
    return c.json({ error: 'No se pudo borrar el archivo del almacenamiento' }, 500)
  }

  const result = await sql`DELETE FROM archivos WHERE id = ${id} RETURNING *`
  return c.json({ ok: true, deleted: result[0] })
})

export default archivos
