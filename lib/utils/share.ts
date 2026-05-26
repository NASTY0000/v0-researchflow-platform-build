export async function shareContent({
  title,
  text,
  url,
}: {
  title: string
  text?: string
  url: string
}) {
  if (typeof navigator === 'undefined') return { success: false }

  if (navigator.share) {
    try {
      await navigator.share({ title, text: text || title, url })
      return { success: true, method: 'native' }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled' }
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return { success: true, method: 'clipboard' }
  } catch {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    return { success: true, method: 'clipboard' }
  }
}
