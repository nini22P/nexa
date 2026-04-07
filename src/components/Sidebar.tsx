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
import type { BookmarkNode } from '../types'

interface RecursiveFolderTreeProps {
  nodes: BookmarkNode[]
  allNodes: Record<string, BookmarkNode>
  level?: number
  parentPath?: boolean[]
}

function RecursiveFolderTree({ nodes, allNodes, level = 0,  parentPath = [] }: RecursiveFolderTreeProps) {
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
            <TreeNodeTrigger>
              <TreeExpander hasChildren={hasChildren} />
              <TreeIcon hasChildren={hasChildren} icon={hasChildren ? undefined : <Folder className="size-4" />} />
              <TreeLabel>{node.title}</TreeLabel>
            </TreeNodeTrigger>
            {hasChildren && (
              <TreeNodeContent hasChildren={hasChildren}>
                <RecursiveFolderTree
                  nodes={children}
                  allNodes={allNodes}
                  level={level + 1}
                  parentPath={[...parentPath, isNodeLast]}
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

  if (!bookmarkFile || !bookmarkNodes) return null

  const rootFolders = Object.values(bookmarkNodes).filter(
    (node) => node.parentId === null && node.type === 'folder'
  )

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
          onExpandedChange={setExpandedFolderIds}
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
            <RecursiveFolderTree
              nodes={rootFolders}
              allNodes={bookmarkNodes}
            />
          </TreeView>
        </TreeProvider>
      </div>
    </aside>
  )
}
