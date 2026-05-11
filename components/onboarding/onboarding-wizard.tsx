'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Sparkles, 
  User, 
  GraduationCap, 
  Target, 
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Loader2,
  CheckCircle
} from 'lucide-react'
import type { Profile, University, AcademicLevel, UserRole } from '@/lib/types/database'
import { completeOnboarding, updateProfile } from '@/lib/actions/auth'

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Academic Details', icon: GraduationCap },
  { id: 3, title: 'Research Interests', icon: Target },
  { id: 4, title: 'Skills & Availability', icon: Clock },
  { id: 5, title: 'Complete', icon: CheckCircle },
]

const ACADEMIC_LEVELS: { value: AcademicLevel; label: string }[] = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'masters', label: 'Masters' },
  { value: 'phd', label: 'PhD' },
  { value: 'postdoc', label: 'Postdoc' },
  { value: 'faculty', label: 'Faculty' },
]

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'student_researcher', label: 'Student Researcher', description: 'Looking to collaborate on research projects' },
  { value: 'mentor', label: 'Mentor', description: 'Willing to guide and support other researchers' },
]

const RESEARCH_AREAS = [
  'Computer Science', 'Data Science', 'Artificial Intelligence', 'Biotechnology',
  'Environmental Science', 'Public Health', 'Economics', 'Social Sciences',
  'Engineering', 'Agriculture', 'Medicine', 'Law', 'Education', 'Business',
  'Physics', 'Chemistry', 'Mathematics', 'Psychology', 'Political Science',
  'Renewable Energy', 'Climate Change', 'Urban Planning', 'Linguistics',
]

const SKILLS = [
  'Python', 'R', 'SPSS', 'Statistical Analysis', 'Data Visualization',
  'Machine Learning', 'Qualitative Research', 'Quantitative Research',
  'Academic Writing', 'Literature Review', 'Survey Design', 'Interviews',
  'Lab Work', 'Field Research', 'GIS', 'Project Management', 'Grant Writing',
  'Public Speaking', 'Data Collection', 'Experiment Design',
]

interface OnboardingWizardProps {
  initialProfile: Profile | null
  universities: University[]
}

