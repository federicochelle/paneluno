function ProjectFormHeader({
  mode,
  title,
  currentVehicleStatus,
  onStatusChange,
  orden,
  onOrdenChange,
  ordenError,
  imageError,
  submitError,
  submitSuccess,
}) {
  return (
    <section className="page-hero">
      <div className="project-form-header">
        <div className="project-summary-header">
          <div className="project-summary-header__title">
            <span className="section-tag">
              {mode === 'edit' ? 'Editar vehículo' : 'Nuevo vehículo'}
            </span>
            <h2>{title}</h2>
          </div>

          <div className="project-summary-header__meta">
            <label className="project-header-field">
              <span>Estado</span>
              <div className="project-status-chips">
                <button
                  type="button"
                  className={`finance-chip${currentVehicleStatus === 'borrador' ? ' is-selected' : ''}`}
                  onClick={() => onStatusChange('borrador')}
                >
                  <span>Borrador</span>
                </button>
                <button
                  type="button"
                  className={`finance-chip${currentVehicleStatus === 'publicado' ? ' is-selected' : ''}`}
                  onClick={() => onStatusChange('publicado')}
                >
                  <span>Publicado</span>
                </button>
                <button
                  type="button"
                  className={`finance-chip${currentVehicleStatus === 'archivado' ? ' is-selected' : ''}`}
                  onClick={() => onStatusChange('archivado')}
                >
                  <span>Archivado</span>
                </button>
              </div>
              {imageError && currentVehicleStatus === 'publicado' ? (
                <small className="project-field__error">{imageError}</small>
              ) : null}
            </label>

            <label className="project-header-field project-header-field--order">
              <span>Orden</span>
              <input
                className={`project-field__control project-header-order-input${
                  ordenError ? ' project-field__control--error' : ''
                }`}
                type="number"
                value={orden}
                onChange={onOrdenChange}
                placeholder="Auto"
              />
              {ordenError ? (
                <small className="project-field__error">{ordenError}</small>
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
  )
}

export default ProjectFormHeader
