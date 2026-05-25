export async function shareContent({
  title,
  text,
  url,
}: {
  title: string
  text?: string
  url: string
}) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text: text || title, url })
      return { success: true, method: 'native' as const }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled' as const }
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return { success: true, method: 'clipboard' as const }
  } catch {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    return { success: true, method: 'clipboard' as const }
  }
}
