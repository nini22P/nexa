import TauriStorageAdapter from './adapters/TauriStorageAdapter'
import WebStorageAdapter from './adapters/WebStorageAdapter'
import type { FileStorageAdapter } from './types'

export const isTauri = !!(
  typeof window !== 'undefined' && window.__TAURI_INTERNALS__
)

let adapter: FileStorageAdapter

export function getFileStorageAdapter(): FileStorageAdapter {
  if (adapter) return adapter

  if (isTauri) {
    adapter = new TauriStorageAdapter()
  } else {
    adapter = new WebStorageAdapter()
  }
  return adapter
}
