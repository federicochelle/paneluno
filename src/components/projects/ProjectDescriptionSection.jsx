import FormSection from './FormSection'

function ProjectDescriptionSection({ value, onChange }) {
  return (
    <FormSection
      className="description-section description-section--compact"
      eyebrow="Descripción"
    >
      <div className="project-form-grid">
        <div className="project-form-grid__full">
          <textarea
            className="project-field__control description-textarea"
            value={value}
            onChange={onChange}
            placeholder="Información útil sobre el vehículo..."
            rows={6}
          />
        </div>
      </div>
    </FormSection>
  )
}

export default ProjectDescriptionSection
