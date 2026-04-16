import { useState } from 'react'
import { Link } from 'react-router-dom'
import { defaultVehicleValues, financingLogoOptions } from '../../data/projects'
import { uploadVehicleCover, uploadVehicleGallery } from '../../lib/projects'
import FormSection from './FormSection'
import FieldGroup from './FieldGroup'

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

function buildDraftSlug(values) {
  return [values.marca, values.modelo]
    .map((value) =>
      String(value || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''),
    )
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

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
  const [selectedCoverFile, setSelectedCoverFile] = useState(null)
  const [coverUploadError, setCoverUploadError] = useState('')
  const [coverUploadSuccess, setCoverUploadSuccess] = useState('')
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([])
  const [galleryUploadError, setGalleryUploadError] = useState('')
  const [galleryUploadSuccess, setGalleryUploadSuccess] = useState('')
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)

  const formTitle = [formValues.marca, formValues.modelo, formValues.version]
    .filter(Boolean)
    .join(' ')

  const safeFormTitle =
    formTitle || (mode === 'edit' ? 'Vehículo en edición' : 'Nuevo vehículo')
  const isUploadingMedia = isUploadingCover || isUploadingGallery
  const isFormBusy = isSaving || isUploadingMedia
  const galleryItems = Array.isArray(formValues.galeria) ? formValues.galeria : []
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

  function normalizeGalleryItem(item, index) {
    const source =
      typeof item === 'string' ? item.trim() : String(item?.src || '').trim()

    if (!source) {
      return null
    }

    return {
      src: source,
      alt: typeof item === 'string' ? '' : item?.alt || '',
      orden: index + 1,
    }
  }

  function isValidGallerySource(source) {
    return source.startsWith('http') || source.startsWith('/')
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

  function handleCoverFileChange(event) {
    const nextFile = event.target.files?.[0] || null

    setSelectedCoverFile(nextFile)
    setCoverUploadError('')
    setCoverUploadSuccess('')
  }

  async function handleCoverUpload() {
    if (!selectedCoverFile || isUploadingCover || isSaving) {
      return
    }

    setIsUploadingCover(true)
    setCoverUploadError('')
    setCoverUploadSuccess('')

    try {
      const { publicUrl } = await uploadVehicleCover(selectedCoverFile, {
        vehicleId: formValues.id,
        slug: buildDraftSlug(formValues),
      })

      setFormValues((currentValues) => ({
        ...currentValues,
        imagen_principal_src: publicUrl,
      }))
      setSelectedCoverFile(null)
      setCoverUploadSuccess('Portada subida correctamente. La URL pública ya quedó cargada.')
    } catch (error) {
      setCoverUploadError(
        error instanceof Error ? error.message : 'No se pudo subir la portada.',
      )
    } finally {
      setIsUploadingCover(false)
    }
  }

  function handleGalleryFileChange(event) {
    const nextFiles = Array.from(event.target.files || [])

    setSelectedGalleryFiles(nextFiles)
    setGalleryUploadError('')
    setGalleryUploadSuccess('')
    clearFieldValidationError('galeria')
  }

  async function handleGalleryUpload() {
    if (!selectedGalleryFiles.length || isUploadingGallery || isSaving) {
      return
    }

    setIsUploadingGallery(true)
    setGalleryUploadError('')
    setGalleryUploadSuccess('')

    try {
      const uploadedGalleryItems = await uploadVehicleGallery(selectedGalleryFiles, {
        vehicleId: formValues.id,
        slug: buildDraftSlug(formValues),
      })

      setFormValues((currentValues) => {
        const currentGallery = Array.isArray(currentValues.galeria)
          ? currentValues.galeria
          : []

        const nextGallery = [...currentGallery, ...uploadedGalleryItems]
          .map(normalizeGalleryItem)
          .filter(Boolean)
          .map((item, index) => ({
            ...item,
            orden: index + 1,
          }))

        const cleanGallery = nextGallery
          .filter((item) => item?.src && isValidGallerySource(item.src))
          .map((item, index) => ({
            ...item,
            orden: index + 1,
          }))

        console.log('[galeria] final array', cleanGallery)
        cleanGallery.forEach((item, index) => {
          console.log('[galeria] item', index, item, {
            src: item?.src,
            alt: item?.alt,
            orden: item?.orden,
            keys: item ? Object.keys(item) : null,
          })
        })

        return {
          ...currentValues,
          galeria: cleanGallery,
        }
      })

      setSelectedGalleryFiles([])
      clearFieldValidationError('galeria')
      setGalleryUploadSuccess('Galería subida correctamente. Las imágenes quedaron agregadas al formulario.')
    } catch (error) {
      setGalleryUploadError(
        error instanceof Error
          ? error.message
          : 'No se pudieron subir las imágenes de la galería.',
      )
    } finally {
      setIsUploadingGallery(false)
    }
  }

  function handleRemoveGalleryItem(indexToRemove) {
    setFormValues((currentValues) => {
      const nextGallery = (Array.isArray(currentValues.galeria) ? currentValues.galeria : [])
        .filter((_, index) => index !== indexToRemove)
        .map(normalizeGalleryItem)
        .filter(Boolean)
        .map((item, index) => ({
          ...item,
          orden: index + 1,
        }))

      const cleanGallery = nextGallery
        .filter((item) => item?.src && isValidGallerySource(item.src))
        .map((item, index) => ({
          ...item,
          orden: index + 1,
        }))

      console.log('[galeria] final array', cleanGallery)
      cleanGallery.forEach((item, index) => {
        console.log('[galeria] item', index, item, {
          src: item?.src,
          alt: item?.alt,
          orden: item?.orden,
          keys: item ? Object.keys(item) : null,
        })
      })

      return {
        ...currentValues,
        galeria: cleanGallery,
      }
    })
    clearFieldValidationError('galeria')
  }

  return (
    <div className="project-editor-layout">
      <div className="project-editor-main">
        <section className="page-hero">
          <div className="project-form-header">
            <div className="project-summary-header">
              <div className="project-summary-header__title">
                <span className="section-tag">
                  {mode === 'edit' ? 'Editar vehículo' : 'Nuevo vehículo'}
                </span>
                <h2>{safeFormTitle}</h2>
              </div>

              <div className="project-summary-header__meta">
                <label className="project-header-field">
                  <span>Estado</span>
                  <div className="project-status-chips">
                    <button
                      type="button"
                      className={`finance-chip${currentVehicleStatus === 'borrador' ? ' is-selected' : ''}`}
                      onClick={() => setVehicleStatus('borrador')}
                    >
                      <span>Borrador</span>
                    </button>
                    <button
                      type="button"
                      className={`finance-chip${currentVehicleStatus === 'publicado' ? ' is-selected' : ''}`}
                      onClick={() => setVehicleStatus('publicado')}
                    >
                      <span>Publicado</span>
                    </button>
                    <button
                      type="button"
                      className={`finance-chip${currentVehicleStatus === 'archivado' ? ' is-selected' : ''}`}
                      onClick={() => setVehicleStatus('archivado')}
                    >
                      <span>Archivado</span>
                    </button>
                  </div>
                </label>

                <label className="project-header-field project-header-field--order">
                  <span>Orden</span>
                  <input
                    className={`project-field__control project-header-order-input${
                      validationErrors.orden ? ' project-field__control--error' : ''
                    }`}
                    type="number"
                    value={formValues.orden}
                    onChange={updateField('orden')}
                    placeholder="Auto"
                  />
                  {validationErrors.orden ? (
                    <small className="project-field__error">{validationErrors.orden}</small>
                  ) : null}
                </label>
              </div>
            </div>
          </div>

          {submitError ? (
            <p className="project-form-notice project-form-notice--error">
              {submitError}
            </p>
          ) : null}

          {submitSuccess ? (
            <p className="project-form-notice project-form-notice--success">
              {submitSuccess}
            </p>
          ) : null}
        </section>

        <FormSection
          className="main-data-section main-data-section--compact"
          eyebrow="Datos principales"
        >
          <div className="project-form-grid">
            <FieldGroup
              label="Marca"
              value={formValues.marca}
              onChange={updateField('marca')}
              placeholder="Toyota"
              error={validationErrors.marca}
            />
            <FieldGroup
              label="Modelo"
              value={formValues.modelo}
              onChange={updateField('modelo')}
              placeholder="Corolla Cross"
              error={validationErrors.modelo}
            />
            <FieldGroup
              label="Versión"
              value={formValues.version}
              onChange={updateField('version')}
              placeholder="Hybrid SEG"
            />
            <label className="project-field">
              <span>Tipo de vehículo</span>
              <div className="segmented-chip-group">
                {vehicleTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`segmented-chip${
                      formValues.tipo_vehiculo === option.value ? ' is-selected' : ''
                    }`}
                    onClick={() => setVehicleType(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {validationErrors.tipo_vehiculo ? (
                <small className="project-field__error">
                  {validationErrors.tipo_vehiculo}
                </small>
              ) : null}
            </label>
            <FieldGroup
              label="Precio"
              type="number"
              step="0.01"
              value={formValues.precio}
              onChange={updateField('precio')}
              placeholder="35990"
              error={validationErrors.precio}
            />
            <FieldGroup
              label="Moneda"
              value={formValues.moneda}
              onChange={updateField('moneda')}
              placeholder="USD"
            />
            <FieldGroup
              label="Año"
              type="number"
              value={formValues.anio}
              onChange={updateField('anio')}
              placeholder="2023"
              error={validationErrors.anio}
            />
            <FieldGroup
              label="Kilómetros"
              type="number"
              value={formValues.kilometros}
              onChange={updateField('kilometros')}
              placeholder="15000"
              error={validationErrors.kilometros}
            />
            <FieldGroup
              label="Combustible"
              value={formValues.combustible}
              onChange={updateField('combustible')}
              placeholder="Nafta, Híbrido, Diesel..."
            />
            <FieldGroup
              label="Transmisión"
              value={formValues.transmision}
              onChange={updateField('transmision')}
              placeholder="Automática"
            />
            <FieldGroup
              label="Motor"
              value={formValues.motor}
              onChange={updateField('motor')}
              placeholder="2.0 Hybrid"
            />
            <FieldGroup
              label="Color"
              value={formValues.color}
              onChange={updateField('color')}
              placeholder="Blanco perlado"
            />
          </div>
        </FormSection>

        <FormSection
          className="finance-section finance-section--compact"
          eyebrow="Financiación"
        >
          <div className="project-form-grid">
            <div className="project-form-grid__full">
              <label className="project-field">
                <div className="finance-chip-group">
                  {financingLogoOptions.map((logo) => (
                    <label
                      key={logo}
                      className={`finance-chip${
                        formValues.financiacion?.logos?.includes(logo) ? ' is-selected' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(formValues.financiacion?.logos?.includes(logo))}
                        onChange={toggleFinancingLogo(logo)}
                      />
                      <span>{financingLogoLabels[logo] || logo}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.financiacion ? (
                  <small className="project-field__error">
                    {validationErrors.financiacion}
                  </small>
                ) : null}
              </label>
            </div>
          </div>
        </FormSection>

        <FormSection
          className="media-section media-section--compact"
          eyebrow="Imágenes"
        >
          <div className="project-form-grid">
            <div className="project-form-grid__full">
              <div className="cover-upload-card">
                <div className="cover-upload-card__preview">
                  {formValues.imagen_principal_src ? (
                    <img
                      src={formValues.imagen_principal_src}
                      alt={formValues.imagen_principal_alt || 'Vista previa de portada'}
                    />
                  ) : (
                    <span>Sin portada cargada</span>
                  )}
                </div>

                <div className="cover-upload-card__meta">
                  <span className="cover-upload-card__label">Portada</span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    disabled={isFormBusy}
                  />

                  <div className="cover-upload-card__actions">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={handleCoverUpload}
                      disabled={!selectedCoverFile || isUploadingCover || isSaving}
                    >
                      {isUploadingCover ? 'Subiendo portada...' : 'Subir portada'}
                    </button>
                  </div>

                  {coverUploadError ? (
                    <p className="project-form-notice project-form-notice--error">
                      {coverUploadError}
                    </p>
                  ) : null}

                  {coverUploadSuccess ? (
                    <p className="project-form-notice project-form-notice--success">
                      {coverUploadSuccess}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="project-form-grid__full">
              <div className="gallery-upload-card">
                <div className="gallery-upload-card__header">
                  <div>
                    <span className="section-tag">Galería</span>
                    <p className="gallery-upload-card__label">Imágenes</p>
                  </div>
                </div>

                <div className="gallery-upload-card__controls">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFileChange}
                    disabled={isFormBusy}
                  />
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleGalleryUpload}
                    disabled={!selectedGalleryFiles.length || isUploadingGallery || isSaving}
                  >
                    {isUploadingGallery ? 'Subiendo galería...' : 'Subir galería'}
                  </button>
                </div>

                {galleryUploadError ? (
                  <p className="project-form-notice project-form-notice--error">
                    {galleryUploadError}
                  </p>
                ) : null}

                {galleryUploadSuccess ? (
                  <p className="project-form-notice project-form-notice--success">
                    {galleryUploadSuccess}
                  </p>
                ) : null}

                {validationErrors.galeria ? (
                  <p className="project-form-notice project-form-notice--error">
                    {validationErrors.galeria}
                  </p>
                ) : null}

                <div className="gallery-grid">
                  {galleryItems.map((item, index) => (
                    <div key={`${item.src}-${index}`} className="gallery-grid__item">
                      <img
                        src={item.src}
                        alt={`Imagen de galería ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="gallery-grid__remove"
                        onClick={() => handleRemoveGalleryItem(index)}
                        disabled={isUploadingGallery || isSaving}
                        aria-label={`Quitar imagen ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          className="description-section description-section--compact"
          eyebrow="Descripción"
        >
          <div className="project-form-grid">
            <div className="project-form-grid__full">
              <textarea
                className="project-field__control description-textarea"
                value={formValues.descripcion_parrafos}
                onChange={updateField('descripcion_parrafos')}
                placeholder="Un párrafo por línea"
                rows={6}
              />
            </div>
          </div>
        </FormSection>

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
