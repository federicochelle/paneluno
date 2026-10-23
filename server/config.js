import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(serverDirectory, '..')

function parseEnvFile(contents) {
  const values = {}

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator < 1) continue

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }

  return values
}

function loadServerEnv() {
  const envPath = process.env.PANELUNO_ENV_FILE || path.join(projectDirectory, '.env')
  if (!fs.existsSync(envPath)) return

  const fileValues = parseEnvFile(fs.readFileSync(envPath, 'utf8'))
  for (const [key, value] of Object.entries(fileValues)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadServerEnv()

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isPlaceholder(value) {
  return !value || /^<[^>]+>$/.test(value)
}

export const config = {
  port: Number(process.env.PORT || 3000),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  adminUserIds: splitList(process.env.SUPABASE_ADMIN_USER_IDS),
  adminEmails: splitList(process.env.SUPABASE_ADMIN_EMAILS).map((email) =>
    email.toLowerCase(),
  ),
  frontendDirectory: path.resolve(serverDirectory, '../dist'),
}

export function hasAdminConfiguration() {
  return config.adminUserIds.some((value) => !isPlaceholder(value)) ||
    config.adminEmails.some((value) => !isPlaceholder(value))
}

export function getMissingServerVariables() {
  const missing = []
  if (isPlaceholder(config.supabaseUrl)) missing.push('SUPABASE_URL')
  if (isPlaceholder(config.supabaseAnonKey)) missing.push('SUPABASE_ANON_KEY')
  if (config.supabaseUrl && !isPlaceholder(config.supabaseUrl)) {
    try {
      const url = new URL(config.supabaseUrl)
      if (!['http:', 'https:'].includes(url.protocol)) missing.push('SUPABASE_URL')
    } catch {
      missing.push('SUPABASE_URL')
    }
  }
  if (!hasAdminConfiguration()) {
    missing.push('SUPABASE_ADMIN_USER_IDS o SUPABASE_ADMIN_EMAILS')
  }
  return missing
}

export function assertServerConfiguration() {
  const missing = getMissingServerVariables()
  if (missing.length) {
    throw new Error(`Faltan variables de servidor obligatorias: ${missing.join(', ')}`)
  }
}
