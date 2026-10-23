import { convertImageFileToWebp, MAX_IMAGE_FILE_SIZE_BYTES, SUPPORTED_IMAGE_TYPES } from './imageProcessing'
import { apiFetch } from './api'
import { trimString } from './vehicleMappers'

export async function uploadVehicleCover(file) {
  const { file: processedFile } = await convertImageFileToWebp(file, { fieldLabel: 'la portada', maxWidth: 1600 })
  const formData = new FormData()
  formData.append('file', processedFile)
  const response = await apiFetch('/api/media/draft-cover', { method: 'POST', body: formData })
  return response.data
}

export async function uploadVehicleGallery(files) {
  const fileList = Array.from(files || [])
  if (!fileList.length) throw new Error('Seleccioná al menos una imagen para la galería.')
  const formData = new FormData()
  for (const file of fileList) {
    const { file: processedFile } = await convertImageFileToWebp(file, { fieldLabel: 'una imagen de la galería', maxWidth: 1200 })
    formData.append('files', processedFile)
  }
  const response = await apiFetch('/api/media/draft-gallery', { method: 'POST', body: formData })
  return response.data
}

export { MAX_IMAGE_FILE_SIZE_BYTES, SUPPORTED_IMAGE_TYPES }

export async function readVehicles() {
  const response = await apiFetch('/api/vehicles')
  return response.data || []
}

export async function readVehiclesDashboard() {
  const response = await apiFetch('/api/dashboard')
  return response.data
}

export async function createVehicle(vehicleData) {
  const response = await apiFetch('/api/vehicles', { method: 'POST', body: JSON.stringify(vehicleData) })
  return response.data
}

export async function readVehicleById(vehicleId) {
  const response = await apiFetch(`/api/vehicles/${encodeURIComponent(vehicleId)}`)
  return response.data
}

export async function updateVehicle(vehicleId, vehicleData) {
  const response = await apiFetch(`/api/vehicles/${encodeURIComponent(vehicleId)}`, { method: 'PATCH', body: JSON.stringify(vehicleData) })
  return response.data
}

export async function toggleVehiclePublished(vehicleId, publicado) {
  const response = await apiFetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/publication`, { method: 'PATCH', body: JSON.stringify({ publicado: Boolean(publicado) }) })
  return response.data
}

export async function toggleVehicleArchived(vehicleId, archivado) {
  const response = await apiFetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/archive`, { method: 'PATCH', body: JSON.stringify({ archivado: Boolean(archivado) }) })
  return response.data
}

export async function updateVehicleOrder(vehicleId, orden) {
  const normalizedOrder = orden === '' || orden === null || orden === undefined ? 99 : Number(orden)
  if (!Number.isInteger(normalizedOrder) || normalizedOrder < 0) throw new Error('El orden debe ser un numero entero valido.')
  const response = await apiFetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/order`, { method: 'PATCH', body: JSON.stringify({ orden: normalizedOrder }) })
  return response.data
}

export async function deleteVehicle(vehicleId) {
  await apiFetch(`/api/vehicles/${encodeURIComponent(trimString(vehicleId))}`, { method: 'DELETE' })
}
