import { create } from 'zustand'
import type { BookmarkNode, BookmarkStore } from '../types'
import parseBookmarkHtml from '../utils/parseBookmarkHtml'
import generateBookmarkHtml from '../utils/generateBookmarkHtml'
import createSelectors from './createSelectors'
import useAppStore from './useAppStore'

const verifyPermission = async (
  handle: FileSystemHandle,
  mode: 'read' | 'readwrite' = 'read',
) => {
  if (!handle || typeof handle.queryPermission !== 'function') return false
  if ((await handle.queryPermission({ mode })) === 'granted') return true
  if ((await handle.requestPermission({ mode })) === 'granted') return true
  return false
}

const useBookmarkStoreBase = create<BookmarkStore>()(
  (set, get) => ({
    bookmarkNodes: null,
    lastModified: null,
    isSaving: false,
    hasUnsavedChanges: false,

    openFile: async () => {
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
        if (!handle) return

        const file = await handle.getFile()
        const content = await file.text()
        const bookmarkNodes = parseBookmarkHtml(content)

        set({
          bookmarkNodes,
          lastModified: file.lastModified,
        })

        useAppStore.setState({
          bookmarkFile: {
            fileName: file.name,
            path: handle.name,
            handle,
          },
          activeFolderId: null,
          selectedItemId: null,
        })
      } catch (e) {
        if ((e as Error).name !== 'AbortError')
          console.error('Open file failed:', e)
      }
    },

    newFile: async () => {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'bookmarks.html',
          types: [
            {
              description: 'HTML Bookmarks',
              accept: { 'text/html': ['.html'] },
            },
          ],
        })

        const emptyData: Record<string, BookmarkNode> = {}
        const initialHtml = generateBookmarkHtml(emptyData)

        set({ isSaving: true })

        const writable = await handle.createWritable()
        await writable.write(initialHtml)
        await writable.close()

        set({ isSaving: false })

        const file = await handle.getFile()

        set({
          bookmarkNodes: emptyData,
          lastModified: file.lastModified,
        })

        useAppStore.setState({
          bookmarkFile: {
            fileName: file.name,
            path: handle.name,
            handle,
          },
          activeFolderId: null,
          selectedItemId: null,
        })
      } catch (e) {
        if ((e as Error).name !== 'AbortError')
          console.error('Create file failed:', e)
      }
    },

    saveFile: async () => {
      const { bookmarkFile } = useAppStore.getState()
      const { bookmarkNodes, lastModified } = get()

      if (!bookmarkFile || !bookmarkNodes || !lastModified) return

      try {
        if (!(await verifyPermission(bookmarkFile.handle, 'readwrite')))
          return

        const handle = bookmarkFile.handle

        const file = await handle.getFile()

        if (file.lastModified > lastModified) {
          if (!window.confirm('文件已在外部被修改，是否覆盖？')) return
        }

        const newHtml = generateBookmarkHtml(bookmarkNodes)

        set({ isSaving: true })

        const writable = await handle.createWritable()
        await writable.write(newHtml)
        await writable.close()

        set({
          bookmarkNodes,
          lastModified: (await handle.getFile()).lastModified,
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

      if (!bookmarkFile || !bookmarkFile.handle || isSaving || hasUnsavedChanges) return

      const handle = bookmarkFile.handle

      try {
        if (!await verifyPermission(handle))
          return

        const file = await handle.getFile()
        const content = await file.text()
        const bookmarkNodes = parseBookmarkHtml(content)

        if (!lastModified || file.lastModified > lastModified) {
          set({
            bookmarkNodes,
            lastModified: file.lastModified,
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