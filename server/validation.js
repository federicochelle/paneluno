import { validateVehicle } from '../src/lib/vehicleValidation.js'
import { ApiError } from './errors.js'

export function assertObject(value, message = 'El cuerpo debe ser un objeto JSON.') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(422, 'INVALID_BODY', message)
  }
}

export function assertVehicleId(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 120) {
    throw new ApiError(400, 'INVALID_VEHICLE_ID', 'El identificador del vehículo no es válido.')
  }
}

export function validateVehiclePayload(payload) {
  const errors = validateVehicle(payload)

  if (Object.keys(errors).length > 0) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'El vehículo contiene datos inválidos.', errors)
  }
}

export function validateUpload(file) {
  if (!file?.buffer || !file.size) {
    throw new ApiError(422, 'INVALID_FILE', 'No se recibió un archivo válido.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new ApiError(422, 'FILE_TOO_LARGE', 'La imagen no puede superar los 5 MB.')
  }

  const bytes = file.buffer
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const isWebp =
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'

  if (!isJpeg && !isPng && !isWebp) {
    throw new ApiError(422, 'INVALID_IMAGE_CONTENT', 'El contenido no es una imagen JPG, PNG o WEBP válida.')
  }

  return isJpeg
    ? { contentType: 'image/jpeg', extension: 'jpg' }
    : isPng
      ? { contentType: 'image/png', extension: 'png' }
      : { contentType: 'image/webp', extension: 'webp' }
}
