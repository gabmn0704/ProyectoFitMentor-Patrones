import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiError, setUnauthorizedHandler, warmUpBackend } from '../lib/api'
import { isGuest, normalizeUser } from '../lib/contract'
import { authApi, meApi, type ProfilePatch } from '../lib/services'
import { kv, tokenStore } from '../lib/storage'
import type { AuthResponse, User } from '../lib/types'

type Status = 'loading' | 'signedOut' | 'signedIn'

type AuthValue = {
  status: Status
  token: string | null
  user: User | null
  guest: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  continueAsGuest: (name?: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (patch: ProfilePatch) => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)
const USER_KEY = 'fitmentor.user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const tokenRef = useRef<string | null>(null)

  const adopt = useCallback(async (response: AuthResponse) => {
    const normalized = normalizeUser(response.user)
    tokenRef.current = response.token
    setToken(response.token)
    setUser(normalized)
    setStatus('signedIn')
    await Promise.all([tokenStore.set(response.token), kv.setJSON(USER_KEY, normalized)])
  }, [])

  const logout = useCallback(async () => {
    tokenRef.current = null
    setToken(null)
    setUser(null)
    setStatus('signedOut')
    await Promise.all([tokenStore.clear(), kv.remove(USER_KEY)])
  }, [])

  // Arranque: recupera la sesión guardada. Sin red se conserva el usuario en caché (modo offline).
  useEffect(() => {
    let active = true
    warmUpBackend()
    ;(async () => {
      const saved = await tokenStore.get()
      if (!saved) {
        if (active) setStatus('signedOut')
        return
      }
      const cached = await kv.getJSON<User | null>(USER_KEY, null)
      tokenRef.current = saved
      if (cached && active) {
        setToken(saved)
        setUser(normalizeUser(cached))
        setStatus('signedIn')
      }
      try {
        const fresh = normalizeUser(await meApi.get(saved))
        if (!active) return
        setToken(saved)
        setUser(fresh)
        setStatus('signedIn')
        void kv.setJSON(USER_KEY, fresh)
      } catch (error) {
        if (!active) return
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) await logout()
        else if (!cached) setStatus('signedOut')
      }
    })()
    return () => {
      active = false
    }
  }, [logout])

  useEffect(() => {
    setUnauthorizedHandler(() => void logout())
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const value = useMemo<AuthValue>(
    () => ({
      status,
      token,
      user,
      guest: isGuest(user),
      login: async (email, password) => adopt(await authApi.login(email.trim(), password)),
      register: async (name, email, password) => adopt(await authApi.register(name.trim(), email.trim(), password)),
      continueAsGuest: async (name) => adopt(await authApi.guest(name)),
      logout,
      updateProfile: async (patch) => {
        if (!tokenRef.current) return
        const updated = normalizeUser(await meApi.update(tokenRef.current, patch))
        setUser(updated)
        void kv.setJSON(USER_KEY, updated)
      },
    }),
    [status, token, user, adopt, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return value
}
