/**
 * Converts a Google Drive share URL to an embeddable preview URL.
 * Other https URLs are passed through as-is.
 */
export function driveUrlToEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') return url
  const trimmed = url.trim()
  // Google Drive: /file/d/{FILE_ID}/view
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`
  }
  // Google Drive: /open?id={FILE_ID}
  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`
  }
  return trimmed
}
