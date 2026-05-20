import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="admin-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={() => setIsSidebarOpen(false)}
      />

      <div className="admin-main-shell">
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Abrir navegación"
        >
          <span />
          <span />
          <span />
        </button>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
