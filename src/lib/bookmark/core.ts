import type { BookmarkItem, BookmarkItemDraft, BookmarkItems } from './types'

export const BookmarkCore = {
  create(
    items: BookmarkItems,
    item: BookmarkItemDraft
  ): { items: BookmarkItems; item: BookmarkItem } {
    const id = item.id ?? crypto.randomUUID()
    const now = Date.now()
    const addDate = item.addDate ?? now
    const lastModified = item.lastModified ?? now

    const newItem = {
      rawAttributes: {},
      ...item,
      id,
      addDate,
      lastModified,
    } as BookmarkItem

    return {
      items: { ...items, [id]: newItem },
      item: newItem,
    }
  },

  update(
    items: BookmarkItems,
    id: string,
    updates: Partial<BookmarkItem>
  ): { items: BookmarkItems, item: BookmarkItem } {
    const target = items[id]

    if (!target) {
      throw new Error(`Update failed: Item with ID "${id}" does not exist.`)
    }

    const updatedItem = {
      ...target,
      ...updates,
      lastModified: Date.now(),
    } as BookmarkItem

    return {
      items: {
        ...items,
        [id]: updatedItem,
      },
      item: updatedItem,
    }
  },

  move(
    items: BookmarkItems,
    id: string,
    { parentId, index }: { parentId: string | null; index: number }
  ): BookmarkItems {
    const keys = Object.keys(items)
    const oldGlobalIndex = keys.indexOf(id)
    if (oldGlobalIndex === -1) return items

    const siblings = keys.filter(k => items[k].parentId === parentId && k !== id)

    let newGlobalIndex: number

    if (siblings.length === 0 || index >= siblings.length) {
      if (parentId === null) {
        newGlobalIndex = keys.length
      } else {
        const lastSiblingId = siblings[siblings.length - 1]
        newGlobalIndex = lastSiblingId ? keys.indexOf(lastSiblingId) + 1 : keys.indexOf(parentId) + 1
      }
    } else {
      newGlobalIndex = keys.indexOf(siblings[index])
    }

    const newKeys = [...keys]
    const [movedKey] = newKeys.splice(oldGlobalIndex, 1)

    const finalIndex = (oldGlobalIndex < newGlobalIndex) ? newGlobalIndex - 1 : newGlobalIndex
    newKeys.splice(finalIndex, 0, movedKey)

    return Object.fromEntries(newKeys.map(k => [
      k,
      k === id ? { ...items[k], parentId, lastModified: Date.now() } : items[k]
    ]))
  },

  delete(items: BookmarkItems, id: string): BookmarkItems {
    const newItems = { ...items }
    const now = Date.now()

    const recursiveTrash = (targetId: string) => {
      const item = newItems[targetId]
      if (!item) {
        throw new Error(`Delete failed: Item with ID "${id}" does not exist.`)
      }

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
}
