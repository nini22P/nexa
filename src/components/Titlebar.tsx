import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarRadioGroup,
  MenubarRadioItem,
} from './ui/menubar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Search, X, Menu, Plus, FolderPlus, Save, FolderOpen, LogOut, ArrowUpDown } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import useBookmarkStore from '../store/useBookmarkStore'
import { isDesktop } from '../utils/platform'
import WindowControls from './WindowControls'

export default function Titlebar() {
  const bookmarkFile = useAppStore.use.bookmarkFile()
  const activeFolderId = useAppStore.use.activeFolderId()
  const searchQuery = useAppStore.use.searchQuery()
  const sortKey = useAppStore.use.sortKey()
  const sortOrder = useAppStore.use.sortOrder()

  const setSearchQuery = useAppStore.use.setSearchQuery()
  const setSort = useAppStore.use.setSort()
  const setEditingItemId = useAppStore.use.setEditingItemId()
  const setSidebarOpen = useAppStore.use.setSidebarOpen()

  const addItem = useBookmarkStore.use.addItem()
  const openFile = useBookmarkStore.use.openFile()
  const saveFile = useBookmarkStore.use.saveFile()
  const closeFile = useBookmarkStore.use.closeFile()

  const isSearching = searchQuery.trim().length > 0

  return (
    <header className="drag flex items-center h-10 px-1 bg-background border-b select-none relative">
      <div className="flex items-center gap-2 z-10">
        <div className="flex items-center gap-2 no-drag mr-2">
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden h-7 w-7"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-1">
            <div className="relative w-4 h-4 flex-none">
              <div className="absolute top-0 left-0 w-3.5 h-3.5 rounded-full border-2 border-purple-200/80 shadow-[0_0_8px_#e9d5ff]" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-emerald-200/80 shadow-[0_0_8px_#a7f3d0]" />
            </div>
            <span className="text-xs font-bold tracking-tighter text-slate-900">NEXA</span>
          </div>
        </div>

        <Menubar className={`border-none bg-transparent shadow-none no-drag h-7 space-x-0 ${!bookmarkFile && 'hidden'}`}>
          <MenubarMenu>
            <MenubarTrigger className="text-xs font-medium h-6 px-2 hover:bg-accent rounded-sm transition-colors">文件</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={saveFile} className="text-xs">
                <Save className="mr-2 h-3.5 w-3.5" />
                保存文件 <MenubarShortcut className="text-[10px]">⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={openFile} className="text-xs">
                <FolderOpen className="mr-2 h-3.5 w-3.5" />
                打开文件 <MenubarShortcut className="text-[10px]">⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={closeFile} className="text-xs text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                关闭文件
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-xs font-medium h-6 px-2 hover:bg-accent rounded-sm transition-colors">编辑</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => {
                const item = addItem('link', activeFolderId)
                if (item) setEditingItemId(item.id)
              }} className="text-xs">
                <Plus className="mr-2 h-3.5 w-3.5" />
                新建书签 <MenubarShortcut className="text-[10px]">⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => {
                const item = addItem('folder', activeFolderId)
                if (item) setEditingItemId(item.id)
              }} className="text-xs">
                <FolderPlus className="mr-2 h-3.5 w-3.5" />
                新建文件夹 <MenubarShortcut className="text-[10px]">⇧⌘N</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-xs font-medium h-6 px-2 hover:bg-accent rounded-sm transition-colors">排序</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup
                value={sortKey}
                onValueChange={(value) => setSort(value as 'none' | 'title' | 'href' | 'addDate', sortOrder)}
              >
                <MenubarRadioItem value="none" className="text-xs">默认</MenubarRadioItem>
                <MenubarRadioItem value="title" className="text-xs">名称</MenubarRadioItem>
                <MenubarRadioItem value="href" className="text-xs">网址</MenubarRadioItem>
                <MenubarRadioItem value="addDate" className="text-xs">日期</MenubarRadioItem>
              </MenubarRadioGroup>
              <MenubarSeparator />
              <MenubarItem onClick={() => setSort(sortKey, sortOrder === 'asc' ? 'desc' : 'asc')} className="text-xs">
                <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                {sortOrder === 'asc' ? '升序' : '降序'}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      <div className={`absolute left-1/2 -translate-x-1/2 w-64 md:w-80 lg:w-96 no-drag ${!bookmarkFile && 'hidden'}`}>
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            className="h-7 pl-8 pr-8 bg-muted/40 border-none focus-visible:ring-1 focus-visible:bg-background transition-all text-xs text-center focus:text-left"
            placeholder="搜索书签或网址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1" />
      <div className="z-10 flex items-center">
        {isDesktop && <WindowControls />}
      </div>
    </header>
  )
}
