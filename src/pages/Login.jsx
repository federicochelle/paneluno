import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import logoNegro from '../assets/logonegro.png'

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
      setError('El acceso no está disponible en este momento. Intentá nuevamente más tarde.')
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
      <section className="auth-card auth-card--split">
        <div className="auth-brand-panel" aria-hidden="true">
          <div className="auth-brand-panel__glow auth-brand-panel__glow--top" />
          <div className="auth-brand-panel__glow auth-brand-panel__glow--bottom" />
          <div className="auth-brand-panel__content">
            <img className="auth-brand-panel__logo" src={logoNegro} alt="UnoMotors" />
            <p className="auth-brand-panel__support">Panel de gestión</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-panel__header">
            <span className="auth-card__eyebrow">Acceso administrador</span>
            <h1>Ingresar al panel</h1>
          </div>

          <form className="auth-card__form" onSubmit={handleSubmit}>
            <label className="field-shell field-shell--auth">
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

            <label className="field-shell field-shell--auth">
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

            <button className="button-primary auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Iniciando sesión...' : 'Entrar al panel'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Login
