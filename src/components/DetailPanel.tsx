import { useMemo } from 'react'
import useBookmarkStore from '../store/useBookmarkStore'
import { getDynamicFavicon } from '../utils/favicon'
import useAppStore from '../store/useAppStore'
import { NotebookPen, X, Folder, Link as LinkIcon, Trash2, Check, ExternalLink } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { cn } from '@/lib/utils'
import type { BookmarkNode } from '@/lib/bookmark/types'

export default function DetailPanel() {
  const editingItemId = useAppStore.use.editingItemId()
  const bookmarkFile = useAppStore.use.bookmarkFile()

  const bookmarkNodes = useBookmarkStore.use.bookmarkNodes()

  const selectedItem = useMemo(() => {
    if (!editingItemId || !bookmarkFile || !bookmarkNodes) return null
    return bookmarkNodes[editingItemId] as BookmarkNode | undefined
  }, [editingItemId, bookmarkFile, bookmarkNodes])

  const onClose = () => useAppStore.getState().setEditingItemId(null)

  const onUpdateItem = (updates: Partial<BookmarkNode>) => {
    if (selectedItem) useBookmarkStore.getState().updateItem(selectedItem.id, updates)
  }

  const onDeleteItem = () => {
    if (selectedItem) {
      if (window.confirm('确定要删除这个项目吗？')) {
        useBookmarkStore.getState().deleteItem(selectedItem.id)
        useAppStore.getState().setEditingItemId(null)
      }
    }
  }

  if (!selectedItem) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-background/30">
      <div
        className="absolute inset-0 animate-in fade-in duration-500"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-background border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh]">
        <header className="px-6 py-5 border-b flex items-center justify-between bg-muted/30 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <NotebookPen className="size-5 text-primary/60" />
            <h2 className="text-base font-semibold">编辑详情</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          <div className="flex flex-col items-center space-y-4">
            <div
              className={cn(
                "w-24 h-24 flex items-center justify-center rounded-3xl shadow-sm border-2 border-background ring-8 transition-all duration-300",
                selectedItem.type === 'folder'
                  ? 'bg-amber-500/10 text-amber-500 ring-amber-500/5'
                  : 'bg-primary/10 text-primary ring-primary/5'
              )}
            >
              {selectedItem.type === 'folder' ? (
                <Folder className="size-10 fill-current/10" />
              ) : (
                <div className="relative size-12 flex items-center justify-center">
                  <img
                    src={
                      selectedItem.icon ||
                      (selectedItem.href
                        ? getDynamicFavicon(selectedItem.href)
                        : undefined)
                    }
                    alt=""
                    className="size-12 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex'
                      }
                    }}
                  />
                  <div className="hidden absolute inset-0 items-center justify-center">
                    <LinkIcon className="size-8 text-muted-foreground/50" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                  selectedItem.type === 'folder'
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {selectedItem.type === 'folder' ? '目录' : '书签'}
              </span>
            </div>
          </div>

          <div className="grid gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-70">
                标题名称
              </label>
              <Input
                className="h-12 px-4 rounded-xl border-muted bg-muted/20 focus-visible:bg-background transition-all"
                value={selectedItem.title}
                onChange={(e) => onUpdateItem({ title: e.target.value })}
              />
            </div>

            {selectedItem.type === 'link' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                    链接地址
                  </label>
                  {selectedItem.href && (
                    <a
                      href={selectedItem.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="size-3" />
                      打开链接
                    </a>
                  )}
                </div>
                <Textarea
                  className="px-4 py-3 rounded-xl border-muted bg-muted/20 focus-visible:bg-background transition-all min-h-24 resize-none font-mono text-xs leading-relaxed"
                  value={selectedItem.href}
                  onChange={(e) => onUpdateItem({ href: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        <footer className="p-8 bg-muted/20 border-t flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 h-12 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold transition-all"
            onClick={onDeleteItem}
          >
            <Trash2 className="size-4 mr-2" />
            删除
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            onClick={onClose}
          >
            <Check className="size-4 mr-2" />
            完成
          </Button>
        </footer>
      </div>
    </div>
  )
}
