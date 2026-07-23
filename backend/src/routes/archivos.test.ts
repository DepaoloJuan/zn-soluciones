import { describe, it, expect, vi, beforeEach } from 'vitest'

const neonQueryMock = vi.fn()

vi.mock('../middleware/auth', () => ({
  requireAuth: async (_c: unknown, next: () => Promise<void>) => next(),
}))

vi.mock('@neondatabase/serverless', () => ({
  neon: () => (..._args: unknown[]) => neonQueryMock(),
}))

function makeEnv(r2Overrides: Partial<{ put: unknown; get: unknown; delete: unknown }> = {}) {
  return {
    DATABASE_URL: 'postgres://fake',
    NEON_JWKS_URL: 'https://example.com/jwks.json',
    VAPID_PUBLIC_KEY: 'fake',
    VAPID_PRIVATE_KEY: 'fake',
    GEMINI_API_KEY: 'fake',
    ARCHIVOS: {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      ...r2Overrides,
    },
  }
}

describe('POST /trabajo/:trabajoId (subir archivo)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve 400 si no viene el campo "archivo"', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv()

    const formData = new FormData()
    formData.append('presupuesto_id', '5')

    const res = await archivos.request('/trabajo/1', { method: 'POST', body: formData }, env)

    expect(res.status).toBe(400)
    expect(env.ARCHIVOS.put).not.toHaveBeenCalled()
    expect(neonQueryMock).not.toHaveBeenCalled()
  })

  it('devuelve 400 si el archivo supera el tamaño máximo, sin tocar R2 ni la base', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv()

    const archivoGrande = new File([new Uint8Array(21 * 1024 * 1024)], 'grande.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('archivo', archivoGrande)

    const res = await archivos.request('/trabajo/1', { method: 'POST', body: formData }, env)

    expect(res.status).toBe(400)
    expect(env.ARCHIVOS.put).not.toHaveBeenCalled()
    expect(neonQueryMock).not.toHaveBeenCalled()
  })

  it('si falla el insert en la base, borra el archivo que ya se había subido a R2', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv()
    neonQueryMock.mockRejectedValueOnce(new Error('DB caída'))

    const formData = new FormData()
    formData.append('archivo', new File(['contenido'], 'presupuesto.pdf', { type: 'application/pdf' }))

    const res = await archivos.request('/trabajo/1', { method: 'POST', body: formData }, env)

    expect(res.status).toBe(500)
    expect(env.ARCHIVOS.put).toHaveBeenCalledTimes(1)
    expect(env.ARCHIVOS.delete).toHaveBeenCalledTimes(1)
    const [uploadedKey] = (env.ARCHIVOS.put as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(env.ARCHIVOS.delete).toHaveBeenCalledWith(uploadedKey)
  })

  it('sube el archivo a R2 con una key basada en el trabajo, y guarda la fila en la tabla', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv()
    const filaInsertada = {
      id: 10,
      trabajo_id: 1,
      presupuesto_id: 5,
      nombre_original: 'presupuesto.pdf',
      r2_key: 'trabajos/1/algo-presupuesto.pdf',
      tamano_bytes: 12,
      tipo_mime: 'application/pdf',
    }
    neonQueryMock.mockResolvedValueOnce([filaInsertada])

    const formData = new FormData()
    formData.append('archivo', new File(['contenido'], 'presupuesto.pdf', { type: 'application/pdf' }))
    formData.append('presupuesto_id', '5')

    const res = await archivos.request('/trabajo/1', { method: 'POST', body: formData }, env)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.archivo).toEqual(filaInsertada)
    expect(env.ARCHIVOS.put).toHaveBeenCalledTimes(1)
    const [key, , options] = (env.ARCHIVOS.put as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(key).toMatch(/^trabajos\/1\/.+-presupuesto\.pdf$/)
    expect(options).toEqual({ httpMetadata: { contentType: 'application/pdf' } })
  })
})

