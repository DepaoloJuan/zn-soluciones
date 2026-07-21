import { describe, it, expect, vi, beforeEach } from 'vitest'

const verifyAuthTokenMock = vi.fn()

vi.mock('../middleware/auth', () => ({
  verifyAuthToken: (...args: unknown[]) => verifyAuthTokenMock(...args),
}))

// Env mínimo — estos casos nunca llegan a usar sus valores reales porque
// verifyAuthToken está mockeado y el flujo corta antes del WebSocketPair.
const env = {
  DATABASE_URL: 'postgres://fake',
  NEON_JWKS_URL: 'https://example.com/jwks.json',
  VAPID_PUBLIC_KEY: 'fake',
  VAPID_PRIVATE_KEY: 'fake',
  GEMINI_API_KEY: 'fake',
}

describe('GET /api/voz (gate de auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve 401 si no viene el query param token', async () => {
    const { default: voz } = await import('./voz')

    const res = await voz.request(
      '/',
      { headers: { Upgrade: 'websocket' } },
      env,
    )

    expect(res.status).toBe(401)
    expect(await res.text()).toBe('No autorizado')
    expect(verifyAuthTokenMock).not.toHaveBeenCalled()
  })

  it('devuelve 401 si token viene pero verifyAuthToken tira', async () => {
    const { default: voz } = await import('./voz')
    verifyAuthTokenMock.mockRejectedValue(new Error('token inválido'))

    const res = await voz.request(
      '/?token=algun-token',
      { headers: { Upgrade: 'websocket' } },
      env,
    )

    expect(res.status).toBe(401)
    expect(await res.text()).toBe('No autorizado')
    expect(verifyAuthTokenMock).toHaveBeenCalledWith('algun-token', env)
  })
})
