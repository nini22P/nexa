import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNodeContent,
} from './kibo-ui/tree'
import { Folder, Home } from 'lucide-react'
import useBookmarkStore from '../store/useBookmarkStore'
import useAppStore from '../store/useAppStore'
import { useRef } from 'react'
import type { BookmarkItem, BookmarkItems } from '@/lib/bookmark/types'

interface FolderTreeNodeProps {
  items: BookmarkItem[]
  allItems: BookmarkItems
  level?: number
  parentPath?: boolean[]
  isOverExpanderRef: React.MutableRefObject<boolean>
}

function FolderTreeNode({ items, allItems, level = 0, parentPath = [], isOverExpanderRef }: FolderTreeNodeProps) {
  return (
    <>
      {items.map((item, index) => {
        const children = Object.values(allItems).filter(
          (child) => child.parentId === item.id && child.type === 'folder'
        )
        const hasChildren = children.length > 0
        const isLast = index === items.length - 1

        return (
          <TreeNode
            key={item.id}
            nodeId={item.id}
            level={level}
            isLast={isLast}
            parentPath={parentPath}
          >
            <TreeNodeTrigger onPointerDown={() => { isOverExpanderRef.current = false }}>
              <TreeExpander
                hasChildren={hasChildren}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  isOverExpanderRef.current = true
                }}
              />
              <TreeIcon hasChildren={hasChildren} icon={hasChildren ? undefined : <Folder className="size-4" />} />
              <TreeLabel>{item.title}</TreeLabel>
            </TreeNodeTrigger>
            {hasChildren && (
              <TreeNodeContent hasChildren={hasChildren}>
                <FolderTreeNode
                  items={children}
                  allItems={allItems}
                  level={level + 1}
                  parentPath={[...parentPath, isLast]}
                  isOverExpanderRef={isOverExpanderRef}
                />
              </TreeNodeContent>
            )}
          </TreeNode>
        )
      })}
    </>
  )
}
export default function Sidebar() {
  const bookmarkFile = useAppStore.use.bookmarkFile()
  const activeFolderId = useAppStore.use.activeFolderId()
  const expandedFolderIds = useAppStore.use.expandedFolderIds()
  const isSidebarOpen = useAppStore.use.isSidebarOpen()
  const setActiveFolderId = useAppStore.use.setActiveFolderId()
  const setSidebarOpen = useAppStore.use.setSidebarOpen()
  const setExpandedFolderIds = useAppStore.use.setExpandedFolderIds()

  const bookmarkItems = useBookmarkStore.use.bookmarkItems()
  const isOverExpanderRef = useRef(false)

  if (!bookmarkFile || !bookmarkItems) return null

  const rootFolders = Object.values(bookmarkItems).filter(
    (item) => item.parentId === null && item.type === 'folder'
  )

  const handleExpandedChange = (newIds: string[]) => {
    const isCollapsing = newIds.length < expandedFolderIds.length

    if (isCollapsing && !isOverExpanderRef.current) {
      const addedIds = newIds.filter(id => !expandedFolderIds.includes(id))
      setExpandedFolderIds([...expandedFolderIds, ...addedIds])
    } else {
      setExpandedFolderIds(newIds)
    }
  }

  return (
    <aside
      className={`
            fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-background text-foreground border-r
            transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
            ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}
        `}
    >
      <div className="flex-1 overflow-y-auto">
        <TreeProvider
          selectedIds={activeFolderId ? [activeFolderId] : ['all-bookmarks']}
          onSelectionChange={(ids) => {
            if (ids.length > 0) {
              setActiveFolderId(ids[0] === 'all-bookmarks' ? null : ids[0])
              setSidebarOpen(false)
            }
          }}
          expandedIds={expandedFolderIds}
          onExpandedChange={handleExpandedChange}
          showLines={true}
          indent={16}
        >
          <TreeView>
            <TreeNode nodeId="all-bookmarks">
              <TreeNodeTrigger>
                <TreeIcon icon={<Home className="size-4" />} />
                <TreeLabel>全部书签</TreeLabel>
              </TreeNodeTrigger>
            </TreeNode>
            <FolderTreeNode
              items={rootFolders}
              allItems={bookmarkItems}
              isOverExpanderRef={isOverExpanderRef}
            />
          </TreeView>
        </TreeProvider>
      </div>
    </aside>
  )
}
