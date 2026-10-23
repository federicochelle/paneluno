import { ApiError } from './errors.js'

export function getStoragePathFromUrl(value, supabaseUrl) {
  if (!value || typeof value !== 'string') return ''

  try {
    const url = new URL(value)
    const marker = '/storage/v1/object/public/vehicles/'
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex < 0 || url.origin !== new URL(supabaseUrl).origin) return ''
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return ''
  }
}

export function collectVehicleMediaPaths(vehicle, supabaseUrl) {
  const paths = new Set()
  const cover = vehicle?.imagen_principal_src
  const coverPath = getStoragePathFromUrl(cover, supabaseUrl)
  if (coverPath) paths.add(coverPath)

  for (const item of Array.isArray(vehicle?.galeria) ? vehicle.galeria : []) {
    const source = typeof item === 'string' ? item : item?.src || item?.publicUrl
    const itemPath = getStoragePathFromUrl(source, supabaseUrl)
    if (itemPath) paths.add(itemPath)
  }

  return paths
}

export function collectDraftMediaPaths(vehicle, supabaseUrl) {
  return new Set(
    [...collectVehicleMediaPaths(vehicle, supabaseUrl)].filter((path) => path.startsWith('drafts/')),
  )
}

export async function removeStoragePaths(supabase, paths) {
  const values = [...paths].filter(Boolean)
  if (!values.length) return []

  const { error } = await supabase.storage.from('vehicles').remove(values)
  if (error) {
    throw new ApiError(502, 'STORAGE_CLEANUP_FAILED', 'No se pudieron limpiar todas las imágenes nuevas.', { count: values.length })
  }

  return values
}

export function buildStoragePath(vehicleId, kind, extension = 'webp') {
  const safeExtension = ['jpg', 'png', 'webp'].includes(extension) ? extension : 'webp'
  const timestamp = Date.now()
  const suffix = kind === 'cover' ? `cover-${timestamp}` : `gallery/${timestamp}-${Math.random().toString(36).slice(2, 8)}`
  return `${vehicleId}/${suffix}.${safeExtension}`
}

export function publicStorageUrl(supabase, storagePath) {
  const { data } = supabase.storage.from('vehicles').getPublicUrl(storagePath)
  if (!data?.publicUrl) {
    throw new ApiError(502, 'STORAGE_URL_FAILED', 'No se pudo obtener la URL pública de la imagen.')
  }
  return data.publicUrl
}
