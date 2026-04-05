import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import useBookmarkStore from '../store/useBookmarkStore'
import type { BookmarkNode } from '../types'
import BookmarkItem, { BookmarkCard } from './BookmarkItem'
import useAppStore from '../store/useAppStore'
import { useMemo } from 'react'
import { ArrowDown, ArrowUp, Bars, ChevronDown, Magnifier, Minus, Plus, Square, Xmark } from '@gravity-ui/icons'
import { ButtonGroup, Button, Dropdown, Label, InputGroup, Card } from '@heroui/react'
import { isDesktop } from '../utils/platform'

export default function MainView() {
  const bookmarkFile = useAppStore.use.bookmarkFile()
  const activeFolderId = useAppStore.use.activeFolderId()
  const searchQuery = useAppStore.use.searchQuery()
  const sortKey = useAppStore.use.sortKey()
  const sortOrder = useAppStore.use.sortOrder()
  const setSearchQuery = useAppStore.use.setSearchQuery()
  const setSort = useAppStore.use.setSort()
  const setSelectedItemId = useAppStore.use.setSelectedItemId()
  const setEditingItemId = useAppStore.use.setEditingItemId()
  const setActiveFolderId = useAppStore.use.setActiveFolderId()
  const setSidebarOpen = useAppStore.use.setSidebarOpen()

  const bookmarkNodes = useBookmarkStore.use.bookmarkNodes()
  const addItem = useBookmarkStore.use.addItem()
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

  if (!bookmarkFile || !bookmarkNodes) return null

  const isSearching = searchQuery.trim().length > 0

  const isDraggable = sortKey === 'none' && !isSearching

  const activeFolder = activeFolderId
    ? bookmarkNodes[activeFolderId]
    : null
  const activeFolderName = isSearching
    ? '搜索结果'
    : activeFolderId === null
      ? '全部书签'
      : activeFolder?.title || '未知文件夹'

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
    <main className="flex-1 flex flex-col min-w-0 shadow-sm ring-1 ring-slate-100 relative">
      <header className="drag flex-none p-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              variant='ghost'
              className="lg:hidden"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars />
            </Button>
            <h1 className="text-xl font-bold text-slate-900 truncate">
              {activeFolderName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <InputGroup className="no-drag w-full md:w-auto">
              <InputGroup.Prefix>
                <Magnifier className="size-4 text-muted" />
              </InputGroup.Prefix>
              <InputGroup.Input
                placeholder="搜索书签或网址..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <InputGroup.Suffix className='pr-0.75'>
                  <Button variant="ghost" isIconOnly size='sm' onClick={() => setSearchQuery('')}>
                    <Xmark className="size-4" />
                  </Button>
                </InputGroup.Suffix>
              )}
            </InputGroup>

            <ButtonGroup className='no-drag'>
              <Dropdown>
                <Button variant='tertiary' aria-label="More sorting options">
                  {
                    sortKey === 'title'
                      ? '名称'
                      : sortKey === 'href'
                        ? '网址'
                        : sortKey === 'addDate'
                          ? '日期'
                          : '默认'
                  }
                  {sortKey === 'none' ? <ChevronDown /> : sortOrder === 'asc' ? <ArrowDown /> : <ArrowUp />}
                </Button>
                <Dropdown.Popover className="max-w-72.5">
                  <Dropdown.Menu
                    selectedKeys={[sortKey || 'none']}
                    selectionMode="single"
                  >
                    <Dropdown.Item
                      id="none"
                      textValue="Sort by default"
                      onClick={() => setSort('none', sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <Dropdown.ItemIndicator />
                      <Label>默认</Label>
                    </Dropdown.Item>
                    <Dropdown.Item
                      id="title"
                      textValue="Sort by name"
                      onClick={() => setSort('title', sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <Dropdown.ItemIndicator>
                        {({ isSelected }) => (isSelected ? sortOrder === 'asc' ? <ArrowDown /> : <ArrowUp /> : null)}
                      </Dropdown.ItemIndicator>
                      <Label>名称</Label>
                    </Dropdown.Item>
                    <Dropdown.Item
                      id="href"
                      textValue="Sort by URL"
                      onClick={() => setSort('href', sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <Dropdown.ItemIndicator>
                        {({ isSelected }) => (isSelected ? sortOrder === 'asc' ? <ArrowDown /> : <ArrowUp /> : null)}
                      </Dropdown.ItemIndicator>
                      <Label>网址</Label>
                    </Dropdown.Item>
                    <Dropdown.Item
                      id="addDate"
                      textValue="Sort by date"
                      onClick={() => setSort('addDate', sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <Dropdown.ItemIndicator>
                        {({ isSelected }) => (isSelected ? sortOrder === 'asc' ? <ArrowDown /> : <ArrowUp /> : null)}
                      </Dropdown.ItemIndicator>
                      <Label>日期</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </ButtonGroup>

            <ButtonGroup className='no-drag'>
              <Button
                variant='tertiary'
                onClick={() => {
                  const newItem = addItem('link', activeFolderId)
                  if (newItem) setEditingItemId(newItem.id)
                }}
              >
                <Plus />
                新建书签
              </Button>
              <Dropdown>
                <Button isIconOnly variant='tertiary' aria-label="More options">
                  <ButtonGroup.Separator />
                  <ChevronDown />
                </Button>
                <Dropdown.Popover className="max-w-72.5">
                  <Dropdown.Menu>
                    <Dropdown.Item
                      id="create-bookmark"
                      textValue="Create a bookmark"
                      onClick={() => {
                        const newItem = addItem('link', activeFolderId)
                        if (newItem) setEditingItemId(newItem.id)
                      }}
                    >
                      <Label>新建书签</Label>
                    </Dropdown.Item>
                    <Dropdown.Item
                      id="create-folder"
                      textValue="Create a folder"
                      onClick={() => {
                        const newItem = addItem('folder', activeFolderId)
                        if (newItem) setEditingItemId(newItem.id)
                      }}
                    >
                      <Label>新建文件夹</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </ButtonGroup>

            {
              isDesktop && <div className="flex gap-1">
                <Button
                  isIconOnly
                  variant='ghost'
                  className='no-drag'
                  onClick={async () => {
                    const { getCurrentWindow } = await import('@tauri-apps/api/window')
                    const currentWindow = getCurrentWindow()
                    currentWindow.minimize()
                  }}
                >
                  <Minus />
                </Button>
                <Button
                  isIconOnly
                  variant='ghost'
                  className='no-drag'
                  onClick={async () => {
                    const { getCurrentWindow } = await import('@tauri-apps/api/window')
                    const currentWindow = getCurrentWindow()
                    currentWindow.toggleMaximize()
                  }}
                >
                  <Square />
                </Button>
                <Button
                  isIconOnly
                  variant='ghost'
                  className="no-drag hover:bg-danger hover:text-white"
                  onClick={async () => {
                    const { getCurrentWindow } = await import('@tauri-apps/api/window')
                    const currentWindow = getCurrentWindow()
                    currentWindow.close()
                  }}
                >
                  <Xmark />
                </Button>
              </div>
            }
          </div>
        </div>
      </header>

      <Card className="flex-1 overflow-y-auto m-3 mt-0">
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <i className="material-symbols-outlined text-6xl mb-4">explore_off</i>
            <p className="text-lg font-medium text-slate-400">这里没有任何项目</p>
          </div>
        ) : (
          <DragDropProvider
            onDragEnd={(event) => {
              const { operation, canceled } = event
              if (canceled) return

              const { source } = operation

              if (isSortable(source)) {
                const oldIndex = source.sortable.initialIndex
                const newIndex = source.sortable.index

                if (oldIndex !== newIndex) {
                  const activeId = currentItems[oldIndex].id
                  const overId = currentItems[newIndex].id

                  moveItem(activeId, overId)
                }
              }
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
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
      </Card>
    </main>
  )
}