import { financingLogoOptions } from '../data/projects'
import { syncLegacyVehicleFields } from './vehicleMappers'
import { VEHICLE_STATUS } from './vehicleModel'

const ALLOWED_CURRENCIES = ['USD', 'UYU']

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function getNumericValue(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : NaN
}

function isValidGallerySource(source) {
  return (
    source.startsWith('http://') ||
    source.startsWith('https://') ||
    source.startsWith('/')
  )
}

function getGalleryItems(value) {
  if (Array.isArray(value)) {
    return value
  }

  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function addRequiredError(errors, field, message) {
  if (!errors[field]) {
    errors[field] = message
  }
}

function validateRequiredText(value, field, message, errors) {
  if (!trimString(value)) {
    addRequiredError(errors, field, message)
  }
}

function validateIntegerInRange(value, field, label, min, max, errors) {
  if (value === '' || value === null || value === undefined) {
    return
  }

  const parsedValue = getNumericValue(value)

  if (!Number.isInteger(parsedValue)) {
    errors[field] = `${label} debe ser un numero entero valido.`
    return
  }

  if (parsedValue < min || parsedValue > max) {
    errors[field] = `${label} debe estar entre ${min} y ${max}.`
  }
}

function validateIntegerMin(value, field, label, min, errors) {
  if (value === '' || value === null || value === undefined) {
    return
  }

  const parsedValue = getNumericValue(value)

  if (!Number.isInteger(parsedValue)) {
    errors[field] = `${label} debe ser un numero entero valido.`
    return
  }

  if (parsedValue < min) {
    errors[field] = `${label} debe ser mayor o igual a ${min}.`
  }
}

function validatePrice(value, errors) {
  if (value === '' || value === null || value === undefined) {
    errors.precio = 'El precio es obligatorio.'
    return
  }

  const parsedValue = getNumericValue(value)

  if (!Number.isFinite(parsedValue)) {
    errors.precio = 'El precio debe ser un numero valido.'
    return
  }

  if (parsedValue <= 0) {
    errors.precio = 'El precio debe ser mayor a 0.'
  }
}

function validateCurrency(value, errors) {
  const normalizedCurrency = trimString(value).toUpperCase()

  if (!normalizedCurrency) {
    errors.moneda = 'La moneda es obligatoria.'
    return
  }

  if (!ALLOWED_CURRENCIES.includes(normalizedCurrency)) {
    errors.moneda = `La moneda debe ser una de estas opciones: ${ALLOWED_CURRENCIES.join(', ')}.`
  }
}

function validateFinancing(financiacion, errors) {
  if (
    financiacion?.logos?.some(
      (logo) => !financingLogoOptions.includes(logo),
    )
  ) {
    errors.financiacion = 'La financiación contiene logos no permitidos.'
  }
}

function validateGallery(galeria, errors) {
  const galleryItems = getGalleryItems(galeria)

  if (
    galleryItems.some((item) => {
      const source = typeof item === 'string' ? item : trimString(item?.src)
      return source && !isValidGallerySource(source)
    })
  ) {
    errors.galeria =
      'Cada imagen de galería debe tener una URL válida o una ruta que empiece con "/".'
  }
}

function validatePublishRules(vehicle, errors) {
  if (vehicle.estado !== VEHICLE_STATUS.PUBLISHED && !vehicle.publicado) {
    return
  }

  validateRequiredText(vehicle.marca, 'marca', 'La marca es obligatoria para publicar.', errors)
  validateRequiredText(vehicle.modelo, 'modelo', 'El modelo es obligatorio para publicar.', errors)
  validateRequiredText(
    vehicle.tipo_vehiculo,
    'tipo_vehiculo',
    'El tipo de vehículo es obligatorio para publicar.',
    errors,
  )

  if (!trimString(vehicle.imagen_principal.src)) {
    errors.imagen_principal = 'La portada es obligatoria para publicar.'
  }

  if (!errors.precio) {
    const parsedValue = getNumericValue(vehicle.precio)

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      errors.precio = 'El precio debe ser válido para publicar.'
    }
  }
}

export function validateVehicle(values) {
  const errors = {}
  const vehicle = syncLegacyVehicleFields(values)
  const currentYear = new Date().getFullYear()

  validateRequiredText(vehicle.marca, 'marca', 'La marca es obligatoria.', errors)
  validateRequiredText(vehicle.modelo, 'modelo', 'El modelo es obligatorio.', errors)
  validateRequiredText(
    vehicle.tipo_vehiculo,
    'tipo_vehiculo',
    'Seleccioná un tipo de vehículo.',
    errors,
  )

  if (
    vehicle.tipo_vehiculo &&
    !['auto', 'moto'].includes(vehicle.tipo_vehiculo)
  ) {
    errors.tipo_vehiculo = 'Seleccioná un tipo de vehículo válido.'
  }

  validatePrice(vehicle.precio, errors)
  validateCurrency(vehicle.moneda, errors)
  validateIntegerInRange(vehicle.anio, 'anio', 'Año', 1900, currentYear + 1, errors)
  validateIntegerMin(vehicle.kilometros, 'kilometros', 'Kilómetros', 0, errors)
  validateIntegerMin(vehicle.orden, 'orden', 'Orden', 0, errors)
  validateFinancing(vehicle.financiacion, errors)
  validateGallery(vehicle.galeria, errors)
  validatePublishRules(vehicle, errors)

  return errors
}

export { ALLOWED_CURRENCIES }
