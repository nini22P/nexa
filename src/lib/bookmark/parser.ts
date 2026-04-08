import type { BookmarkNode } from './types'
import { elementToNodeData } from './mapper'

export default function parseBookmarkHtml(html: string): Record<string, BookmarkNode> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const flatNodes: Record<string, BookmarkNode> = {}

  const rootDl = doc.querySelector('dl')
  if (!rootDl) return flatNodes

  function parseDl(dl: HTMLElement, parentId: string | null) {
    const items = dl.querySelectorAll(':scope > dt')

    for (const dt of Array.from(items)) {
      const h3 = dt.querySelector(':scope > h3')
      const a = dt.querySelector(':scope > a')

      if (h3) {
        const folderData = elementToNodeData(h3 as HTMLElement, {
          type: 'folder',
          title: h3.textContent || '',
          parentId
        })
        flatNodes[folderData.id] = folderData

        const subDl = dt.querySelector(':scope > dl')
        if (subDl) {
          parseDl(subDl as HTMLElement, folderData.id)
        }
      } else if (a) {
        const linkData = elementToNodeData(a as HTMLElement, {
          type: 'link',
          title: a.textContent || '',
          parentId
        })
        flatNodes[linkData.id] = linkData
      }
    }
  }

  parseDl(rootDl, null)
  return flatNodes
}