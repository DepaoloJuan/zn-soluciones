import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await authClient.signIn.email({ email, password })

    setLoading(false)

    if (signInError) {
      setError('Email o contraseña incorrectos')
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-nz-surface border border-nz-border rounded-xl p-8">
        <h1 className="text-2xl font-extrabold mb-6 text-center">Iniciar sesión</h1>

        <label className="block text-sm text-nz-text2 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 mb-4 outline-none focus:border-nz-green"
        />

        <label className="block text-sm text-nz-text2 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-nz-surface2 border border-nz-border rounded-lg px-3 py-2 mb-4 outline-none focus:border-nz-green"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-nz-green text-black font-semibold rounded-lg py-2.5 disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
