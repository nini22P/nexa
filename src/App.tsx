import { useEffect } from 'react'
import useBookmarkStore from './store/useBookmarkStore'
import DetailPanel from './components/DetailPanel'
import MainView from './components/MainView'
import Sidebar from './components/Sidebar'

export default function App() {
  const bookmarkFile = useBookmarkStore(state => state.bookmarkFile)
  const _hasHydrated = useBookmarkStore(state => state._hasHydrated)
  const isSidebarOpen = useBookmarkStore(state => state.isSidebarOpen)
  const setSidebarOpen = useBookmarkStore(state => state.setSidebarOpen)
  const openFile = useBookmarkStore(state => state.openFile)
  const newFile = useBookmarkStore(state => state.newFile)
  const syncWithDisk = useBookmarkStore(state => state.syncWithDisk)

  useEffect(() => {
    if (!bookmarkFile) return

    syncWithDisk()
    const interval = setInterval(syncWithDisk, 30000)

    const handleFocus = () => syncWithDisk()
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarkFile?.path, syncWithDisk])

  if (!_hasHydrated) {
    return (
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
    )
  }

  return (
    <div className="h-full w-full bg-white font-sans text-slate-900">
      {
        bookmarkFile ? (
          <div className="flex h-screen overflow-hidden bg-white relative" key={bookmarkFile.path || 'bookmark'} >
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <Sidebar />
            <MainView />
            <DetailPanel />
          </div>
        ) : (
          <main className="flex h-full items-center justify-center p-6">
            <div className="max-w-md text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-2xl mb-6 ring-1 ring-slate-200">
                  <i className="material-symbols-outlined text-3xl text-slate-700">Bookmark</i>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Bookmark</h1>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={openFile}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-medium transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95"
                >
                  <i className="material-symbols-outlined text-xl">folder_open</i>
                  <span>打开书签文件</span>
                </button>
                <button
                  onClick={newFile}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 border border-slate-200 rounded-xl font-medium transition-all hover:bg-slate-50 hover:shadow-sm active:scale-95"
                >
                  <i className="material-symbols-outlined text-xl">add</i>
                  <span>新建书签文件</span>
                </button>
              </div>
            </div>
          </main>
        )
      }
    </div>
  )
}
