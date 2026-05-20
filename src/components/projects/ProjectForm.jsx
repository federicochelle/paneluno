import { useState } from 'react'
import { Link } from 'react-router-dom'
import { defaultVehicleValues, financingLogoOptions } from '../../data/projects'
import { uploadVehicleCover, uploadVehicleGallery } from '../../lib/projects'
import { syncLegacyVehicleFields } from '../../lib/vehicleMappers'
import ProjectBasicFieldsSection from './ProjectBasicFieldsSection'
import ProjectDescriptionSection from './ProjectDescriptionSection'
import ProjectFinanceSection from './ProjectFinanceSection'
import ProjectFormHeader from './ProjectFormHeader'
import ProjectMediaSection from './ProjectMediaSection'
import {
  buildDraftSlug,
  getCoverImageSource,
  mergeGalleryItems,
  removeGalleryItemAtIndex,
  shiftFailedGalleryImagesMap,
} from './projectForm.helpers'

const financingLogoLabels = {
  santander: 'Santander',
  cash: 'Cash',
  mercado_pago: 'Mercado Pago',
  unomotors: 'Unomotors',
}

const vehicleTypeOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'moto', label: 'Moto' },
]

function ProjectForm({
  initialValues,
  mode = 'create',
  onSubmit,
  isSaving = false,
  submitError = '',
  submitSuccess = '',
  validationErrors = {},
  onValidationErrorsChange,
}) {
  const [formValues, setFormValues] = useState({
    ...defaultVehicleValues,
    ...initialValues,
  })
  const [coverUploadError, setCoverUploadError] = useState('')
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [galleryUploadError, setGalleryUploadError] = useState('')
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [coverImageFailed, setCoverImageFailed] = useState(false)
  const [failedGalleryImages, setFailedGalleryImages] = useState({})

  const formTitle = [formValues.marca, formValues.modelo, formValues.version]
    .filter(Boolean)
    .join(' ')

  const safeFormTitle =
    formTitle || (mode === 'edit' ? 'Vehículo en edición' : 'Nuevo vehículo')
  const isUploadingMedia = isUploadingCover || isUploadingGallery
  const isFormBusy = isSaving || isUploadingMedia
  const galleryItems = Array.isArray(formValues.galeria) ? formValues.galeria : []
  const selectedFinancingLogos = formValues.financiacion?.logos || []
  const currentVehicleStatus = formValues.archivado
    ? 'archivado'
    : formValues.publicado
      ? 'publicado'
      : 'borrador'

  function updateField(field) {
    return (event) => {
      const value =
        event.target.type === 'checkbox' ? event.target.checked : event.target.value

      setFormValues((currentValues) => ({
        ...currentValues,
        [field]: value,
      }))
    }
  }

  function clearFieldValidationError(field) {
    if (!onValidationErrorsChange) {
      return
    }

    onValidationErrorsChange((currentErrors) => {
      if (!currentErrors?.[field]) {
        return currentErrors || {}
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  function toggleFinancingLogo(logo) {
    return (event) => {
      const checked = event.target.checked

      setFormValues((currentValues) => {
        const currentLogos = currentValues.financiacion?.logos || []
        const nextLogos = checked
          ? [...currentLogos, logo]
          : currentLogos.filter((currentLogo) => currentLogo !== logo)

        return {
          ...currentValues,
          financiacion: {
            mostrar: nextLogos.length > 0,
            logos: nextLogos,
          },
        }
      })
    }
  }

  function setVehicleType(nextType) {
    setFormValues((currentValues) => ({
      ...currentValues,
      tipo_vehiculo: nextType,
    }))
  }

  function setVehicleStatus(status) {
    setFormValues((currentValues) => ({
      ...currentValues,
      publicado: status === 'publicado',
      archivado: status === 'archivado',
    }))
  }

  function handleSubmit() {
    if (!onSubmit || isFormBusy) {
      return
    }

    onSubmit(formValues)
  }

  async function handleCoverFileChange(event) {
    const nextFile = event.target.files?.[0] || null

    setCoverUploadError('')
    clearFieldValidationError('imagen_principal')
    if (!nextFile || isUploadingCover || isSaving) {
      event.target.value = ''
      return
    }

    setIsUploadingCover(true)

    try {
      const uploadResult = await uploadVehicleCover(nextFile, {
        vehicleId: formValues.id,
        slug: buildDraftSlug(formValues),
      })

      setFormValues((currentValues) =>
        syncLegacyVehicleFields({
          ...currentValues,
          imagen_principal: {
            path: uploadResult.path,
            publicUrl: uploadResult.publicUrl,
            src: uploadResult.publicUrl,
            alt:
              currentValues.imagen_principal?.alt ||
              currentValues.imagen_principal_alt ||
              '',
          },
        }),
      )
      setCoverImageFailed(false)
      clearFieldValidationError('imagen_principal')
    } catch (error) {
      setCoverUploadError(
        error instanceof Error ? error.message : 'No se pudo subir la portada.',
      )
    } finally {
      event.target.value = ''
      setIsUploadingCover(false)
    }
  }

  async function handleGalleryFileChange(event) {
    const nextFiles = Array.from(event.target.files || [])

    setGalleryUploadError('')
    clearFieldValidationError('galeria')
    if (!nextFiles.length || isUploadingGallery || isSaving) {
      event.target.value = ''
      return
    }

    setIsUploadingGallery(true)

    try {
      const uploadedGalleryItems = await uploadVehicleGallery(nextFiles, {
        vehicleId: formValues.id,
        slug: buildDraftSlug(formValues),
      })

      setFormValues((currentValues) => ({
        ...currentValues,
        galeria: mergeGalleryItems(currentValues.galeria, uploadedGalleryItems),
      }))

      setFailedGalleryImages({})
      clearFieldValidationError('galeria')
    } catch (error) {
      setGalleryUploadError(
        error instanceof Error
          ? error.message
          : 'No se pudieron subir las imágenes de la galería.',
      )
    } finally {
      event.target.value = ''
      setIsUploadingGallery(false)
    }
  }

  function handleRemoveGalleryItem(indexToRemove) {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        galeria: removeGalleryItemAtIndex(currentValues.galeria, indexToRemove),
      }
    })
    setFailedGalleryImages((currentState) =>
      shiftFailedGalleryImagesMap(currentState, indexToRemove),
    )
    clearFieldValidationError('galeria')
  }

  const coverImageSource = getCoverImageSource(formValues)
  const coverImageAlt =
    formValues.imagen_principal?.alt ||
    formValues.imagen_principal_alt ||
    'Vista previa de portada'
  const ordenChangeHandler = updateField('orden')
  const descriptionChangeHandler = updateField('descripcion_parrafos')

  function handleGalleryImageError(index) {
    setFailedGalleryImages((currentState) => ({
      ...currentState,
      [index]: true,
    }))
  }

  return (
    <div className="project-editor-layout">
      <div className="project-editor-main">
        <ProjectFormHeader
          mode={mode}
          title={safeFormTitle}
          currentVehicleStatus={currentVehicleStatus}
          onStatusChange={setVehicleStatus}
          orden={formValues.orden}
          onOrdenChange={ordenChangeHandler}
          ordenError={validationErrors.orden}
          imageError={validationErrors.imagen_principal}
          submitError={submitError}
          submitSuccess={submitSuccess}
        />

        <ProjectBasicFieldsSection
          values={formValues}
          errors={validationErrors}
          onFieldChange={updateField}
          onVehicleTypeChange={setVehicleType}
          vehicleTypeOptions={vehicleTypeOptions}
        />

        <ProjectFinanceSection
          selectedLogos={selectedFinancingLogos}
          financingLogoOptions={financingLogoOptions}
          financingLogoLabels={financingLogoLabels}
          onToggleLogo={toggleFinancingLogo}
          error={validationErrors.financiacion}
        />

        <ProjectMediaSection
          mode={mode}
          coverImageSource={coverImageSource}
          coverImageAlt={coverImageAlt}
          coverImageFailed={coverImageFailed}
          onCoverImageError={() => setCoverImageFailed(true)}
          onCoverFileChange={handleCoverFileChange}
          isUploadingCover={isUploadingCover}
          coverUploadError={coverUploadError}
          coverValidationError={validationErrors.imagen_principal}
          galleryItems={galleryItems}
          failedGalleryImages={failedGalleryImages}
          onGalleryImageError={handleGalleryImageError}
          onGalleryFileChange={handleGalleryFileChange}
          onRemoveGalleryItem={handleRemoveGalleryItem}
          isUploadingGallery={isUploadingGallery}
          galleryUploadError={galleryUploadError}
          galleryValidationError={validationErrors.galeria}
          isSaving={isSaving}
          isFormBusy={isFormBusy}
        />

        <ProjectDescriptionSection
          value={formValues.descripcion_parrafos}
          onChange={descriptionChangeHandler}
        />

        <div className="project-form-footer">
          <button
            type="button"
            className="button-primary"
            onClick={handleSubmit}
            disabled={isFormBusy || !onSubmit}
          >
            {isSaving ? 'Guardando...' : isUploadingMedia ? 'Subiendo imágenes...' : 'Guardar vehículo'}
          </button>
          <Link className="button-tertiary project-form-cancel" to="/vehicles">
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProjectForm
