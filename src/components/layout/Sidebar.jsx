import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import logo from '../../assets/logo.png'
import useAuth from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const navigationItems = [
  { label: 'Panel', to: '/dashboard' },
  { label: 'Vehículos', to: '/vehicles' },
]

function Sidebar({ isOpen, onClose, onNavigate }) {
  const navigate = useNavigate()
  const { user, isUsingBypassAuth } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const email = user?.email || 'admin@unomotors.com'
  const initials = email.slice(0, 2).toUpperCase()

  async function handleLogout() {
    if (isUsingBypassAuth) {
      return
    }

    if (!supabase) {
      navigate('/login', { replace: true })
      return
    }

    setIsLoggingOut(true)
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
    setIsLoggingOut(false)
  }

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <img
            className="sidebar__brand-logo"
            src={logo}
            alt="Logo UnoMotors"
          />
        </div>

        <nav className="sidebar__nav" aria-label="Navegación principal">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' is-active' : ''}`
              }
              onClick={onNavigate}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__avatar">{initials}</span>
            <div>
              <strong>{email}</strong>
              <span>{isUsingBypassAuth ? 'Modo desarrollo' : 'Administrador'}</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar__logout"
            onClick={handleLogout}
            disabled={isLoggingOut || isUsingBypassAuth}
          >
            {isUsingBypassAuth
              ? 'Bypass activo'
              : isLoggingOut
                ? 'Cerrando sesión...'
                : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <button
        type="button"
        className={`sidebar__backdrop ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-label="Cerrar navegación"
      />
    </>
  )
}

export default Sidebar
