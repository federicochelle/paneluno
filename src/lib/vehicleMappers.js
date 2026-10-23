import { financingLogoOptions } from '../data/projects.js'
import { createDefaultVehicle, VEHICLE_STATUS } from './vehicleModel.js'

const DEFAULT_VEHICLE_ORDER = 99

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

function buildVehicleAltText(vehicle) {
  const parts = [vehicle.marca, vehicle.modelo, vehicle.version]
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

function formatGalleryField(value) {
  if (!Array.isArray(value)) {
    return typeof value === 'string' ? value : ''
  }

  return value
    .map((item) => {
      if (item && typeof item === 'object') {
        const publicUrl = trimString(item.publicUrl || item.src)
        return {
          path: trimString(item.path),
          publicUrl,
          src: publicUrl,
          alt: trimString(item.alt),
          orden: Number.isInteger(Number(item.orden)) ? Number(item.orden) : null,
        }
      }

      const normalizedItem = trimString(item)
      return normalizedItem
        ? {
            path: '',
            publicUrl: normalizedItem,
            src: normalizedItem,
            alt: '',
            orden: null,
          }
        : null
    })
    .filter((item) => item?.src)
    .map((item, index) => ({
      path: item.path || '',
      publicUrl: item.publicUrl || item.src,
      src: item.src,
      alt: item.alt || '',
      orden: item.orden ?? index + 1,
    }))
}

function parseGalleryField(value) {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        if (item && typeof item === 'object') {
          const publicUrl = trimString(item.publicUrl || item.src)

          if (!publicUrl) {
            return null
          }

          const parsedOrder = Number(item.orden)

          return {
            path: trimString(item.path),
            publicUrl,
            src: publicUrl,
            alt: trimString(item.alt),
            orden: Number.isInteger(parsedOrder) ? parsedOrder : index + 1,
          }
        }

        const publicUrl = trimString(item)

        if (!publicUrl) {
          return null
        }

        return {
          path: '',
          publicUrl,
          src: publicUrl,
          alt: '',
          orden: index + 1,
        }
      })
      .filter(Boolean)
  }

  return parseListField(value).map((publicUrl, index) => ({
    path: '',
    publicUrl,
    src: publicUrl,
    alt: '',
    orden: index + 1,
  }))
}

