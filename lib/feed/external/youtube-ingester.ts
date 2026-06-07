import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

interface ChannelConfig {
  id: string
  name: string
  areas: string[]
  isAfrican?: boolean
}

const SCIENCE_CHANNELS: ChannelConfig[] = [
  { id: 'UCsXVk37bltHxD1rDPwtNM8Q', name: 'Kurzgesagt', areas: ['Biology', 'Physics', 'Environmental Science', 'Medicine'] },
  { id: 'UCiPNJ4nilbaqKDkomPnvGhg', name: 'SciShow', areas: ['Biology', 'Chemistry', 'Medicine', 'Physics'] },
  { id: 'UCHnyfMqiRRG1u-2MsSQLbXA', name: 'Veritasium', areas: ['Physics', 'Mathematics', 'Engineering', 'Biology'] },
  { id: 'UCPF0-OZhAVJNNMOhF21RKOA', name: 'TED Research', areas: [] },
  { id: 'UC9-y-6csu5WGm29I7JiwpnA', name: 'Computerphile', areas: ['Computer Science', 'AI', 'Cybersecurity'] },
  { id: 'UCV0qA-eDDICsRR9rPcnG7tw', name: 'African Science', areas: ['Public Health', 'Agriculture', 'Biology'], isAfrican: true },
]

interface YouTubeSearchItem {
  id: { videoId?: string }
  snippet: {
    title: string
    description?: string
    publishedAt: string
    thumbnails?: { medium?: { url?: string } }
  }
}

export async function ingestYouTubeScience(supabase: SupabaseClient): Promise<number> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not set — skipping YouTube ingestion')
    return 0
  }

  let inserted = 0
  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  for (const channel of SCIENCE_CHANNELS) {
    try {
      const url =
        'https://www.googleapis.com/youtube/v3/search' +
        `?key=${encodeURIComponent(apiKey)}` +
        `&channelId=${encodeURIComponent(channel.id)}` +
        '&part=snippet,id&order=date&maxResults=5&type=video' +
        `&publishedAfter=${encodeURIComponent(publishedAfter)}`

      const res = await fetch(url)
      if (!res.ok) continue

      const data = await res.json()
      const videos = (data.items ?? []) as YouTubeSearchItem[]

      for (const video of videos) {
        const videoId = video.id.videoId
        if (!videoId) continue

        const snippet = video.snippet
        const videoUrl = `https://youtube.com/watch?v=${videoId}`
        const titleLower = snippet.title.toLowerCase()

        const { error } = await supabase
          .from('feed_external_content')
          .upsert(
            {
              category: 'discovery',
              content_type: 'video',
              source_name: channel.name,
              title: snippet.title.slice(0, 500),
              description: snippet.description?.slice(0, 500) ?? null,
              url: videoUrl,
              thumbnail_url: snippet.thumbnails?.medium?.url ?? null,
              research_areas: channel.areas,
              published_at: snippet.publishedAt,
              is_african_relevant: channel.isAfrican === true || titleLower.includes('africa'),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            { onConflict: 'url', ignoreDuplicates: true }
          )

        if (!error) inserted++
      }

      await new Promise(r => setTimeout(r, 200))
    } catch (err) {
      console.error('YouTube ingestion error:', channel.name, err)
    }
  }

  return inserted
}
