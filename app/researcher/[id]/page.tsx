import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAkiliTitle } from '@/lib/constants/akili'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, department')
    .eq('id', id)
    .single()

  if (!profile) return { title: 'Researcher | ResearchFlow' }

  return {
    title: `${profile.full_name} | ResearchFlow`,
    description: profile.bio || `${profile.full_name} is a researcher on ResearchFlow`,
    openGraph: {
      title: profile.full_name || 'Researcher',
      description: profile.bio || 'View this researcher on ResearchFlow',
      url: `https://researchflowafrica.com/researcher/${id}`,
    },
  }
}

export default async function PublicResearcherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('onboarding_completed', true)
    .single()

  if (!profile) notFound()

  if (profile.profile_visibility === 'connections_only') {
    return <PrivateProfileView name={profile.full_name} department={profile.department} />
  }

  let universityName = ''
  if (profile.university_id?.includes('-')) {
    const { data: uni } = await supabase
      .from('universities')
      .select('name')
      .eq('id', profile.university_id)
      .single()
    universityName = uni?.name || ''
  }

  const { data: showcase } = await supabase
    .from('showcase_entries')
    .select('id, title, abstract, research_area')
    .eq('author_id', id)
    .in('status', ['published', 'featured'])
    .limit(3)

  return (
    <div style={{ minHeight: '100vh', background: '#05010F', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      {/* Navbar */}
      <nav style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(124,58,237,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{
          fontSize: 18, fontWeight: 700,
          background: 'linear-gradient(90deg,#A855F7,#22D3EE)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textDecoration: 'none',
        }}>
          ResearchFlow
        </a>
        <a href="/auth/signup" style={{
          padding: '8px 20px',
          borderRadius: 8,
          background: '#7C3AED',
          color: 'white',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
        }}>
          Join ResearchFlow
        </a>
      </nav>

      <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px' }}>
        {/* Header card */}
        <div style={{
          background: 'rgba(18,8,31,0.8)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: profile.avatar_url
                ? 'transparent'
                : 'linear-gradient(135deg,#7C3AED,#22D3EE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.full_name?.charAt(0) || '?'
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>
                {profile.full_name}
              </h1>
              <p style={{ color: 'rgba(200,180,255,0.7)', fontSize: 14, margin: '0 0 8px' }}>
                {profile.academic_level?.replace(/_/g, ' ')}
                {profile.department && ` · ${profile.department}`}
                {universityName && ` · ${universityName}`}
              </p>
              {profile.bio && (
                <p style={{ color: 'rgba(200,180,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
                  {profile.bio}
                </p>
              )}
              {(profile.akili_score || 0) > 0 && (
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  fontSize: 12,
                  color: '#A855F7',
                  fontWeight: 600,
                }}>
                  {profile.akili_score} Akili · {getAkiliTitle(profile.akili_score)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Research Interests */}
        {profile.research_interests?.length > 0 && (
          <div style={{
            background: 'rgba(18,8,31,0.8)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h3 style={{
              fontSize: 11, fontWeight: 600, color: 'rgba(200,180,255,0.5)',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12,
            }}>
              Research Interests
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.research_interests.map((r: string) => (
                <span key={r} style={{
                  border: '1px solid #9d4edd',
                  background: 'transparent',
                  color: '#9d4edd',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div style={{
            background: 'rgba(18,8,31,0.8)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h3 style={{
              fontSize: 11, fontWeight: 600, color: 'rgba(200,180,255,0.5)',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12,
            }}>
              Skills
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.skills.map((s: string) => (
                <span key={s} style={{
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  color: '#A855F7',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Published research */}
        {showcase && showcase.length > 0 && (
          <div style={{
            background: 'rgba(18,8,31,0.8)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h3 style={{
              fontSize: 11, fontWeight: 600, color: 'rgba(200,180,255,0.5)',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
            }}>
              Published Research
            </h3>
            {showcase.map((entry: { id: string; title: string; abstract: string; research_area: string }) => (
              <a
                key={entry.id}
                href={`/showcase/${entry.id}`}
                style={{
                  display: 'block',
                  padding: 16,
                  borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.15)',
                  marginBottom: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: 4, color: 'white' }}>{entry.title}</p>
                <p style={{ fontSize: 12, color: 'rgba(200,180,255,0.5)' }}>{entry.research_area}</p>
              </a>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(34,211,238,0.1))',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Want to collaborate with {profile.full_name?.split(' ')[0]}?
          </h3>
          <p style={{ color: 'rgba(200,180,255,0.6)', fontSize: 14, marginBottom: 24 }}>
            Join ResearchFlow to connect, collaborate, and publish research with students across Africa.
          </p>
          <a href="/auth/signup" style={{
            display: 'inline-block',
            padding: '12px 32px',
            borderRadius: 10,
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 15,
          }}>
            Join ResearchFlow Free
          </a>
        </div>
      </div>
    </div>
  )
}

function PrivateProfileView({ name, department }: { name: string | null; department: string | null }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#05010F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      color: 'white',
      textAlign: 'center',
      padding: 24,
    }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{name}</h2>
        <p style={{ color: 'rgba(200,180,255,0.6)', marginTop: 8, marginBottom: 24 }}>
          {department} · Profile is private
        </p>
        <a href="/auth/signup" style={{
          padding: '10px 24px',
          borderRadius: 8,
          background: '#7C3AED',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 600,
        }}>
          Join to Connect
        </a>
      </div>
    </div>
  )
}
