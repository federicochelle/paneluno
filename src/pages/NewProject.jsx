import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectForm from '../components/projects/ProjectForm'
import { defaultVehicleValues } from '../data/projects'
import { validateVehicle } from '../lib/projectValidation'
import { createVehicle } from '../lib/projects'

function NewProject() {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  async function handleCreateProject(values) {
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
      await createVehicle(values)
      setSubmitSuccess('Vehículo creado correctamente. Redirigiendo al listado...')
      window.setTimeout(() => {
        navigate('/vehicles', { replace: true })
      }, 900)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'No se pudo crear el vehículo.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProjectForm
      initialValues={defaultVehicleValues}
      mode="create"
      onSubmit={handleCreateProject}
      isSaving={isSaving}
      submitError={submitError}
      submitSuccess={submitSuccess}
      validationErrors={validationErrors}
      onValidationErrorsChange={setValidationErrors}
    />
  )
}

export default NewProject
