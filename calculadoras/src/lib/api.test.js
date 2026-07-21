import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getClientes } from './api'
import { authClient } from './auth'

// apiFetch itself is not exported from api.js, so its behavior is exercised
// here through getClientes(), an exported wrapper that calls apiFetch('/api/clientes')
// with no extra options. No production code is modified for this.
vi.mock('./auth', () => ({
  authClient: {
    getSession: vi.fn(),
  },
}))

describe('apiFetch (exercised via getClientes)', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws before calling fetch when no session token is resolvable', async () => {
    authClient.getSession.mockResolvedValue({ data: {} })

    await expect(getClientes()).rejects.toThrow(
      'No se pudo obtener la sesión. Volvé a iniciar sesión.'
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sends Authorization and Content-Type headers and returns the parsed body', async () => {
    authClient.getSession.mockResolvedValue({
      data: { session: { token: 'abc123' } },
    })
    const responseBody = { id: 1, nombre: 'Cliente Test' }
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(responseBody),
    })

    const result = await getClientes()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer abc123',
          'Content-Type': 'application/json',
        }),
      })
    )
    expect(result).toEqual(responseBody)
  })

  it('throws the backend error message on a non-ok response', async () => {
    authClient.getSession.mockResolvedValue({
      data: { session: { token: 'abc123' } },
    })
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    })

    await expect(getClientes()).rejects.toThrow('Unauthorized')
  })

  it('falls back to the default error message when the body has no error field', async () => {
    authClient.getSession.mockResolvedValue({
      data: { session: { token: 'abc123' } },
    })
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    })

    await expect(getClientes()).rejects.toThrow('Error en la petición')
  })
})
