'use client'

import { useState } from 'react'
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
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import { postResearchIdea, joinProjectAsCollaborator } from '@/lib/actions/akili'

const RESEARCH_AREAS = [
  'Computer Science', 'Data Science', 'Artificial Intelligence', 'Machine Learning',
  'Biotechnology', 'Environmental Science', 'Public Health', 'Economics',
  'Social Sciences', 'Engineering', 'Mathematics', 'Physics', 'Chemistry',
  'Medicine', 'Agriculture', 'Education', 'Other',
]

const METHODOLOGIES = [
  'Qualitative', 'Quantitative', 'Mixed Methods', 'Systematic Review',
  'Case Study', 'Experimental', 'Survey', 'Observational',
]

const SKILLS_LIST = [
  'Python', 'R', 'SPSS', 'STATA', 'Excel', 'Machine Learning', 'NLP',
  'Data Visualization', 'Technical Writing', 'Qualitative Analysis',
  'Statistical Analysis', 'Lab Skills', 'Field Research', 'Literature Review',
  'Grant Writing', 'Survey Design', 'Bioinformatics', 'GIS', 'Other',
]

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(139,92,246,0.25)',
  color: '#F3F0FF',
}

export default function NewProjectPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [aim, setAim] = useState('')
  const [objectives, setObjectives] = useState<string[]>([''])
  const [methodology, setMethodology] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [researchAreas, setResearchAreas] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addObjective() {
    setObjectives([...objectives, ''])
  }

  function removeObjective(index: number) {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  function updateObjective(index: number, value: string) {
    const updated = [...objectives]
    updated[index] = value
    setObjectives(updated)
  }

  function toggleArea(area: string) {
    if (researchAreas.includes(area)) {
      setResearchAreas(researchAreas.filter((a) => a !== area))
    } else if (researchAreas.length < 3) {
      setResearchAreas([...researchAreas, area])
    }
  }

  function toggleSkill(skill: string) {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !aim.trim() || !methodology) {
      setError('Title, research aim, and methodology are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      setIsSubmitting(false)
      return
    }

    // Create a team first (projects require a team)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: title.trim(),
        description: aim.trim(),
        leader_id: user.id,
        max_members: 10,
        status: 'active',
      })
      .select()
      .single()

    if (teamError || !team) {
      setError(teamError?.message || 'Failed to create project team.')
      setIsSubmitting(false)
      return
    }

    // Add creator as team member
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: user.id,
      role: 'leader',
      responsibilities: [],
    })

    const filledObjectives = objectives.filter((o) => o.trim())
    const descriptionWithObjectives = filledObjectives.length > 0
      ? `${aim.trim()}\n\nObjectives:\n${filledObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}`
      : aim.trim()

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        team_id: team.id,
        title: title.trim(),
        description: descriptionWithObjectives,
        research_area: researchAreas[0] || null,
        current_phase: 'problem_identification',
        phase_progress: 0,
        start_date: startDate || new Date().toISOString().split('T')[0],
        target_end_date: endDate || null,
        status: 'active',
        is_public: true,
      })
      .select()
      .single()

    if (projectError || !project) {
      setError(projectError?.message || 'Failed to create project.')
      setIsSubmitting(false)
      return
    }

    // Award Akili points for creating project and auto-joining as leader
    postResearchIdea(user.id, project.id).catch(() => {})
    joinProjectAsCollaborator(user.id, project.id).catch(() => {})

    // Auto-create 7 research phases
    const phaseNames = [
      'Topic Refinement', 'Literature Review', 'Methodology Design',
      'Data Collection', 'Data Analysis', 'Writing and Review', 'Showcase Submission',
    ]
    await supabase.from('project_phases').insert(
      phaseNames.map((name, i) => ({
        project_id: project.id,
        phase_number: i + 1,
        phase_name: name,
        status: i === 0 ? 'in_progress' : 'not_started',
      }))
    )

    router.push(`/projects/${project.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#A855F7' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <h1 className="text-2xl font-bold font-heading mt-4" style={{ letterSpacing: '-0.02em' }}>New Project</h1>
        <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Create a research project workspace</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl p-6 space-y-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>

        {/* Title */}
        <div className="space-y-2">
          <Label>Project Title <span className="text-destructive">*</span></Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Climate Change Impact on Crop Yields in East Africa"
            style={inputStyle}
            maxLength={150}
          />
        </div>

        {/* Research Aim */}
        <div className="space-y-2">
          <Label>Research Aim <span className="text-destructive">*</span></Label>
          <Textarea
            value={aim}
            onChange={(e) => setAim(e.target.value)}
            placeholder="What is the overarching goal of this research?"
            rows={3}
            style={inputStyle}
          />
        </div>

        {/* Specific Objectives */}
        <div className="space-y-2">
          <Label>Specific Objectives</Label>
          <div className="space-y-2">
            {objectives.map((obj, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-sm font-medium w-5 shrink-0" style={{ color: '#7C6A9C' }}>{i + 1}.</span>
                <Input
                  value={obj}
                  onChange={(e) => updateObjective(i, e.target.value)}
                  placeholder={`Objective ${i + 1}`}
                  style={inputStyle}
                />
                {objectives.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 w-8 h-8"
                    onClick={() => removeObjective(i)}
                    style={{ color: '#7C6A9C' }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addObjective}
            style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A855F7' }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Objective
          </Button>
        </div>

        {/* Methodology */}
        <div className="space-y-2">
          <Label>Methodology <span className="text-destructive">*</span></Label>
          <Select value={methodology} onValueChange={setMethodology}>
            <SelectTrigger style={inputStyle}>
              <SelectValue placeholder="Select methodology" />
            </SelectTrigger>
            <SelectContent>
              {METHODOLOGIES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Research Areas */}
        <div className="space-y-2">
          <Label>Research Areas <span className="text-xs font-normal" style={{ color: '#7C6A9C' }}>(select up to 3)</span></Label>
          <div className="flex flex-wrap gap-2">
            {RESEARCH_AREAS.map((area) => (
              <Badge
                key={area}
                variant={researchAreas.includes(area) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleArea(area)}
                style={researchAreas.includes(area)
                  ? { background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(168,85,247,0.5)', color: '#E2D9F3' }
                  : { border: '1px solid rgba(139,92,246,0.3)', color: '#9D8BB8', cursor: 'pointer' }
                }
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>

        {/* Skills Needed */}
        <div className="space-y-2">
          <Label>Skills Needed</Label>
          <div className="flex flex-wrap gap-2">
            {SKILLS_LIST.map((skill) => (
              <Badge
                key={skill}
                variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleSkill(skill)}
                style={selectedSkills.includes(skill)
                  ? { background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(168,85,247,0.5)', color: '#E2D9F3' }
                  : { border: '1px solid rgba(139,92,246,0.3)', color: '#9D8BB8', cursor: 'pointer' }
                }
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !aim.trim() || !methodology}
            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
            className="flex-1"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Project...</>
            ) : (
              'Create Project'
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
