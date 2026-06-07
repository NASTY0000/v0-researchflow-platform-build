import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

interface SubredditConfig {
  name: string
  areas: string[]
  minScore: number
}

const SCIENCE_SUBREDDITS: SubredditConfig[] = [
  { name: 'science', areas: ['Biology', 'Physics', 'Chemistry', 'Medicine', 'Environmental Science'], minScore: 500 },
  { name: 'medicine', areas: ['Medicine', 'Public Health', 'Pharmacology'], minScore: 100 },
  { name: 'datascience', areas: ['Data Science', 'Machine Learning', 'Statistics', 'AI'], minScore: 100 },
  { name: 'MachineLearning', areas: ['Machine Learning', 'AI', 'Computer Science'], minScore: 200 },
  { name: 'biology', areas: ['Biology', 'Genetics', 'Biochemistry'], minScore: 100 },
  { name: 'chemistry', areas: ['Chemistry', 'Biochemistry', 'Pharmacology'], minScore: 100 },
  { name: 'AskScience', areas: [], minScore: 500 },
  { name: 'environment', areas: ['Environmental Science', 'Public Health', 'Agriculture'], minScore: 200 },
  { name: 'economics', areas: ['Economics', 'Finance', 'Development Studies'], minScore: 200 },
]

const USER_AGENT = 'ResearchFlow/1.0 researchflowafrica.com'

interface RedditPost {
  title: string
  selftext?: string
  url?: string
  permalink: string
  score: number
  num_comments: number
  created_utc: number
  is_self: boolean
}

const AFRICA_KEYWORDS = ['africa', 'nigeria', 'kenya', 'ghana', 'south africa', 'egypt', 'ethiopia']

export async function ingestRedditScience(supabase: SupabaseClient): Promise<number> {
  let inserted = 0

  for (const sub of SCIENCE_SUBREDDITS) {
    try {
      const url = `https://www.reddit.com/r/${sub.name}/top.json?t=day&limit=10`
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) continue

      const data = await res.json()
      const posts = (data?.data?.children ?? []) as { data: RedditPost }[]

      for (const { data: post } of posts) {
        if (post.score < sub.minScore) continue
        if (post.is_self && (post.selftext ?? '').length < 100) continue

        const postUrl = `https://reddit.com${post.permalink}`
        const titleLower = post.title.toLowerCase()
        const isAfricanRelevant = AFRICA_KEYWORDS.some(k => titleLower.includes(k))

        const { error } = await supabase
          .from('feed_external_content')
          .upsert(
            {
              category: 'discovery',
              content_type: 'post',
              source_name: `r/${sub.name}`,
              title: post.title.slice(0, 500),
              description: (post.selftext || post.url || '').slice(0, 500),
              url: postUrl,
              research_areas: sub.areas,
              published_at: new Date(post.created_utc * 1000).toISOString(),
              is_african_relevant: isAfricanRelevant,
              relevance_signals: {
                reddit_score: post.score,
                comment_count: post.num_comments,
                subreddit: sub.name,
              },
              expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            },
            { onConflict: 'url', ignoreDuplicates: true }
          )

        if (!error) inserted++
      }

      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error('Reddit ingestion error:', sub.name, err)
    }
  }

  return inserted
}
