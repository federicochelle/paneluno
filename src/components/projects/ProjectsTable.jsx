import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge'
import EmptyState from '../common/EmptyState'

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20h4l10-10-4-4L4 16v4Zm3.5-1.5H6v-1.5l8-8 1.5 1.5-8 8ZM17 8l-1.5-1.5 1-1a1.06 1.06 0 0 1 1.5 0l1 1a1.06 1.06 0 0 1 0 1.5l-1 1Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4V5Zm0 5h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8Zm5 3v2h6v-2H9Z"
        fill="currentColor"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 8h10l-.6 11a2 2 0 0 1-2 1.9H9.6a2 2 0 0 1-2-1.9L7 8Z"
        fill="currentColor"
      />
    </svg>
  )
}

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
  onOrderChange,
  actionLoadingId,
  actionType,
}) {
  const [orderDrafts, setOrderDrafts] = useState({})

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
            const draftOrder = orderDrafts[vehicle.id] ?? String(vehicle.orden ?? 99)

            function handleOrderBlur() {
              if (!onOrderChange) {
                return
              }

              onOrderChange(vehicle.id, draftOrder)
            }

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
                <td data-label="Orden">
                  <input
                    className="table-order-input"
                    type="number"
                    min="0"
                    value={draftOrder}
                    onChange={(event) =>
                      setOrderDrafts((currentState) => ({
                        ...currentState,
                        [vehicle.id]: event.target.value,
                      }))
                    }
                    onBlur={handleOrderBlur}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur()
                      }
                    }}
                    disabled={isVehicleLoading}
                    aria-label={`Orden de ${vehicle.title}`}
                    placeholder="99"
                  />
                </td>
                <td data-label="Fecha">{formatVehicleDate(vehicle)}</td>
                <td data-label="Acciones">
                  <div className="table-actions">
                    <Link
                      className="table-action-button table-action-button--icon table-action-button--primary"
                      to={`/vehicles/${vehicle.id}/edit`}
                      aria-label="Editar vehículo"
                    >
                      <EditIcon />
                      <span className="table-action-button__label">Editar</span>
                    </Link>
                    <button
                      type="button"
                      className="table-action-button table-action-button--icon"
                      onClick={() => onArchive(vehicle.id)}
                      disabled={isVehicleLoading || vehicle.archivado}
                      aria-label={
                        isVehicleLoading && actionType === 'archive'
                          ? 'Guardando vehículo'
                          : 'Archivar vehículo'
                      }
                    >
                      <ArchiveIcon />
                      <span className="table-action-button__label">
                      {isVehicleLoading && actionType === 'archive'
                        ? 'Guardando...'
                        : 'Archivar'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="table-action-button table-action-button--icon table-action-button--danger"
                      onClick={() => onDelete(vehicle.id)}
                      disabled={isVehicleLoading}
                      aria-label={
                        isVehicleLoading && actionType === 'delete'
                          ? 'Eliminando vehículo'
                          : 'Eliminar vehículo'
                      }
                    >
                      <DeleteIcon />
                      <span className="table-action-button__label">
                      {isVehicleLoading && actionType === 'delete'
                        ? 'Eliminando...'
                        : 'Eliminar'}
                      </span>
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
