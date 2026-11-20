import NetInfo from '@react-native-community/netinfo'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import { enqueueSession, flushQueue, markSynced, pendingOf } from '../lib/queue'
import { loadProfile, saveProfile, type BodyProfile } from '../lib/profile'
import { sessionsApi } from '../lib/services'
import { kv } from '../lib/storage'
import type { SessionPayload, SessionRecord } from '../lib/types'
import { useAuth } from './auth'
import { clearRemoteCache } from './useRemote'

type DataValue = {
  /** Sesiones guardadas en este teléfono (sincronizadas y pendientes). */
  sessions: SessionRecord[]
  pending: number
  online: boolean
  syncing: boolean
  /** Guarda una sesión: primero en el teléfono, después se sube cuando hay red. */
  saveSession: (payload: SessionPayload) => Promise<SessionRecord>
  sync: () => Promise<number>
  /** Perfil físico (objetivo, peso, días). `undefined` mientras carga, `null` si falta. */
  body: BodyProfile | null | undefined
  saveBody: (profile: BodyProfile) => Promise<void>
  /** Cambia cuando se sincroniza algo: las pantallas lo usan para recargar estadísticas. */
  version: number
}

const DataContext = createContext<DataValue | null>(null)
const sessionsKey = (userId: string) => `fitmentor.sessions.${userId}`

export function DataProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth()
  const userId = user?.id
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [body, setBody] = useState<BodyProfile | null | undefined>(undefined)
  const [online, setOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [version, setVersion] = useState(0)
  const sessionsRef = useRef<SessionRecord[]>([])
  const busy = useRef(false)

  const persist = useCallback(
    async (next: SessionRecord[]) => {
      sessionsRef.current = next
      setSessions(next)
      if (userId) await kv.setJSON(sessionsKey(userId), next)
    },
    [userId],
  )

  // Carga lo guardado para el usuario actual.
  useEffect(() => {
    let active = true
    setBody(undefined)
    if (!userId) {
      sessionsRef.current = []
      setSessions([])
      setBody(null)
      clearRemoteCache()
      return
    }
    ;(async () => {
      const [saved, profile] = await Promise.all([kv.getJSON<SessionRecord[]>(sessionsKey(userId), []), loadProfile(userId)])
      if (!active) return
      const list = Array.isArray(saved) ? saved : []
      sessionsRef.current = list
      setSessions(list)
      setBody(profile)
    })()
    return () => {
      active = false
    }
  }, [userId])

  const sync = useCallback(async () => {
    if (!token || busy.current || !pendingOf(sessionsRef.current).length) return 0
    busy.current = true
    setSyncing(true)
    try {
      const { uploaded, dropped } = await flushQueue(sessionsRef.current, (payload) => sessionsApi.create(token, payload))
      if (uploaded.size || dropped.size) {
        const synced = markSynced(sessionsRef.current, uploaded).filter((record) => !dropped.has(record.localId))
        await persist(synced)
        setVersion((value) => value + 1)
      }
      return uploaded.size
    } finally {
      busy.current = false
      setSyncing(false)
    }
  }, [token, persist])

  // Reintenta al recuperar la red, al volver a la app y cada vez que cambia el token.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const reachable = state.isConnected !== false && state.isInternetReachable !== false
      setOnline(reachable)
      if (reachable) void sync()
    })
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync()
    })
    void sync()
    return () => {
      unsubscribe()
      appState.remove()
    }
  }, [sync])

  const saveSession = useCallback(
    async (payload: SessionPayload) => {
      const next = enqueueSession(sessionsRef.current, payload)
      await persist(next)
      void sync()
      return next[0]
    },
    [persist, sync],
  )

  const saveBody = useCallback(
    async (profile: BodyProfile) => {
      setBody(profile)
      if (userId) await saveProfile(userId, profile)
    },
    [userId],
  )

  const value = useMemo<DataValue>(
    () => ({ sessions, pending: pendingOf(sessions).length, online, syncing, saveSession, sync, body, saveBody, version }),
    [sessions, online, syncing, saveSession, sync, body, saveBody, version],
  )
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataValue {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData debe usarse dentro de DataProvider')
  return value
}
