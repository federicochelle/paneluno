import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { describe, it } from 'node:test'
import request from 'supertest'
import { createApp } from '../server/app.js'
import { createRoutes } from '../server/routes.js'
import { config } from '../server/config.js'

const supabaseOrigin = 'https://supabase.test'

const httpTestsAvailable = await new Promise((resolve) => {
  const server = createServer()
  server.once('error', () => resolve(false))
  server.listen(0, '127.0.0.1', () => server.close(() => resolve(true)))
})
const describeHttp = httpTestsAvailable ? describe : describe.skip

function vehicle(id, overrides = {}) {
  return {
    id,
    slug: 'uno-x',
    tipo_vehiculo: 'auto',
    marca: 'Uno',
    modelo: 'X',
    version: 'Base',
    anio: 2025,
    precio: 100,
    moneda: 'USD',
    subtitulo: null,
    kilometros: null,
    combustible: null,
    transmision: null,
    motor: null,
    color: null,
    telefono: null,
    ubicacion: null,
    imagen_principal_src: null,
    imagen_principal_alt: null,
    galeria: [],
    financiacion: { mostrar: false, logos: [] },
    descripcion_parrafos: [],
    features: [],
    publicado: false,
    destacado: false,
    archivado: false,
    orden: 99,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

class FakeSupabase {
  constructor(initial = []) {
    this.rows = new Map(initial.map((row) => [row.id, row]))
    this.storageFiles = new Set()
    this.calls = { uploads: [], removes: [], operations: [] }
    this.fail = {}
  }

  from(table) {
    assert.equal(table, 'vehicles')
    return new FakeQuery(this)
  }

  get storage() {
    return {
      from: (bucket) => {
        assert.equal(bucket, 'vehicles')
        return {
          upload: async (path) => {
            this.calls.uploads.push(path)
            if (this.fail.uploadAt === this.calls.uploads.length) return { error: new Error('simulated upload failure') }
            this.storageFiles.add(path)
            return { error: null }
          },
          remove: async (paths) => {
            this.calls.removes.push([...paths])
            if (this.fail.remove) return { error: new Error('simulated cleanup failure') }
            for (const path of paths) this.storageFiles.delete(path)
            return { error: null }
          },
          getPublicUrl: (path) => ({ data: { publicUrl: `${supabaseOrigin}/storage/v1/object/public/vehicles/${path}` } }),
        }
      },
    }
  }
}

class FakeQuery {
  constructor(db) {
    this.db = db
    this.action = 'select'
    this.filters = []
  }

  select() { return this }
  order() { return this }
  eq(field, value) { this.filters.push([field, value]); return this }
  insert(payload) { this.action = 'insert'; this.payload = payload; return this }
  update(payload) { this.action = 'update'; this.payload = payload; return this }
  delete() { this.action = 'delete'; return this }
  maybeSingle() { return this.execute('maybeSingle') }
  single() { return this.execute('single') }
  then(resolve, reject) { return this.execute('many').then(resolve, reject) }

  async execute(mode) {
    const id = this.filters.find(([field]) => field === 'id')?.[1]
    const row = id ? this.db.rows.get(id) : null
    this.db.calls.operations.push({ action: this.action, id, payload: this.payload })

    if (this.action === 'insert') {
      if (this.db.fail.insert) return { data: null, error: new Error('simulated database failure') }
      const created = vehicle(`v-${this.db.rows.size + 1}`, this.payload)
      this.db.rows.set(created.id, created)
      return { data: created, error: null }
    }
    if (this.action === 'update') {
      if (this.db.fail.update) return { data: null, error: new Error('simulated database failure') }
      if (!row) return { data: null, error: new Error('missing row') }
      const updated = { ...row, ...this.payload }
      this.db.rows.set(id, updated)
      return { data: updated, error: null }
    }
    if (this.action === 'delete') {
      if (this.db.fail.delete) return { data: null, error: new Error('simulated database failure') }
      this.db.rows.delete(id)
      return { data: null, error: null }
    }

    const rows = [...this.db.rows.values()]
    const selected = id ? row || null : rows
    if (mode === 'maybeSingle') return { data: selected, error: null }
    if (mode === 'single') return { data: selected, error: selected ? null : new Error('missing row') }
    return { data: rows, error: null }
  }
}

function setup(initial = []) {
  const db = new FakeSupabase(initial)
  const originalIds = config.adminUserIds
  const originalEmails = config.adminEmails
  const originalUrl = config.supabaseUrl
  config.adminUserIds = ['admin-id']
  config.adminEmails = []
  config.supabaseUrl = supabaseOrigin
  const app = createApp({
    routes: createRoutes({
      authenticateUser: async () => ({
        user: { id: 'admin-id', email: 'admin@example.com' },
        supabase: db,
      }),
    }),
  })
  const restore = () => {
    config.adminUserIds = originalIds
    config.adminEmails = originalEmails
    config.supabaseUrl = originalUrl
  }
  return { app, db, restore }
}

const auth = { Authorization: 'Bearer test-token' }
const validVehicle = {
  marca: 'Uno', modelo: 'X', tipo_vehiculo: 'auto', precio: '100', moneda: 'USD', publicado: false,
}

describeHttp('flujo de vehículos con Supabase simulado', () => {
  it('devuelve JSON para API inexistente y HTML para navegación SPA', async () => {
    const { app, restore } = setup()
    try {
      const apiResponse = await request(app).get('/api/no-such-route').expect(404)
      assert.equal(apiResponse.headers['content-type'].startsWith('application/json'), true)
      assert.equal(apiResponse.body.error.code, 'NOT_FOUND')
      const spaResponse = await request(app).get('/vehicles').expect(200)
      assert.match(spaResponse.headers['content-type'], /text\/html/)
      assert.match(spaResponse.text, /id="root"/)
    } finally { restore() }
  })

  it('crea, edita, publica y elimina un vehículo', async () => {
    const { app, db, restore } = setup()
    try {
    const created = await request(app).post('/api/vehicles').set(auth).send(validVehicle).expect(201)
    const id = created.body.data.id
    assert.ok(db.rows.has(id))

    await request(app).patch(`/api/vehicles/${id}`).set(auth).send({ precio: '125' }).expect(200)
    await request(app).patch(`/api/vehicles/${id}/publication`).set(auth).send({ publicado: true }).expect(200)
    assert.equal(db.rows.get(id).publicado, true)

    await request(app).delete(`/api/vehicles/${id}`).set(auth).expect(204)
    assert.equal(db.rows.has(id), false)
    } finally { restore() }
  })

  it('limpia borradores nuevos si falla la creación del vehículo', async () => {
    const { app, db, restore } = setup()
    db.fail.insert = true
    try {
      const draft = `${supabaseOrigin}/storage/v1/object/public/vehicles/drafts/new-cover.webp`
      await request(app).post('/api/vehicles').set(auth).send({ ...validVehicle, imagen_principal: { src: draft } }).expect(502)
      assert.deepEqual(db.calls.removes, [['drafts/new-cover.webp']])
    } finally { restore() }
  })

  it('limpia uploads anteriores de la misma operación si falla una carga posterior', async () => {
    const { app, db, restore } = setup([vehicle('v1')])
    try {
    db.fail.uploadAt = 2
    const image = Buffer.from([0xff, 0xd8, 0xff, 0x00])
    const response = await request(app)
      .post('/api/vehicles/v1/media/gallery')
      .set(auth)
      .attach('files', image, { filename: 'one.jpg', contentType: 'image/jpeg' })
      .attach('files', image, { filename: 'two.jpg', contentType: 'image/jpeg' })
      .expect(502)
    assert.equal(response.body.error.code, 'SUPABASE_ERROR')
    assert.equal(db.storageFiles.size, 0)
    assert.equal(db.calls.removes.length, 1)
    assert.equal(db.calls.removes[0].length, 1)
    } finally { restore() }
  })

  it('limpia solo borradores nuevos si falla la actualización de base', async () => {
    const { app, db, restore } = setup([vehicle('v1', { imagen_principal_src: `${supabaseOrigin}/storage/v1/object/public/vehicles/old/cover.webp` })])
    db.storageFiles.add('old/cover.webp')
    try {
    db.fail.update = true
    const draft = `${supabaseOrigin}/storage/v1/object/public/vehicles/drafts/new-cover.webp`
    const response = await request(app).patch('/api/vehicles/v1').set(auth).send({ imagen_principal: { src: draft }, publicado: false }).expect(502)
    assert.equal(response.body.error.code, 'SUPABASE_ERROR')
    assert.deepEqual(db.calls.removes, [['drafts/new-cover.webp']])
    assert.equal(db.storageFiles.has('old/cover.webp'), true)
    } finally { restore() }
  })

  it('conserva las imágenes anteriores cuando la limpieza posterior falla', async () => {
    const oldPath = 'v1/old-cover.webp'
    const { app, db, restore } = setup([vehicle('v1', { imagen_principal_src: `${supabaseOrigin}/storage/v1/object/public/vehicles/${oldPath}` })])
    try {
    db.fail.remove = true
    const response = await request(app).patch('/api/vehicles/v1').set(auth).send({ imagen_principal: { src: 'https://example.com/new.webp' }, publicado: false }).expect(200)
    assert.match(response.body.warning, /No se pudieron limpiar/)
    assert.equal(db.calls.removes[0][0], oldPath)
    } finally { restore() }
  })
})
