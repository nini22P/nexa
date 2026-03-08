import useBookmarkStore from '../store/useBookmarkStore'

export interface FolderTreeItemProps {
  nodeId: string;
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  level?: number;
}

export default function FolderTreeItem({
  nodeId,
  activeFolderId,
  onSelectFolder,
  level = 0,
}: FolderTreeItemProps) {
  const node = useBookmarkStore((state) => state.bookmarkFile?.data[nodeId])
  const allData = useBookmarkStore((state) => state.bookmarkFile?.data || {})

  const { expandedFolderIds, toggleFolderExpanded, setSidebarOpen } =
    useBookmarkStore()

  if (!node || node.type !== 'folder') return null

  const isExpanded = expandedFolderIds.includes(nodeId)
  const isActive = activeFolderId === nodeId

  const handleSelect = () => {
    onSelectFolder(nodeId)
    setSidebarOpen(false)
  }

  const folderChildrenIds = (node.childrenIds || []).filter(
    (childId) => allData[childId]?.type === 'folder',
  )
  const hasFolderChildren = folderChildrenIds.length > 0

  return (
    <div className="select-none">
      <button
        className={`w-full flex items-center gap-2 py-1.5 rounded-lg text-sm transition-all group ${isActive
            ? 'bg-slate-200 text-slate-900 font-semibold'
            : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
          }`}
        style={{ paddingLeft: `${level * 12 + 8}px`, paddingRight: '8px' }}
        onClick={handleSelect}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${hasFolderChildren ? 'opacity-100' : 'opacity-0'}`}
          onClick={(e) => {
            if (hasFolderChildren) {
              e.stopPropagation()
              toggleFolderExpanded(nodeId)
            }
          }}
        >
          <i className="material-symbols-outlined text-base">chevron_right</i>
        </span>
        <i
          className={`material-symbols-outlined text-lg ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}
        >
          {isExpanded ? 'folder_open' : 'folder'}
        </i>
        <span className="flex-1 truncate text-left">{node.title}</span>
      </button>

      {isExpanded && hasFolderChildren && (
        <div className="mt-0.5">
          {folderChildrenIds.map((childId) => (
            <FolderTreeItem
              key={childId}
              nodeId={childId}
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
