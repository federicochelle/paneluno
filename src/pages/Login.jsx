import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSupabaseConfigured, isDevBypassAuthEnabled } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  if (isDevBypassAuthEnabled) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Supabase todavía no está configurado. Agregá las variables de entorno requeridas para habilitar el inicio de sesión.',
      )
      return
    }

    setIsSubmitting(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Email o contraseña inválidos. Probá nuevamente.')
      setIsSubmitting(false)
      return
    }

    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-card__intro">
          <span className="auth-card__eyebrow">Acceso administrador</span>
          <h1>Iniciar sesión en Unomotors Admin</h1>
          <p>
            Ingresá con tus credenciales de administrador para entrar al panel
            y gestionar el catálogo de vehículos desde una misma base operativa.
          </p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <label className="field-shell">
            <span>Email</span>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@unomotors.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field-shell">
            <span>Contraseña</span>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresá tu contraseña"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="auth-message auth-message--error">{error}</p> : null}

          {!isSupabaseConfigured ? (
            <p className="auth-message">
              Falta configurar Supabase. Definí `VITE_SUPABASE_URL` y
              `VITE_SUPABASE_ANON_KEY` para habilitar la autenticación.
            </p>
          ) : null}

          <button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Iniciando sesión...' : 'Entrar al panel'}
          </button>

          <p className="auth-card__hint">
            El acceso del panel usa Supabase Auth con credenciales reales de administrador.
          </p>
        </form>
      </section>
    </div>
  )
}

export default Login
