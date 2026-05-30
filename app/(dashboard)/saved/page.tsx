'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bookmark, Lightbulb, Award, GraduationCap, User, Star } from 'lucide-react'
import { BookmarkButton } from '@/components/ui/bookmark-button'
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'
import { EmptyState } from '@/components/ui/EmptyState'

interface Bookmark {
  id: string
  content_type: 'idea' | 'showcase' | 'mentor' | 'profile'
  content_id: string
  created_at: string
}

interface IdeaItem {
  id: string
  title: string
  description: string
  research_area: string
  tags: string[]
  upvotes: number
  views: number
  author_id: string
  author?: { full_name: string | null; avatar_url: string | null }
}

interface ShowcaseItem {
  id: string
  title: string
  abstract: string
  research_area: string
  status: string
  author_id: string
  author?: { full_name: string | null; avatar_url: string | null }
}

interface MentorItem {
  id: string
  user_id: string
  rating: number | null
  total_sessions: number
  expertise_areas: string[]
  profile?: { full_name: string | null; avatar_url: string | null; department: string | null }
}

interface ProfileItem {
  id: string
  full_name: string | null
  avatar_url: string | null
  department: string | null
  academic_level: string | null
  research_interests: string[]
}

export default function SavedPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [ideas, setIdeas] = useState<Map<string, IdeaItem>>(new Map())
  const [showcases, setShowcases] = useState<Map<string, ShowcaseItem>>(new Map())
  const [mentors, setMentors] = useState<Map<string, MentorItem>>(new Map())
  const [profiles, setProfiles] = useState<Map<string, ProfileItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadSaved()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSaved() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: bks } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!bks || bks.length === 0) { setLoading(false); return }
    setBookmarks(bks as Bookmark[])

    const byType = {
      idea: bks.filter(b => b.content_type === 'idea').map(b => b.content_id),
      showcase: bks.filter(b => b.content_type === 'showcase').map(b => b.content_id),
      mentor: bks.filter(b => b.content_type === 'mentor').map(b => b.content_id),
      profile: bks.filter(b => b.content_type === 'profile').map(b => b.content_id),
    }

    await Promise.all([
      byType.idea.length > 0 && supabase
        .from('research_ideas')
        .select('id, title, description, research_area, tags, upvotes, views, author_id, author:profiles!research_ideas_author_id_fkey(full_name, avatar_url)')
        .in('id', byType.idea)
        .then(({ data }) => {
          if (data) {
            const m = new Map<string, IdeaItem>()
            data.forEach(i => m.set(i.id, i as unknown as IdeaItem))
            setIdeas(m)
          }
        }),
      byType.showcase.length > 0 && supabase
        .from('showcase_entries')
        .select('id, title, abstract, research_area, status, author_id, author:profiles!author_id(full_name, avatar_url)')
        .in('id', byType.showcase)
        .then(({ data }) => {
          if (data) {
            const m = new Map<string, ShowcaseItem>()
            data.forEach(s => m.set(s.id, s as unknown as ShowcaseItem))
            setShowcases(m)
          }
        }),
      byType.mentor.length > 0 && supabase
        .from('mentor_profiles')
        .select('id, user_id, rating, total_sessions, expertise_areas, profile:profiles!mentor_profiles_user_id_fkey(full_name, avatar_url, department)')
        .in('id', byType.mentor)
        .then(({ data }) => {
          if (data) {
            const m = new Map<string, MentorItem>()
            data.forEach(mn => m.set(mn.id, mn as unknown as MentorItem))
            setMentors(m)
          }
        }),
      byType.profile.length > 0 && supabase
        .from('profiles')
        .select('id, full_name, avatar_url, department, academic_level, research_interests')
        .in('id', byType.profile)
        .then(({ data }) => {
          if (data) {
            const m = new Map<string, ProfileItem>()
            data.forEach(p => m.set(p.id, p as ProfileItem))
            setProfiles(m)
          }
        }),
    ])

    setLoading(false)
  }

  const ideaBookmarks = bookmarks.filter(b => b.content_type === 'idea')
  const showcaseBookmarks = bookmarks.filter(b => b.content_type === 'showcase')
  const mentorBookmarks = bookmarks.filter(b => b.content_type === 'mentor')
  const profileBookmarks = bookmarks.filter(b => b.content_type === 'profile')

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><ListPageSkeleton type="card" count={4} /></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Saved Items</h1>
        <p className="text-sm text-muted-foreground mt-1">Your bookmarked ideas, research, mentors, and researchers</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All <Badge className="ml-2 text-xs">{bookmarks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ideas">
            Ideas <Badge className="ml-2 text-xs">{ideaBookmarks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="showcase">
            Showcase <Badge className="ml-2 text-xs">{showcaseBookmarks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="mentors">
            Mentors <Badge className="ml-2 text-xs">{mentorBookmarks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="researchers">
            Researchers <Badge className="ml-2 text-xs">{profileBookmarks.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ALL */}
        <TabsContent value="all" className="mt-4 space-y-4">
          {bookmarks.length === 0 ? (
            <EmptyState
              icon="🔖"
              title="Nothing saved yet"
              description="Bookmark research ideas, profiles, and projects you want to come back to."
              ctaLabel="Explore the Idea Board"
              ctaHref="/ideas"
            />
          ) : (
            <div className="space-y-3">
              {bookmarks.map(bk => {
                if (bk.content_type === 'idea') {
                  const item = ideas.get(bk.content_id)
                  if (!item) return null
                  return <IdeaCard key={bk.id} item={item} bookmarkId={bk.content_id} />
                }
                if (bk.content_type === 'showcase') {
                  const item = showcases.get(bk.content_id)
                  if (!item) return null
                  return <ShowcaseCard key={bk.id} item={item} bookmarkId={bk.content_id} />
                }
                if (bk.content_type === 'mentor') {
                  const item = mentors.get(bk.content_id)
                  if (!item) return null
                  return <MentorCard key={bk.id} item={item} bookmarkId={bk.content_id} />
                }
                if (bk.content_type === 'profile') {
                  const item = profiles.get(bk.content_id)
                  if (!item) return null
                  return <ProfileCard key={bk.id} item={item} bookmarkId={bk.content_id} />
                }
                return null
              })}
            </div>
          )}
        </TabsContent>

        {/* IDEAS */}
        <TabsContent value="ideas" className="mt-4 space-y-3">
          {ideaBookmarks.length === 0 ? (
            <EmptyState icon="🔖" title="No saved ideas yet" description="Browse the Ideas Board and click the bookmark icon to save ideas here." ctaLabel="Browse Ideas" ctaHref="/ideas" />
          ) : ideaBookmarks.map(bk => {
            const item = ideas.get(bk.content_id)
            if (!item) return null
            return <IdeaCard key={bk.id} item={item} bookmarkId={bk.content_id} />
          })}
        </TabsContent>

        {/* SHOWCASE */}
        <TabsContent value="showcase" className="mt-4 space-y-3">
          {showcaseBookmarks.length === 0 ? (
            <EmptyState icon="🔖" title="No saved showcase entries yet" description="Discover published research in the Showcase and bookmark entries to revisit." ctaLabel="Browse Showcase" ctaHref="/showcase" />
          ) : showcaseBookmarks.map(bk => {
            const item = showcases.get(bk.content_id)
            if (!item) return null
            return <ShowcaseCard key={bk.id} item={item} bookmarkId={bk.content_id} />
          })}
        </TabsContent>

        {/* MENTORS */}
        <TabsContent value="mentors" className="mt-4 space-y-3">
          {mentorBookmarks.length === 0 ? (
            <EmptyState icon="🔖" title="No saved mentors yet" description="Browse the Mentor Directory and bookmark mentors you'd like to connect with." ctaLabel="Find Mentors" ctaHref="/mentors" />
          ) : mentorBookmarks.map(bk => {
            const item = mentors.get(bk.content_id)
            if (!item) return null
            return <MentorCard key={bk.id} item={item} bookmarkId={bk.content_id} />
          })}
        </TabsContent>

        {/* RESEARCHERS */}
        <TabsContent value="researchers" className="mt-4 space-y-3">
          {profileBookmarks.length === 0 ? (
            <EmptyState icon="🔖" title="No saved researchers yet" description="Browse researcher profiles and bookmark ones you want to collaborate with." ctaLabel="Find Collaborators" ctaHref="/matches" />
          ) : profileBookmarks.map(bk => {
            const item = profiles.get(bk.content_id)
            if (!item) return null
            return <ProfileCard key={bk.id} item={item} bookmarkId={bk.content_id} />
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function IdeaCard({ item, bookmarkId }: { item: IdeaItem; bookmarkId: string }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Idea</span>
            </div>
            <Link href={`/ideas/${item.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">
              {item.title}
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {item.author && (
                <span className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={item.author.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">{item.author.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {item.author.full_name}
                </span>
              )}
              <Badge variant="outline" className="text-xs">{item.research_area}</Badge>
            </div>
          </div>
          <BookmarkButton contentType="idea" contentId={bookmarkId} />
        </div>
      </CardContent>
    </Card>
  )
}

function ShowcaseCard({ item, bookmarkId }: { item: ShowcaseItem; bookmarkId: string }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Showcase</span>
            </div>
            <Link href={`/showcase/${item.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">
              {item.title}
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.abstract}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {item.author && (
                <span className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={item.author.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">{item.author.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {item.author.full_name}
                </span>
              )}
              <Badge variant="outline" className="text-xs">{item.research_area}</Badge>
            </div>
          </div>
          <BookmarkButton contentType="showcase" contentId={bookmarkId} />
        </div>
      </CardContent>
    </Card>
  )
}

function MentorCard({ item, bookmarkId }: { item: MentorItem; bookmarkId: string }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href={`/profile/${item.user_id}`}>
              <Avatar className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <AvatarImage src={item.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {item.profile?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <GraduationCap className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Mentor</span>
              </div>
              <Link href={`/profile/${item.user_id}`} className="font-semibold hover:text-primary transition-colors">
                {item.profile?.full_name}
              </Link>
              {item.profile?.department && (
                <p className="text-xs text-muted-foreground">{item.profile.department}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {item.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {Number(item.rating).toFixed(1)}
                  </span>
                )}
                {item.total_sessions > 0 && <span>{item.total_sessions} sessions</span>}
              </div>
            </div>
          </div>
          <BookmarkButton contentType="mentor" contentId={bookmarkId} />
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileCard({ item, bookmarkId }: { item: ProfileItem; bookmarkId: string }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href={`/profile/${item.id}`}>
              <Avatar className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <AvatarImage src={item.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {item.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <User className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Researcher</span>
              </div>
              <Link href={`/profile/${item.id}`} className="font-semibold hover:text-primary transition-colors">
                {item.full_name}
              </Link>
              {item.department && (
                <p className="text-xs text-muted-foreground">{item.department} · {item.academic_level?.replace(/_/g, ' ')}</p>
              )}
              {item.research_interests?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.research_interests.slice(0, 3).map(r => (
                    <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <BookmarkButton contentType="profile" contentId={bookmarkId} />
        </div>
      </CardContent>
    </Card>
  )
}
