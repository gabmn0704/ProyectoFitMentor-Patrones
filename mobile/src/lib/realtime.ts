import type { PosePoint } from './pose-analysis'
import type { CommandName, ExerciseId, ServerMessage } from './types'

/**
 * Protocolo STOMP con el backend Spring Boot (el mismo que usa la web).
 * - Conexión: `ws(s)://<api>/ws` (CONNECT con cabecera Authorization: Bearer).
 * - Envíos: `/app/pose` (landmarks) y `/app/command`.
 * - Recepción por sesión: `/topic/feedback.{session_id}` y `/topic/state.{session_id}`.
 */

/** Intervalo mínimo entre envíos de pose: como máximo tres por segundo. */
export const POSE_INTERVAL_MS = 340
export const POSE_DESTINATION = '/app/pose'
export const COMMAND_DESTINATION = '/app/command'
export const feedbackTopic = (sessionId: string): string => `/topic/feedback.${sessionId}`
export const stateTopic = (sessionId: string): string => `/topic/state.${sessionId}`

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/

export function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ID_PATTERN.test(value)
}

/** Id de sesión de entrenamiento aceptado por el backend. */
export function newSessionId(now = Date.now(), random = Math.random()): string {
  return `m-${now.toString(36)}-${random.toString(36).slice(2, 10)}`
}

export const MAX_STOMP_MESSAGE_BYTES = 8 * 1024
const STOMP_FRAME_OVERHEAD_BYTES = 512

/** Longitud UTF-8 sin depender de TextEncoder. */
function utf8Length(text: string): number {
  let bytes = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4
      i++
    } else bytes += 3
  }
  return bytes
}

export function fitsStompFrame(body: string): boolean {
  return utf8Length(body) + STOMP_FRAME_OVERHEAD_BYTES <= MAX_STOMP_MESSAGE_BYTES
}

const COORD_MIN = -0.5
const COORD_MAX = 1.5
const clampCoord = (value: number): number => Math.min(COORD_MAX, Math.max(COORD_MIN, value))

/** Articulaciones MoveNet (índice de 17 puntos) con el nombre que espera el servicio de IA. */
export const TRACKED_JOINTS = [
  [5, 'left_shoulder'],
  [6, 'right_shoulder'],
  [7, 'left_elbow'],
  [8, 'right_elbow'],
  [9, 'left_wrist'],
  [10, 'right_wrist'],
  [11, 'left_hip'],
  [12, 'right_hip'],
  [13, 'left_knee'],
  [14, 'right_knee'],
  [15, 'left_ankle'],
  [16, 'right_ankle'],
] as const

/** URL del broker STOMP a partir de la URL del API (http → ws, https → wss). */
export function buildBrokerUrl(apiUrl: string): string {
  const base = apiUrl.replace(/\/+$/, '')
  const scheme = base.startsWith('https:') || base.startsWith('wss:') ? 'wss:' : 'ws:'
  return `${base.replace(/^[a-z]+:/i, scheme)}/ws`
}

export function buildConnectHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface PosePayload {
  exercise: ExerciseId
  points: Array<{ name: string; x: number; y: number; confidence: number }>
  frame_width: number
  frame_height: number
  session_id: string
}

export function buildPoseMessage(exercise: ExerciseId, landmarks: PosePoint[], frameWidth: number, frameHeight: number, sessionId: string): PosePayload | null {
  if (!isValidSessionId(sessionId)) return null
  const points = TRACKED_JOINTS.flatMap(([index, name]) => {
    const point = landmarks[index]
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return []
    const confidence = Number.isFinite(point.confidence) ? point.confidence : 0
    return [{ name, x: clampCoord(point.x), y: clampCoord(point.y), confidence: Math.min(1, Math.max(0, confidence)) }]
  })
  if (!points.length) return null
  return {
    exercise,
    points,
    frame_width: Math.max(1, Math.round(frameWidth)),
    frame_height: Math.max(1, Math.round(frameHeight)),
    session_id: sessionId,
  }
}

export function buildCommandMessage(name: CommandName, sessionId: string) {
  return { session_id: sessionId, name }
}

/** Valida y normaliza un mensaje del servidor. Devuelve null si no es válido. */
export function parseServerMessage(raw: string): ServerMessage | null {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null

  if (data.type === 'state' && typeof data.state === 'string') {
    return { type: 'state', state: data.state, ...(typeof data.exercise === 'string' ? { exercise: data.exercise } : {}) }
  }
  if (data.type === 'error' && typeof data.message === 'string') return { type: 'error', message: data.message }
  if (data.type === 'feedback' && typeof data.score === 'number') {
    const list = Array.isArray(data.feedback) ? data.feedback.filter((item): item is string => typeof item === 'string') : []
    const message = typeof data.message === 'string' && data.message.trim() ? data.message : list.join(' ')
    if (!message) return null
    return {
      type: 'feedback',
      score: Math.round(data.score),
      message,
      feedback: list,
      phase: typeof data.phase === 'string' ? data.phase : undefined,
      reps: typeof data.reps === 'number' && Number.isFinite(data.reps) && data.reps >= 0 ? Math.floor(data.reps) : undefined,
      state: typeof data.state === 'string' ? data.state : undefined,
      ...(typeof data.exercise === 'string' ? { exercise: data.exercise } : {}),
    }
  }
  return null
}
