import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BookmarkNode, BookmarkStore } from '../types'
import parseBookmarkHtml from '../utils/parseBookmarkHtml'
import generateBookmarkHtml from '../utils/generateBookmarkHtml'
import idbStorage from './idbStorage'

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

const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      bookmarkFile: null,
      activeFolderId: null,
      selectedItemId: null,
      editingItemId: null,
      searchQuery: '',
      sortKey: 'none',
      sortOrder: 'asc',
      isSidebarOpen: false,
      expandedFolderIds: [],

      setBookmarkFile: (file) => set({ bookmarkFile: file }),
      updateBookmarkData: (newData) =>
        set((state) => {
          if (!state.bookmarkFile) return state
          return {
            bookmarkFile: {
              ...state.bookmarkFile,
              data: newData,
            },
          }
        }),

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
            bookmarkFile: {
              path: handle.name,
              handle,
              data,
              lastSavedData: JSON.stringify(data),
              lastSavedHtml: content,
              fileName: file.name,
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
            bookmarkFile: {
              path: handle.name,
              handle,
              data: emptyData,
              lastSavedData: JSON.stringify(emptyData),
              lastSavedHtml: initialHtml,
              fileName: file.name,
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
        const { bookmarkFile } = get()
        if (!bookmarkFile) return

        try {
          if (!(await verifyPermission(bookmarkFile.handle, 'readwrite')))
            return

          const fileOnDisk = await bookmarkFile.handle.getFile()
          const contentOnDisk = await fileOnDisk.text()
          if (
            normalize(contentOnDisk) !== normalize(bookmarkFile.lastSavedHtml)
          ) {
            if (!window.confirm('文件已在外部被修改，是否覆盖？')) return
          }

          const newHtml = generateBookmarkHtml(bookmarkFile.data)
          const writable = await bookmarkFile.handle.createWritable()
          await writable.write(newHtml)
          await writable.close()
          set({
            bookmarkFile: {
              ...bookmarkFile,
              lastSavedData: JSON.stringify(bookmarkFile.data),
              lastSavedHtml: newHtml,
            },
          })
          // alert('保存成功')
        } catch (e) {
          console.error('Save failed:', e)
          alert('保存失败: ' + (e as Error).message)
        }
      },

      closeFile: () => {
        const { bookmarkFile } = get()
        if (!bookmarkFile) return

        const isDirty =
          normalize(JSON.stringify(bookmarkFile.data)) !==
          normalize(bookmarkFile.lastSavedData)
        if (isDirty) {
          if (!window.confirm('您有未保存的更改，确定要关闭吗？')) {
            return
          }
        }

        set({
          bookmarkFile: null,
          activeFolderId: null,
          selectedItemId: null,
          editingItemId: null,
          searchQuery: '',
          expandedFolderIds: [],
        })
      },

      syncWithDisk: async () => {
        const { bookmarkFile } = get()
        if (!bookmarkFile || !bookmarkFile.handle) return
        try {
          if (typeof bookmarkFile.handle.queryPermission !== 'function') {
            console.warn('Handle is not valid, possibly serialization issue.')
            return
          }

          if (
            (await bookmarkFile.handle.queryPermission({ mode: 'read' })) !==
            'granted'
          )
            return

          const file = await bookmarkFile.handle.getFile()
          const content = await file.text()
          const data = parseBookmarkHtml(content)
          const diskDataStr = JSON.stringify(data)

          if (diskDataStr !== bookmarkFile.lastSavedData) {
            const isUserDirty =
              normalize(JSON.stringify(bookmarkFile.data)) !==
              normalize(bookmarkFile.lastSavedData)
            if (!isUserDirty) {
              set({
                bookmarkFile: {
                  ...bookmarkFile,
                  data,
                  lastSavedData: diskDataStr,
                  lastSavedHtml: content,
                },
              })
              console.log('[Sync 内容已更新')
            }
          }
        } catch (e) {
          console.warn('Sync failed:', e)
        }
      },

      addItem: (type, parentId) => {
        const { bookmarkFile } = get()
        if (!bookmarkFile) return null

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
              childrenIds: [],
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

        const newData = { ...bookmarkFile.data, [id]: newItem }

        if (parentId && newData[parentId]) {
          newData[parentId] = {
            ...newData[parentId],
            childrenIds: [...(newData[parentId].childrenIds || []), id],
          }
        }

        set({ bookmarkFile: { ...bookmarkFile, data: newData } })
        return newItem
      },

      updateItem: (id, updates) => {
        const { bookmarkFile } = get()
        if (!bookmarkFile || !bookmarkFile.data[id]) return

        const newData = {
          ...bookmarkFile.data,
          [id]: {
            ...bookmarkFile.data[id],
            ...updates,
            lastModified: Date.now().toString(),
          },
        }
        set({ bookmarkFile: { ...bookmarkFile, data: newData } })
      },

      deleteItem: (id) => {
        const { bookmarkFile, selectedItemId, activeFolderId } = get()
        if (!bookmarkFile || !bookmarkFile.data[id]) return

        const newData = { ...bookmarkFile.data }
        const nodeToDelete = newData[id]

        if (nodeToDelete.parentId && newData[nodeToDelete.parentId]) {
          newData[nodeToDelete.parentId] = {
            ...newData[nodeToDelete.parentId],
            childrenIds: newData[nodeToDelete.parentId].childrenIds?.filter(
              (childId) => childId !== id,
            ),
          }
        }

        const recursiveDelete = (targetId: string) => {
          const node = newData[targetId]
          if (node?.type === 'folder' && node.childrenIds) {
            node.childrenIds.forEach((childId) => recursiveDelete(childId))
          }
          delete newData[targetId]
        }
        recursiveDelete(id)

        set({
          bookmarkFile: { ...bookmarkFile, data: newData },
          selectedItemId: selectedItemId === id ? null : selectedItemId,
          activeFolderId: activeFolderId === id ? null : activeFolderId,
        })
      },

      getCurrentItems: () => {
        const {
          bookmarkFile,
          activeFolderId,
          searchQuery,
          sortKey,
          sortOrder,
        } = get()
        if (!bookmarkFile) return []

        let items: BookmarkNode[] = []
        const allNodes = Object.values(bookmarkFile.data)

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          items = allNodes.filter(
            (node) =>
              node.title.toLowerCase().includes(q) ||
              (node.type === 'link' && node.href?.toLowerCase().includes(q)),
          )
        } else {
          items = allNodes.filter((node) => node.parentId === activeFolderId)
        }

        if (!sortKey || sortKey === 'none') return items

        return [...items].sort((a, b) => {
          const valA = (a[sortKey as keyof BookmarkNode] || '')
            .toString()
            .toLowerCase()
          const valB = (b[sortKey as keyof BookmarkNode] || '')
            .toString()
            .toLowerCase()
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1
          return 0
        })
      },
    }),
    {
      name: 'nexa-storage',
      storage: idbStorage,
      partialize: (state) => ({
        bookmarkFile: state.bookmarkFile,
        activeFolderId: state.activeFolderId,
        expandedFolderIds: state.expandedFolderIds,
        sortKey: state.sortKey,
        sortOrder: state.sortOrder,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

export default useBookmarkStore
