import {
  convertImageFileToWebp,
  MAX_IMAGE_FILE_SIZE_BYTES,
  SUPPORTED_IMAGE_TYPES,
} from './imageProcessing'
import { isSupabaseConfigured, supabase } from './supabase'
import {
  DEFAULT_VEHICLE_ORDER,
  mapVehicleDbToFormVehicle,
  mapVehicleDbToListVehicle,
  mapVehicleFormToDbPayload,
  trimString,
} from './vehicleMappers'

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase no esta configurado. Defini VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
    )
  }
}

function getFileExtension(fileName) {
  const normalizedName = trimString(fileName)
  const lastDotIndex = normalizedName.lastIndexOf('.')

  if (lastDotIndex === -1) {
    return 'jpg'
  }

  return normalizedName.slice(lastDotIndex + 1).toLowerCase() || 'jpg'
}

function sanitizePathSegment(value) {
  const normalizedValue = trimString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalizedValue || ''
}

function getVehicleBaseSelect() {
  return `
    id,
    slug,
    tipo_vehiculo,
    marca,
    modelo,
    version,
    anio,
    precio,
    moneda,
    subtitulo,
    kilometros,
    combustible,
    transmision,
    motor,
    color,
    telefono,
    ubicacion,
    imagen_principal_src,
    imagen_principal_alt,
    galeria,
    financiacion,
    descripcion_parrafos,
    features,
    publicado,
    destacado,
    archivado,
    orden
  `
}

export async function uploadVehicleCover(file, { vehicleId, slug } = {}) {
  ensureSupabase()

  const { file: processedFile } = await convertImageFileToWebp(file, {
    fieldLabel: 'la portada',
    maxWidth: 1600,
  })

  const fileExtension = getFileExtension(processedFile.name)
  const timestamp = Date.now()
  const normalizedVehicleId = trimString(vehicleId)
  const normalizedSlug = sanitizePathSegment(slug)
  const draftKey =
    normalizedSlug || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `${timestamp}`)

  const filePath = normalizedVehicleId
    ? `${normalizedVehicleId}/cover-${timestamp}.${fileExtension}`
    : `drafts/${draftKey}/cover-${timestamp}.${fileExtension}`

  const { error: uploadError } = await supabase.storage
    .from('vehicles')
    .upload(filePath, processedFile, { upsert: false })

  if (uploadError) {
    throw new Error(uploadError.message || 'No se pudo subir la portada.')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('vehicles').getPublicUrl(filePath)

  if (!publicUrl) {
    throw new Error('No se pudo obtener la URL pública de la portada.')
  }

  return {
    path: filePath,
    publicUrl,
    src: publicUrl,
    alt: '',
  }
}

