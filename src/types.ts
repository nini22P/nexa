import type { StorageFile } from './storage/types'
import type { BookmarkItem, BookmarkItems } from './lib/bookmark/types'

export type BookmarkFile = StorageFile

export interface AppState {
  hasHydrated: boolean;
  bookmarkFile: BookmarkFile | null;
  activeFolderId: string | null;
  selectedItemId: string | null;
  editingItemId: string | null;
  searchQuery: string;
  sortKey: 'none' | 'title' | 'href' | 'addDate';
  sortOrder: 'asc' | 'desc';
  isSidebarOpen: boolean;
  expandedFolderIds: string[];
}

export interface AppActions {
  setHasHydrated: (state: boolean) => void;
  setBookmarkFile: (file: BookmarkFile | null) => void;
  setActiveFolderId: (id: string | null) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setExpandedFolderIds: (ids: string[]) => void;
  toggleFolderExpanded: (id: string) => void;
  setSelectedItemId: (id: string | null) => void;
  setEditingItemId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSort: (
    key: 'none' | 'title' | 'href' | 'addDate',
    order: 'asc' | 'desc',
  ) => void;
}

export type AppStore = AppState & AppActions;

export interface BookmarkState {
  bookmarkItems: BookmarkItems | null;
  lastModified: number | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export interface BookmarkActions {
  openFile: () => Promise<void>;
  newFile: () => Promise<void>;
  saveFile: () => Promise<void>;
  closeFile: () => void;
  syncWithDisk: () => Promise<void>;
  createItem: (type: 'link' | 'folder', parentId: string | null) => BookmarkItem | null;
  updateItem: (id: string, updates: Partial<BookmarkItem>) => void;
  deleteItem: (id: string) => void;
  moveItem: (id: string, { parentId, index }: { parentId: string | null; index: number }) => void;
}

export type BookmarkStore = BookmarkState & BookmarkActions