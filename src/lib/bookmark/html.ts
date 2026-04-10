import { elementToItemData, itemToAttrString } from './mapper'
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
          const folderData = elementToItemData(h3 as HTMLElement, {
            type: 'folder',
            title: h3.textContent || '',
            parentId
          })
          items[folderData.id] = folderData

          const subDl = dt.querySelector(':scope > dl')
          if (subDl) {
            parseDl(subDl as HTMLElement, folderData.id)
          }
        } else if (a) {
          const linkData = elementToItemData(a as HTMLElement, {
            type: 'link',
            title: a.textContent || '',
            parentId
          })
          items[linkData.id] = linkData
        }
      }
    }

    parseDl(rootDl, null)
    return items
  },

  generate(
    items: BookmarkItems,
  ): string {
    let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n'
    html += '<!-- This is an automatically generated file.\n'
    html += '     It will be read and overwritten.\n'
    html += '     DO NOT EDIT! -->\n'
    html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n'
    html += '<TITLE>Bookmarks</TITLE>\n'
    html += '<H1>Bookmarks</H1>\n'
    html += '<DL><p>\n'

    const allItems = Object.values(items)

    const generateNode = (parentId: string | null, indent: number) => {
      const indentStr = '    '.repeat(indent)
      const children = allItems.filter((n) => n.parentId === parentId)

      for (const item of children) {
        const attrs = itemToAttrString(item)

        if (item.type === 'folder') {
          html += `${indentStr}<DT><H3${attrs}>${item.title}</H3>\n`
          html += `${indentStr}<DL><p>\n`
          generateNode(item.id, indent + 1)
          html += `${indentStr}</DL><p>\n`
        } else {
          html += `${indentStr}<DT><A${attrs}>${item.title}</A>\n`
        }
      }
    }

    generateNode(null, 1)
    html += '</DL><p>\n'
    return html
  }
}