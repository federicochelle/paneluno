import express from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { createRequireUser, requireAdmin } from './auth.js'
import { config } from './config.js'
import { ApiError, asyncHandler } from './errors.js'
import {
  buildStoragePath,
  collectDraftMediaPaths,
  collectVehicleMediaPaths,
  publicStorageUrl,
  removeStoragePaths,
} from './media.js'
import { assertObject, assertVehicleId, validateUpload, validateVehiclePayload } from './validation.js'
import {
  DEFAULT_VEHICLE_ORDER,
  mapVehicleDbToFormVehicle,
  mapVehicleDbToListVehicle,
  mapVehicleFormToDbPayload,
} from '../src/lib/vehicleMappers.js'

export function createRoutes({ authenticateUser } = {}) {
const router = express.Router()
const requireUser = createRequireUser(authenticateUser)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
})

const baseSelect = `id, slug, tipo_vehiculo, marca, modelo, version, anio, precio, moneda, subtitulo, kilometros, combustible, transmision, motor, color, telefono, ubicacion, imagen_principal_src, imagen_principal_alt, galeria, financiacion, descripcion_parrafos, features, publicado, destacado, archivado, orden, created_at, updated_at`
const listSelect = `id, slug, tipo_vehiculo, marca, modelo, version, precio, moneda, publicado, destacado, archivado, orden, created_at, updated_at`

function supabaseError(error, fallback) {
  return new ApiError(502, 'SUPABASE_ERROR', error?.message || fallback)
}

async function cleanupNewPaths(supabase, paths, operation) {
  if (!paths.size) return null
  try {
    await removeStoragePaths(supabase, paths)
    return null
  } catch (error) {
    console.error(`No se pudieron limpiar archivos nuevos durante ${operation}.`, {
      code: error.code || 'UNKNOWN',
      count: paths.size,
    })
    return error
  }
}

async function readVehicle(supabase, id) {
  const { data, error } = await supabase.from('vehicles').select(baseSelect).eq('id', id).maybeSingle()
  if (error) throw supabaseError(error, 'No se pudo leer el vehículo.')
  if (!data) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'El vehículo no existe.')
  return data
}

router.get('/health', (request, response) => {
  response.json({ ok: true, service: 'paneluno-api' })
})

router.use('/vehicles', requireUser, requireAdmin)
router.use('/dashboard', requireUser, requireAdmin)
router.use('/media', requireUser, requireAdmin)

router.get('/vehicles', asyncHandler(async (request, response) => {
  const { data, error } = await request.auth.supabase.from('vehicles').select(listSelect).order('orden', { ascending: true })
  if (error) throw supabaseError(error, 'No se pudieron cargar los vehículos.')
  response.json({ data: (data || []).map(mapVehicleDbToListVehicle) })
}))

router.get('/dashboard', asyncHandler(async (request, response) => {
  const { data, error } = await request.auth.supabase.from('vehicles').select(listSelect).order('orden', { ascending: true })
  if (error) throw supabaseError(error, 'No se pudo cargar el dashboard.')
  const vehicles = (data || []).map(mapVehicleDbToListVehicle)
  response.json({
    data: {
      totalVehicles: vehicles.length,
      publishedVehicles: vehicles.filter((vehicle) => vehicle.publicado).length,
      archivedVehicles: vehicles.filter((vehicle) => vehicle.archivado).length,
      featuredVehicles: vehicles.filter((vehicle) => vehicle.destacado).length,
      recentVehicles: vehicles.slice(0, 4),
    },
  })
}))

router.get('/vehicles/:id', asyncHandler(async (request, response) => {
  assertVehicleId(request.params.id)
  const vehicle = await readVehicle(request.auth.supabase, request.params.id)
  response.json({ data: mapVehicleDbToFormVehicle(vehicle) })
}))

router.post('/vehicles', asyncHandler(async (request, response) => {
  assertObject(request.body)
  validateVehiclePayload(request.body)
  const payload = mapVehicleFormToDbPayload(request.body)
  const { data, error } = await request.auth.supabase.from('vehicles').insert(payload).select(baseSelect).single()
  if (error) {
    await cleanupNewPaths(request.auth.supabase, collectDraftMediaPaths(payload, config.supabaseUrl), 'crear vehículo')
    throw supabaseError(error, 'No se pudo crear el vehículo.')
  }
  response.status(201).json({ data: mapVehicleDbToFormVehicle(data) })
}))

router.patch('/vehicles/:id', asyncHandler(async (request, response) => {
  assertVehicleId(request.params.id)
  assertObject(request.body)
  const previous = await readVehicle(request.auth.supabase, request.params.id)
  const current = { ...mapVehicleDbToFormVehicle(previous), ...request.body }
  validateVehiclePayload(current)
  const payload = mapVehicleFormToDbPayload(current)
  const { data, error } = await request.auth.supabase.from('vehicles').update(payload).eq('id', request.params.id).select(baseSelect).single()
  if (error) {
    await cleanupNewPaths(request.auth.supabase, collectDraftMediaPaths(payload, config.supabaseUrl), 'actualizar vehículo')
    throw supabaseError(error, 'No se pudo actualizar el vehículo.')
  }

  const obsoletePaths = collectVehicleMediaPaths(previous, config.supabaseUrl)
  for (const path of collectVehicleMediaPaths(data, config.supabaseUrl)) obsoletePaths.delete(path)
  let cleanupWarning
  try {
    await removeStoragePaths(request.auth.supabase, obsoletePaths)
  } catch (cleanupError) {
    cleanupWarning = cleanupError.message
  }

  const result = { data: mapVehicleDbToFormVehicle(data) }
  if (cleanupWarning) result.warning = cleanupWarning
  response.json(result)
}))

async function updateVehicleField(request, response, field, value, message) {
  assertVehicleId(request.params.id)
  const normalized = typeof value === 'boolean' ? value : Number(value)
  if (field !== 'orden' && typeof value !== 'boolean') {
    throw new ApiError(422, 'VALIDATION_ERROR', 'El valor debe ser booleano.')
  }
  if (field === 'orden' && (!Number.isInteger(normalized) || normalized < 0)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'El orden debe ser un entero no negativo.')
  }
  const { data, error } = await request.auth.supabase.from('vehicles').update({ [field]: normalized }).eq('id', request.params.id).select(listSelect).single()
  if (error) throw supabaseError(error, message)
  response.json({ data: mapVehicleDbToListVehicle(data) })
}

router.patch('/vehicles/:id/publication', asyncHandler((request, response) => updateVehicleField(request, response, 'publicado', request.body?.publicado, 'No se pudo actualizar la publicación.')))
router.patch('/vehicles/:id/archive', asyncHandler((request, response) => updateVehicleField(request, response, 'archivado', request.body?.archivado, 'No se pudo actualizar el archivo.')))
router.patch('/vehicles/:id/order', asyncHandler((request, response) => updateVehicleField(request, response, 'orden', request.body?.orden ?? DEFAULT_VEHICLE_ORDER, 'No se pudo actualizar el orden.')))

router.delete('/vehicles/:id', asyncHandler(async (request, response) => {
  assertVehicleId(request.params.id)
  const previous = await readVehicle(request.auth.supabase, request.params.id)
  const { error } = await request.auth.supabase.from('vehicles').delete().eq('id', request.params.id)
  if (error) throw supabaseError(error, 'No se pudo eliminar el vehículo.')
  let warning
  try {
    await removeStoragePaths(request.auth.supabase, collectVehicleMediaPaths(previous, config.supabaseUrl))
  } catch (cleanupError) {
    warning = cleanupError.message
  }
  response.status(204).set('X-Cleanup-Warning', warning || '').send()
}))

router.post('/vehicles/:id/media/cover', upload.single('file'), asyncHandler(async (request, response) => {
  assertVehicleId(request.params.id)
  const image = validateUpload(request.file)
  const previous = await readVehicle(request.auth.supabase, request.params.id)
  const storagePath = buildStoragePath(request.params.id, 'cover', image.extension)
  const createdPaths = new Set()
  const { error: uploadError } = await request.auth.supabase.storage.from('vehicles').upload(storagePath, request.file.buffer, { contentType: image.contentType, upsert: false })
  if (uploadError) throw supabaseError(uploadError, 'No se pudo subir la portada.')
  createdPaths.add(storagePath)
  let publicUrl
  try {
    publicUrl = publicStorageUrl(request.auth.supabase, storagePath)
  } catch (error) {
    await cleanupNewPaths(request.auth.supabase, createdPaths, 'subir portada')
    throw error
  }
  response.status(201).json({ data: { path: storagePath, publicUrl, src: publicUrl, alt: previous.imagen_principal_alt || '' } })
}))

router.post('/vehicles/:id/media/gallery', upload.array('files', 12), asyncHandler(async (request, response) => {
  assertVehicleId(request.params.id)
  if (!request.files?.length) throw new ApiError(422, 'INVALID_FILE', 'Se requiere al menos una imagen.')
  const results = []
  const createdPaths = new Set()
  for (const file of request.files) {
    const image = validateUpload(file)
    const storagePath = buildStoragePath(request.params.id, 'gallery', image.extension)
    const { error: uploadError } = await request.auth.supabase.storage.from('vehicles').upload(storagePath, file.buffer, { contentType: image.contentType, upsert: false })
    if (uploadError) {
      await cleanupNewPaths(request.auth.supabase, createdPaths, 'subir galería')
      throw supabaseError(uploadError, 'No se pudo subir una imagen de galería.')
    }
    createdPaths.add(storagePath)
    let publicUrl
    try {
      publicUrl = publicStorageUrl(request.auth.supabase, storagePath)
    } catch (error) {
      await cleanupNewPaths(request.auth.supabase, createdPaths, 'subir galería')
      throw error
    }
    results.push({ path: storagePath, publicUrl, src: publicUrl, alt: '', orden: results.length + 1 })
  }
  response.status(201).json({ data: results })
}))

router.post('/media/draft-cover', upload.single('file'), asyncHandler(async (request, response) => {
  const image = validateUpload(request.file)
  const storagePath = `drafts/${randomUUID()}/cover.${image.extension}`
  const createdPaths = new Set()
  const { error } = await request.auth.supabase.storage.from('vehicles').upload(storagePath, request.file.buffer, { contentType: image.contentType, upsert: false })
  if (error) throw supabaseError(error, 'No se pudo subir la portada.')
  createdPaths.add(storagePath)
  let publicUrl
  try {
    publicUrl = publicStorageUrl(request.auth.supabase, storagePath)
  } catch (publicUrlError) {
    await cleanupNewPaths(request.auth.supabase, createdPaths, 'subir portada de borrador')
    throw publicUrlError
  }
  response.status(201).json({ data: { path: storagePath, publicUrl, src: publicUrl, alt: '' } })
}))

router.post('/media/draft-gallery', upload.array('files', 12), asyncHandler(async (request, response) => {
  if (!request.files?.length) throw new ApiError(422, 'INVALID_FILE', 'Se requiere al menos una imagen.')
  const draftId = randomUUID()
  const results = []
  const createdPaths = new Set()
  for (const file of request.files) {
    const image = validateUpload(file)
    const storagePath = `drafts/${draftId}/gallery/${results.length + 1}.${image.extension}`
    const { error } = await request.auth.supabase.storage.from('vehicles').upload(storagePath, file.buffer, { contentType: image.contentType, upsert: false })
    if (error) {
      await cleanupNewPaths(request.auth.supabase, createdPaths, 'subir galería de borrador')
      throw supabaseError(error, 'No se pudo subir una imagen de galería.')
    }
    createdPaths.add(storagePath)
    let publicUrl
    try {
      publicUrl = publicStorageUrl(request.auth.supabase, storagePath)
    } catch (publicUrlError) {
      await cleanupNewPaths(request.auth.supabase, createdPaths, 'subir galería de borrador')
      throw publicUrlError
    }
    results.push({ path: storagePath, publicUrl, src: publicUrl, alt: '', orden: results.length + 1 })
  }
  response.status(201).json({ data: results })
}))

return router
}

export default createRoutes()
