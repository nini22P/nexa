import { elementToItem, itemToAttrString } from './mapper'
import type { BookmarkItems } from './types'

export const BookmarkHTML = {
  parse(html: string): BookmarkItems {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const items: BookmarkItems = {}

    const rootDl = doc.querySelector('dl')
    if (!rootDl) return items

    const parseDl = (dl: HTMLElement, parentId: string | null) => {
      const dts = dl.querySelectorAll(':scope > dt')

      for (const dt of Array.from(dts)) {
        const h3 = dt.querySelector(':scope > h3')
        const a = dt.querySelector(':scope > a')

        if (h3) {
          const folder = elementToItem(h3 as HTMLElement, {
            type: 'folder',
            title: h3.textContent || '',
            parentId
          })
          items[folder.id] = folder

          const subDl = dt.querySelector(':scope > dl')
          if (subDl) {
            parseDl(subDl as HTMLElement, folder.id)
          }
        } else if (a) {
          const link = elementToItem(a as HTMLElement, {
            type: 'link',
            title: a.textContent || '',
            parentId
          })
          items[link.id] = link
        }
      }
    }

    parseDl(rootDl, null)
    return items
  },

  generate(
    items: BookmarkItems,
  ): string {
    const allItems = Object.values(items)
    const buffer: string[] = []

    buffer.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>')
    buffer.push('<!-- This is an automatically generated file.')
    buffer.push('     It will be read and overwritten.')
    buffer.push('     DO NOT EDIT! -->')
    buffer.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">')
    buffer.push('<TITLE>Bookmarks</TITLE>')
    buffer.push('<H1>Bookmarks</H1>')
    buffer.push('<DL><p>')

    const generateNode = (parentId: string | null, indent: number) => {
      const indentStr = '    '.repeat(indent)
      const children = allItems.filter((n) => n.parentId === parentId)

      for (const item of children) {
        const attrs = itemToAttrString(item)

        if (item.type === 'folder') {
          buffer.push(`${indentStr}<DT><H3${attrs}>${item.title}</H3>`)
          buffer.push(`${indentStr}<DL><p>`)
          generateNode(item.id, indent + 1)
          buffer.push(`${indentStr}</DL><p>`)
        } else {
          buffer.push(`${indentStr}<DT><A${attrs}>${item.title}</A>`)
        }
      }
    }

    generateNode(null, 1)
    buffer.push('</DL><p>')
    return buffer.join('\n')
  }
}