import { create } from 'zustand'
import type { BookmarkStore } from '../types'
import {
  BookmarkHTML,
  BookmarkCore,
  type BookmarkItems
} from '../lib/bookmark'
import createSelectors from './createSelectors'
import useAppStore from './useAppStore'
import { getFileStorageAdapter } from '../storage'

const useBookmarkStoreBase = create<BookmarkStore>()(
  (set, get) => ({
    bookmarkItems: null,
    lastModified: null,
    isSaving: false,
    hasUnsavedChanges: false,

    openFile: async () => {
      try {
        const adapter = getFileStorageAdapter()
        const storageFile = await adapter.openFile()
        if (!storageFile) return

        const content = await adapter.readFile(storageFile)
        const bookmarkItems = BookmarkHTML.parse(content)
        const lastModified = await adapter.getModifiedTime(storageFile)

        set({
          bookmarkItems,
          lastModified,
        })

        useAppStore.setState({
          bookmarkFile: storageFile,
          activeFolderId: null,
          selectedItemId: null,
        })
      } catch (e) {
        console.error('Open file failed:', e)
      }
    },

    newFile: async () => {
      try {
        const adapter = getFileStorageAdapter()
        const storageFile = await adapter.newFile('bookmarks.html')
        if (!storageFile) return

        const emptyData: BookmarkItems = {}
        const initialHtml = BookmarkHTML.generate(emptyData)

        set({ isSaving: true })
        await adapter.saveFile(storageFile, initialHtml)
        set({ isSaving: false })

        const lastModified = await adapter.getModifiedTime(storageFile)

        set({
          bookmarkItems: emptyData,
          lastModified,
        })

        useAppStore.setState({
          bookmarkFile: storageFile,
          activeFolderId: null,
          selectedItemId: null,
        })
      } catch (e) {
        console.error('Create file failed:', e)
      }
    },

    saveFile: async () => {
      const { bookmarkFile } = useAppStore.getState()
      const { bookmarkItems, lastModified } = get()

      if (!bookmarkFile || !bookmarkItems || !lastModified) return

      try {
        const adapter = getFileStorageAdapter()
        if (!(await adapter.verifyPermission(bookmarkFile, 'readwrite')))
          return

        const currentModified = await adapter.getModifiedTime(bookmarkFile)

        if (currentModified > lastModified) {
          if (!window.confirm('文件已在外部被修改，是否覆盖？')) return
        }

        const newHtml = BookmarkHTML.generate(bookmarkItems)

        set({ isSaving: true })
        await adapter.saveFile(bookmarkFile, newHtml)

        const finalModified = await adapter.getModifiedTime(bookmarkFile)

        set({
          bookmarkItems,
          lastModified: finalModified,
          isSaving: false,
          hasUnsavedChanges: false,
        })
      } catch (e) {
        console.error('Save failed:', e)
        alert('保存失败: ' + (e as Error).message)
      }
    },

    closeFile: async () => {
      const { bookmarkFile } = useAppStore.getState()
      const { bookmarkItems, hasUnsavedChanges } = get()
      if (!bookmarkFile || !bookmarkItems) return

      if (hasUnsavedChanges) {
        if (!window.confirm('您有未保存的更改，确定要关闭吗？')) {
          return
        }
      }

      set({
        lastModified: null,
        hasUnsavedChanges: false,
      })

      useAppStore.setState({
        bookmarkFile: null,
        activeFolderId: null,
        selectedItemId: null,
        editingItemId: null,
        searchQuery: '',
        expandedFolderIds: [],
      })
    },

    syncWithDisk: async () => {
      const { bookmarkFile } = useAppStore.getState()
      const { lastModified, isSaving, hasUnsavedChanges } = get()

      if (!bookmarkFile || isSaving || hasUnsavedChanges) return

      try {
        const adapter = getFileStorageAdapter()
        if (!(await adapter.verifyPermission(bookmarkFile, 'read')))
          return

        const currentModified = await adapter.getModifiedTime(bookmarkFile)

        if (!lastModified || currentModified > lastModified) {
          const content = await adapter.readFile(bookmarkFile)
          const bookmarkItems = BookmarkHTML.parse(content)
          set({
            bookmarkItems,
            lastModified: currentModified,
          })
          console.log('[Sync] 内容已更新')
        }
      } catch (e) {
        console.warn('Sync failed:', e)
      }
    },

    addItem: (type, parentId) => {
      const { bookmarkItems } = get()
      if (!bookmarkItems) return null

      const { items, item } = BookmarkCore.add(bookmarkItems, type, parentId)

      set({
        bookmarkItems: items,
        hasUnsavedChanges: true,
      })
      return item
    },

    updateItem: (id, updates) => {
      const { bookmarkItems } = get()
      if (!bookmarkItems) return

      const items = BookmarkCore.update(bookmarkItems, id, updates)

      set({
        bookmarkItems: items,
        hasUnsavedChanges: true,
      })
    },

    deleteItem: (id) => {
      const { bookmarkItems } = get()
      if (!bookmarkItems) return

      const items = BookmarkCore.delete(bookmarkItems, id)

      set({
        bookmarkItems: items,
        hasUnsavedChanges: true,
      })

      const { selectedItemId, activeFolderId } = useAppStore.getState()
      useAppStore.setState({
        selectedItemId: selectedItemId === id ? null : selectedItemId,
        activeFolderId: activeFolderId === id ? null : activeFolderId,
      })
    },

    moveItem: (id, target) => {
      const { bookmarkItems } = get()
      if (!bookmarkItems) return

      const items = BookmarkCore.move(bookmarkItems, id, target)

      set({
        bookmarkItems: items,
        hasUnsavedChanges: true,
      })
    },
  })
)

const useBookmarkStore = createSelectors(useBookmarkStoreBase)

export default useBookmarkStore
