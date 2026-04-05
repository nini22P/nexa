import type { StorageFile } from './storage/types'

export interface BookmarkNode {
  type: 'folder' | 'link';
  id: string;
  parentId: string | null;
  title: string;
  addDate: string;
  lastModified: string;
  personalToolbarFolder?: boolean; // only for root folder
  href?: string; // only for link
  icon?: string; // only for link
}

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
  bookmarkNodes: Record<string, BookmarkNode> | null;
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
  addItem: (type: 'link' | 'folder', parentId: string | null) => BookmarkNode | null;
  updateItem: (id: string, updates: Partial<BookmarkNode>) => void;
  deleteItem: (id: string) => void;
  moveItem: (activeId: string, overId: string) => void;
}

export type BookmarkStore = BookmarkState & BookmarkActions