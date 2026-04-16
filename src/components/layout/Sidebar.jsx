import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo.png'

const navigationItems = [
  { label: 'Panel', to: '/dashboard' },
  { label: 'Vehículos', to: '/vehicles' },
]

function Sidebar({ isOpen, onClose, onNavigate }) {
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
          <p>Base lista para seguir desarrollando el panel.</p>
          <span>Versión 0.1</span>
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
