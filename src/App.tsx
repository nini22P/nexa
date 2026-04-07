import { useEffect } from 'react'
import { FolderOpen, PlusSquare } from 'lucide-react'
import useBookmarkStore from './store/useBookmarkStore'
import DetailPanel from './components/DetailPanel'
import MainView from './components/MainView'
import Sidebar from './components/Sidebar'
import useAppStore from './store/useAppStore'
import useSWR, { mutate } from 'swr'
import { Button } from './components/ui/button'

import Titlebar from './components/Titlebar'

export default function App() {
  const bookmarkFile = useAppStore.use.bookmarkFile()
  const hasHydrated = useAppStore.use.hasHydrated()
  const isSidebarOpen = useAppStore.use.isSidebarOpen()
  const setSidebarOpen = useAppStore.use.setSidebarOpen()
  const openFile = useBookmarkStore((state) => state.openFile)
  const newFile = useBookmarkStore((state) => state.newFile)
  const syncWithDisk = useBookmarkStore((state) => state.syncWithDisk)

  useSWR('bookmark/init', async () => {
    if (bookmarkFile) {
      await syncWithDisk()
    }
  })

  useEffect(() => {
    if (bookmarkFile)
      mutate('bookmark/init')
  }, [bookmarkFile])

  if (!hasHydrated) {
    return (
      <div className='w-full h-full flex justify-center items-center'>
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="h-dvh w-dvw overflow-hidden relative flex flex-col bg-background">
      <Titlebar />
      {
        bookmarkFile
          ?
          <main
            className="flex-1 flex overflow-hidden relative"
            key={bookmarkFile.path}
          >
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden animate-in fade-in duration-300"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <Sidebar />
            <MainView />
            <DetailPanel />
          </main>
          :
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-8 h-8 flex-none animate-in fade-in zoom-in duration-500 scale-200">
                  <div className="absolute top-0 left-0 w-7 h-7 rounded-full border-[3px] border-purple-200 shadow-[0_0_15px_#e9d5ff] opacity-90" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-[3px] border-emerald-200 shadow-[0_0_15px_#a7f3d0] opacity-90" />
                </div>
                <h1 className="text-xl font-black text-slate-950 tracking-tighter">
                  NEXA
                </h1>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={openFile}>
                  <FolderOpen />
                  打开书签文件
                </Button>
                <Button variant='secondary' onClick={newFile}>
                  <PlusSquare />
                  新建书签文件
                </Button>
              </div>
            </div>
          </main>
      }
    </div>
  )
}
