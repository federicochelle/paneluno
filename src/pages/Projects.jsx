import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import ProjectsTable from '../components/projects/ProjectsTable'
import {
  deleteVehicle,
  readVehicles,
  toggleVehicleArchived,
} from '../lib/projects'

function Projects() {
  const [vehicles, setVehicles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [actionType, setActionType] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadVehicles() {
      setLoading(true)
      setError('')

      try {
        const vehiclesData = await readVehicles()

        if (isMounted) {
          setVehicles(vehiclesData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los vehiculos.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadVehicles()

    return () => {
      isMounted = false
    }
  }, [])

  const vehicleTypes = useMemo(() => {
    return [...new Set(vehicles.map((vehicle) => vehicle.tipoVehiculo))].sort()
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        normalizedSearch === '' ||
        vehicle.marca.toLowerCase().includes(normalizedSearch) ||
        vehicle.modelo.toLowerCase().includes(normalizedSearch) ||
        vehicle.version.toLowerCase().includes(normalizedSearch) ||
        vehicle.slug.toLowerCase().includes(normalizedSearch)

      const matchesType =
        typeFilter === '' || vehicle.tipoVehiculo === typeFilter

      const matchesStatus =
        statusFilter === '' ||
        (statusFilter === 'published' && vehicle.publicado && !vehicle.archivado) ||
        (statusFilter === 'draft' && !vehicle.publicado && !vehicle.archivado) ||
        (statusFilter === 'archived' && vehicle.archivado) ||
        (statusFilter === 'featured' && vehicle.destacado)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [vehicles, searchTerm, typeFilter, statusFilter])

  async function handleArchiveVehicle(vehicleId) {
    const currentVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId)

    if (!currentVehicle || currentVehicle.archivado) {
      return
    }

    setActionLoadingId(vehicleId)
    setActionType('archive')
    setActionError('')
    setActionSuccess('')

    try {
      const updatedVehicle = await toggleVehicleArchived(vehicleId, true)
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === vehicleId ? updatedVehicle : vehicle,
        ),
      )
      setActionSuccess(`"${currentVehicle.title}" quedó archivado.`)
    } catch (archiveError) {
      setActionError(
        archiveError instanceof Error
          ? archiveError.message
          : 'No se pudo actualizar el archivo del vehículo.',
      )
    } finally {
      setActionLoadingId('')
      setActionType('')
    }
  }

  async function handleDeleteVehicle(vehicleId) {
    const currentVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId)

    if (!currentVehicle) {
      return
    }

    const confirmed = window.confirm(
      '¿Seguro que querés eliminar este vehículo? Esta acción no se puede deshacer.',
    )

    if (!confirmed) {
      return
    }

    setActionLoadingId(vehicleId)
    setActionType('delete')
    setActionError('')
    setActionSuccess('')

    try {
      await deleteVehicle(vehicleId)
      setVehicles((currentVehicles) =>
        currentVehicles.filter((vehicle) => vehicle.id !== vehicleId),
      )
      setActionSuccess(`"${currentVehicle.title}" fue eliminado definitivamente.`)
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar el vehículo.',
      )
    } finally {
      setActionLoadingId('')
      setActionType('')
    }
  }

  function handleClearFilters() {
    setSearchTerm('')
    setTypeFilter('')
    setStatusFilter('')
  }

  async function handleRetry() {
    setLoading(true)
    setError('')
    setActionError('')

    try {
      const vehiclesData = await readVehicles()
      setVehicles(vehiclesData)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los vehiculos.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="panel-card">
        <div className="panel-card__header panel-card__header--inline">
          <div>
            <h3>Listado principal</h3>
          </div>

          <Link className="button-primary" to="/vehicles/new">
            Nuevo vehículo
          </Link>
        </div>

        <div className="projects-toolbar">
          <label className="control-field control-field--search">
            <span>Búsqueda</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por marca, modelo, versión o slug"
            />
          </label>

          <label className="control-field">
            <span>Tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              disabled={loading || Boolean(error)}
            >
              <option value="">Todos los tipos</option>
              {vehicleTypes.map((vehicleType) => (
                <option key={vehicleType} value={vehicleType}>
                  {vehicleType}
                </option>
              ))}
            </select>
          </label>

          <label className="control-field">
            <span>Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              disabled={loading || Boolean(error)}
            >
              <option value="">Todos los estados</option>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
              <option value="featured">Destacado</option>
            </select>
          </label>

          <button
            type="button"
            className="button-secondary"
            onClick={handleClearFilters}
            disabled={Boolean(actionLoadingId)}
          >
            Limpiar
          </button>
        </div>

        {actionError ? (
          <p className="project-form-notice project-form-notice--error">
            {actionError}
          </p>
        ) : null}

        {actionSuccess ? (
          <p className="project-form-notice project-form-notice--success">
            {actionSuccess}
          </p>
        ) : null}

        {loading ? (
          <div className="projects-feedback-card">
            <span className="section-tag">Cargando</span>
            <h3>Cargando vehículos</h3>
            <p>Estamos consultando la tabla `vehicles` en Supabase.</p>
          </div>
        ) : null}

        {!loading && error ? (
          <EmptyState
            eyebrow="Error de conexión"
            title="No pudimos leer vehículos desde Supabase"
            description={error}
            action={
              <button
                type="button"
                className="button-secondary"
                onClick={handleRetry}
              >
                Reintentar
              </button>
            }
          />
        ) : null}

        {!loading && !error && vehicles.length === 0 ? (
          <EmptyState
            eyebrow="Catálogo vacío"
            title="Todavía no hay vehículos cargados"
            description="Cuando existan filas reales en la tabla `vehicles`, van a aparecer acá usando esta misma UI."
          />
        ) : null}

        {!loading && !error && vehicles.length > 0 ? (
          <ProjectsTable
            vehicles={filteredVehicles}
            searchTerm={searchTerm}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            onClearFilters={handleClearFilters}
            onArchive={handleArchiveVehicle}
            onDelete={handleDeleteVehicle}
            actionLoadingId={actionLoadingId}
            actionType={actionType}
          />
        ) : null}
      </section>
    </div>
  )
}

export default Projects
