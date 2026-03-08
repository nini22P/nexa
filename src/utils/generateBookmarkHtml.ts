import type { BookmarkNode } from '../types'

export default function generateBookmarkHtml(
  nodes: Record<string, BookmarkNode>,
): string {
  let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n'

  html += '<!-- This is an automatically generated file.\n'
  html += '     It will be read and overwritten.\n'
  html += '     DO NOT EDIT! -->\n'
  html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n'
  html += '<TITLE>Bookmarks</TITLE>\n'
  html += '<H1>Bookmarks</H1>\n'
  html += '<DL><p>\n'

  const rootNodes = Object.values(nodes).filter((n) => n.parentId === null)

  function renderNodes(currentIds: string[], indent: number) {
    const indentStr = '    '.repeat(indent)

    for (const id of currentIds) {
      const node = nodes[id]
      if (!node) continue

      if (node.type === 'folder') {
        let attrs = ''

        if (node.addDate)
          attrs += ` ADD_DATE="${node.addDate}"`
        if (node.lastModified)
          attrs += ` LAST_MODIFIED="${node.lastModified}"`
        if (node.personalToolbarFolder)
          attrs += ' PERSONAL_TOOLBAR_FOLDER="true"'
        attrs += ` DATA-ID="${node.id}"`

        html += `${indentStr}<DT><H3${attrs}>${node.title}</H3>\n`
        html += `${indentStr}<DL><p>\n`
        if (node.childrenIds)
          renderNodes(node.childrenIds, indent + 1)
        html += `${indentStr}</DL><p>\n`
      } else {
        let attrs = ` HREF="${node.href}"`
        if (node.addDate)
          attrs += ` ADD_DATE="${node.addDate}"`
        if (node.lastModified)
          attrs += ` LAST_MODIFIED="${node.lastModified}"`
        if (node.icon)
          attrs += ` ICON="${node.icon}"`
        attrs += ` DATA-ID="${node.id}"`

        html += `${indentStr}<DT><A${attrs}>${node.title}</A>\n`
      }
    }
  }

  renderNodes(
    rootNodes.map((n) => n.id),
    1,
  )
  html += '</DL><p>\n'
  return html
}
