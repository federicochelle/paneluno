import StatusBadge from '../common/StatusBadge'

function formatPrice(value, currency) {
  if (!value) {
    return 'Sin precio'
  }

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return String(value)
  }

  try {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(numericValue)
  } catch {
    return `${currency || 'USD'} ${numericValue}`
  }
}

function ProjectPreviewCard({ project }) {
  const completionItems = [
    { label: 'Identificación', done: Boolean(project.marca && project.modelo) },
    { label: 'Precio', done: Boolean(project.precio && project.moneda) },
    { label: 'Imagen principal', done: Boolean(project.imagen_principal_src) },
    { label: 'Financiación', done: Boolean(project.financiacion?.mostrar) },
  ]

  const title = [project.marca, project.modelo, project.version].filter(Boolean).join(' ')

  return (
    <div className="project-preview-card-panel">
      <div className="project-preview-card-panel__hero">
        <div>
          <span className="section-tag">Vehículo</span>
          <h3>{title || 'Vehículo sin título'}</h3>
          <p>
            {project.subtitulo ||
              'Completá la ficha básica del vehículo para habilitar su publicación en el panel.'}
          </p>
        </div>

        <StatusBadge
          status={project.archivado ? 'archived' : project.publicado ? 'published' : 'draft'}
          labels={{
            archived: 'Archivado',
            published: 'Publicado',
            draft: 'Borrador',
          }}
        />
      </div>

      <div className="project-preview-card-panel__list">
        <div>
          <span>Título</span>
          <strong>{title || 'Vehículo sin título'}</strong>
        </div>
        <div>
          <span>Precio</span>
          <strong>{formatPrice(project.precio, project.moneda)}</strong>
        </div>
        <div>
          <span>Imagen principal</span>
          <strong>{project.imagen_principal_src ? 'Configurada' : 'Pendiente'}</strong>
        </div>
        <div>
          <span>Financiación</span>
          <strong>
            {project.financiacion?.mostrar
              ? project.financiacion.logos?.length
                ? project.financiacion.logos.join(', ')
                : 'Visible sin logos'
              : 'Oculta'}
          </strong>
        </div>
        <div>
          <span>Especificaciones</span>
          <strong>
            {[project.anio, project.kilometros, project.combustible]
              .filter(Boolean)
              .join(' · ') || 'Pendientes'}
          </strong>
        </div>
      </div>

      <div className="project-preview-progress">
        {completionItems.map((item) => (
          <div
            key={item.label}
            className={`project-preview-progress__item${item.done ? ' is-complete' : ''}`}
          >
            <strong>{item.label}</strong>
            <span>{item.done ? 'Listo' : 'Pendiente'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectPreviewCard
