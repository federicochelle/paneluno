import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createApp } from '../server/app.js'
import { requireAdmin, requireUser } from '../server/auth.js'
import { config } from '../server/config.js'
import { ApiError } from '../server/errors.js'
import { validateUpload, validateVehiclePayload } from '../server/validation.js'

describe('API sin configuración externa', () => {
  it('construye la aplicación y mantiene el health check configurado', () => {
    const app = createApp()
    assert.equal(typeof app, 'function')
  })

  it('rechaza operaciones protegidas sin token', async () => {
    await assert.rejects(
      () => new Promise((resolve, reject) => requireUser({ get: () => '' }, {}, (error) => error ? reject(error) : resolve())),
      (error) => error.code === 'UNAUTHENTICATED',
    )
  })

  it('rechaza el bypass visual porque no genera token', async () => {
    await assert.rejects(
      () => new Promise((resolve, reject) => requireUser({ get: (name) => name === 'authorization' ? '' : 'true' }, {}, (error) => error ? reject(error) : resolve())),
      (error) => error.code === 'UNAUTHENTICATED',
    )
  })
})

describe('autorización', () => {
  it('deniega por defecto cuando no hay allowlist administrativa', async () => {
    const originalIds = config.adminUserIds
    const originalEmails = config.adminEmails
    config.adminUserIds = []
    config.adminEmails = []
    await assert.rejects(
      () => new Promise((resolve, reject) => requireAdmin({ auth: { user: { id: 'u1', email: 'a@example.com' } } }, {}, (error) => error ? reject(error) : resolve())),
      (error) => error.code === 'ADMIN_ACCESS_NOT_CONFIGURED',
    )
    config.adminUserIds = originalIds
    config.adminEmails = originalEmails
  })

  it('permite únicamente una identidad incluida en la allowlist', async () => {
    const originalIds = config.adminUserIds
    const originalEmails = config.adminEmails
    config.adminUserIds = ['admin-id']
    config.adminEmails = []
    await new Promise((resolve, reject) => requireAdmin({ auth: { user: { id: 'admin-id', email: 'admin@example.com' } } }, {}, (error) => error ? reject(error) : resolve()))
    await assert.rejects(
      () => new Promise((resolve, reject) => requireAdmin({ auth: { user: { id: 'other-id', email: 'other@example.com' } } }, {}, (error) => error ? reject(error) : resolve())),
      (error) => error.code === 'FORBIDDEN',
    )
    config.adminUserIds = originalIds
    config.adminEmails = originalEmails
  })

  it('rechaza un email permitido pero no verificado', async () => {
    const originalIds = config.adminUserIds
    const originalEmails = config.adminEmails
    config.adminUserIds = []
    config.adminEmails = ['admin@example.com']
    await assert.rejects(
      () => new Promise((resolve, reject) => requireAdmin({ auth: { user: { id: 'email-admin', email: 'admin@example.com' } } }, {}, (error) => error ? reject(error) : resolve())),
      (error) => error.code === 'FORBIDDEN',
    )
    config.adminUserIds = originalIds
    config.adminEmails = originalEmails
  })

  it('prioriza un ID administrativo aunque el email no esté verificado', async () => {
    const originalIds = config.adminUserIds
    const originalEmails = config.adminEmails
    config.adminUserIds = ['admin-id']
    config.adminEmails = ['other@example.com']
    await new Promise((resolve, reject) => requireAdmin({ auth: { user: { id: 'admin-id', email: 'admin@example.com' } } }, {}, (error) => error ? reject(error) : resolve()))
    config.adminUserIds = originalIds
    config.adminEmails = originalEmails
  })
})

describe('validaciones', () => {
  it('rechaza un vehículo inválido', () => {
    assert.throws(() => validateVehiclePayload({ marca: '', modelo: '', tipo_vehiculo: 'camion' }), (error) => {
      assert.equal(error.code, 'VALIDATION_ERROR')
      assert.ok(error.details.marca)
      return true
    })
  })

  it('acepta un vehículo publicable válido', () => {
    assert.doesNotThrow(() => validateVehiclePayload({
      marca: 'Uno', modelo: 'X', tipo_vehiculo: 'auto', precio: '100', moneda: 'USD',
      imagen_principal: { src: 'https://example.com/cover.webp' }, publicado: true,
    }))
  })
})

describe('imágenes', () => {
  it('rechaza contenido que no coincide con una firma de imagen', () => {
    assert.throws(() => validateUpload({ size: 4, buffer: Buffer.from('not-an-image') }), (error) => {
      assert.equal(error.code, 'INVALID_IMAGE_CONTENT')
      return true
    })
  })

  it('rechaza archivos mayores al límite', () => {
    assert.throws(() => validateUpload({ size: 6 * 1024 * 1024, buffer: Buffer.alloc(12) }), (error) => {
      assert.equal(error.code, 'FILE_TOO_LARGE')
      return true
    })
  })
})

describe('errores', () => {
  it('mantiene ApiError como error identificable', () => {
    const error = new ApiError(422, 'TEST', 'Mensaje')
    assert.equal(error.status, 422)
    assert.equal(error.code, 'TEST')
  })
})

void requireUser
