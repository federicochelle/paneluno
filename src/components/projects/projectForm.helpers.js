export function buildDraftSlug(values) {
  return [values.marca, values.modelo]
    .map((value) =>
      String(value || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''),
    )
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getCoverImageSource(values) {
  return (
    values.imagen_principal?.publicUrl ||
    values.imagen_principal?.src ||
    values.imagen_principal_src
  )
}

export function normalizeGalleryItem(item, index) {
  const source =
    typeof item === 'string'
      ? item.trim()
      : String(item?.publicUrl || item?.src || '').trim()

  if (!source) {
    return null
  }

  return {
    path: typeof item === 'string' ? '' : item?.path || '',
    publicUrl: source,
    src: source,
    alt: typeof item === 'string' ? '' : item?.alt || '',
    orden:
      typeof item === 'string'
        ? index + 1
        : Number.isInteger(Number(item?.orden))
          ? Number(item.orden)
          : index + 1,
  }
}

export function isValidGallerySource(source) {
  return source.startsWith('http') || source.startsWith('/')
}

export function normalizeGalleryItems(items) {
  return (Array.isArray(items) ? items : [])
    .map(normalizeGalleryItem)
    .filter(Boolean)
    .filter((item) => item?.src && isValidGallerySource(item.src))
    .map((item, index) => ({
      ...item,
      orden: index + 1,
    }))
}

export function mergeGalleryItems(currentItems, uploadedItems) {
  return normalizeGalleryItems([
    ...(Array.isArray(currentItems) ? currentItems : []),
    ...(Array.isArray(uploadedItems) ? uploadedItems : []),
  ])
}

export function removeGalleryItemAtIndex(items, indexToRemove) {
  return normalizeGalleryItems(
    (Array.isArray(items) ? items : []).filter((_, index) => index !== indexToRemove),
  )
}

export function shiftFailedGalleryImagesMap(currentState, removedIndex) {
  const nextState = {}

  Object.entries(currentState || {}).forEach(([key, value]) => {
    const numericKey = Number(key)

    if (numericKey < removedIndex) {
      nextState[numericKey] = value
    } else if (numericKey > removedIndex) {
      nextState[numericKey - 1] = value
    }
  })

  return nextState
}
