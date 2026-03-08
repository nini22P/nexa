import type { StorageValue } from 'zustand/middleware'

const idbStorage = {
  getItem: async (name: string): Promise<StorageValue<unknown> | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('bookmark-db', 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore('bookmark-store')
      }
      request.onsuccess = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('bookmark-store')) {
          resolve(null)
          return
        }
        const transaction = db.transaction('bookmark-store', 'readonly')
        const store = transaction.objectStore('bookmark-store')
        const getRequest = store.get(name)
        getRequest.onsuccess = () => resolve(getRequest.result || null)
        getRequest.onerror = () => resolve(null)
      }
      request.onerror = () => resolve(null)
    })
  },
  setItem: async (
    name: string,
    value: StorageValue<unknown>,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('bookmark-db', 1)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction('bookmark-store', 'readwrite')
        const store = transaction.objectStore('bookmark-store')
        store.put(value, name)
        transaction.oncomplete = () => resolve()
      }
    })
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('bookmark-db', 1)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction('bookmark-store', 'readwrite')
        const store = transaction.objectStore('bookmark-store')
        store.delete(name)
        transaction.oncomplete = () => resolve()
      }
    })
  },
}

export default idbStorage