describe('GET /trabajo/:trabajoId (listar archivos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve la lista de archivos del trabajo', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv()
    neonQueryMock.mockResolvedValueOnce([{ id: 1 }, { id: 2 }])

    const res = await archivos.request('/trabajo/1', {}, env)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.archivos).toHaveLength(2)
  })
})

describe('GET /:id/descargar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve 404 si el archivo no existe en la tabla', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv()
    neonQueryMock.mockResolvedValueOnce([])

    const res = await archivos.request('/99/descargar', {}, env)

    expect(res.status).toBe(404)
    expect(env.ARCHIVOS.get).not.toHaveBeenCalled()
  })

  it('devuelve 404 si el registro existe pero el objeto ya no está en R2', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv({ get: vi.fn().mockResolvedValue(null) })
    neonQueryMock.mockResolvedValueOnce([{ id: 1, r2_key: 'trabajos/1/x-nombre.pdf', nombre_original: 'nombre.pdf', tipo_mime: 'application/pdf' }])

    const res = await archivos.request('/1/descargar', {}, env)

    expect(res.status).toBe(404)
  })

  it('devuelve el archivo con los headers correctos cuando existe', async () => {
    const { default: archivos } = await import('./archivos')
    const fakeBody = new ReadableStream()
    const env = makeEnv({ get: vi.fn().mockResolvedValue({ body: fakeBody }) })
    neonQueryMock.mockResolvedValueOnce([{ id: 1, r2_key: 'trabajos/1/x-nombre.pdf', nombre_original: 'nombre.pdf', tipo_mime: 'application/pdf' }])

    const res = await archivos.request('/1/descargar', {}, env)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="nombre.pdf"')
  })

  it('sanitiza comillas en el nombre original para no romper el header Content-Disposition', async () => {
    const { default: archivos } = await import('./archivos')
    const fakeBody = new ReadableStream()
    const env = makeEnv({ get: vi.fn().mockResolvedValue({ body: fakeBody }) })
    neonQueryMock.mockResolvedValueOnce([{ id: 1, r2_key: 'trabajos/1/x-raro.pdf', nombre_original: 'presu "final".pdf', tipo_mime: 'application/pdf' }])

    const res = await archivos.request('/1/descargar', {}, env)

    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="presu _final_.pdf"')
  })
})

describe('DELETE /:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve 404 si el archivo no existe', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv()
    neonQueryMock.mockResolvedValueOnce([])

    const res = await archivos.request('/99', { method: 'DELETE' }, env)

    expect(res.status).toBe(404)
    expect(env.ARCHIVOS.delete).not.toHaveBeenCalled()
  })

  it('borra el objeto de R2 y recién después la fila de la tabla', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv()
    neonQueryMock
      .mockResolvedValueOnce([{ id: 1, r2_key: 'trabajos/1/x-nombre.pdf' }]) // SELECT
      .mockResolvedValueOnce([{ id: 1, r2_key: 'trabajos/1/x-nombre.pdf' }]) // DELETE ... RETURNING

    const res = await archivos.request('/1', { method: 'DELETE' }, env)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(env.ARCHIVOS.delete).toHaveBeenCalledWith('trabajos/1/x-nombre.pdf')
    expect(neonQueryMock).toHaveBeenCalledTimes(2)
  })

  it('si falla el borrado en R2, no borra la fila de la tabla (para poder reintentar)', async () => {
    const { default: archivos } = await import('./archivos')
    const env = makeEnv({ delete: vi.fn().mockRejectedValue(new Error('R2 caído')) })
    neonQueryMock.mockResolvedValueOnce([{ id: 1, r2_key: 'trabajos/1/x-nombre.pdf' }])

    const res = await archivos.request('/1', { method: 'DELETE' }, env)

    expect(res.status).toBe(500)
    expect(neonQueryMock).toHaveBeenCalledTimes(1) // solo el SELECT, no el DELETE
  })
})
