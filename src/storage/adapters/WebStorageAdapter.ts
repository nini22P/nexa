import type { FileStorageAdapter, StorageFile } from '../types'

export default class WebStorageAdapter implements FileStorageAdapter {
  async openFile(): Promise<StorageFile | null> {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'HTML Bookmarks',
            accept: { 'text/html': ['.html', '.htm'] },
          },
        ],
        multiple: false,
      })
      if (!handle) return null

      return {
        path: handle.name,
        handle,
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Open file failed:', e)
      }
      return null
    }
  }

  async saveFile(file: StorageFile, content: string): Promise<void> {
    const handle = file.handle as FileSystemFileHandle
    if (!handle) throw new Error('Invalid file handle')

    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  async readFile(file: StorageFile): Promise<string> {
    const handle = file.handle as FileSystemFileHandle
    if (!handle) throw new Error('Invalid file handle')

    const f = await handle.getFile()
    return await f.text()
  }

  async newFile(suggestedName: string): Promise<StorageFile | null> {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'HTML Bookmarks',
            accept: { 'text/html': ['.html'] },
          },
        ],
      })
      if (!handle) return null

      return {
        path: handle.name,
        handle,
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Create file failed:', e)
      }
      return null
    }
  }

  async verifyPermission(
    file: StorageFile,
    mode: 'read' | 'readwrite' = 'read',
  ): Promise<boolean> {
    const handle = file.handle as FileSystemFileHandle
    if (!handle || typeof handle.queryPermission !== 'function') return false
    if ((await handle.queryPermission({ mode })) === 'granted') return true
    if ((await handle.requestPermission({ mode })) === 'granted') return true
    return false
  }

  async getModifiedTime(file: StorageFile): Promise<number> {
    const handle = file.handle as FileSystemFileHandle
    if (!handle) throw new Error('Invalid file handle')
    const f = await handle.getFile()
    return f.lastModified
  }
}
