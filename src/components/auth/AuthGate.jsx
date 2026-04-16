import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

function AuthLoadingScreen() {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-card">
        <span className="section-tag">Unomotors Admin</span>
        <h1>Verificando sesión</h1>
        <p>Estamos validando la sesión actual antes de cargar el panel.</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export { AuthLoadingScreen, ProtectedRoute, PublicOnlyRoute }
