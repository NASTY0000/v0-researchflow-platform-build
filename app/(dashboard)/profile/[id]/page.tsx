import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, BookOpen, ExternalLink, Zap, Award, Briefcase, FileText, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AkiliScoreCard } from '@/components/akili/AkiliScoreCard'
import type { PortfolioItem } from '@/lib/types/database'

interface Props {
  params: Promise<{ id: string }>
}

function getPortfolioIcon(type: string) {
  switch (type) {
    case 'publication': return <BookOpen className="w-4 h-4" />
    case 'project': return <Briefcase className="w-4 h-4" />
    case 'certificate': return <Award className="w-4 h-4" />
    case 'award': return <Star className="w-4 h-4" />
    case 'presentation': return <FileText className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [profileResult, portfolioResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('portfolio_items').select('*').eq('user_id', id).order('date', { ascending: false }).limit(12)
  ])

  if (!profileResult.data) notFound()
  const profile = profileResult.data
  const portfolioItems: PortfolioItem[] = portfolioResult.data || []

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(139,92,246,0.15)',
    borderRadius: '16px',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/matches" className="inline-flex items-center gap-2 text-sm" style={{ color: '#A855F7' }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Profile header */}
      <div className="p-6 rounded-2xl" style={cardStyle}>
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ''} />
            <AvatarFallback className="text-2xl" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF' }}>
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-heading" style={{ letterSpacing: '-0.02em' }}>
                {profile.full_name || 'Researcher'}
              </h1>
              {profile.akili_score > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.25)', color: '#C084FC' }}>
                  <Zap className="w-3 h-3" />
                  {profile.akili_score.toLocaleString()} Akili
                </span>
              )}
            </div>
            {profile.department && (
              <p className="text-sm mt-0.5" style={{ color: '#7C6A9C' }}>{profile.department}</p>
            )}
            {profile.university_id && (
              <p className="text-sm flex items-center gap-1.5 mt-1" style={{ color: '#7C6A9C' }}>
                <GraduationCap className="w-3.5 h-3.5" />
                {profile.university_id}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {profile.academic_level && (
                <span className="text-xs px-2.5 py-0.5 rounded-full capitalize"
                  style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#C084FC' }}>
                  {profile.academic_level.replace('_', ' ')}
                </span>
              )}
              {profile.roles?.map((role: string) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-5 text-sm leading-relaxed" style={{ color: '#C4B5D8' }}>{profile.bio}</p>
        )}
      </div>

      {/* Research interests */}
      {profile.research_interests?.length > 0 && (
        <div className="p-5 rounded-2xl" style={cardStyle}>
          <h2 className="font-semibold font-heading text-sm mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: '#A855F7' }} /> Research Interests
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.research_interests.map((interest: string) => (
              <span key={interest} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#C084FC' }}>
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div className="p-5 rounded-2xl" style={cardStyle}>
          <h2 className="font-semibold font-heading text-sm mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill: string) => (
              <span key={skill} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#06B6D4' }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Looking for */}
      {profile.looking_for?.length > 0 && (
        <div className="p-5 rounded-2xl" style={cardStyle}>
          <h2 className="font-semibold font-heading text-sm mb-3">Looking For</h2>
          <div className="flex flex-wrap gap-2">
            {profile.looking_for.map((item: string) => (
              <span key={item} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {portfolioItems.length > 0 && (
        <div className="p-5 rounded-2xl" style={cardStyle}>
          <h2 className="font-semibold font-heading text-sm mb-4">Portfolio</h2>
          <div className="space-y-3">
            {portfolioItems.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <span style={{ color: '#A855F7' }}>{getPortfolioIcon(item.item_type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" style={{ color: '#A855F7' }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#7C6A9C' }}>
                    {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                    {item.date && ` · ${new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  </p>
                  {item.description && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#C4B5D8' }}>{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Akili Score */}
      <AkiliScoreCard userId={profile.id} />
    </div>
  )
}
