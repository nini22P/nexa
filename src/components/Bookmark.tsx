import { useSortable } from '@dnd-kit/react/sortable'
import { getDynamicFavicon } from '../utils/favicon'
import type { BookmarkItem } from '@/lib/bookmark/types'

export function BookmarkCard({
  item,
  childCount,
  isOverlay = false,
  isDragging = false,
  isDraggable = false,
  onClick,
  onEdit,
  onDelete,
}: {
  item: BookmarkItem
  childCount: number
  isOverlay?: boolean
  isDragging?: boolean
  isDraggable?: boolean
  onClick?: (item: BookmarkItem) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  return (
    <article
      className={`
        p-3 rounded-xl border flex items-center gap-3 bg-white
        ${isOverlay
          ? 'shadow-xl scale-105 transform-gpu ring-2 ring-slate-900/10 border-slate-300 cursor-grabbing'
          : `relative transition-all border-slate-100 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5
             ${isDragging ? 'shadow-lg border-slate-300 ring-2 ring-slate-900/10' : ''}
             ${isDraggable ? 'cursor-pointer active:cursor-grabbing' : 'cursor-pointer'}
            `
        }
      `}
      onClick={() => onClick?.(item)}
      title={`${item.title}${item.type === 'link' ? '\n' + item.href : ''}`}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-lg flex-none transition-colors ${item.type === 'folder'
          ? isOverlay ? 'bg-amber-100 text-amber-600' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
          : isOverlay ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
          }`}
      >
        {item.type === 'folder' ? (
          <i className="material-symbols-outlined text-xl">folder</i>
        ) : (
          <img
            src={item.icon || getDynamicFavicon(item.href)}
            alt=""
            className="w-5 h-5 object-contain"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              if (target.parentElement) {
                target.parentElement.innerHTML =
                  '<i class="material-symbols-outlined text-xl">link</i>'
              }
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-800 truncate">
          {item.title || 'Untitled'}
        </h3>
        {item.type === 'link' ? (
          <p className="text-[10px] text-slate-400 truncate font-mono opacity-80">
            {item.href?.replace(/^https?:\/\//, '')}
          </p>
        ) : (
          <p className="text-[10px] text-slate-400 font-medium">
            {childCount} 个项目
          </p>
        )}
      </div>

      {!isOverlay && onEdit && onDelete && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item.id)
            }}
          >
            <i className="material-symbols-outlined text-lg">edit</i>
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (!window.confirm('确定要删除这个项目吗？')) return
              onDelete(item.id)
            }}
          >
            <i className="material-symbols-outlined text-lg">delete_outline</i>
          </button>
        </div>
      )}
    </article>
  )
}

interface BookmarkProps {
  item: BookmarkItem
  index: number
  isDraggable: boolean
  childCount: number
  onClick: (item: BookmarkItem) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function Bookmark({
  item,
  index,
  isDraggable,
  childCount,
  onClick,
  onEdit,
  onDelete,
}: BookmarkProps) {
  const { ref, isDragging } = useSortable({
    id: item.id,
    index,
    disabled: !isDraggable,
  })

  return (
    <div
      ref={ref}
      className={`group animate-in fade-in zoom-in-95 duration-300 outline-none ${isDragging ? 'opacity-40 z-10' : ''
        }`}
    >
      <BookmarkCard
        item={item}
        childCount={childCount}
        isDragging={isDragging}
        isDraggable={isDraggable}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}