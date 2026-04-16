function FormSection({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`panel-card ${className}`.trim()}>
      <div className="panel-card__header">
        <div>
          {eyebrow ? <span className="section-tag">{eyebrow}</span> : null}
          {title ? <h3>{title}</h3> : null}
          {description ? <p>{description}</p> : null}
        </div>
      </div>

      {children}
    </section>
  )
}

export default FormSection
