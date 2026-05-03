const OFFLINE_DB_NAME = 'insanefit-offline-db'
const OFFLINE_STORE_NAME = 'kv'
const OFFLINE_DB_VERSION = 1

const hasIndexedDb = (): boolean =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'

const openOfflineDb = async (): Promise<IDBDatabase | null> => {
  if (!hasIndexedDb()) return null

  return new Promise((resolve) => {
    const request = window.indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      resolve(null)
    }
  })
}

export const readOfflineJson = async <T>(key: string): Promise<T | null> => {
  const db = await openOfflineDb()
  if (!db) return null

  return new Promise((resolve) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readonly')
    const store = tx.objectStore(OFFLINE_STORE_NAME)
    const request = store.get(key)

    request.onsuccess = () => {
      resolve((request.result as T | undefined) ?? null)
    }

    request.onerror = () => {
      resolve(null)
    }

    tx.oncomplete = () => {
      db.close()
    }
  })
}

export const writeOfflineJson = async <T>(key: string, value: T): Promise<void> => {
  const db = await openOfflineDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite')
    const store = tx.objectStore(OFFLINE_STORE_NAME)
    store.put(value, key)

    tx.oncomplete = () => {
      db.close()
      resolve()
    }

    tx.onerror = () => {
      db.close()
      resolve()
    }
  })
}
