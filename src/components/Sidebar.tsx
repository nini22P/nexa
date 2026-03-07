import useBookmarkStore from '../store/useBookmarkStore'
import FolderTreeItem from './FolderTreeItem'

export default function Sidebar() {
    const store = useBookmarkStore()
    const { bookmarkFile, activeFolderId, setActiveFolderId, openFile, saveFile, closeFile, isSidebarOpen, setSidebarOpen } = store

    if (!bookmarkFile) return null

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-slate-50 border-r border-slate-100 flex flex-col 
            transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
            ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}
        `}>
            <header className="p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 flex-none animate-in fade-in zoom-in duration-500">
                            <div className="absolute top-0 left-0 w-7 h-7 rounded-full border-[3px] border-purple-200 shadow-[0_0_15px_#e9d5ff] opacity-90" />
                            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-[3px] border-emerald-200 shadow-[0_0_15px_#a7f3d0] opacity-90" />
                        </div>
                        <h1 className="text-xl font-black text-slate-950 tracking-tighter">
                            Nexa
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                        onClick={saveFile}
                        title="保存修改"
                    >
                        <i className="material-symbols-outlined text-base">save</i>
                        <span>保存</span>
                    </button>
                    <button
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        onClick={openFile}
                        title="打开书签文件"
                    >
                        <i className="material-symbols-outlined text-base">folder_open</i>
                        <span>打开</span>
                    </button>
                    <button
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        onClick={closeFile}
                        title="关闭文件"
                    >
                        <i className="material-symbols-outlined text-base">close</i>
                        <span>关闭</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                <button
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFolderId === null
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                        }`}
                    onClick={() => {
                        setActiveFolderId(null)
                        setSidebarOpen(false)
                    }}
                >
                    <i className="material-symbols-outlined text-lg">home</i>
                    <span>全部书签</span>
                </button>

                <div className="space-y-0.5">
                    {
                        Object.values(bookmarkFile.data)
                            .filter((node) => node.parentId === null && node.type === 'folder')
                            .map((node) => (
                                <FolderTreeItem
                                    key={node.id}
                                    nodeId={node.id}
                                    activeFolderId={activeFolderId}
                                    onSelectFolder={setActiveFolderId}
                                />
                            ))
                    }
                </div>
            </div>
        </aside>
    )
}

