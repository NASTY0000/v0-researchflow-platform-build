import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, GraduationCap, BookOpen } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

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
            <h1 className="text-2xl font-bold font-heading" style={{ letterSpacing: '-0.02em' }}>
              {profile.full_name || 'Researcher'}
            </h1>
            {profile.department && (
              <p className="text-sm mt-0.5" style={{ color: '#7C6A9C' }}>{profile.department}</p>
            )}
            {profile.university_id && (
              <p className="text-sm flex items-center gap-1.5 mt-1" style={{ color: '#7C6A9C' }}>
                <GraduationCap className="w-3.5 h-3.5" />
                {profile.university_id}
              </p>
            )}
            {profile.academic_level && (
              <span className="inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full capitalize" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#C084FC' }}>
                {profile.academic_level.replace('_', ' ')}
              </span>
            )}
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
              <span key={interest} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#C084FC' }}>
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
              <span key={skill} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#06B6D4' }}>
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
              <span key={item} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
