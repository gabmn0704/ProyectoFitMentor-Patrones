import type { ServerSession, SessionPayload, SessionRecord } from './types'

/**
 * Cola offline de sesiones. Lógica pura (sin red ni almacenamiento): el estado se
 * pasa y se devuelve, así se prueba sin móvil. `SyncProvider` la conecta con
 * AsyncStorage y con `sessionsApi`.
 */

export const MAX_LOCAL_SESSIONS = 200

export function newLocalId(now = new Date(), random = Math.random()): string {
  return `${now.getTime().toString(36)}-${random.toString(36).slice(2, 8)}`
}

/** Añade una sesión nueva (pendiente) al principio de la lista. */
export function enqueueSession(list: SessionRecord[], payload: SessionPayload, now = new Date(), random = Math.random()): SessionRecord[] {
  const record: SessionRecord = { ...payload, localId: newLocalId(now, random), date: now.toISOString(), synced: false }
  return [record, ...list].slice(0, MAX_LOCAL_SESSIONS)
}

export const pendingOf = (list: SessionRecord[]): SessionRecord[] => list.filter((record) => !record.synced)

export function payloadOf(record: SessionRecord): SessionPayload {
  return {
    exercise: record.exercise,
    reps: record.reps,
    accuracy: record.accuracy,
    durationSeconds: record.durationSeconds,
    ...(record.avgAngles ? { avgAngles: record.avgAngles } : {}),
  }
}

/** Marca como sincronizadas las sesiones cuyos ids se subieron. */
export function markSynced(list: SessionRecord[], ids: ReadonlySet<string>): SessionRecord[] {
  return list.map((record) => (ids.has(record.localId) ? { ...record, synced: true } : record))
}

/**
 * Sube las pendientes con `upload`. Se detiene en el primer error de red (0) para no
 * martillear un servidor caído; un error 4xx descarta la sesión (nunca será válida).
 * Devuelve los ids subidos y los descartados.
 */
export async function flushQueue(
  list: SessionRecord[],
  upload: (payload: SessionPayload) => Promise<unknown>,
): Promise<{ uploaded: Set<string>; dropped: Set<string> }> {
  const uploaded = new Set<string>()
  const dropped = new Set<string>()
  for (const record of pendingOf(list).reverse()) {
    try {
      await upload(payloadOf(record))
      uploaded.add(record.localId)
    } catch (error) {
      const status = (error as { status?: number }).status ?? 0
      if (status >= 400 && status < 500 && status !== 401 && status !== 429) dropped.add(record.localId)
      else break
    }
  }
  return { uploaded, dropped }
}

export interface HistoryEntry {
  id: string
  exercise: string
  reps: number
  accuracy: number
  durationSeconds: number
  /** ISO 8601. */
  date: string
  synced: boolean
}

/** Historial a mostrar: lo del servidor manda y se añaden las locales pendientes. */
export function mergeHistory(server: ServerSession[] | null, local: SessionRecord[]): HistoryEntry[] {
  const fromLocal = (r: SessionRecord): HistoryEntry => ({
    id: r.localId,
    exercise: r.exercise,
    reps: r.reps,
    accuracy: r.accuracy,
    durationSeconds: r.durationSeconds,
    date: r.date,
    synced: r.synced,
  })
  const entries: HistoryEntry[] = server
    ? [
        ...server.map((s) => ({
          id: s.id,
          exercise: s.exercise,
          reps: s.reps,
          accuracy: s.accuracy,
          durationSeconds: s.durationSeconds,
          date: s.createdAt,
          synced: true,
        })),
        ...local.filter((r) => !r.synced).map(fromLocal),
      ]
    : local.map(fromLocal)
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
