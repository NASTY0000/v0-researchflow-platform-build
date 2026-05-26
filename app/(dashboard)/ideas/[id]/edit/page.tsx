'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import type { ResearchIdea } from '@/lib/types/database'
import { TagInput } from '@/components/ui/tag-input'
import { RESEARCH_AREAS, SKILLS_LIST } from '@/lib/constants/tags'
import { BaobabLoader } from '@/components/ui/baobab-loader'

export default function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [idea, setIdea] = useState<ResearchIdea | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [researchArea, setResearchArea] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const { data, error: fetchError } = await supabase
        .from('research_ideas')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !data) {
        router.push('/ideas')
        return
      }

      if (user && data.author_id !== user.id) {
        router.push(`/ideas/${id}`)
        return
      }

      setIdea(data)
      setTitle(data.title || '')
      setDescription(data.description || '')
      setResearchArea(data.research_area ? [data.research_area] : [])
      setTags(data.tags || [])
      setSkillsNeeded(data.skills_needed || [])
      setIsLoading(false)
    }
    load()
  }, [id, router])

  async function handleSave() {
    if (!title.trim() || !description.trim() || researchArea.length === 0 || !idea) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('research_ideas')
      .update({
        title: title.trim(),
        description: description.trim(),
        research_area: researchArea[0],
        tags,
        skills_needed: skillsNeeded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', idea.id)

    if (updateError) {
      setError(updateError.message)
      setIsSaving(false)
      return
    }

    router.push(`/ideas/${id}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <BaobabLoader size="sm" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: '#A855F7' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Idea
        </button>
        <h1 className="text-2xl font-bold font-heading mt-4" style={{ letterSpacing: '-0.02em' }}>Edit Idea</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="space-y-2">
          <Label>Title <span className="text-destructive">*</span></Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Research idea title"
            maxLength={150}
          />
        </div>

        <div className="space-y-2">
          <Label>Description <span className="text-destructive">*</span></Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your research idea..."
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label>Research Area <span className="text-destructive">*</span></Label>
          <TagInput
            options={RESEARCH_AREAS}
            value={researchArea}
            onChange={setResearchArea}
            placeholder="Search research area..."
            maxItems={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <TagInput
            options={[]}
            value={tags}
            onChange={setTags}
            placeholder="Type a tag and press Enter..."
            maxItems={10}
          />
        </div>

        <div className="space-y-2">
          <Label>Skills Needed</Label>
          <TagInput
            options={SKILLS_LIST}
            value={skillsNeeded}
            onChange={setSkillsNeeded}
            placeholder="Search skills..."
            maxItems={10}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !description.trim() || researchArea.length === 0}
            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Changes</>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/ideas/${id}`}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
