import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { authClient } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('shows the loading state and not children while the session is pending', () => {
    authClient.useSession.mockReturnValue({ data: undefined, isPending: true })

    renderProtectedRoute()

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /login and does not render children when there is no session', () => {
    authClient.useSession.mockReturnValue({ data: null, isPending: false })

    renderProtectedRoute()

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children and does not redirect when there is an active session', () => {
    authClient.useSession.mockReturnValue({
      data: { session: { token: 'x' } },
      isPending: false,
    })

    renderProtectedRoute()

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
