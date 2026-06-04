'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import { postResearchIdea, joinProjectAsCollaborator } from '@/lib/actions/akili'
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'

const RESEARCH_AREAS = [
  'Artificial Intelligence & Machine Learning',
  'Data Science & Analytics',
  'Computer Science & Software Engineering',
  'Cybersecurity & Information Security',
  'Biotechnology & Genetic Engineering',
  'Biomedical Engineering',
  'Environmental Science & Climate Change',
  'Renewable Energy & Clean Technology',
  'Public Health & Epidemiology',
  'Medicine & Clinical Research',
  'Pharmacology & Drug Discovery',
  'Nursing & Allied Health',
  'Agriculture & Food Security',
  'Agronomy & Crop Science',
  'Veterinary Science & Animal Husbandry',
  'Economics & Finance',
  'Development Economics',
  'Business Administration & Management',
  'Social Sciences & Sociology',
  'Political Science & Governance',
  'Law & Legal Studies',
  'Education & Pedagogy',
  'Psychology & Behavioral Science',
  'Linguistics & Communication',
  'African Studies & Cultural Heritage',
  'History & Archaeology',
  'Philosophy & Ethics',
  'Theology & Religious Studies',
  'Mathematics & Statistics',
  'Physics & Astronomy',
  'Chemistry & Materials Science',
  'Earth Sciences & Geology',
  'Marine & Aquatic Sciences',
  'Ecology & Biodiversity',
  'Civil Engineering & Infrastructure',
  'Mechanical Engineering',
  'Electrical & Electronic Engineering',
  'Chemical Engineering',
  'Urban Planning & Architecture',
  'Transportation & Logistics',
  'Water Resources & Sanitation',
  'Nutrition & Dietetics',
  'Sports Science & Kinesiology',
  'Gender Studies & Feminism',
  'Human Rights & International Relations',
  'Journalism & Media Studies',
  'Library & Information Science',
  'Nanotechnology',
  'Quantum Computing',
  'Robotics & Automation',
  'Other',
]

const RESEARCH_SKILLS = [
  // Programming & Data
  'Python', 'R', 'MATLAB', 'Julia', 'SQL', 'JavaScript', 'Java', 'C/C++',
  // Stats & Analysis
  'SPSS', 'STATA', 'SAS', 'Excel', 'Statistical Analysis', 'Econometrics',
  'Biostatistics', 'Epidemiological Modelling',
  // Machine Learning
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  'Reinforcement Learning', 'Time Series Analysis',
  // Data Tools
  'Data Visualization', 'Tableau', 'Power BI', 'Data Wrangling',
  'Big Data (Spark/Hadoop)', 'Database Design',
  // Research Methods
  'Qualitative Analysis', 'Quantitative Research', 'Mixed Methods',
  'Systematic Review', 'Meta-Analysis', 'Survey Design',
  'Focus Group Facilitation', 'Ethnography', 'Grounded Theory',
  'Action Research', 'Case Study Research',
  // Lab & Field
  'Lab Skills', 'Field Research', 'PCR & Molecular Biology',
  'Microscopy', 'Cell Culture', 'Genomic Sequencing', 'Clinical Trials',
  // Writing & Communication
  'Technical Writing', 'Academic Writing', 'Grant Writing',
  'Literature Review', 'Science Communication', 'Policy Writing',
  // GIS & Environment
  'GIS & Remote Sensing', 'ArcGIS', 'QGIS', 'Spatial Analysis',
  'Environmental Monitoring',
  // Specialist
  'Bioinformatics', 'Cheminformatics', 'Health Economics',
  'Project Management', 'Ethics & IRB Protocols',
  'Community Engagement', 'Translation & Interpretation',
  'Other',
]

const METHODOLOGIES = [
  'Qualitative', 'Quantitative', 'Mixed Methods', 'Systematic Review',
  'Case Study', 'Experimental', 'Survey', 'Observational',
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
          <SearchableMultiSelect
            options={RESEARCH_AREAS}
            value={researchAreas}
            onChange={setResearchAreas}
            placeholder="Select research areas..."
            searchPlaceholder="Search research areas..."
            maxSelections={3}
            allowCustom={true}
          />
        </div>

        {/* Skills Needed */}
        <div className="space-y-2">
          <Label>Skills Needed</Label>
          <SearchableMultiSelect
            options={RESEARCH_SKILLS}
            value={selectedSkills}
            onChange={setSelectedSkills}
            placeholder="Select skills needed..."
            searchPlaceholder="Search or add a skill..."
            allowCustom={true}
          />
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
