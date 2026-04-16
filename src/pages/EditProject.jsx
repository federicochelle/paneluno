import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import ProjectForm from '../components/projects/ProjectForm'
import { readVehicleById, updateVehicle } from '../lib/projects'
import { validateVehicle } from '../lib/projectValidation'

function EditProject() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    let isMounted = true

    async function loadVehicle() {
      setLoading(true)
      setError('')

      try {
        const vehicleData = await readVehicleById(id)

        if (isMounted) {
          setVehicle(vehicleData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar el vehiculo.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadVehicle()

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleUpdateProject(values) {
    const errors = validateVehicle(values)

    setValidationErrors(errors)
    setSubmitError('')
    setSubmitSuccess('')

    if (Object.keys(errors).length > 0) {
      setSubmitError('Revisá los campos obligatorios antes de guardar.')
      return
    }

    setIsSaving(true)

    try {
      const updatedVehicle = await updateVehicle(id, values)
      setVehicle(updatedVehicle)
      setSubmitSuccess('Vehículo actualizado correctamente. Redirigiendo al listado...')
      window.setTimeout(() => {
        navigate('/vehicles', { replace: true })
      }, 900)
    } catch (updateError) {
      setSubmitError(
        updateError instanceof Error
          ? updateError.message
          : 'No se pudo actualizar el vehiculo.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="projects-feedback-card">
            <span className="section-tag">Cargando</span>
            <h3>Cargando vehículo</h3>
            <p>Estamos leyendo el vehículo seleccionado desde la tabla `vehicles`.</p>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <EmptyState
            eyebrow="Error de conexión"
            title="No pudimos cargar este vehículo"
            description={error}
          />
        </section>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <EmptyState
            eyebrow="Vehículo no encontrado"
            title="No existe un vehículo con este id"
            description="La consulta a `vehicles` no devolvió resultados para este identificador. Podés volver al listado y seleccionar otro vehículo."
          />
        </section>
      </div>
    )
  }

  return (
    <ProjectForm
      key={vehicle.id}
      initialValues={vehicle}
      mode="edit"
      onSubmit={handleUpdateProject}
      isSaving={isSaving}
      submitError={submitError}
      submitSuccess={submitSuccess}
      validationErrors={validationErrors}
      onValidationErrorsChange={setValidationErrors}
    />
  )
}

export default EditProject
