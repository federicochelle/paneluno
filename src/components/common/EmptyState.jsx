function EmptyState({ eyebrow = 'Sin resultados', title, description, action }) {
  return (
    <div className="empty-state">
      <div>
        <span className="section-tag">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}

export default EmptyState
