declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
  }
}

export type FileHandle = FileSystemFileHandle | string;

export interface StorageFile {
  path: string;
  handle?: FileHandle;
}

export interface FileStorageAdapter {
  openFile(): Promise<StorageFile | null>;
  saveFile(file: StorageFile, content: string): Promise<void>;
  readFile(file: StorageFile): Promise<string>;
  newFile(suggestedName: string): Promise<StorageFile | null>;
  verifyPermission(file: StorageFile, mode: 'read' | 'readwrite'): Promise<boolean>;
  getModifiedTime(file: StorageFile): Promise<number>;
}
