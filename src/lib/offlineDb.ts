// Native IndexedDB Wrapper with localStorage Fallback
const DB_NAME = 'insanefit_db'
const DB_VERSION = 1
const DEFAULT_STORE = 'keyval'

let dbPromise: Promise<IDBDatabase> | null = null

export const isIndexedDbSupported = (): boolean => {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null
  } catch {
    return false
  }
}

const getDb = (): Promise<IDBDatabase> => {
  if (!isIndexedDbSupported()) {
    return Promise.reject(new Error('IndexedDB not supported'))
  }

  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(DEFAULT_STORE)) {
        db.createObjectStore(DEFAULT_STORE)
      }
      if (!db.objectStoreNames.contains('exercises')) {
        const store = db.createObjectStore('exercises', { keyPath: 'id' })
        store.createIndex('muscleGroup', 'muscleGroup', { unique: false })
        store.createIndex('equipment', 'equipment', { unique: false })
        store.createIndex('target', 'target', { unique: false })
      }
      if (!db.objectStoreNames.contains('migration_meta')) {
        db.createObjectStore('migration_meta')
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })

  return dbPromise
}

export const getItemAsync = async <T>(key: string, storeName = DEFAULT_STORE): Promise<T | null> => {
  if (!isIndexedDbSupported()) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  try {
    const db = await getDb()
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result !== undefined ? (req.result as T) : null)
      req.onerror = () => resolve(null)
    })
  } catch {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }
}

export const setItemAsync = async <T>(key: string, value: T, storeName = DEFAULT_STORE): Promise<boolean> => {
  if (!isIndexedDbSupported()) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  try {
    const db = await getDb()
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const req = store.put(value, key)
      req.onsuccess = () => resolve(true)
      req.onerror = () => resolve(false)
    })
  } catch {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }
}

export const removeItemAsync = async (key: string, storeName = DEFAULT_STORE): Promise<boolean> => {
  if (!isIndexedDbSupported()) {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }

  try {
    const db = await getDb()
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const req = store.delete(key)
      req.onsuccess = () => resolve(true)
      req.onerror = () => resolve(false)
    })
  } catch {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}

export const clearAsync = async (storeName = DEFAULT_STORE): Promise<boolean> => {
  if (!isIndexedDbSupported()) {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }

  try {
    const db = await getDb()
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const req = store.clear()
      req.onsuccess = () => resolve(true)
      req.onerror = () => resolve(false)
    })
  } catch {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }
}
