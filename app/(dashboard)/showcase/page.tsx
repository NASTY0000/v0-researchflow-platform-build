'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Filter, Eye, Heart, ExternalLink, FileText, 
  Users, Calendar, Trophy, TrendingUp, Sparkles 
} from 'lucide-react'
import type { ShowcaseEntry, Profile } from '@/lib/types/database'

type ShowcaseWithAuthor = ShowcaseEntry & {
  author: Profile | null
}

const RESEARCH_AREAS = [
  'All Areas',
  'Computer Science',
  'Medicine & Health',
  'Engineering',
  'Social Sciences',
  'Environmental Science',
  'Economics',
  'Education',
  'Law',
  'Psychology',
]

export default function ShowcasePage() {
  const [entries, setEntries] = useState<ShowcaseWithAuthor[]>([])
  const [featuredEntries, setFeaturedEntries] = useState<ShowcaseWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState('All Areas')
  const supabase = createClient()

  useEffect(() => {
    loadShowcase()
  }, [selectedArea])

  async function loadShowcase() {
    setIsLoading(true)

    let query = supabase
      .from('showcase_entries')
      .select(`
        *,
        author:profiles!author_id(*)
      `)
      .in('status', ['published', 'featured'])
      .order('published_at', { ascending: false })

    if (selectedArea !== 'All Areas') {
      query = query.eq('research_area', selectedArea)
    }

    const { data } = await query

    if (data) {
      setEntries(data.filter(e => e.status === 'published') as ShowcaseWithAuthor[])
      setFeaturedEntries(data.filter(e => e.status === 'featured') as ShowcaseWithAuthor[])
    }

    setIsLoading(false)
  }

  async function handleLike(entryId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('showcase_likes')
      .select('id')
      .eq('entry_id', entryId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      await supabase
        .from('showcase_likes')
        .delete()
        .eq('id', existingLike.id)

      await supabase
        .from('showcase_entries')
        .update({ likes: entries.find(e => e.id === entryId)!.likes - 1 })
        .eq('id', entryId)
    } else {
      // Like
      await supabase
        .from('showcase_likes')
        .insert({ entry_id: entryId, user_id: user.id })

      await supabase
        .from('showcase_entries')
        .update({ likes: entries.find(e => e.id === entryId)!.likes + 1 })
        .eq('id', entryId)
    }

    loadShowcase()
  }

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading">Research Showcase</h1>
        <p className="text-muted-foreground mt-1">
          Discover completed research from the ResearchFlow community
        </p>
      </div>

      {/* Featured Section */}
      {featuredEntries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Featured Research</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredEntries.slice(0, 2).map(entry => (
              <Card key={entry.id} className="overflow-hidden border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent">
                {entry.thumbnail_url && (
                  <div className="aspect-video bg-muted relative">
                    <img 
                      src={entry.thumbnail_url} 
                      alt={entry.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      <Trophy className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-2">{entry.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={entry.author?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {entry.author?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {entry.author?.full_name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {entry.abstract}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary">{entry.research_area}</Badge>
                    {entry.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {entry.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {entry.likes}
                    </span>
                  </div>
                  <Button size="sm">
                    Read More
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search research by title, abstract, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedArea} onValueChange={setSelectedArea} className="w-full sm:w-auto">
          <TabsList className="flex-wrap h-auto p-1">
            {RESEARCH_AREAS.slice(0, 5).map(area => (
              <TabsTrigger key={area} value={area} className="text-xs">
                {area}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{entries.length + featuredEntries.length}</p>
              <p className="text-xs text-muted-foreground">Published Works</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(entries.map(e => e.author_id)).size}
              </p>
              <p className="text-xs text-muted-foreground">Researchers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {entries.reduce((sum, e) => sum + e.views, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {entries.reduce((sum, e) => sum + e.likes, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Likes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted" />
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No research found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchQuery 
              ? "Try adjusting your search terms or filters"
              : "Be the first to publish your research to the showcase!"}
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map(entry => (
            <Card key={entry.id} className="overflow-hidden hover:border-primary/50 transition-colors group">
              {entry.thumbnail_url ? (
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img 
                    src={entry.thumbnail_url} 
                    alt={entry.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                  {entry.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={entry.author?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {entry.author?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{entry.author?.full_name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.abstract}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant="secondary" className="text-xs">{entry.research_area}</Badge>
                  {entry.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {entry.views}
                  </span>
                  <button 
                    onClick={() => handleLike(entry.id)}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    {entry.likes}
                  </button>
                  {entry.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(entry.published_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="text-xs">
                  Read
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
