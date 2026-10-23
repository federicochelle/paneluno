import express from 'express'
import path from 'node:path'
import { config } from './config.js'
import { errorHandler } from './errors.js'
import defaultRoutes from './routes.js'

export function createApp({ routes = defaultRoutes } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', routes)

  app.use(express.static(config.frontendDirectory))
  app.get(/^(?!\/api(?:\/|$)).*/, (request, response, next) => {
    if (request.path.startsWith('/api/')) {
      next()
      return
    }
    response.sendFile(path.join(config.frontendDirectory, 'index.html'), (error) => {
      if (error) next(error)
    })
  })

  app.use((request, response) => {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado.' } })
  })
  app.use(errorHandler)
  return app
}
