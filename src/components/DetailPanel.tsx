import { useMemo } from 'react'
import useBookmarkStore from '../store/useBookmarkStore'
import type { BookmarkNode } from '../types'
import { getDynamicFavicon } from '../utils/favicon'

export default function DetailPanel() {
    const store = useBookmarkStore()
    const editingItemId = useBookmarkStore(state => state.editingItemId)
    const bookmarkFile = useBookmarkStore(state => state.bookmarkFile)

    const selectedItem = useMemo(() => {
        if (!editingItemId || !bookmarkFile) return null
        return (bookmarkFile.data)[editingItemId] as BookmarkNode | undefined
    }, [editingItemId, bookmarkFile])

    const onClose = () => store.setEditingItemId(null)

    const onUpdateItem = (updates: Partial<BookmarkNode>) => {
        if (selectedItem) store.updateItem(selectedItem.id, updates)
    }

    const onDeleteItem = () => {
        if (selectedItem) {
            if (window.confirm('确定要删除这个项目吗？')) {
                store.deleteItem(selectedItem.id)
                store.setEditingItemId(null)
            }
        }
    }

    if (!selectedItem) return null

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh]">

                <header className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <i className="material-symbols-outlined text-slate-400">edit_note</i>
                        <h2 className="text-base font-bold text-slate-900">编辑详情</h2>
                    </div>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-50 text-slate-400 transition-all active:scale-90"
                        onClick={onClose}
                    >
                        <i className="material-symbols-outlined">close</i>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <div className="flex flex-col items-center space-y-3">
                        <div className={`w-24 h-24 flex items-center justify-center rounded-4xl shadow-sm border-4 border-white ring-1 ring-slate-100 ${selectedItem.type === 'folder' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-500'
                            }`}>
                            {selectedItem.type === 'folder' ? (
                                <i className="material-symbols-outlined text-5xl">folder</i>
                            ) : (
                                <img
                                    src={selectedItem.icon || (selectedItem.href ? getDynamicFavicon(selectedItem.href) : undefined)}
                                    alt=""
                                    className="w-14 h-14 object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        if (target.parentElement) {
                                            target.parentElement.innerHTML = '<i class="material-symbols-outlined text-4xl">link</i>'
                                        }
                                    }}
                                />
                            )}
                        </div>
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full ${selectedItem.type === 'folder' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {selectedItem.type === 'folder' ? 'DIRECTORY' : 'BOOKMARK'}
                        </span>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">标题名称</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:bg-white focus:border-slate-100 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
                                value={selectedItem.title}
                                onChange={e => onUpdateItem({ title: e.target.value })}
                            />
                        </div>

                        {selectedItem.type === 'link' && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">链接地址</label>
                                <div className="relative group">
                                    <textarea
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-mono focus:bg-white focus:border-slate-100 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all min-h-24 resize-none"
                                        value={selectedItem.href}
                                        onChange={e => onUpdateItem({ href: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="p-6 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
                    <button
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600 hover:shadow-lg hover:shadow-red-200 transition-all active:scale-95"
                        onClick={onDeleteItem}
                    >
                        <i className="material-symbols-outlined text-lg">delete</i>
                        <span>永久删除</span>
                    </button>
                    <button
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                        onClick={onClose}
                    >
                        完成退出
                    </button>
                </footer>
            </div>
        </div>
    )
}