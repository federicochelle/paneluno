import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'
import { ApiError } from './errors.js'

export function assertSupabaseConfigured() {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new ApiError(
      503,
      'SUPABASE_NOT_CONFIGURED',
      'Supabase no está configurado en el servidor.',
    )
  }
}

export function createUserSupabaseClient(accessToken) {
  assertSupabaseConfigured()

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export async function getAuthenticatedUser(accessToken) {
  const supabase = createUserSupabaseClient(accessToken)
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'La sesión no es válida.')
  }

  return { supabase, user: data.user }
}