export async function uploadVehicleGallery(files, { vehicleId, slug } = {}) {
  ensureSupabase()

  const fileList = Array.from(files || [])

  if (!fileList.length) {
    throw new Error('Seleccioná al menos una imagen para la galería.')
  }

  const timestamp = Date.now()
  const normalizedVehicleId = trimString(vehicleId)
  const normalizedSlug = sanitizePathSegment(slug)
  const draftKey =
    normalizedSlug || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `${timestamp}`)
  const basePath = normalizedVehicleId
    ? `${normalizedVehicleId}/gallery`
    : `drafts/${draftKey}/gallery`

  const uploadResults = []

  for (const [index, file] of fileList.entries()) {
    const { file: processedFile } = await convertImageFileToWebp(file, {
      fieldLabel: `la imagen ${index + 1} de la galería`,
      maxWidth: 1200,
    })
    const fileExtension = getFileExtension(processedFile.name)
    const filePath = `${basePath}/${timestamp}-${index + 1}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from('vehicles')
      .upload(filePath, processedFile, { upsert: false })

    if (uploadError) {
      throw new Error(uploadError.message || 'No se pudo subir una imagen de la galería.')
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('vehicles').getPublicUrl(filePath)

    if (!publicUrl) {
      throw new Error('No se pudo obtener la URL pública de una imagen de la galería.')
    }

    uploadResults.push({
      path: filePath,
      publicUrl,
      src: publicUrl,
      alt: '',
      orden: index + 1,
    })
  }

  return uploadResults
}

export { MAX_IMAGE_FILE_SIZE_BYTES, SUPPORTED_IMAGE_TYPES }

export async function readVehicles() {
  ensureSupabase()

  const { data, error } = await supabase
    .from('vehicles')
    .select(
      'id, slug, tipo_vehiculo, marca, modelo, version, precio, moneda, publicado, destacado, archivado, orden, created_at, updated_at',
    )
    .order('orden', { ascending: true })

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar los vehiculos.')
  }

  return (data || []).map(mapVehicleDbToListVehicle)
}

export async function readVehiclesDashboard() {
  const vehicles = await readVehicles()

  return {
    totalVehicles: vehicles.length,
    publishedVehicles: vehicles.filter((vehicle) => vehicle.publicado).length,
    archivedVehicles: vehicles.filter((vehicle) => vehicle.archivado).length,
    featuredVehicles: vehicles.filter((vehicle) => vehicle.destacado).length,
    recentVehicles: vehicles.slice(0, 4),
  }
}

export async function createVehicle(vehicleData) {
  ensureSupabase()

  const payload = mapVehicleFormToDbPayload(vehicleData)

  const { data, error } = await supabase
    .from('vehicles')
    .insert(payload)
    .select(getVehicleBaseSelect())
    .single()

  if (error) {
    throw new Error(error.message || 'No se pudo crear el vehiculo.')
  }

  return mapVehicleDbToFormVehicle(data)
}

export async function readVehicleById(vehicleId) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('vehicles')
    .select(getVehicleBaseSelect())
    .eq('id', vehicleId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'No se pudo cargar el vehiculo.')
  }

  return mapVehicleDbToFormVehicle(data)
}

export async function updateVehicle(vehicleId, vehicleData) {
  ensureSupabase()

  const payload = mapVehicleFormToDbPayload(vehicleData)

  const { data, error } = await supabase
    .from('vehicles')
    .update(payload)
    .eq('id', vehicleId)
    .select(getVehicleBaseSelect())
    .single()

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar el vehiculo.')
  }

  return mapVehicleDbToFormVehicle(data)
}

function getListRowSelect() {
  return `
    id,
    slug,
    tipo_vehiculo,
    marca,
    modelo,
    version,
    precio,
    moneda,
    publicado,
    destacado,
    archivado,
    orden
  `
}

export async function toggleVehiclePublished(vehicleId, publicado) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('vehicles')
    .update({ publicado })
    .eq('id', vehicleId)
    .select(getListRowSelect())
    .single()

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar la publicacion.')
  }

  return mapVehicleDbToListVehicle(data)
}

export async function toggleVehicleArchived(vehicleId, archivado) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('vehicles')
    .update({ archivado })
    .eq('id', vehicleId)
    .select(getListRowSelect())
    .single()

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar el archivo del vehiculo.')
  }

  return mapVehicleDbToListVehicle(data)
}

export async function updateVehicleOrder(vehicleId, orden) {
  ensureSupabase()

  const normalizedOrder =
    orden === '' || orden === null || orden === undefined
      ? DEFAULT_VEHICLE_ORDER
      : Number(orden)

  if (!Number.isInteger(normalizedOrder) || normalizedOrder < 0) {
    throw new Error('El orden debe ser un numero entero valido.')
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({ orden: normalizedOrder })
    .eq('id', vehicleId)
    .select(getListRowSelect())
    .single()

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar el orden del vehiculo.')
  }

  return mapVehicleDbToListVehicle(data)
}

export async function deleteVehicle(vehicleId) {
  ensureSupabase()

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)

  if (error) {
    throw new Error(error.message || 'No se pudo eliminar el vehiculo.')
  }
}
