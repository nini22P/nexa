import type { FileStorageAdapter, StorageFile } from '../types'

export default class TauriStorageAdapter implements FileStorageAdapter {
  private async getFs() {
    return await import('@tauri-apps/plugin-fs')
  }

  private async getDialog() {
    return await import('@tauri-apps/plugin-dialog')
  }

  private async getOs() {
    return await import('@tauri-apps/plugin-os')
  }

  async openFile(): Promise<StorageFile | null> {
    const { open } = await this.getDialog()
    const selected = await open({
      multiple: false,
      filters: [{ name: 'HTML Bookmarks', extensions: ['html', 'htm'] }],
    })

    if (!selected || Array.isArray(selected)) return null

    const path = selected
    const name = path.split(/[/\\]/).pop() || 'bookmarks.html'

    console.log('Selected file:', { path, name })

    return {
      path,
      handle: path,
    }
  }

  async saveFile(file: StorageFile, content: string): Promise<void> {
    const { writeTextFile } = await this.getFs()
    const path = file.handle as string || file.path
    if (!path) throw new Error('Missing file handle/path')

    await writeTextFile(path, content)
  }

  async readFile(file: StorageFile): Promise<string> {
    const { readTextFile } = await this.getFs()
    const path = file.handle as string || file.path
    if (!path) throw new Error('Missing file handle/path')

    return await readTextFile(path)
  }

  async newFile(suggestedName: string): Promise<StorageFile | null> {
    const { save } = await this.getDialog()
    const selected = await save({
      defaultPath: suggestedName,
      filters: [{ name: 'HTML Bookmarks', extensions: ['html'] }],
    })

    if (!selected) return null

    const path = selected

    return {
      path,
      handle: path,
    }
  }

  async verifyPermission(): Promise<boolean> {
    return true
  }

  async getModifiedTime(file: StorageFile): Promise<number> {
    const { stat } = await this.getFs()

    const path = file.handle as string || file.path
    if (!path) throw new Error('Missing file handle/path')

    try {
      const s = await stat(path)
      return s.mtime ? new Date(s.mtime).getTime() : Date.now()
    } catch (e) {
      console.warn('Stat failed, falling back to current time:', e)
      return Date.now()
    }
  }
}
