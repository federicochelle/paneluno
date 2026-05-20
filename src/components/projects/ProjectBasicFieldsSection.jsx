import FormSection from './FormSection'
import FieldGroup from './FieldGroup'

function ProjectBasicFieldsSection({
  values,
  errors,
  onFieldChange,
  onVehicleTypeChange,
  vehicleTypeOptions,
}) {
  return (
    <FormSection
      className="main-data-section main-data-section--compact"
      eyebrow="Datos principales"
    >
      <div className="project-form-grid">
        <FieldGroup
          label="Marca"
          value={values.marca}
          onChange={onFieldChange('marca')}
          placeholder="Toyota"
          error={errors.marca}
        />
        <FieldGroup
          label="Modelo"
          value={values.modelo}
          onChange={onFieldChange('modelo')}
          placeholder="Corolla Cross"
          error={errors.modelo}
        />
        <FieldGroup
          label="Versión"
          value={values.version}
          onChange={onFieldChange('version')}
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
                  values.tipo_vehiculo === option.value ? ' is-selected' : ''
                }`}
                onClick={() => onVehicleTypeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.tipo_vehiculo ? (
            <small className="project-field__error">
              {errors.tipo_vehiculo}
            </small>
          ) : null}
        </label>
        <FieldGroup
          label="Precio"
          type="number"
          step="0.01"
          value={values.precio}
          onChange={onFieldChange('precio')}
          placeholder="35990"
          error={errors.precio}
        />
        <FieldGroup
          label="Moneda"
          value={values.moneda}
          onChange={onFieldChange('moneda')}
          placeholder="USD"
          error={errors.moneda}
        />
        <FieldGroup
          label="Año"
          type="number"
          value={values.anio}
          onChange={onFieldChange('anio')}
          placeholder="2023"
          error={errors.anio}
        />
        <FieldGroup
          label="Kilómetros"
          type="number"
          value={values.kilometros}
          onChange={onFieldChange('kilometros')}
          placeholder="15000"
          error={errors.kilometros}
        />
        <FieldGroup
          label="Combustible"
          value={values.combustible}
          onChange={onFieldChange('combustible')}
          placeholder="Nafta, Híbrido, Diesel..."
        />
        <FieldGroup
          label="Transmisión"
          value={values.transmision}
          onChange={onFieldChange('transmision')}
          placeholder="Automática"
        />
        <FieldGroup
          label="Motor"
          value={values.motor}
          onChange={onFieldChange('motor')}
          placeholder="2.0 Hybrid"
        />
        <FieldGroup
          label="Color"
          value={values.color}
          onChange={onFieldChange('color')}
          placeholder="Blanco perlado"
        />
      </div>
    </FormSection>
  )
}

export default ProjectBasicFieldsSection
