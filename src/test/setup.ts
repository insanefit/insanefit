import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

const ensureLocalStorage = () => {
  const storage = (globalThis as { localStorage?: Storage }).localStorage
  const hasApi =
    storage &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function' &&
    typeof storage.clear === 'function'

  if (hasApi) return

  const cache = new Map<string, string>()
  const fallbackStorage: Storage = {
    get length() {
      return cache.size
    },
    clear: () => cache.clear(),
    getItem: (key: string) => cache.get(key) ?? null,
    key: (index: number) => Array.from(cache.keys())[index] ?? null,
    removeItem: (key: string) => {
      cache.delete(key)
    },
    setItem: (key: string, value: string) => {
      cache.set(String(key), String(value))
    },
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: fallbackStorage,
  })
}

ensureLocalStorage()

afterEach(() => {
  cleanup()
  globalThis.localStorage.clear()
})
