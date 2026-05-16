'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  GraduationCap, 
  Target, 
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Loader2,
  CheckCircle,
  Search
} from 'lucide-react'
import type { Profile, University, AcademicLevel } from '@/lib/types/database'
import { completeOnboarding, updateProfile } from '@/lib/actions/auth'
import { USER_ROLES, type ExtendedUserRole } from '@/lib/data/research-data'
import { TagInput } from '@/components/ui/tag-input'
import { RESEARCH_AREAS, SKILLS_LIST, LOOKING_FOR_OPTIONS } from '@/lib/constants/tags'
import { COUNTRIES, ALL_NIGERIAN_UNIVERSITIES } from '@/lib/data/universities'

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Academic Details', icon: GraduationCap },
  { id: 3, title: 'Research Interests', icon: Target },
  { id: 4, title: 'Skills & Looking For', icon: Clock },
  { id: 5, title: 'Complete', icon: CheckCircle },
]

const ACADEMIC_LEVELS: { value: AcademicLevel; label: string }[] = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'masters', label: 'Masters' },
  { value: 'phd', label: 'PhD' },
  { value: 'postdoc', label: 'Postdoc' },
  { value: 'faculty', label: 'Faculty' },
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
  const [country, setCountry] = useState('Nigeria')
  const [customUniversity, setCustomUniversity] = useState('')
  const isNigeria = country === 'Nigeria'
  const [department, setDepartment] = useState(initialProfile?.department || '')
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel | ''>(initialProfile?.academic_level || '')
  const [roles, setRoles] = useState<ExtendedUserRole[]>((initialProfile?.roles as ExtendedUserRole[]) || ['student_researcher'])
  const [researchInterests, setResearchInterests] = useState<string[]>(initialProfile?.research_interests || [])
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || [])
  const [lookingFor, setLookingFor] = useState<string[]>(initialProfile?.looking_for || [])
  const [weeklyHours, setWeeklyHours] = useState(initialProfile?.weekly_hours_available || 10)
  const [customInterest, setCustomInterest] = useState('')
  const [customSkill, setCustomSkill] = useState('')
  const [customLookingFor, setCustomLookingFor] = useState('')
  
  // Search filters
  const [interestSearch, setInterestSearch] = useState('')
  const [skillSearch, setSkillSearch] = useState('')
  const [lookingForSearch, setLookingForSearch] = useState('')

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  // Filtered lists based on search
  const filteredInterests = useMemo(() => {
    if (!interestSearch.trim()) return ALL_RESEARCH_INTERESTS
    return ALL_RESEARCH_INTERESTS.filter(i => i.toLowerCase().includes(interestSearch.toLowerCase()))
  }, [interestSearch])

  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) return SKILLS_OFFERED
    return SKILLS_OFFERED.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()))
  }, [skillSearch])

  const filteredLookingFor = useMemo(() => {
    if (!lookingForSearch.trim()) return COLLABORATOR_TYPES
    return COLLABORATOR_TYPES.filter(c => c.toLowerCase().includes(lookingForSearch.toLowerCase()))
  }, [lookingForSearch])

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

  const toggleRole = (role: ExtendedUserRole) => {
    if (role === 'all') {
      // If selecting 'all', set all roles
      if (roles.includes('all')) {
        setRoles(['student_researcher'])
      } else {
        setRoles(['student_researcher', 'collaborator', 'technical_expert', 'mentor', 'all'])
      }
    } else {
      if (roles.includes(role)) {
        // Don't allow deselecting if it's the last role
        const filteredRoles = roles.filter(r => r !== role && r !== 'all')
        if (filteredRoles.length > 0) {
          setRoles(filteredRoles)
        }
      } else {
        // Add the role
        const newRoles = [...roles.filter(r => r !== 'all'), role]
        // Check if all individual roles are now selected
        if (['student_researcher', 'collaborator', 'technical_expert', 'mentor'].every(r => newRoles.includes(r as ExtendedUserRole))) {
          setRoles([...newRoles, 'all'])
        } else {
          setRoles(newRoles)
        }
      }
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
      // For Nigeria, use universityId as the university name; for others, use customUniversity
      const universityName = isNigeria ? universityId : customUniversity
      data.university_id = universityName || null
      data.department = department
      data.academic_level = academicLevel || null
      // Filter out 'all' role for storage
      data.roles = roles.filter(r => r !== 'all')
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
    // Validation
    if (step === 1 && !fullName.trim()) {
      setError('Please enter your full name')
      return
    }
    if (step === 2) {
      // Validate university selection
      const hasUniversity = isNigeria ? universityId.trim() : customUniversity.trim()
      if (!hasUniversity) {
        setError('Please select or enter your university')
        return
      }
    }
    if (step === 3 && researchInterests.length === 0) {
      setError('Please select at least one research interest')
      return
    }
    if (step === 4 && lookingFor.length === 0) {
      setError('Please select at least one thing you are looking for in collaborators')
      return
    }

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

    const universityName = isNigeria ? universityId : customUniversity
    const data = {
      full_name: fullName,
      bio,
      university_id: universityName || null,
      department,
      academic_level: academicLevel || null,
      roles: roles.filter(r => r !== 'all'),
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

  // Check if mentor is selected
  const isMentorSelected = roles.includes('mentor') || roles.includes('all')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#05010F' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(139,92,246,0.12)', backgroundColor: 'rgba(5,1,15,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              <Image src="/icon.svg" alt="ResearchFlow" width={36} height={36} className="w-9 h-9" />
            </div>
            <span className="text-xl font-bold font-heading gradient-text-cyan">ResearchFlow</span>
          </Link>
          <div className="text-sm" style={{ color: '#7C6A9C' }}>
            Step {step} of {STEPS.length}
          </div>
        </div>
      </header>

      {/* Progress */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                  style={step >= s.id
                    ? { background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF', boxShadow: '0 0 14px rgba(124,58,237,0.4)' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#7C6A9C', border: '1px solid rgba(139,92,246,0.2)' }
                  }
                >
                  <s.icon className="w-5 h-5" />
                </div>
                {index < STEPS.length - 1 && (
                  <div 
                    className="hidden sm:block w-16 lg:w-24 h-0.5 mx-2 rounded transition-all duration-300"
                    style={{ background: step > s.id ? 'linear-gradient(90deg,#7C3AED,#A855F7)' : 'rgba(255,255,255,0.06)' }}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7C3AED,#06B6D4)', boxShadow: '2px 0 8px rgba(124,58,237,0.5)' }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Tell us about yourself</CardTitle>
                <CardDescription style={{ color: '#7C6A9C' }}>
                  Let&apos;s start with your basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" style={{ color: '#7C6A9C' }}>Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" style={{ color: '#7C6A9C' }}>Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself and your research interests..."
                    rows={4}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                  />
                  <p className="text-xs" style={{ color: '#7C6A9C' }}>
                    This will be visible on your profile
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Academic Details & Roles */}
          {step === 2 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Academic Details & Roles</CardTitle>
                <CardDescription style={{ color: '#7C6A9C' }}>
                  Tell us about your academic background and how you want to participate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Country Selection */}
                <div className="space-y-2">
                  <Label style={{ color: '#7C6A9C' }}>Country *</Label>
                  <Select value={country} onValueChange={(val) => { setCountry(val); setUniversityId(''); setCustomUniversity('') }}>
                    <SelectTrigger style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* University Selection - Different UI based on country */}
                <div className="space-y-2">
                  <Label style={{ color: '#7C6A9C' }}>University / Institution *</Label>
                  {isNigeria ? (
                    <Select value={universityId} onValueChange={setUniversityId}>
                      <SelectTrigger style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
                        <SelectValue placeholder="Select your university" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {ALL_NIGERIAN_UNIVERSITIES.map((uni) => (
                          <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={customUniversity}
                      onChange={(e) => setCustomUniversity(e.target.value)}
                      placeholder="Enter your university name"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                    />
                  )}
                  <p className="text-xs" style={{ color: '#7C6A9C' }}>
                    {isNigeria 
                      ? 'Select from the list of Nigerian universities'
                      : 'Enter the full name of your institution'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" style={{ color: '#7C6A9C' }}>Department / Faculty</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Computer Science, Medicine"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#7C6A9C' }}>Academic Level</Label>
                  <Select value={academicLevel} onValueChange={(v) => setAcademicLevel(v as AcademicLevel)}>
                    <SelectTrigger style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
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
                  <Label style={{ color: '#7C6A9C' }}>Your Role(s) - Select all that apply</Label>
                  <div className="space-y-3">
                    {USER_ROLES.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => toggleRole(role.value)}
                        className="w-full p-4 rounded-xl text-left transition-all duration-200"
                        style={roles.includes(role.value)
                          ? { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.5)', boxShadow: '0 0 16px rgba(124,58,237,0.15)' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0"
                            style={roles.includes(role.value)
                              ? { background: 'linear-gradient(135deg,#7C3AED,#A855F7)', borderColor: 'transparent' }
                              : { borderColor: 'rgba(139,92,246,0.4)' }
                            }
                          >
                            {roles.includes(role.value) && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: roles.includes(role.value) ? '#C084FC' : '#F3F0FF' }}>
                              {role.label}
                            </div>
                            <div className="text-sm mt-0.5" style={{ color: '#7C6A9C' }}>{role.description}</div>
                            {role.value === 'mentor' && roles.includes('mentor') && (
                              <div className="text-xs mt-2 px-2 py-1 rounded inline-block" style={{ background: 'rgba(6,182,212,0.15)', color: '#06B6D4' }}>
                                You&apos;ll complete mentor verification after onboarding
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Research Interests */}
          {step === 3 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Research Interests</CardTitle>
                <CardDescription style={{ color: '#7C6A9C' }}>
                  Select your research areas or type to add a custom one (at least 1 required)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TagInput
                  value={researchInterests}
                  onChange={setResearchInterests}
                  options={RESEARCH_AREAS}
                  placeholder="Search research areas..."
                  maxItems={10}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Skills & Looking For */}
          {step === 4 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Skills & Collaborators</CardTitle>
                <CardDescription style={{ color: '#7C6A9C' }}>
                  What skills do you have, and what are you looking for?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Your Skills */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-lg font-medium" style={{ color: '#F3F0FF' }}>Your Skills</Label>
                    <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Select the skills you can offer, or type to add a custom skill</p>
                  </div>
                  <TagInput
                    value={skills}
                    onChange={setSkills}
                    options={SKILLS_LIST}
                    placeholder="Search skills..."
                    maxItems={15}
                  />
                </div>

                {/* Divider */}
                <div className="h-px" style={{ background: 'rgba(139,92,246,0.2)' }} />

                {/* Looking For */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-lg font-medium" style={{ color: '#F3F0FF' }}>What are you looking for in collaborators? *</Label>
                    <p className="text-sm mt-1" style={{ color: lookingFor.length === 0 ? '#EF4444' : '#7C6A9C' }}>
                      {lookingFor.length === 0 ? 'At least 1 required' : `${lookingFor.length} selected`}
                    </p>
                  </div>
                  <TagInput
                    value={lookingFor}
                    onChange={setLookingFor}
                    options={LOOKING_FOR_OPTIONS}
                    placeholder="Search collaborator types..."
                    maxItems={10}
                  />
                </div>

                {/* Divider */}
                <div className="h-px" style={{ background: 'rgba(139,92,246,0.2)' }} />

                {/* Weekly Hours */}
                <div className="space-y-3">
                  <Label style={{ color: '#F3F0FF' }}>Weekly Hours Available: {weeklyHours} hours</Label>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #7C3AED 0%, #7C3AED ${(weeklyHours / 40) * 100}%, rgba(255,255,255,0.1) ${(weeklyHours / 40) * 100}%, rgba(255,255,255,0.1) 100%)` }}
                  />
                  <div className="flex justify-between text-xs" style={{ color: '#7C6A9C' }}>
                    <span>1 hour</span>
                    <span>40 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardContent className="py-12 text-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold font-heading mb-3" style={{ color: '#F3F0FF' }}>You&apos;re all set!</h2>
                <p className="mb-8 max-w-md mx-auto" style={{ color: '#7C6A9C' }}>
                  Your profile is complete. {isMentorSelected && "You'll be prompted to complete mentor verification next. "}
                  Start exploring research ideas, connecting with collaborators, and building your research journey.
                </p>

                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="h-12 px-8 text-base"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Setting up your profile...
                    </>
                  ) : (
                    <>
                      {isMentorSelected ? 'Continue to Mentor Verification' : 'Go to Dashboard'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1 || isLoading}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={isLoading}
                style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 14px rgba(124,58,237,0.3)', border: 'none' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
