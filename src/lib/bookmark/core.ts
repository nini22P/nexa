import type { BookmarkNode, BookmarkNodes } from './types'

export const BookmarkCore = {
  add(
    nodes: BookmarkNodes,
    type: 'link' | 'folder',
    parentId: string | null
  ): { nodes: BookmarkNodes; newNode: BookmarkNode } {
    const id = crypto.randomUUID()
    const now = Date.now()
    const newNode: BookmarkNode =
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
      nodes: { ...nodes, [id]: newNode },
      newNode,
    }
  },

  update(
    nodes: BookmarkNodes,
    id: string,
    updates: Partial<BookmarkNode>
  ): BookmarkNodes {
    if (!nodes[id]) return nodes

    const updatedNode = {
      ...nodes[id],
      ...updates,
      lastModified: Date.now(),
    } as BookmarkNode

    return {
      ...nodes,
      [id]: updatedNode,
    }
  },

  delete(nodes: BookmarkNodes, id: string): BookmarkNodes {
    if (!nodes[id]) return nodes

    const newNodes = { ...nodes }
    const now = Date.now()

    const recursiveTrash = (targetId: string) => {
      const node = newNodes[targetId]
      if (!node) return

      newNodes[targetId] = {
        ...node,
        deletedAt: now,
        lastModified: now,
      } as BookmarkNode

      Object.values(newNodes)
        .filter((n) => n.parentId === targetId)
        .forEach((n) => recursiveTrash(n.id))
    }

    recursiveTrash(id)
    return newNodes
  },

  move(nodes: BookmarkNodes, activeId: string, overId: string): BookmarkNodes {
    const keys = Object.keys(nodes)
    const oldIndex = keys.indexOf(activeId)
    const newIndex = keys.indexOf(overId)

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return nodes

    const newKeys = [...keys]
    const [moved] = newKeys.splice(oldIndex, 1)
    newKeys.splice(newIndex, 0, moved)

    const newBookmarkNodes: BookmarkNodes = {}
    newKeys.forEach((key) => {
      newBookmarkNodes[key] = nodes[key]
    })

    return newBookmarkNodes
  },
}
