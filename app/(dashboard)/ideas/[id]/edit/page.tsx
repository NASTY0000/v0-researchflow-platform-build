'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, X, Plus, Loader2 } from 'lucide-react'
import type { ResearchIdea } from '@/lib/types/database'

const RESEARCH_AREAS = [
  'Computer Science', 'Data Science', 'Artificial Intelligence', 'Machine Learning',
  'Biotechnology', 'Environmental Science', 'Public Health', 'Economics',
  'Social Sciences', 'Engineering', 'Mathematics', 'Physics', 'Chemistry',
  'Medicine', 'Agriculture', 'Education', 'Other',
]

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
  const [researchArea, setResearchArea] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
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
      setResearchArea(data.research_area || '')
      setTags(data.tags || [])
      setSkillsNeeded(data.skills_needed || [])
      setIsLoading(false)
    }
    load()
  }, [id, router])

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skillsNeeded.includes(s) && skillsNeeded.length < 10) {
      setSkillsNeeded([...skillsNeeded, s])
      setSkillInput('')
    }
  }

  async function handleSave() {
    if (!title.trim() || !description.trim() || !researchArea || !idea) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('research_ideas')
      .update({
        title: title.trim(),
        description: description.trim(),
        research_area: researchArea,
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/ideas/${id}`} className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: '#A855F7' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Idea
        </Link>
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
          <Select value={researchArea} onValueChange={setResearchArea}>
            <SelectTrigger>
              <SelectValue placeholder="Select research area" />
            </SelectTrigger>
            <SelectContent>
              {RESEARCH_AREAS.map((area) => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 10}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Skills Needed</Label>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add a skill..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <Button type="button" variant="outline" onClick={addSkill} disabled={skillsNeeded.length >= 10}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {skillsNeeded.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skillsNeeded.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                  {skill}
                  <button onClick={() => setSkillsNeeded(skillsNeeded.filter((s) => s !== skill))} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !description.trim() || !researchArea}
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
