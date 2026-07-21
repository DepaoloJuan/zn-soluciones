import { describe, it, expect, vi, beforeEach } from 'vitest'

const jwtVerifyMock = vi.fn()
const createRemoteJWKSetMock = vi.fn(() => 'mock-jwks')
const neonQueryMock = vi.fn()

vi.mock('jose', () => ({
  jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
  createRemoteJWKSet: (...args: unknown[]) => createRemoteJWKSetMock(...args),
}))

vi.mock('@neondatabase/serverless', () => ({
  neon: () => {
    // `sql` es un tagged template — lo modelamos como tal para que
    // `sql\`SELECT ...\`` en el código real funcione igual en el test.
    return (..._args: unknown[]) => neonQueryMock()
  },
}))

const env = {
  NEON_JWKS_URL: 'https://example.com/.well-known/jwks.json',
  DATABASE_URL: 'postgres://fake',
}

describe('verifyAuthToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createRemoteJWKSetMock.mockReturnValue('mock-jwks')
  })

  it('devuelve el payload cuando el token es válido y el email está en allowed_emails', async () => {
    const { verifyAuthToken } = await import('./auth')
    jwtVerifyMock.mockResolvedValue({ payload: { email: 'nico@nz.com' } })
    neonQueryMock.mockResolvedValue([{ '?column?': 1 }])

    const payload = await verifyAuthToken('valid-token', env)

    expect(payload).toEqual({ email: 'nico@nz.com' })
    expect(jwtVerifyMock).toHaveBeenCalledWith('valid-token', 'mock-jwks')
  })

  it('propaga la excepción cuando el token es inválido (jwtVerify tira)', async () => {
    const { verifyAuthToken } = await import('./auth')
    jwtVerifyMock.mockRejectedValue(new Error('signature verification failed'))

    await expect(verifyAuthToken('invalid-token', env)).rejects.toThrow(
      'signature verification failed',
    )
    expect(neonQueryMock).not.toHaveBeenCalled()
  })

  it('tira "No autorizado para usar esta aplicación" si el email no está en allowed_emails', async () => {
    const { verifyAuthToken } = await import('./auth')
    jwtVerifyMock.mockResolvedValue({ payload: { email: 'desconocido@nz.com' } })
    neonQueryMock.mockResolvedValue([])

    await expect(verifyAuthToken('valid-token', env)).rejects.toThrow(
      'No autorizado para usar esta aplicación',
    )
  })
})
