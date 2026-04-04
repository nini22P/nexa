import { create } from 'zustand'
import type { BookmarkNode, BookmarkStore } from '../types'
import parseBookmarkHtml from '../utils/parseBookmarkHtml'
import generateBookmarkHtml from '../utils/generateBookmarkHtml'
import createSelectors from './createSelectors'
import useAppStore from './useAppStore'

const normalize = (str: string) => (str || '').replace(/\r\n/g, '\n').trim()

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
    lastSavedData: null,
    lastSavedHtml: null,

    setBookmarkNodes: (bookmarkNodes) =>
      set((state) => {
        if (!state.bookmarkNodes) return state
        return {
          bookmarkNodes,
        }
      }),

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
        const data = parseBookmarkHtml(content)

        set({
          bookmarkNodes: data,
          lastSavedData: JSON.stringify(data),
          lastSavedHtml: content,
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

        const writable = await handle.createWritable()
        await writable.write(initialHtml)
        await writable.close()

        const file = await handle.getFile()

        set({
          bookmarkNodes: emptyData,
          lastSavedData: JSON.stringify(emptyData),
          lastSavedHtml: initialHtml,
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
      const { bookmarkNodes, lastSavedHtml } = get()

      if (!bookmarkFile || !bookmarkNodes || !lastSavedHtml) return

      try {
        if (!(await verifyPermission(bookmarkFile.handle, 'readwrite')))
          return

        const fileOnDisk = await bookmarkFile.handle.getFile()
        const contentOnDisk = await fileOnDisk.text()
        if (
          normalize(contentOnDisk) !== normalize(lastSavedHtml)
        ) {
          if (!window.confirm('文件已在外部被修改，是否覆盖？')) return
        }

        const newHtml = generateBookmarkHtml(bookmarkNodes)
        const writable = await bookmarkFile.handle.createWritable()
        await writable.write(newHtml)
        await writable.close()

        set({
          bookmarkNodes,
          lastSavedData: JSON.stringify(bookmarkNodes),
          lastSavedHtml: newHtml,
        })
      } catch (e) {
        console.error('Save failed:', e)
        alert('保存失败: ' + (e as Error).message)
      }
    },

    closeFile: () => {
      const { bookmarkFile } = useAppStore.getState()
      const { bookmarkNodes, lastSavedData } = get()
      if (!bookmarkFile || !bookmarkNodes || !lastSavedData) return

      const isDirty =
        normalize(JSON.stringify(bookmarkNodes)) !== normalize(lastSavedData)
      if (isDirty) {
        if (!window.confirm('您有未保存的更改，确定要关闭吗？')) {
          return
        }
      }

      set({
        lastSavedData: null,
        lastSavedHtml: null,
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
      const { lastSavedData } = get()

      if (!bookmarkFile || !bookmarkFile.handle) return
      try {
        if (typeof bookmarkFile.handle.queryPermission !== 'function') {
          console.warn('Handle is not valid, possibly serialization issue.')
          return
        }

        if ((await bookmarkFile.handle.queryPermission({ mode: 'read' })) !== 'granted')
          return

        const file = await bookmarkFile.handle.getFile()
        const content = await file.text()
        const data = parseBookmarkHtml(content)
        const diskDataStr = JSON.stringify(data)

        if (diskDataStr !== lastSavedData) {
          const isUserDirty = normalize(diskDataStr) !== normalize(lastSavedData ?? '')
          if (!isUserDirty || !lastSavedData) {
            set({
              bookmarkNodes: data,
              lastSavedData: diskDataStr,
              lastSavedHtml: content,
            })
            console.log('[Sync] 内容已更新')
          }
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
      const newItem: BookmarkNode =
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

      const newData = { ...bookmarkNodes, [id]: newItem }

      set({ bookmarkNodes: newData })
      return newItem
    },

    updateItem: (id, updates) => {
      const { bookmarkNodes } = get()
      if (!bookmarkNodes || !bookmarkNodes[id]) return

      const newData = {
        ...bookmarkNodes,
        [id]: {
          ...bookmarkNodes[id],
          ...updates,
          lastModified: Date.now().toString(),
        },
      }
      set({ bookmarkNodes: newData })
    },

    deleteItem: (id) => {
      const { bookmarkFile, selectedItemId, activeFolderId } = useAppStore.getState()
      const { bookmarkNodes } = get()
      if (!bookmarkFile || !bookmarkNodes || !bookmarkNodes[id]) return

      const newData = { ...bookmarkNodes }

      const recursiveDelete = (targetId: string) => {
        const childrenIds = Object.values(newData)
          .filter((node) => node.parentId === targetId)
          .map((node) => node.id)

        childrenIds.forEach((childId) => recursiveDelete(childId))
        delete newData[targetId]
      }

      recursiveDelete(id)

      set({
        bookmarkNodes: newData,
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

      const newData: Record<string, BookmarkNode> = {}
      newKeys.forEach((key) => {
        newData[key] = bookmarkNodes[key]
      })

      set({
        bookmarkNodes: newData,
      })
    },
  }
  ),
)

const useBookmarkStore = createSelectors(useBookmarkStoreBase)

export default useBookmarkStore