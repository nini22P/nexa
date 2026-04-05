import { create } from 'zustand'
import type { BookmarkNode, BookmarkStore } from '../types'
import parseBookmarkHtml from '../utils/parseBookmarkHtml'
import generateBookmarkHtml from '../utils/generateBookmarkHtml'
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
        const bookmarkNodes = parseBookmarkHtml(content)
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

        const emptyData: Record<string, BookmarkNode> = {}
        const initialHtml = generateBookmarkHtml(emptyData)

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

        const newHtml = generateBookmarkHtml(bookmarkNodes)

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
          const bookmarkNodes = parseBookmarkHtml(content)
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

      const id = crypto.randomUUID()
      const now = Date.now().toString()
      const node: BookmarkNode =
        type === 'folder'
          ? {
            id,
            parentId,
            type: 'folder',
            title: '新文件夹',
            addDate: now,
            lastModified: now,
          }
          : {
            id,
            parentId,
            type: 'link',
            title: '新书签',
            href: 'https://',
            addDate: now,
            lastModified: now,
          }

      const newBookmarkNodes = { ...bookmarkNodes, [id]: node }

      set({
        bookmarkNodes: newBookmarkNodes,
        hasUnsavedChanges: true,
      })
      return node
    },

    updateItem: (id, updates) => {
      const { bookmarkNodes } = get()
      if (!bookmarkNodes || !bookmarkNodes[id]) return

      const newBookmarkNodes = {
        ...bookmarkNodes,
        [id]: {
          ...bookmarkNodes[id],
          ...updates,
          lastModified: Date.now().toString(),
        },
      }
      set({
        bookmarkNodes: newBookmarkNodes,
        hasUnsavedChanges: true,
      })
    },

    deleteItem: (id) => {
      const { bookmarkFile, selectedItemId, activeFolderId } = useAppStore.getState()
      const { bookmarkNodes } = get()
      if (!bookmarkFile || !bookmarkNodes || !bookmarkNodes[id]) return

      const newBookmarkNodes = { ...bookmarkNodes }

      const recursiveDelete = (targetId: string) => {
        const childrenIds = Object.values(newBookmarkNodes)
          .filter((node) => node.parentId === targetId)
          .map((node) => node.id)

        childrenIds.forEach((childId) => recursiveDelete(childId))
        delete newBookmarkNodes[targetId]
      }

      recursiveDelete(id)

      set({
        bookmarkNodes: newBookmarkNodes,
        hasUnsavedChanges: true,
      })

      useAppStore.setState({
        selectedItemId: selectedItemId === id ? null : selectedItemId,
        activeFolderId: activeFolderId === id ? null : activeFolderId,
      })
    },

    moveItem: (activeId: string, overId: string) => {
      const { bookmarkNodes } = get()
      if (!bookmarkNodes) return

      const keys = Object.keys(bookmarkNodes)
      const oldIndex = keys.indexOf(activeId)
      const newIndex = keys.indexOf(overId)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const newKeys = [...keys]
      const [moved] = newKeys.splice(oldIndex, 1)
      newKeys.splice(newIndex, 0, moved)

      const newBookmarkNodes: Record<string, BookmarkNode> = {}
      newKeys.forEach((key) => {
        newBookmarkNodes[key] = bookmarkNodes[key]
      })

      set({
        bookmarkNodes: newBookmarkNodes,
        hasUnsavedChanges: true,
      })
    },
  }
  ),
)

const useBookmarkStore = createSelectors(useBookmarkStoreBase)

export default useBookmarkStore
