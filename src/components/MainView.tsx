import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import useBookmarkStore from '../store/useBookmarkStore'
import type { BookmarkNode } from '../types'
import BookmarkItem, { BookmarkCard } from './BookmarkItem'
import useAppStore from '../store/useAppStore'
import { useMemo } from 'react'
import { Folder } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb'

export default function MainView() {
  const bookmarkFile = useAppStore.use.bookmarkFile()
  const activeFolderId = useAppStore.use.activeFolderId()
  const searchQuery = useAppStore.use.searchQuery()
  const sortKey = useAppStore.use.sortKey()
  const sortOrder = useAppStore.use.sortOrder()
  const setSelectedItemId = useAppStore.use.setSelectedItemId()
  const setEditingItemId = useAppStore.use.setEditingItemId()
  const setActiveFolderId = useAppStore.use.setActiveFolderId()

  const bookmarkNodes = useBookmarkStore.use.bookmarkNodes()
  const deleteItem = useBookmarkStore.use.deleteItem()
  const moveItem = useBookmarkStore.use.moveItem()

  const currentItems = useMemo(() => {
    let items: BookmarkNode[]
    const allNodes = Object.values(bookmarkNodes ?? [])

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
  }, [activeFolderId, bookmarkNodes, searchQuery, sortKey, sortOrder])

  const breadcrumbPath = useMemo(() => {
    if (!bookmarkNodes || !activeFolderId) return []
    const path: { id: string; title: string }[] = []
    let currentId: string | null = activeFolderId
    while (currentId) {
      const node: BookmarkNode | undefined = bookmarkNodes[currentId]
      if (node) {
        path.unshift({ id: node.id, title: node.title })
        currentId = node.parentId
      } else {
        break
      }
    }
    return path
  }, [bookmarkNodes, activeFolderId])

  if (!bookmarkFile || !bookmarkNodes) return null

  const isSearching = searchQuery.trim().length > 0
  const isDraggable = sortKey === 'none' && !isSearching

  const onItemClick = (item: BookmarkNode) => {
    setSelectedItemId(item.id)
    if (item.type === 'folder') {
      setActiveFolderId(item.id)
      setSelectedItemId(null)
    } else if (item.type === 'link') {
      window.open(item.href, '_blank')
    }
  }

  const getChildCount = (folderId: string) => {
    if (!bookmarkNodes) return 0
    return Object.values(bookmarkNodes).filter((n) => n.parentId === folderId).length
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 relative bg-background/50">
      <header className="flex-none px-4 py-2 flex flex-col gap-4 border-b bg-background/30 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => setActiveFolderId(null)}
                >
                  全部书签
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-1.5">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === breadcrumbPath.length - 1 ? (
                      <BreadcrumbPage className="font-semibold text-foreground">{folder.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className="cursor-pointer hover:text-foreground transition-colors max-w-40 truncate"
                        onClick={() => setActiveFolderId(folder.id)}
                      >
                        {folder.title}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            {currentItems.length} 个项目
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 animate-in fade-in duration-500">
            <Folder className="size-16 mb-6 stroke-[1]" />
            <p className="text-sm font-medium">这里没有任何项目</p>
          </div>
        ) : (
          <DragDropProvider
            onDragEnd={(event) => {
              const { operation, canceled } = event
              if (canceled) return

              const { source } = operation

              if (isSortable(source)) {
                const oldIndex = source.initialIndex
                const newIndex = source.index

                if (oldIndex !== newIndex) {
                  const activeId = currentItems[oldIndex].id
                  const overId = currentItems[newIndex].id

                  moveItem(activeId, overId)
                }
              }
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {currentItems.map((item, index) => (
                <BookmarkItem
                  key={item.id}
                  item={item}
                  index={index}
                  isDraggable={isDraggable}
                  childCount={item.type === 'folder' ? getChildCount(item.id) : 0}
                  onClick={onItemClick}
                  onEdit={setEditingItemId}
                  onDelete={deleteItem}
                />
              ))}
            </div>

            <DragOverlay>
              {(source) => {
                if (!source) return null
                const draggedItem = currentItems.find((i) => i.id === source.id)
                return draggedItem ? (
                  <BookmarkCard
                    item={draggedItem}
                    childCount={draggedItem.type === 'folder' ? getChildCount(draggedItem.id) : 0}
                    isOverlay
                  />
                ) : null
              }}
            </DragOverlay>
          </DragDropProvider>
        )}
      </div>
    </main>
  )
}