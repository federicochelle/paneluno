import FormSection from './FormSection'

function ProjectFinanceSection({
  selectedLogos,
  financingLogoOptions,
  financingLogoLabels,
  onToggleLogo,
  error,
}) {
  return (
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
                    selectedLogos.includes(logo) ? ' is-selected' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selectedLogos.includes(logo))}
                    onChange={onToggleLogo(logo)}
                  />
                  <span>{financingLogoLabels[logo] || logo}</span>
                </label>
              ))}
            </div>
            {error ? (
              <small className="project-field__error">{error}</small>
            ) : null}
          </label>
        </div>
      </div>
    </FormSection>
  )
}

export default ProjectFinanceSection
