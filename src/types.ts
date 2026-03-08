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

export interface BookmarkFile {
  path: string;
  handle: FileSystemFileHandle;
  data: Record<string, BookmarkNode>;
  lastSavedData: string;
  lastSavedHtml: string;
  fileName: string;
}

export interface BookmarkStore {
  bookmarkFile: BookmarkFile | null;
  activeFolderId: string | null;
  selectedItemId: string | null;
  editingItemId: string | null;
  searchQuery: string;
  sortKey: 'none' | 'title' | 'href' | 'addDate';
  sortOrder: 'asc' | 'desc';
  isSidebarOpen: boolean;
  expandedFolderIds: string[];

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setBookmarkFile: (file: BookmarkFile | null) => void;
  updateBookmarkData: (newData: Record<string, BookmarkNode>) => void;
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
  openFile: () => Promise<void>;
  newFile: () => Promise<void>;
  saveFile: () => Promise<void>;
  closeFile: () => void;
  syncWithDisk: () => Promise<void>;
  getCurrentItems: () => BookmarkNode[];
  addItem: (
    type: 'link' | 'folder',
    parentId: string | null,
  ) => BookmarkNode | null;
  updateItem: (id: string, updates: Partial<BookmarkNode>) => void;
  deleteItem: (id: string) => void;
  moveItem: (activeId: string, overId: string) => void;
}