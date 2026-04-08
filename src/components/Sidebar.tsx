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
import type { BookmarkNode } from '@/lib/bookmark/types'

interface FolderTreeNodeProps {
  nodes: BookmarkNode[]
  allNodes: Record<string, BookmarkNode>
  level?: number
  parentPath?: boolean[]
  isOverExpanderRef: React.MutableRefObject<boolean>
}

function FolderTreeNode({ nodes, allNodes, level = 0, parentPath = [], isOverExpanderRef }: FolderTreeNodeProps) {
  return (
    <>
      {nodes.map((node, index) => {
        const children = Object.values(allNodes).filter(
          (child) => child.parentId === node.id && child.type === 'folder'
        )
        const hasChildren = children.length > 0
        const isNodeLast = index === nodes.length - 1

        return (
          <TreeNode
            key={node.id}
            nodeId={node.id}
            level={level}
            isLast={isNodeLast}
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
              <TreeLabel>{node.title}</TreeLabel>
            </TreeNodeTrigger>
            {hasChildren && (
              <TreeNodeContent hasChildren={hasChildren}>
                <FolderTreeNode
                  nodes={children}
                  allNodes={allNodes}
                  level={level + 1}
                  parentPath={[...parentPath, isNodeLast]}
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

  const bookmarkNodes = useBookmarkStore.use.bookmarkNodes()
  const isOverExpanderRef = useRef(false)

  if (!bookmarkFile || !bookmarkNodes) return null

  const rootFolders = Object.values(bookmarkNodes).filter(
    (node) => node.parentId === null && node.type === 'folder'
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
              nodes={rootFolders}
              allNodes={bookmarkNodes}
              isOverExpanderRef={isOverExpanderRef}
            />
          </TreeView>
        </TreeProvider>
      </div>
    </aside>
  )
}
