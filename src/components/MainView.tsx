import useBookmarkStore from '../store/useBookmarkStore'
import type { BookmarkNode } from '../types'
import { getDynamicFavicon } from '../utils/favicon'

export default function MainView() {
  const store = useBookmarkStore()
  const {
    bookmarkFile,
    activeFolderId,
    searchQuery,
    setSearchQuery,
    sortKey,
    sortOrder,
    setSort,
    setSelectedItemId,
    setEditingItemId,
    setActiveFolderId,
    setSidebarOpen,
    addItem,
    deleteItem,
  } = store

  if (!bookmarkFile) return null

  const currentItems = store.getCurrentItems()

  const isSearching = searchQuery.trim().length > 0

  const activeFolder = activeFolderId
    ? bookmarkFile.data[activeFolderId]
    : null
  const activeFolderName = isSearching
    ? '搜索结果'
    : activeFolderId === null
      ? '全部书签'
      : activeFolder?.title || '未知文件夹'

  const onItemClick = (item: BookmarkNode) => {
    setSelectedItemId(item.id)
    if (item.type === 'folder') {
      setActiveFolderId(item.id)
      setSelectedItemId(null)
    } else if (item.type === 'link') {
      window.open(item.href, '_blank')
    }
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white shadow-sm ring-1 ring-slate-100 relative">
      <header className="flex-none p-4 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="material-symbols-outlined">menu</i>
            </button>
            <h1 className="text-xl font-bold text-slate-900 truncate">
              {activeFolderName}
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full">
              {currentItems.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group flex-1 md:flex-none md:w-64">
              <i className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors text-lg">
                search
              </i>
              <input
                type="text"
                placeholder="搜索书签或网址..."
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="material-symbols-outlined text-base">close</i>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
              <select
                className="h-7 bg-transparent border-none text-xs font-medium text-slate-600 outline-none px-2 py-1 cursor-pointer"
                value={sortKey}
                onChange={(e) =>
                  setSort(
                    e.target.value as 'none' | 'title' | 'href' | 'addDate',
                    sortOrder,
                  )
                }
              >
                <option value="none">默认</option>
                <option value="title">名称</option>
                <option value="href">网址</option>
                <option value="addDate">日期</option>
              </select>
              {sortKey !== 'none' ? (
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-900"
                  onClick={() =>
                    setSort(sortKey, sortOrder === 'asc' ? 'desc' : 'asc')
                  }
                >
                  <i className="material-symbols-outlined text-base">
                    {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                  </i>
                </button>
              ) : (
                <div className="w-1" />
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newItem = addItem('folder', activeFolderId)
                  if (newItem) setEditingItemId(newItem.id)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white ring-1 ring-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 hover:ring-slate-300 transition-all shadow-sm active:scale-95"
              >
                <i className="material-symbols-outlined text-base text-slate-500">
                  create_new_folder
                </i>
                <span>新建文件夹</span>
              </button>
              <button
                onClick={() => {
                  const newItem = addItem('link', activeFolderId)
                  if (newItem) setEditingItemId(newItem.id)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all shadow-md shadow-slate-200 active:scale-95"
              >
                <i className="material-symbols-outlined text-base">add</i>
                <span>新书签</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <i className="material-symbols-outlined text-6xl mb-4">
              explore_off
            </i>
            <p className="text-lg font-medium text-slate-400">
              这里没有任何项目
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
            {currentItems.map((item) => {
              return (
                <div
                  key={item.id}
                  className="group animate-in fade-in zoom-in-95 duration-300"
                >
                  <article
                    className={`
            p-3 rounded-xl border transition-all cursor-pointer relative flex items-center gap-3 bg-white
            border-slate-100 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5
        `}
                    onClick={() => onItemClick(item)}
                    title={`${item.title}${item.type === 'link' ? '\n' + item.href : ''}`}
                  >
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-lg flex-none transition-colors ${item.type === 'folder'
                          ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
                          : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
                        }`}
                    >
                      {item.type === 'folder' ? (
                        <i className="material-symbols-outlined text-xl">
                          folder
                        </i>
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
                          {item.childrenIds?.length || 0} 个项目
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingItemId(item.id)
                        }}
                      >
                        <i className="material-symbols-outlined text-lg">
                          edit
                        </i>
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!window.confirm('确定要删除这个项目吗？')) return
                          deleteItem(item.id)
                        }}
                      >
                        <i className="material-symbols-outlined text-lg">
                          delete_outline
                        </i>
                      </button>
                    </div>
                  </article>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
