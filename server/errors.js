export class ApiError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error)
    return
  }

  const status = Number(error.status) ||
    (error.code === 'LIMIT_FILE_SIZE' ? 413 : error.code === 'LIMIT_UNEXPECTED_FILE' ? 422 : 500)
  const body = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message:
        status >= 500
          ? 'Ocurrió un error interno.'
          : error.code === 'LIMIT_FILE_SIZE'
            ? 'La imagen no puede superar los 5 MB.'
            : error.message,
    },
  }

  if (error.details !== undefined && status < 500) {
    body.error.details = error.details
  }

  if (status >= 500) {
    console.error(error)
  }

  response.status(status).json(body)
}
