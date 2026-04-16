import { financingLogoOptions } from '../data/projects'
import { isSupabaseConfigured, supabase } from './supabase'

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase no esta configurado. Defini VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
    )
  }
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function getOptionalString(value) {
  const trimmedValue = trimString(value)
  return trimmedValue === '' ? null : trimmedValue
}

function parseOptionalInteger(value, label) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue)) {
    throw new Error(`El campo ${label} debe ser un numero entero valido.`)
  }

  return parsedValue
}

function parseOptionalNumber(value, label) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`El campo ${label} debe ser un numero valido.`)
  }

  return parsedValue
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

function buildVehicleSlug(vehicleData) {
  const baseSlug = [vehicleData.marca, vehicleData.modelo]
    .map((value) =>
      trimString(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''),
    )
    .filter(Boolean)
    .join('-')
    .toLowerCase()

  return baseSlug
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeVehicleType(value) {
  const normalizedValue = trimString(value).toLowerCase()

  if (normalizedValue === 'auto' || normalizedValue === 'moto') {
    return normalizedValue
  }

  return ''
}

function formatVehicleLabel(vehicle) {
  const parts = [vehicle.marca, vehicle.modelo, vehicle.version]
    .map((value) => trimString(value))
    .filter(Boolean)

  return parts.length ? parts.join(' ') : 'Vehiculo sin titulo'
}

function buildVehicleAltText(vehicleData) {
  const parts = [vehicleData.marca, vehicleData.modelo, vehicleData.version]
    .map((value) => trimString(value))
    .filter(Boolean)

  return parts.join(' ')
}

function formatListField(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join('\n')
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return typeof value === 'string' ? value : ''
}

function formatGalleryField(value) {
  if (!Array.isArray(value)) {
    return typeof value === 'string' ? value : ''
  }

  return value
    .map((item) => {
      if (item && typeof item === 'object') {
        return {
          src: trimString(item.src),
          alt: trimString(item.alt),
          orden: Number.isInteger(Number(item.orden)) ? Number(item.orden) : null,
        }
      }

      const normalizedItem = trimString(item)
      return normalizedItem ? { src: normalizedItem, alt: '', orden: null } : null
    })
    .filter((item) => item?.src)
    .map((item, index) => ({
      src: item.src,
      alt: item.alt || '',
      orden: item.orden ?? index + 1,
    }))
}

function normalizeFinancingRecord(value) {
  const logos = Array.isArray(value?.logos)
    ? value.logos.filter((logo) => financingLogoOptions.includes(logo))
    : []

  return {
    mostrar: logos.length > 0,
    logos,
  }
}

function parseListField(value) {
  const trimmedValue = trimString(value)

  if (!trimmedValue) {
    return []
  }

  if (trimmedValue.startsWith('[')) {
    const parsedValue = JSON.parse(trimmedValue)

    if (!Array.isArray(parsedValue)) {
      throw new Error('El valor debe ser un arreglo JSON valido.')
    }

    return parsedValue
  }

  return trimmedValue
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseGalleryField(value) {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        if (item && typeof item === 'object') {
          const src = trimString(item.src)

          if (!src) {
            return null
          }

          const parsedOrder = Number(item.orden)

          return {
            src,
            alt: trimString(item.alt),
            orden: Number.isInteger(parsedOrder) ? parsedOrder : index + 1,
          }
        }

        const src = trimString(item)

        if (!src) {
          return null
        }

        return {
          src,
          alt: '',
          orden: index + 1,
        }
      })
      .filter(Boolean)
  }

  return parseListField(value).map((src, index) => ({
    src,
    alt: '',
    orden: index + 1,
  }))
}

function parseFinancingField(value) {
  const logos = Array.isArray(value?.logos)
    ? value.logos.filter((logo) => financingLogoOptions.includes(logo))
    : []

  return {
    mostrar: logos.length > 0,
    logos,
  }
}

function normalizeVehicleRow(vehicle) {
  return {
    id: vehicle.id,
    slug: vehicle.slug || '',
    tipoVehiculo: normalizeVehicleType(vehicle.tipo_vehiculo) || 'Sin tipo',
    marca: vehicle.marca || 'Sin marca',
    modelo: vehicle.modelo || 'Sin modelo',
    version: vehicle.version || '',
    title: formatVehicleLabel(vehicle),
    precio: vehicle.precio,
    moneda: vehicle.moneda || '',
    publicado: Boolean(vehicle.publicado),
    destacado: Boolean(vehicle.destacado),
    archivado: Boolean(vehicle.archivado),
    orden: vehicle.orden ?? null,
    createdAt: vehicle.created_at || '',
    updatedAt: vehicle.updated_at || '',
    status: vehicle.archivado ? 'archived' : vehicle.publicado ? 'published' : 'draft',
    raw: vehicle,
  }
}

