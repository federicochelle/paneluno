import { Link } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge'
import EmptyState from '../common/EmptyState'

function formatCurrency(value, currency) {
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

function formatVehicleDate(vehicle) {
  const sourceDate = vehicle.updatedAt || vehicle.createdAt

  if (!sourceDate) {
    return 'Sin fecha'
  }

  const parsedDate = new Date(sourceDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

function getVehicleSubtitle(vehicle) {
  return vehicle.version || vehicle.tipoVehiculo || 'Sin detalle'
}

function ProjectsTable({
  vehicles,
  searchTerm,
  typeFilter,
  statusFilter,
  onClearFilters,
  onArchive,
  onDelete,
  actionLoadingId,
  actionType,
}) {
  if (!vehicles.length) {
    return (
      <EmptyState
        title="No hay vehículos para esos filtros"
        description="Probá otra búsqueda, cambiá tipo o estado, o limpiá los filtros para volver a ver el catálogo completo."
        action={
          <button
            type="button"
            className="button-secondary"
            onClick={onClearFilters}
          >
            Limpiar filtros
          </button>
        }
      />
    )
  }

  return (
    <div className="projects-table-shell">
      <table className="projects-table">
        <thead>
          <tr>
            <th>Vehículo</th>
            <th>Precio</th>
            <th>Publicado</th>
            <th>Orden</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {vehicles.map((vehicle) => {
            const isVehicleLoading = actionLoadingId === vehicle.id

            return (
              <tr key={vehicle.id}>
                <td data-label="Vehículo">
                  <div className="project-title-cell">
                    <strong>{`${vehicle.marca} ${vehicle.modelo}`}</strong>
                    <span>{getVehicleSubtitle(vehicle)}</span>
                  </div>
                </td>
                <td data-label="Precio">
                  {formatCurrency(vehicle.precio, vehicle.moneda)}
                </td>
                <td data-label="Publicado">
                  <StatusBadge
                    status={vehicle.publicado ? 'published' : 'draft'}
                    labels={{ published: 'Sí', draft: 'No' }}
                  />
                </td>
                <td data-label="Orden">{vehicle.orden ?? 'Sin orden'}</td>
                <td data-label="Fecha">{formatVehicleDate(vehicle)}</td>
                <td data-label="Acciones">
                  <div className="table-actions">
                    <Link
                      className="table-action-button table-action-button--primary"
                      to={`/vehicles/${vehicle.id}/edit`}
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="table-action-button"
                      onClick={() => onArchive(vehicle.id)}
                      disabled={isVehicleLoading || vehicle.archivado}
                    >
                      {isVehicleLoading && actionType === 'archive'
                        ? 'Guardando...'
                        : 'Archivar'}
                    </button>
                    <button
                      type="button"
                      className="table-action-button table-action-button--danger"
                      onClick={() => onDelete(vehicle.id)}
                      disabled={isVehicleLoading}
                    >
                      {isVehicleLoading && actionType === 'delete'
                        ? 'Eliminando...'
                        : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="projects-table-summary">
        <span>
          Mostrando {vehicles.length} resultado{vehicles.length === 1 ? '' : 's'}
        </span>
        <span>
          Búsqueda: {searchTerm || 'Todas'} / Tipo: {typeFilter || 'Todos'} / Estado:{' '}
          {statusFilter === 'published'
            ? 'Publicado'
            : statusFilter === 'draft'
              ? 'Borrador'
              : statusFilter === 'archived'
                ? 'Archivado'
                : statusFilter === 'featured'
                  ? 'Destacado'
                  : 'Todos'}
        </span>
      </div>
    </div>
  )
}

export default ProjectsTable
