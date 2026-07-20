'use client'

import { useEffect, useState, use, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { acceptInvitation } from '@/lib/actions/invitations'

function JoinPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error' | 'no-token'>('loading')
  const [message, setMessage] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectTitle, setProjectTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setStatus('no-token'); return }
    handleJoin()
  }, [token])

  async function handleJoin() {
    setStatus('loading')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to signup preserving token
      router.push(`/auth/signup?redirect=/join?token=${token}`)
      return
    }

    setStatus('joining')
    const result = await acceptInvitation(token!, user.id)

    if (result.error) {
      setStatus('error')
      setMessage(result.error)
      return
    }

    setStatus('success')
    setProjectId(result.projectId || null)
    setProjectTitle(result.projectTitle || null)
    setTimeout(() => {
      if (result.projectId) router.push(`/projects/${result.projectId}`)
    }, 2500)
  }

  const bgStyle = { backgroundColor: '#05010F', minHeight: '100vh' }
  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px' }

  return (
    <div className="flex items-center justify-center min-h-screen px-4" style={bgStyle}>
      <Card className="w-full max-w-md" style={cardStyle}>
        <CardContent className="py-12 text-center space-y-4">
          {status === 'loading' || status === 'joining' ? (
            <>
              <div className="w-8 h-8 rounded-full animate-spin border-4 border-primary border-t-transparent mx-auto" />
              <p className="font-medium" style={{ color: '#E2D9F3' }}>
                {status === 'loading' ? 'Checking invitation...' : 'Joining project...'}
              </p>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <div className="space-y-1">
                <p className="text-lg font-semibold" style={{ color: '#E2D9F3' }}>Welcome to the team!</p>
                {projectTitle && (
                  <p className="text-sm text-muted-foreground">
                    You've joined <strong style={{ color: '#C4B5FD' }}>{projectTitle}</strong>
                  </p>
                )}
              </div>
              <p className="text-xs" style={{ color: '#4A3F6B' }}>Redirecting to your project...</p>
              {projectId && (
                <Link href={`/projects/${projectId}`}>
                  <Button style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
                    <Users className="h-4 w-4 mr-2" />
                    Go to Project
                  </Button>
                </Link>
              )}
            </>
          ) : status === 'error' ? (
            <>
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <div className="space-y-1">
                <p className="text-lg font-semibold" style={{ color: '#E2D9F3' }}>Invitation issue</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'transparent' }}>
                  Go to Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No invitation token found.</p>
              <Link href="/dashboard">
                <Button variant="outline" style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'transparent' }}>
                  Go to Dashboard
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: '#05010F' }} />
    }>
      <JoinPageInner />
    </Suspense>
  )
}

