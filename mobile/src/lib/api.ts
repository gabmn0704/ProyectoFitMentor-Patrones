import { API_URL } from './config'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = '',
    readonly retryAfter: number | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let onUnauthorized: (() => void) | null = null

/** El AuthProvider registra aquí cómo cerrar sesión cuando el token caduca. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

export function buildApiUrl(path: string, base = API_URL): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function errorCodeOf(body = ''): string {
  try {
    const parsed = JSON.parse(body) as { error?: unknown }
    return typeof parsed.error === 'string' ? parsed.error.trim().toLowerCase() : ''
  } catch {
    return ''
  }
}

export function parseRetryAfter(value: string | null | undefined, now = Date.now()): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) return Math.max(1, Number(trimmed))
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return null
  return Math.max(1, Math.ceil((date - now) / 1000))
}

function waitText(seconds: number | null): string {
  if (!seconds) return 'Espera un momento y vuelve a intentarlo.'
  if (seconds < 60) return `Vuelve a intentarlo en ${seconds} s.`
  return `Vuelve a intentarlo en ${Math.ceil(seconds / 60)} min.`
}

/** Mensaje legible en español para un error del backend (`{ error, message }`). */
export function errorMessageFor(
  status: number,
  body = '',
  options: { retryAfter?: number | null; authenticated?: boolean } = {},
): string {
  const code = errorCodeOf(body)
  const { retryAfter = null, authenticated = true } = options
  switch (code) {
    case 'invalid_credential':
      return 'Correo o contraseña incorrectos.'
    case 'rate_limited':
      return `Has hecho demasiadas solicitudes seguidas. ${waitText(retryAfter)}`
    case 'unknown_exercise':
      return 'Ese ejercicio no existe en el catálogo.'
    case 'validation_error':
    case 'bad_request':
      return 'Algunos datos no son válidos. Revísalos e inténtalo de nuevo.'
    default:
      break
  }
  if (status === 401) {
    return authenticated ? 'Tu sesión caducó. Vuelve a iniciar sesión.' : 'Correo o contraseña incorrectos.'
  }
  if (status === 403) return 'No tienes permiso para esta acción.'
  if (status === 404) return 'No encontramos lo que buscabas.'
  if (status === 409) return 'Ese correo ya tiene una cuenta. Inicia sesión.'
  if (status === 429) return `Has hecho demasiadas solicitudes seguidas. ${waitText(retryAfter)}`
  if (status === 400 || status === 422) return 'Algunos datos no son válidos. Revísalos e inténtalo de nuevo.'
  if (status === 503) return 'El servicio no está disponible ahora. Inténtalo de nuevo en unos minutos.'
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
  return `El servidor respondió ${status}.`
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string | null
  /** El plan gratuito de Render tarda en despertar: por defecto se espera hasta 60 s. */
  timeoutMs?: number
}

const RETRYABLE_STATUS = new Set([500, 502, 503, 504])
const RETRY_DELAY_MS = 400

/** GET idénticos en vuelo (misma ruta y token) comparten una sola petición. */
const inFlightGets = new Map<string, Promise<unknown>>()

/** Los GET se deduplican mientras están en vuelo y se reintentan una vez ante un 5xx transitorio. */
export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if ((options.method ?? 'GET') !== 'GET') return send<T>(path, options)
  const key = `${options.token ?? ''}|${path}`
  const pending = inFlightGets.get(key)
  if (pending) return pending as Promise<T>
  const request = sendWithRetry<T>(path, options).finally(() => inFlightGets.delete(key))
  inFlightGets.set(key, request)
  return request
}

async function sendWithRetry<T>(path: string, options: RequestOptions): Promise<T> {
  try {
    return await send<T>(path, options)
  } catch (error) {
    if (!(error instanceof ApiError) || !RETRYABLE_STATUS.has(error.status)) throw error
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return send<T>(path, options)
  }
}

async function send<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = 'GET', body, token, timeoutMs = 60_000 } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(buildApiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.')
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 401 && token) onUnauthorized?.()
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    const retryAfter = response.status === 429 ? parseRetryAfter(response.headers.get('Retry-After')) : null
    throw new ApiError(
      response.status,
      errorMessageFor(response.status, text, { retryAfter, authenticated: Boolean(token) }),
      errorCodeOf(text),
      retryAfter,
    )
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

const WARM_COOLDOWN_MS = 4 * 60_000
const WARM_TIMEOUT_MS = 70_000
let lastWarm = 0

/**
 * Despierta el backend (Render lo duerme y el primer intento tarda hasta un minuto; el servicio de IA
 * despierta con él). Se lanza al abrir la app y al entrar en Entrenar o Coach; se limita a una vez cada
 * pocos minutos y se ignora cualquier resultado.
 */
export function warmUpBackend(now = Date.now()): void {
  if (now - lastWarm < WARM_COOLDOWN_MS) return
  lastWarm = now
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), WARM_TIMEOUT_MS)
  fetch(buildApiUrl('/api/exercises'), { method: 'GET', signal: controller.signal })
    .catch(() => undefined)
    .finally(() => clearTimeout(timer))
}

/**
 * Comprueba si el backend ya responde: resuelve con los ms que tardó en llegar CUALQUIER respuesta HTTP
 * (aunque sea 401) o null si no hubo red o se agotó el tiempo.
 */
export async function pingBackend(timeoutMs = 8_000): Promise<number | null> {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetch(buildApiUrl('/api/exercises'), { method: 'GET', signal: controller.signal })
    return Date.now() - started
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Solo para pruebas. */
export function resetWarmUp(): void {
  lastWarm = 0
}
