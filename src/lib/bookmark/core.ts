import type { BookmarkItem, BookmarkItems } from './types'

export const BookmarkCore = {
  add(
    items: BookmarkItems,
    type: 'link' | 'folder',
    parentId: string | null
  ): { items: BookmarkItems; item: BookmarkItem } {
    const id = crypto.randomUUID()
    const now = Date.now()
    const newItem: BookmarkItem =
      type === 'folder'
        ? {
          id,
          parentId,
          type: 'folder',
          title: '新文件夹',
          addDate: now,
          lastModified: now,
        }
        : {
          id,
          parentId,
          type: 'link',
          title: '新书签',
          href: 'https://',
          addDate: now,
          lastModified: now,
        }

    return {
      items: { ...items, [id]: newItem },
      item: newItem,
    }
  },

  update(
    items: BookmarkItems,
    id: string,
    updates: Partial<BookmarkItem>
  ): BookmarkItems {
    if (!items[id]) return items

    const updatedItem = {
      ...items[id],
      ...updates,
      lastModified: Date.now(),
    } as BookmarkItem

    return {
      ...items,
      [id]: updatedItem,
    }
  },

  delete(items: BookmarkItems, id: string): BookmarkItems {
    if (!items[id]) return items

    const newItems = { ...items }
    const now = Date.now()

    const recursiveTrash = (targetId: string) => {
      const item = newItems[targetId]
      if (!item) return

      newItems[targetId] = {
        ...item,
        deletedAt: now,
        lastModified: now,
      } as BookmarkItem

      Object.values(newItems)
        .filter((n) => n.parentId === targetId)
        .forEach((n) => recursiveTrash(n.id))
    }

    recursiveTrash(id)
    return newItems
  },

  move(items: BookmarkItems, id: string, target: string): BookmarkItems {
    const keys = Object.keys(items)
    const oldIndex = keys.indexOf(id)
    const newIndex = keys.indexOf(target)

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return items

    const newKeys = [...keys]
    const [moved] = newKeys.splice(oldIndex, 1)
    newKeys.splice(newIndex, 0, moved)

    const newBookmarkItems: BookmarkItems = {}
    newKeys.forEach((key) => {
      newBookmarkItems[key] = items[key]
    })

    return newBookmarkItems
  },
}
