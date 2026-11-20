import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

/** Almacén clave-valor tolerante a fallos: un almacenamiento roto nunca debe tumbar la app. */
export const kv = {
  async getJSON<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  },
  async setJSON(key: string, value: unknown): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      /* sin almacenamiento: la preferencia vive solo en memoria */
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      /* ignorar */
    }
  },
}

const TOKEN_KEY = 'fitmentor.token'

/** El token de sesión vive en el almacén seguro del sistema (Keystore / Keychain). */
export const tokenStore = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY)
    } catch {
      return null
    }
  },
  async set(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token)
    } catch {
      /* sin almacén seguro: la sesión dura hasta cerrar la app */
    }
  },
  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
    } catch {
      /* ignorar */
    }
  },
}
