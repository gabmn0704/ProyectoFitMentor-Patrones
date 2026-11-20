import { useMemo } from 'react'
import { achievementsApi, routineApi, sessionsApi, statsApi } from '../lib/services'
import { mergeHistory, type HistoryEntry } from '../lib/queue'
import { computeLocalStats } from '../lib/stats'
import type { Achievement, Routine, ServerSession, Stats } from '../lib/types'
import { useAuth } from './auth'
import { useData } from './data'
import { useRemote } from './useRemote'

/** Estadísticas: las del servidor; si no hay red, las calculadas con las sesiones del teléfono. */
export function useStats() {
  const { token, user } = useAuth()
  const { sessions, version } = useData()
  const remote = useRemote<Stats>(token && user ? `stats:${user.id}` : null, () => statsApi.get(token!), [version])
  const local = useMemo(() => computeLocalStats(sessions), [sessions])
  const stats: Stats | undefined = remote.data ?? (remote.error ? local : undefined)
  return { ...remote, stats, fromLocal: !remote.data && Boolean(remote.error) }
}

export function useHistory(limit = 30) {
  const { token, user } = useAuth()
  const { sessions, version } = useData()
  const remote = useRemote<ServerSession[]>(token && user ? `history:${user.id}:${limit}` : null, () => sessionsApi.list(token!, limit), [version])
  const entries: HistoryEntry[] | undefined = useMemo(() => {
    if (remote.data) return mergeHistory(remote.data, sessions)
    if (remote.error) return mergeHistory(null, sessions)
    return undefined
  }, [remote.data, remote.error, sessions])
  return { ...remote, entries }
}

export function useRoutine() {
  const { token, user } = useAuth()
  const { version } = useData()
  return useRemote<Routine>(token && user ? `routine:${user.id}` : null, () => routineApi.get(token!), [version])
}

export function useAchievements() {
  const { token, user } = useAuth()
  const { version } = useData()
  return useRemote<Achievement[]>(token && user ? `achievements:${user.id}` : null, () => achievementsApi.list(token!), [version])
}
