import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppStore } from '../types'
import idbStorage from './idbStorage'
import createSelectors from './createSelectors'

const useAppStoreBase = create<AppStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      bookmarkFile: null,
      activeFolderId: null,
      selectedItemId: null,
      editingItemId: null,
      searchQuery: '',
      sortKey: 'none',
      sortOrder: 'asc',
      isSidebarOpen: false,
      expandedFolderIds: [],
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setBookmarkFile: (file) => set({ bookmarkFile: file }),
      setActiveFolderId: (id) => set({ activeFolderId: id }),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleFolderExpanded: (id) =>
        set((state) => ({
          expandedFolderIds: state.expandedFolderIds.includes(id)
            ? state.expandedFolderIds.filter((f) => f !== id)
            : [...state.expandedFolderIds, id],
        })),
      setSelectedItemId: (id) => set({ selectedItemId: id }),
      setEditingItemId: (id) => set({ editingItemId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSort: (key, order) => set({ sortKey: key, sortOrder: order }),
    }),
    {
      name: 'nexa-storage',
      storage: idbStorage,
      partialize: (state) => ({
        bookmarkFile: state.bookmarkFile,
        activeFolderId: state.activeFolderId,
        selectedItemId: state.selectedItemId,
        editingItemId: state.editingItemId,
        searchQuery: state.searchQuery,
        sortKey: state.sortKey,
        sortOrder: state.sortOrder,
        isSidebarOpen: state.isSidebarOpen,
        expandedFolderIds: state.expandedFolderIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

const useAppStore = createSelectors(useAppStoreBase)

export default useAppStore