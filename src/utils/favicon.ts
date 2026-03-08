export function getDynamicFavicon(urlStr?: string): string | undefined {
  if (!urlStr) return undefined
  try {
    const url = new URL(urlStr)
    return `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`
  } catch {
    return undefined
  }
}

export async function getFaviconBase64(
  urlStr: string,
): Promise<string | undefined> {
  const iconUrl = getDynamicFavicon(urlStr)
  if (!iconUrl) return undefined

  return await urlToBase64(iconUrl)
}

export async function urlToBase64(urlStr: string): Promise<string | undefined> {
  try {
    const response = await fetch(urlStr)
    if (!response.ok) throw new Error('Network response was not ok')

    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Base64 conversion failed:', error)
    return undefined
  }
}