function normalizeFinancingRecord(value) {
  const logos = Array.isArray(value?.logos)
    ? value.logos.filter((logo) => financingLogoOptions.includes(logo))
    : []

  return {
    mostrar: logos.length > 0,
    logos,
    resumen: trimString(value?.resumen),
  }
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

export function normalizeVehicleStatus(vehicle) {
  if (vehicle?.archivado) {
    return VEHICLE_STATUS.ARCHIVED
  }

  if (vehicle?.publicado) {
    return VEHICLE_STATUS.PUBLISHED
  }

  return VEHICLE_STATUS.DRAFT
}

export function buildVehicleSlug(vehicle) {
  const baseSlug = [vehicle.marca, vehicle.modelo]
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

export function syncLegacyVehicleFields(vehicle) {
  const normalizedDescription =
    vehicle.descripcion !== undefined ? vehicle.descripcion : vehicle.descripcion_parrafos
  const normalizedEquipment =
    vehicle.equipamiento !== undefined ? vehicle.equipamiento : vehicle.features
  const imageSrc =
    vehicle.imagen_principal?.src !== undefined
      ? vehicle.imagen_principal.src
      : vehicle.imagen_principal?.publicUrl !== undefined
        ? vehicle.imagen_principal.publicUrl
        : vehicle.imagen_principal_src
  const imageAlt =
    vehicle.imagen_principal?.alt !== undefined
      ? vehicle.imagen_principal.alt
      : vehicle.imagen_principal_alt
  const imagePath =
    vehicle.imagen_principal?.path !== undefined
      ? vehicle.imagen_principal.path
      : vehicle.imagen_principal_path
  const normalizedStatus = vehicle.estado || normalizeVehicleStatus(vehicle)

  return createDefaultVehicle({
    ...vehicle,
    descripcion: normalizedDescription || '',
    equipamiento: normalizedEquipment || '',
    descripcion_parrafos: normalizedDescription || '',
    features: normalizedEquipment || '',
    imagen_principal: {
      path: imagePath || '',
      publicUrl: imageSrc || '',
      src: imageSrc || '',
      alt: imageAlt || '',
    },
    imagen_principal_src: imageSrc || '',
    imagen_principal_alt: imageAlt || '',
    imagen_principal_path: imagePath || '',
    estado: normalizedStatus,
    publicado:
      vehicle.publicado !== undefined
        ? Boolean(vehicle.publicado)
        : normalizedStatus === VEHICLE_STATUS.PUBLISHED,
    archivado:
      vehicle.archivado !== undefined
        ? Boolean(vehicle.archivado)
        : normalizedStatus === VEHICLE_STATUS.ARCHIVED,
  })
}

export function mapVehicleDbToFormVehicle(vehicle) {
  if (!vehicle) {
    return null
  }

  return syncLegacyVehicleFields({
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
    imagen_principal: {
      path: '',
      publicUrl: vehicle.imagen_principal_src || '',
      src: vehicle.imagen_principal_src || '',
      alt: vehicle.imagen_principal_alt || '',
    },
    galeria: formatGalleryField(vehicle.galeria),
    financiacion: normalizeFinancingRecord(vehicle.financiacion),
    descripcion: formatListField(vehicle.descripcion_parrafos),
    equipamiento: formatListField(vehicle.features),
    publicado: Boolean(vehicle.publicado),
    destacado: Boolean(vehicle.destacado),
    archivado: Boolean(vehicle.archivado),
    orden: vehicle.orden != null ? String(vehicle.orden) : '',
    created_at: vehicle.created_at || '',
    updated_at: vehicle.updated_at || '',
  })
}

export function mapVehicleDbToListVehicle(vehicle) {
  const normalizedStatus = normalizeVehicleStatus(vehicle)

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
    estado: normalizedStatus,
    orden: vehicle.orden ?? DEFAULT_VEHICLE_ORDER,
    createdAt: vehicle.created_at || '',
    updatedAt: vehicle.updated_at || '',
    status:
      normalizedStatus === VEHICLE_STATUS.ARCHIVED
        ? 'archived'
        : normalizedStatus === VEHICLE_STATUS.PUBLISHED
          ? 'published'
          : 'draft',
    raw: vehicle,
  }
}

export function mapVehicleFormToDbPayload(vehicle) {
  const safeVehicle = syncLegacyVehicleFields(vehicle)
  const generatedAlt = buildVehicleAltText(safeVehicle)
  const normalizedOrder = trimString(safeVehicle.orden) === ''
    ? DEFAULT_VEHICLE_ORDER
    : parseOptionalInteger(safeVehicle.orden, 'Orden')

  return {
    slug: buildVehicleSlug(safeVehicle),
    tipo_vehiculo: normalizeVehicleType(safeVehicle.tipo_vehiculo) || null,
    marca: trimString(safeVehicle.marca),
    modelo: trimString(safeVehicle.modelo),
    version: getOptionalString(safeVehicle.version),
    anio: parseOptionalInteger(safeVehicle.anio, 'Año'),
    precio: parseOptionalNumber(safeVehicle.precio, 'Precio'),
    moneda: getOptionalString(safeVehicle.moneda),
    subtitulo: getOptionalString(safeVehicle.subtitulo),
    kilometros: parseOptionalInteger(safeVehicle.kilometros, 'Kilómetros'),
    combustible: getOptionalString(safeVehicle.combustible),
    transmision: getOptionalString(safeVehicle.transmision),
    motor: getOptionalString(safeVehicle.motor),
    color: getOptionalString(safeVehicle.color),
    telefono: getOptionalString(safeVehicle.telefono),
    ubicacion: getOptionalString(safeVehicle.ubicacion),
    imagen_principal_src: getOptionalString(safeVehicle.imagen_principal.src),
    imagen_principal_alt: getOptionalString(safeVehicle.imagen_principal.alt || generatedAlt),
    galeria: parseGalleryField(safeVehicle.galeria).map((item) => ({
      ...item,
      alt: item.alt || generatedAlt,
    })),
    financiacion: parseFinancingField(safeVehicle.financiacion),
    descripcion_parrafos: parseListField(safeVehicle.descripcion),
    features: parseListField(safeVehicle.equipamiento),
    publicado: Boolean(safeVehicle.publicado),
    destacado: Boolean(safeVehicle.destacado),
    archivado: Boolean(safeVehicle.archivado),
    orden: normalizedOrder,
  }
}

export {
  DEFAULT_VEHICLE_ORDER,
  formatGalleryField,
  formatListField,
  normalizeVehicleType,
  parseGalleryField,
  parseListField,
  trimString,
}