export function OnboardingWizard({ initialProfile, universities }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(initialProfile?.onboarding_step || 1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState(initialProfile?.full_name || '')
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [universityId, setUniversityId] = useState(initialProfile?.university_id || '')
  const [department, setDepartment] = useState(initialProfile?.department || '')
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel | ''>(initialProfile?.academic_level || '')
  const [roles, setRoles] = useState<UserRole[]>(initialProfile?.roles || ['student_researcher'])
  const [researchInterests, setResearchInterests] = useState<string[]>(initialProfile?.research_interests || [])
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || [])
  const [lookingFor, setLookingFor] = useState<string[]>(initialProfile?.looking_for || [])
  const [weeklyHours, setWeeklyHours] = useState(initialProfile?.weekly_hours_available || 10)
  const [customInterest, setCustomInterest] = useState('')
  const [customSkill, setCustomSkill] = useState('')
  const [customLookingFor, setCustomLookingFor] = useState('')

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  const toggleArrayItem = (arr: string[], setArr: (arr: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item))
    } else {
      setArr([...arr, item])
    }
  }

  const addCustomItem = (value: string, arr: string[], setArr: (arr: string[]) => void, setValue: (v: string) => void) => {
    if (value.trim() && !arr.includes(value.trim())) {
      setArr([...arr, value.trim()])
      setValue('')
    }
  }

  const toggleRole = (role: UserRole) => {
    if (roles.includes(role)) {
      if (roles.length > 1) {
        setRoles(roles.filter(r => r !== role))
      }
    } else {
      setRoles([...roles, role])
    }
  }

  const saveProgress = async () => {
    setIsLoading(true)
    setError(null)

    const data: Record<string, unknown> = {
      onboarding_step: step,
    }

    if (step >= 1) {
      data.full_name = fullName
      data.bio = bio
    }
    if (step >= 2) {
      data.university_id = universityId || null
      data.department = department
      data.academic_level = academicLevel || null
      data.roles = roles
    }
    if (step >= 3) {
      data.research_interests = researchInterests
    }
    if (step >= 4) {
      data.skills = skills
      data.looking_for = lookingFor
      data.weekly_hours_available = weeklyHours
    }

    const result = await updateProfile(data)
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return false
    }

    setIsLoading(false)
    return true
  }

  const handleNext = async () => {
    const saved = await saveProgress()
    if (saved) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleComplete = async () => {
    setIsLoading(true)
    setError(null)

    const data = {
      full_name: fullName,
      bio,
      university_id: universityId || null,
      department,
      academic_level: academicLevel || null,
      roles,
      research_interests: researchInterests,
      skills,
      looking_for: lookingFor,
      weekly_hours_available: weeklyHours,
    }

    const result = await completeOnboarding(data)
    
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-heading">ResearchFlow</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {step} of {STEPS.length}
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step >= s.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    className={`hidden sm:block w-16 lg:w-24 h-1 mx-2 rounded ${
                      step > s.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Tell us about yourself</CardTitle>
                <CardDescription>
                  Let&apos;s start with your basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself and your research interests..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be visible on your profile
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Academic Details */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Academic Details</CardTitle>
                <CardDescription>
                  Tell us about your academic background
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select value={universityId} onValueChange={setUniversityId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.name} ({uni.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department / Faculty</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Computer Science, Economics"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Academic Level</Label>
                  <Select value={academicLevel} onValueChange={(v) => setAcademicLevel(v as AcademicLevel)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Your Role(s)</Label>
                  <div className="space-y-3">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => toggleRole(role.value)}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          roles.includes(role.value)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">{role.label}</div>
                        <div className="text-sm text-muted-foreground">{role.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Research Interests */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Research Interests</CardTitle>
                <CardDescription>
                  Select or add your research areas (at least 1)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {RESEARCH_AREAS.map((area) => (
                    <Badge
                      key={area}
                      variant={researchInterests.includes(area) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(researchInterests, setResearchInterests, area)}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>

                {researchInterests.filter(i => !RESEARCH_AREAS.includes(i)).length > 0 && (
                  <div className="space-y-2">
                    <Label>Custom Interests</Label>
                    <div className="flex flex-wrap gap-2">
                      {researchInterests.filter(i => !RESEARCH_AREAS.includes(i)).map((interest) => (
                        <Badge key={interest} variant="secondary" className="gap-1">
                          {interest}
                          <button onClick={() => toggleArrayItem(researchInterests, setResearchInterests, interest)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add custom research area"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomItem(customInterest, researchInterests, setResearchInterests, setCustomInterest)
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => addCustomItem(customInterest, researchInterests, setResearchInterests, setCustomInterest)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Skills & Availability */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Skills & Availability</CardTitle>
                <CardDescription>
                  What skills do you bring, and what are you looking for?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Your Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={skills.includes(skill) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(skills, setSkills, skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder="Add custom skill"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomItem(customSkill, skills, setSkills, setCustomSkill)
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => addCustomItem(customSkill, skills, setSkills, setCustomSkill)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>What are you looking for in collaborators?</Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={lookingFor.includes(skill) ? 'secondary' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(lookingFor, setLookingFor, skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={customLookingFor}
                      onChange={(e) => setCustomLookingFor(e.target.value)}
                      placeholder="Add what you're looking for"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomItem(customLookingFor, lookingFor, setLookingFor, setCustomLookingFor)
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => addCustomItem(customLookingFor, lookingFor, setLookingFor, setCustomLookingFor)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Weekly hours available for collaboration</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="range"
                      min="1"
                      max="40"
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-16 text-center font-medium">{weeklyHours}h/week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-heading">You&apos;re all set!</CardTitle>
                <CardDescription>
                  Your profile is complete. Ready to start collaborating?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">University</span>
                    <span className="font-medium">
                      {universities.find(u => u.id === universityId)?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium capitalize">{academicLevel || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Research Areas</span>
                    <span className="font-medium">{researchInterests.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skills</span>
                    <span className="font-medium">{skills.length} selected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <Button onClick={handleNext} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                ) : null}
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                ) : null}
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
