import { NextResponse } from 'next/server'

export async function GET() {
  const testUrl = 'https://www.sciencedaily.com/rss/all.xml'

  try {
    const res = await fetch(testUrl, {
      headers: {
        'User-Agent': 'ResearchFlow/1.0'
      }
    })

    const status = res.status
    const headers = Object.fromEntries(res.headers.entries())
    const text = await res.text()

    return NextResponse.json({
      fetch_status: status,
      response_length: text.length,
      first_200_chars: text.slice(0, 200),
      headers_received: headers,
      error: null,
    })

  } catch (err) {
    return NextResponse.json({
      fetch_status: 0,
      response_length: 0,
      first_200_chars: null,
      error: String(err),
    })
  }
}
