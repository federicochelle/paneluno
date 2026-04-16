function StatusBadge({ status, labels }) {
  const normalizedStatus = status.toLowerCase()
  const label =
    labels?.[normalizedStatus] ||
    (normalizedStatus === 'published' ? 'Publicado' : 'Borrador')

  return (
    <span className={`status-badge status-badge--${normalizedStatus}`}>
      {label}
    </span>
  )
}

export default StatusBadge
