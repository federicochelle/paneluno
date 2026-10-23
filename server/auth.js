import { config, hasAdminConfiguration } from './config.js'
import { ApiError, asyncHandler } from './errors.js'
import { getAuthenticatedUser } from './supabase.js'

function getBearerToken(request) {
  const header = request.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

export function createRequireUser(authenticateUser = getAuthenticatedUser) {
  return asyncHandler(async (request, response, next) => {
    const token = getBearerToken(request)

    if (!token) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Se requiere una sesión válida.')
    }

    const authenticated = await authenticateUser(token)
    request.auth = { ...authenticated, accessToken: token }
    next()
  })
}

export const requireUser = createRequireUser()

export const requireAdmin = asyncHandler(async (request, response, next) => {
  if (!request.auth?.user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Se requiere una sesión válida.')
  }

  if (!hasAdminConfiguration()) {
    throw new ApiError(
      403,
      'ADMIN_ACCESS_NOT_CONFIGURED',
      'El acceso administrativo todavía no está configurado en el servidor.',
    )
  }

  const user = request.auth.user
  const matchesId = config.adminUserIds.includes(user.id)
  const matchesEmail = Boolean(
    !matchesId &&
      user.email_confirmed_at &&
      user.email &&
      config.adminEmails.includes(user.email.toLowerCase()),
  )

  if (!matchesId && !matchesEmail) {
    throw new ApiError(403, 'FORBIDDEN', 'El usuario no tiene permisos administrativos.')
  }

  next()
})

export function getRequestUser(request) {
  return request.auth?.user || null
}
