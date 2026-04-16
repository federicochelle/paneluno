// Bypass temporal solo para desarrollo local. Nunca debe usarse en producción.
const rawDevBypassAuth = import.meta.env.VITE_DEV_BYPASS_AUTH

function parseBooleanEnv(value) {
  if (typeof value !== 'string') {
    return false
  }

  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export const isDevBypassAuthEnabled =
  import.meta.env.DEV && parseBooleanEnv(rawDevBypassAuth)

export const devBypassUser = {
  email: 'dev-admin@unomotors.local',
}
