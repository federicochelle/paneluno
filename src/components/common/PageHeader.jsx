function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <section className="page-hero page-hero--split">
      <div>
        {eyebrow ? <span className="section-tag">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </section>
  )
}

export default PageHeader