function normalizeVehicleRecord(vehicle) {
  if (!vehicle) {
    return null
  }

  return {
    id: vehicle.id,
    slug: vehicle.slug || '',
    tipo_vehiculo: normalizeVehicleType(vehicle.tipo_vehiculo),
    marca: vehicle.marca || '',
    modelo: vehicle.modelo || '',
    version: vehicle.version || '',
    anio: vehicle.anio != null ? String(vehicle.anio) : '',
    precio: vehicle.precio != null ? String(vehicle.precio) : '',
    moneda: vehicle.moneda || '',
    subtitulo: vehicle.subtitulo || '',
    kilometros: vehicle.kilometros != null ? String(vehicle.kilometros) : '',
    combustible: vehicle.combustible || '',
    transmision: vehicle.transmision || '',
    motor: vehicle.motor || '',
    color: vehicle.color || '',
    telefono: vehicle.telefono || '',
    ubicacion: vehicle.ubicacion || '',
    imagen_principal_src: vehicle.imagen_principal_src || '',
    imagen_principal_alt: vehicle.imagen_principal_alt || '',
    galeria: formatGalleryField(vehicle.galeria),
    financiacion: normalizeFinancingRecord(vehicle.financiacion),
    descripcion_parrafos: formatListField(vehicle.descripcion_parrafos),
    features: formatListField(vehicle.features),
    publicado: Boolean(vehicle.publicado),
    destacado: Boolean(vehicle.destacado),
    archivado: Boolean(vehicle.archivado),
    orden: vehicle.orden != null ? String(vehicle.orden) : '',
  }
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

function buildVehiclePayload(vehicleData) {
  const generatedAlt = buildVehicleAltText(vehicleData)

  return {
    slug: buildVehicleSlug(vehicleData),
    tipo_vehiculo: normalizeVehicleType(vehicleData.tipo_vehiculo) || null,
    marca: trimString(vehicleData.marca),
    modelo: trimString(vehicleData.modelo),
    version: getOptionalString(vehicleData.version),
    anio: parseOptionalInteger(vehicleData.anio, 'Año'),
    precio: parseOptionalNumber(vehicleData.precio, 'Precio'),
    moneda: getOptionalString(vehicleData.moneda),
    subtitulo: getOptionalString(vehicleData.subtitulo),
    kilometros: parseOptionalInteger(vehicleData.kilometros, 'Kilómetros'),
    combustible: getOptionalString(vehicleData.combustible),
    transmision: getOptionalString(vehicleData.transmision),
    motor: getOptionalString(vehicleData.motor),
    color: getOptionalString(vehicleData.color),
    telefono: getOptionalString(vehicleData.telefono),
    ubicacion: getOptionalString(vehicleData.ubicacion),
    imagen_principal_src: getOptionalString(vehicleData.imagen_principal_src),
    imagen_principal_alt: getOptionalString(generatedAlt),
    galeria: parseGalleryField(vehicleData.galeria).map((item) => ({
      ...item,
      alt: generatedAlt,
    })),
    financiacion: parseFinancingField(vehicleData.financiacion),
    descripcion_parrafos: parseListField(vehicleData.descripcion_parrafos),
    features: parseListField(vehicleData.features),
    publicado: Boolean(vehicleData.publicado),
    destacado: Boolean(vehicleData.destacado),
    archivado: Boolean(vehicleData.archivado),
    orden: parseOptionalInteger(vehicleData.orden, 'Orden'),
  }
}

export async function uploadVehicleCover(file, { vehicleId, slug } = {}) {
  ensureSupabase()

  if (!(file instanceof File)) {
    throw new Error('No se recibió un archivo válido para la portada.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('La portada debe ser un archivo de imagen.')
  }

  const fileExtension = getFileExtension(file.name)
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
    .upload(filePath, file, { upsert: false })

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
  }
}

export async function uploadVehicleGallery(files, { vehicleId, slug } = {}) {
  ensureSupabase()

  const fileList = Array.from(files || [])

  if (!fileList.length) {
    throw new Error('Seleccioná al menos una imagen para la galería.')
  }

  if (fileList.some((file) => !(file instanceof File) || !file.type.startsWith('image/'))) {
    throw new Error('Todos los archivos de la galería deben ser imágenes.')
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
    const fileExtension = getFileExtension(file.name)
    const filePath = `${basePath}/${timestamp}-${index + 1}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file, { upsert: false })

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
      src: publicUrl,
      alt: '',
      orden: index + 1,
    })
  }

  return uploadResults
}

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

  return (data || []).map(normalizeVehicleRow)
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

  const payload = buildVehiclePayload(vehicleData)

  const { data, error } = await supabase
    .from('vehicles')
    .insert(payload)
    .select(getVehicleBaseSelect())
    .single()

  if (error) {
    throw new Error(error.message || 'No se pudo crear el vehiculo.')
  }

  return normalizeVehicleRecord(data)
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

  return normalizeVehicleRecord(data)
}

export async function updateVehicle(vehicleId, vehicleData) {
  ensureSupabase()

  const payload = buildVehiclePayload(vehicleData)

  const { data, error } = await supabase
    .from('vehicles')
    .update(payload)
    .eq('id', vehicleId)
    .select(getVehicleBaseSelect())
    .single()

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar el vehiculo.')
  }

  return normalizeVehicleRecord(data)
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

  return normalizeVehicleRow(data)
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

  return normalizeVehicleRow(data)
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
