import { financingLogoOptions } from '../data/projects'

function validateNumericField(value, label, errors, field, { integer = false } = {}) {
  if (value === '' || value === null || value === undefined) {
    return
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || (integer && !Number.isInteger(parsedValue))) {
    errors[field] = integer
      ? `${label} debe ser un numero entero valido.`
      : `${label} debe ser un numero valido.`
  }
}

export function validateVehicle(values) {
  const errors = {}
  const galleryItems = Array.isArray(values.galeria)
    ? values.galeria
    : String(values.galeria || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

  console.log('[galeria][validation] full gallery', galleryItems)
  galleryItems.forEach((item, index) => {
    console.log('[galeria][validation] checking', index, item, {
      src: item?.src,
      alt: item?.alt,
      orden: item?.orden,
      keys: item ? Object.keys(item) : null,
    })
  })

  if (!values.marca.trim()) {
    errors.marca = 'La marca es obligatoria.'
  }

  if (!values.modelo.trim()) {
    errors.modelo = 'El modelo es obligatorio.'
  }

  if (values.tipo_vehiculo && !['auto', 'moto'].includes(values.tipo_vehiculo)) {
    errors.tipo_vehiculo = 'Seleccioná un tipo de vehículo válido.'
  }

  if (values.precio === '' || values.precio === null || values.precio === undefined) {
    errors.precio = 'El precio es obligatorio.'
  }

  validateNumericField(values.anio, 'Año', errors, 'anio', { integer: true })
  validateNumericField(values.precio, 'Precio', errors, 'precio')
  validateNumericField(values.kilometros, 'Kilómetros', errors, 'kilometros', {
    integer: true,
  })
  validateNumericField(values.orden, 'Orden', errors, 'orden', { integer: true })

  if (
    values.financiacion?.logos?.some(
      (logo) => !financingLogoOptions.includes(logo),
    )
  ) {
    errors.financiacion = 'La financiación contiene logos no permitidos.'
  }

  if (
    galleryItems.some((item, index) => {
      const source = typeof item === 'string' ? item : item?.src || ''
      const isInvalid =
        source &&
        !source.startsWith('http://') &&
        !source.startsWith('https://') &&
        !source.startsWith('/')

      if (isInvalid) {
        console.log('[galeria][validation] invalid item', index, item, {
          source,
          reason: 'src no empieza con http://, https:// ni /',
          src: item?.src,
          alt: item?.alt,
          orden: item?.orden,
          keys: item ? Object.keys(item) : null,
        })
      }

      return isInvalid
    })
  ) {
    errors.galeria = 'Cada imagen de galería debe tener una URL válida o una ruta que empiece con "/".'
  }

  return errors
}
