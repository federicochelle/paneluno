import { useEffect, useState } from 'react'
import EmptyState from '../components/common/EmptyState'
import { readVehiclesDashboard } from '../lib/projects'

function formatPrice(value, currency) {
  if (value === null || value === undefined || value === '') {
    return 'Sin precio'
  }

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return String(value)
  }

  try {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(numericValue)
  } catch {
    return `${currency || 'USD'} ${numericValue}`
  }
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalVehicles: 0,
    publishedVehicles: 0,
    archivedVehicles: 0,
    recentVehicles: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const nextDashboardData = await readVehiclesDashboard()

        if (isMounted) {
          setDashboardData(nextDashboardData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar el resumen del panel.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const { totalVehicles, publishedVehicles, archivedVehicles, recentVehicles } =
    dashboardData

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <article className="stat-card">
          <span>Total de vehículos</span>
          <strong>{loading ? '...' : totalVehicles}</strong>
          <p>Registros totales</p>
        </article>

        <article className="stat-card">
          <span>Publicados</span>
          <strong>{loading ? '...' : publishedVehicles}</strong>
          <p>Disponibles en catálogo</p>
        </article>

        <article className="stat-card">
          <span>Archivados</span>
          <strong>{loading ? '...' : archivedVehicles}</strong>
          <p>Fuera de circulación</p>
        </article>
      </section>

      <section className="dashboard-list-grid">
        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <h3>Vehículos recientes</h3>
            </div>
          </div>

          {loading ? (
            <div className="projects-feedback-card">
              <h3>Cargando vehículos</h3>
              <p>Consultando catálogo.</p>
            </div>
          ) : null}

          {!loading && error ? (
            <EmptyState
              eyebrow="Error de conexión"
              title="No pudimos cargar el resumen"
              description={error}
            />
          ) : null}

          {!loading && !error && recentVehicles.length === 0 ? (
            <EmptyState
              eyebrow="Sin vehículos"
              title="Todavía no hay vehículos cargados"
              description="Los registros van a aparecer acá."
            />
          ) : null}

          {!loading && !error && recentVehicles.length > 0 ? (
            <ul className="timeline-list">
              {recentVehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <strong>{vehicle.title}</strong>
                  <span>
                    {vehicle.tipoVehiculo || 'Sin tipo'} ·{' '}
                    {formatPrice(vehicle.precio, vehicle.moneda)} ·{' '}
                    {vehicle.archivado
                      ? 'Archivado'
                      : vehicle.publicado
                        ? 'Publicado'
                        : 'Borrador'}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </div>
  )
}

export default Dashboard
