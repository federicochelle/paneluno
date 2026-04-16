import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { PublicOnlyRoute, ProtectedRoute } from '../components/auth/AuthGate'
import { AuthProvider } from '../context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'
import Dashboard from '../pages/Dashboard'
import EditProject from '../pages/EditProject'
import Login from '../pages/Login'
import NewProject from '../pages/NewProject'
import Projects from '../pages/Projects'

function LegacyEditProjectRedirect() {
  const { id } = useParams()
  return <Navigate to={`/vehicles/${id}/edit`} replace />
}

function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Navigate to="/vehicles" replace />} />
            <Route path="/projects/new" element={<Navigate to="/vehicles/new" replace />} />
            <Route path="/projects/:id/edit" element={<LegacyEditProjectRedirect />} />
            <Route path="/vehicles" element={<Projects />} />
            <Route path="/vehicles/new" element={<NewProject />} />
            <Route path="/vehicles/:id/edit" element={<EditProject />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default AppRouter
