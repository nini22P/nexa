import type { BookmarkNode } from '../types'

export default function parseBookmarkHtml(
  html: string,
): Record<string, BookmarkNode> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const rootDl = doc.querySelector('dl')
  if (!rootDl) return {}

  const flatNodes: Record<string, BookmarkNode> = {}

  function parseDl(dlNode: Element, parentId: string | null) {
    for (const child of Array.from(dlNode.children)) {
      if (child.tagName.toUpperCase() === 'DT') {
        const h3 = child.querySelector('h3')
        const a = child.querySelector('a')

        if (h3) {
          const id = h3.getAttribute('data-id') || crypto.randomUUID()
          const folder: BookmarkNode = {
            id,
            parentId,
            type: 'folder',
            title: h3.textContent || '',
            addDate: h3.getAttribute('add_date') || '0',
            lastModified: h3.getAttribute('last_modified') || '0',
            personalToolbarFolder:
              h3.getAttribute('personal_toolbar_folder') === 'true',
          }

          flatNodes[id] = folder

          let dl = child.querySelector('dl')
          if (!dl) {
            let next = child.nextElementSibling
            while (next && next.tagName.toUpperCase() !== 'DT') {
              if (next.tagName.toUpperCase() === 'DL') {
                dl = next as HTMLDListElement
                break
              }
              next = next.nextElementSibling
            }
          }

          if (dl) {
            parseDl(dl, id)
          }
        } else if (a) {
          const id = a.getAttribute('data-id') || crypto.randomUUID()
          const link: BookmarkNode = {
            id,
            parentId,
            type: 'link',
            title: a.textContent || '',
            href: a.getAttribute('href') || '',
            addDate: a.getAttribute('add_date') || '0',
            lastModified: a.getAttribute('last_modified') || '0',
            icon: a.getAttribute('icon') || undefined,
          }

          flatNodes[id] = link
        }
      }
    }
  }

  parseDl(rootDl, null)
  return flatNodes
}