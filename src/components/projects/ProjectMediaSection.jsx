import FormSection from './FormSection'

function EditImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 20h4.5L19 9.5a1.5 1.5 0 0 0 0-2.121l-2.379-2.38a1.5 1.5 0 0 0-2.121 0L4 15.5V20Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13.5 6.5 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RemoveImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5 7h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 3h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 7v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m8 15 2.5-2.5a1 1 0 0 1 1.414 0L16 16.586"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m14 14 1.5-1.5a1 1 0 0 1 1.414 0L20 15.586"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" />
    </svg>
  )
}

function ProjectMediaSection({
  mode,
  coverImageSource,
  coverImageAlt,
  coverImageFailed,
  onCoverImageError,
  onCoverFileChange,
  isUploadingCover,
  coverUploadError,
  coverValidationError,

  galleryItems,
  failedGalleryImages,
  onGalleryImageError,
  onGalleryFileChange,
  onRemoveGalleryItem,
  isUploadingGallery,
  galleryUploadError,
  galleryValidationError,

  isSaving,
  isFormBusy,
}) {
  return (
    <FormSection className="media-section media-section--compact">
      <div className="project-media-layout">
        <section className="project-media-panel project-media-panel--cover">
          <div className="project-media-panel__header">
            <div>
              <span className="section-tag">Portada</span>
              <p className="project-media-panel__title">Imagen principal</p>
            </div>
            {mode === 'create' || !coverImageSource ? (
              <label
                className={`button-secondary project-media-panel__button${
                  isFormBusy ? ' is-disabled' : ''
                }`}
              >
                <input
                  className="media-thumb__input"
                  type="file"
                  accept="image/*"
                  onChange={onCoverFileChange}
                  disabled={isFormBusy}
                />
                {isUploadingCover
                  ? 'Subiendo portada...'
                  : coverImageSource
                    ? 'Reemplazar portada'
                    : 'Subir portada'}
              </label>
            ) : null}
          </div>

          <div className="project-media-panel__body">
            <label
              className={`media-thumb media-thumb--cover${
                isFormBusy ? ' media-thumb--disabled' : ''
              }`}
            >
              {coverImageSource && !coverImageFailed ? (
                <>
                  <img
                    className="media-thumb__image"
                    src={coverImageSource}
                    alt={coverImageAlt || 'Vista previa de portada'}
                    onError={onCoverImageError}
                  />
                  <span className="media-thumb__overlay" aria-hidden="true">
                    <span className="media-thumb__actions">
                      <span className="media-thumb__action media-thumb__action--remove">
                        <RemoveImageIcon />
                      </span>
                    </span>
                  </span>
                </>
              ) : (
                <span className="media-thumb__empty">
                  <span className="media-thumb__empty-icon">
                    <ImagePlaceholderIcon />
                  </span>
                  <span className="media-thumb__empty-label">Sin portada cargada</span>
                  <span className="media-thumb__empty-hint">
                    Seleccioná una imagen principal para el vehículo.
                  </span>
                </span>
              )}

              <input
                className="media-thumb__input"
                type="file"
                accept="image/*"
                onChange={onCoverFileChange}
                disabled={isFormBusy}
              />
            </label>

            <div className="project-media-panel__footer">
              {coverUploadError ? (
                <p className="project-form-notice project-form-notice--error">
                  {coverUploadError}
                </p>
              ) : null}

              {coverValidationError ? (
                <p className="project-form-notice project-form-notice--error">
                  {coverValidationError}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="project-media-panel project-media-panel--gallery">
          <div className="project-media-panel__header">
            <div>
              <span className="section-tag">Galería</span>
              <p className="project-media-panel__title">Imágenes secundarias</p>
            </div>
            <label
              className={`button-secondary project-media-panel__button${
                isFormBusy ? ' is-disabled' : ''
              }`}
            >
              <input
                className="media-thumb__input"
                type="file"
                accept="image/*"
                multiple
                onChange={onGalleryFileChange}
                disabled={isFormBusy}
              />
              {isUploadingGallery ? 'Subiendo galería...' : 'Subir imágenes'}
            </label>
          </div>

          <div className="project-media-panel__body">

            <div className="gallery-thumb-grid">
              {galleryItems.length ? (
                galleryItems.map((item, index) => (
                  <div key={`${item.src}-${index}`} className="media-thumb media-thumb--gallery">
                    {!failedGalleryImages[index] ? (
                      <>
                        <img
                          className="media-thumb__image"
                          src={item.publicUrl || item.src}
                          alt={item.alt || `Imagen de galería ${index + 1}`}
                          onError={() => onGalleryImageError(index)}
                        />
                        <div className="media-thumb__overlay">
                          <div className="media-thumb__actions">
                            <button
                              type="button"
                              className="media-thumb__action media-thumb__action--remove"
                              onClick={() => onRemoveGalleryItem(index)}
                              disabled={isUploadingGallery || isSaving}
                              aria-label={`Quitar imagen ${index + 1}`}
                            >
                              <RemoveImageIcon />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="media-thumb__empty media-thumb__empty--compact">
                        Imagen no disponible
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <label
                  className={`project-media-panel__empty-gallery media-thumb${
                    isFormBusy ? ' media-thumb--disabled' : ''
                  }`}
                >
                  <span className="media-thumb__empty-icon">
                    <ImagePlaceholderIcon />
                  </span>
                  <span className="project-media-panel__empty-title">
                    Sin imágenes de galería
                  </span>
                  <span className="project-media-panel__empty-hint">
                    Podés cargar varias imágenes para completar la ficha.
                  </span>
                  <input
                    className="media-thumb__input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onGalleryFileChange}
                    disabled={isFormBusy}
                  />
                </label>
              )}
            </div>

            {galleryUploadError ? (
              <p className="project-form-notice project-form-notice--error">
                {galleryUploadError}
              </p>
            ) : null}

            {galleryValidationError ? (
              <p className="project-form-notice project-form-notice--error">
                {galleryValidationError}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </FormSection>
  )
}

export default ProjectMediaSection
