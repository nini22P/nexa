
import type { BookmarkFile } from '../types'
import generateBookmarkHtml from './generateBookmarkHtml'

const saveBookmarkHtmlFile = async (bookmarkFile: BookmarkFile) => {
  const saveData = bookmarkFile.data

  const htmlString = generateBookmarkHtml(saveData)
  const textEncoder = new TextEncoder()
  const bufferView = textEncoder.encode(htmlString)

  try {
    const writable = await bookmarkFile.handle.createWritable()
    await writable.write(bufferView.buffer as ArrayBuffer)
    await writable.close()

    alert('已保存: ' + bookmarkFile.fileName)
  } catch (error) {
    console.error('文件保存失败:', error)
    downloadFile(bufferView, bookmarkFile.fileName)
  }
}

const downloadFile = (bufferView: Uint8Array, name: string) => {
  const blob = new Blob([bufferView.buffer as ArrayBuffer], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default saveBookmarkHtmlFile