import { create } from 'zustand'
import type { BookmarkStore } from '../types'
import {
  BookmarkHTML,
  BookmarkCore,
  type BookmarkNodes
} from '../lib/bookmark'
import createSelectors from './createSelectors'
import useAppStore from './useAppStore'
import { getFileStorageAdapter } from '../storage'

const useBookmarkStoreBase = create<BookmarkStore>()(
  (set, get) => ({
    bookmarkNodes: null,
    lastModified: null,
    isSaving: false,
    hasUnsavedChanges: false,

    openFile: async () => {
      try {
        const adapter = getFileStorageAdapter()
        const storageFile = await adapter.openFile()
        if (!storageFile) return

        const content = await adapter.readFile(storageFile)
        const bookmarkNodes = BookmarkHTML.parse(content)
        const lastModified = await adapter.getModifiedTime(storageFile)

        set({
          bookmarkNodes,
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

        const emptyData: BookmarkNodes = {}
        const initialHtml = BookmarkHTML.generate(emptyData)

        set({ isSaving: true })
        await adapter.saveFile(storageFile, initialHtml)
        set({ isSaving: false })

        const lastModified = await adapter.getModifiedTime(storageFile)

        set({
          bookmarkNodes: emptyData,
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
      const { bookmarkNodes, lastModified } = get()

      if (!bookmarkFile || !bookmarkNodes || !lastModified) return

      try {
        const adapter = getFileStorageAdapter()
        if (!(await adapter.verifyPermission(bookmarkFile, 'readwrite')))
          return

        const currentModified = await adapter.getModifiedTime(bookmarkFile)

        if (currentModified > lastModified) {
          if (!window.confirm('文件已在外部被修改，是否覆盖？')) return
        }

        const newHtml = BookmarkHTML.generate(bookmarkNodes)

        set({ isSaving: true })
        await adapter.saveFile(bookmarkFile, newHtml)

        const finalModified = await adapter.getModifiedTime(bookmarkFile)

        set({
          bookmarkNodes,
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
      const { bookmarkNodes, hasUnsavedChanges } = get()
      if (!bookmarkFile || !bookmarkNodes) return

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
          const bookmarkNodes = BookmarkHTML.parse(content)
          set({
            bookmarkNodes,
            lastModified: currentModified,
          })
          console.log('[Sync] 内容已更新')
        }
      } catch (e) {
        console.warn('Sync failed:', e)
      }
    },

    addItem: (type, parentId) => {
      const { bookmarkNodes } = get()
      if (!bookmarkNodes) return null

      const { nodes, newNode } = BookmarkCore.add(bookmarkNodes, type, parentId)

      set({
        bookmarkNodes: nodes,
        hasUnsavedChanges: true,
      })
      return newNode
    },

    updateItem: (id, updates) => {
      const { bookmarkNodes } = get()
      if (!bookmarkNodes) return

      const nodes = BookmarkCore.update(bookmarkNodes, id, updates)

      set({
        bookmarkNodes: nodes,
        hasUnsavedChanges: true,
      })
    },

    deleteItem: (id) => {
      const { bookmarkNodes } = get()
      if (!bookmarkNodes) return

      const nodes = BookmarkCore.delete(bookmarkNodes, id)

      set({
        bookmarkNodes: nodes,
        hasUnsavedChanges: true,
      })

      const { selectedItemId, activeFolderId } = useAppStore.getState()
      useAppStore.setState({
        selectedItemId: selectedItemId === id ? null : selectedItemId,
        activeFolderId: activeFolderId === id ? null : activeFolderId,
      })
    },

    moveItem: (activeId, overId) => {
      const { bookmarkNodes } = get()
      if (!bookmarkNodes) return

      const nodes = BookmarkCore.move(bookmarkNodes, activeId, overId)

      set({
        bookmarkNodes: nodes,
        hasUnsavedChanges: true,
      })
    },
  })
)

const useBookmarkStore = createSelectors(useBookmarkStoreBase)

export default useBookmarkStore
