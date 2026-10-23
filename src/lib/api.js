import { supabase } from './supabase'

async function getAccessToken() {
  if (!supabase) throw new Error('No hay una sesión de Supabase disponible.')
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) throw new Error('La sesión expiró. Ingresá nuevamente al panel.')
  return data.session.access_token
}

async function parseResponse(response) {
  if (response.status === 204) return null
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'La operación no pudo completarse.')
    error.code = body?.error?.code
    error.details = body?.error?.details
    throw error
  }
  return body
}

export async function apiFetch(path, options = {}) {
  const token = await getAccessToken()
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  return parseResponse(await fetch(path, { ...options, headers }))
}
