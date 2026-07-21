import { Navigate } from 'react-router-dom'
import { authClient } from '../lib/auth'

export default function ProtectedRoute({ children }) {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center text-nz-text2">
        Cargando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
