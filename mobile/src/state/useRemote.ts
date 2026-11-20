import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../lib/api'

type Remote<T> = {
  data: T | undefined
  error: ApiError | Error | undefined
  /** Primera carga sin datos. */
  loading: boolean
  /** Refresco con datos ya visibles (pull to refresh). */
  refreshing: boolean
  offline: boolean
  refresh: () => void
}

const cache = new Map<string, unknown>()

/** Limpia la caché en memoria (al cerrar sesión). */
export function clearRemoteCache(): void {
  cache.clear()
}

/**
 * Carga remota con "stale-while-revalidate": muestra lo último que se vio mientras
 * pide lo nuevo. `key` identifica la caché; `null` pausa la carga.
 */
export function useRemote<T>(key: string | null, load: () => Promise<T>, deps: ReadonlyArray<unknown> = []): Remote<T> {
  const [data, setData] = useState<T | undefined>(() => (key ? (cache.get(key) as T | undefined) : undefined))
  const [error, setError] = useState<ApiError | Error | undefined>()
  const [refreshing, setRefreshing] = useState(false)
  const [nonce, setNonce] = useState(0)
  const loader = useRef(load)
  loader.current = load

  useEffect(() => {
    if (!key) return
    let active = true
    const cached = cache.get(key) as T | undefined
    if (cached !== undefined) setData(cached)
    loader
      .current()
      .then((result) => {
        if (!active) return
        cache.set(key, result)
        setData(result)
        setError(undefined)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason : new Error('Error desconocido'))
      })
      .finally(() => {
        if (active) setRefreshing(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, ...deps])

  const refresh = useCallback(() => {
    setRefreshing(true)
    setNonce((value) => value + 1)
  }, [])

  return {
    data,
    error,
    loading: Boolean(key) && data === undefined && error === undefined,
    refreshing,
    offline: error instanceof ApiError && error.status === 0,
    refresh,
  }
}
