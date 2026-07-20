'use client'

import { useState, useEffect, useRef } from 'react'
import { celebrateAchievement } from '@/lib/utils/confetti'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  GraduationCap,
  Target,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Sparkles,
  Search,
  ChevronDown,
  X,
} from 'lucide-react'
import type { Profile, University, AcademicLevel } from '@/lib/types/database'
import { completeOnboarding, updateProfile } from '@/lib/actions/auth'
import { USER_ROLES, type ExtendedUserRole } from '@/lib/data/research-data'
import { COUNTRIES, ALL_NIGERIAN_UNIVERSITIES } from '@/lib/data/universities'
import ChipSelector from '@/components/ui/chip-selector'
import {
  RESEARCH_AREAS, RESEARCH_AREAS_FEATURED,
  SKILLS_OFFERED, SKILLS_FEATURED,
  COLLABORATOR_TYPES, COLLABORATOR_TYPES_FEATURED,
} from '@/lib/constants/onboarding'

import { createClient } from '@/lib/supabase/client'

// ── University picker ─────────────────────────────────────────────────────────

interface UniOption {
  id: string
  name: string
  university_type: string | null
}

interface UniversityPickerProps {
  value: string
  onChange: (name: string) => void
}

function UniversityPicker({ value, onChange }: UniversityPickerProps) {
  const [search, setSearch] = useState('')
  const [universities, setUniversities] = useState<UniOption[]>([])
  const [filtered, setFiltered] = useState<UniOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUniversities()
  }, [])

  useEffect(() => {
    if (!universities.length) return

    const q = search.trim().toLowerCase()

    if (q.length === 0) {
      setFiltered(universities.slice(0, 8))
      return
    }

    const results = universities.filter(u => u.name.toLowerCase().includes(q))

    const sorted = results.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aStarts = aName.startsWith(q)
      const bStarts = bName.startsWith(q)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return aName.localeCompare(bName)
    })

    setFiltered(sorted.slice(0, 15))
  }, [search, universities])

  async function loadUniversities() {
    setLoading(true)
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, university_type')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) console.error('Failed to load universities:', error.message)

    const list = (data || []) as UniOption[]
    // Fall back to static list if DB is empty
    if (list.length === 0) {
      const fallback: UniOption[] = ALL_NIGERIAN_UNIVERSITIES.map((name, i) => ({
        id: `static-${i}`,
        name,
        university_type: null,
      }))
      setUniversities(fallback)
      setFiltered(fallback.slice(0, 8))
    } else {
      setUniversities(list)
      setFiltered(list.slice(0, 8))
    }
    setLoading(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(168,85,247,0.7)' : '1px solid rgba(139,92,246,0.25)',
          color: value ? '#F3F0FF' : 'var(--muted-foreground)',
          boxShadow: open ? '0 0 0 2px rgba(124,58,237,0.15)' : 'none',
        }}
      >
        <span className="truncate">{value || 'Search for your university...'}</span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {value && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange('') }}
              className="p-0.5 rounded text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className="w-4 h-4 text-muted-foreground transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-xl overflow-hidden"
          style={{ background: '#120C28', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          {/* Search */}
          <div className="p-2" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  color: '#F3F0FF',
                }}
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading universities...
              </div>
            ) : search.length > 0 && search.length < 2 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Keep typing to search...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No university found for &ldquo;{search}&rdquo;
              </div>
            ) : (
              filtered.map((uni) => (
                <button
                  key={uni.id}
                  type="button"
                  onClick={() => { onChange(uni.name); setSearch(''); setOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-2"
                  style={{
                    color: value === uni.name ? '#C084FC' : '#F3F0FF',
                    background: value === uni.name ? 'rgba(124,58,237,0.15)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (value !== uni.name) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (value !== uni.name) (e.currentTarget as HTMLElement).style.background = value === uni.name ? 'rgba(124,58,237,0.15)' : 'transparent' }}
                >
                  <span className="truncate font-medium">{uni.name}</span>
                  {uni.university_type && (
                    <span
                      className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0"
                      style={
                        uni.university_type === 'federal'
                          ? { background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }
                          : uni.university_type === 'state'
                          ? { background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }
                          : { background: 'rgba(168,85,247,0.15)', color: '#C084FC' }
                      }
                    >
                      {uni.university_type}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className="px-3 py-2 text-xs"
            style={{ borderTop: '1px solid rgba(139,92,246,0.15)', color: 'var(--muted-foreground)' }}
          >
            {universities.length} universities available
          </div>
        </div>
      )}
    </div>
  )
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Academic Details', icon: GraduationCap },
  { id: 3, title: 'Research Interests', icon: Target },
  { id: 4, title: 'Skills & Looking For', icon: Clock },
  { id: 5, title: 'Research Identity', icon: Sparkles },
  { id: 6, title: 'Complete', icon: CheckCircle },
]

const ACADEMIC_LEVELS: { value: AcademicLevel; label: string }[] = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'masters', label: 'Masters' },
  { value: 'phd', label: 'PhD' },
  { value: 'postdoc', label: 'Postdoc' },
  { value: 'faculty', label: 'Faculty' },
]

// ── Main wizard ───────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  initialProfile: Profile | null
  universities: University[]
}

export function OnboardingWizard({ initialProfile, universities }: OnboardingWizardProps) {
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
  const [profileBackground, setProfileBackground] = useState<'baobab' | 'constellation'>(
    (initialProfile?.profile_background as 'baobab' | 'constellation') ?? 'baobab'
  )

  function toggleChip(arr: string[], setArr: (v: string[]) => void, max: number, item: string) {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item))
    } else if (arr.length < max) {
      setArr([...arr, item])
    }
  }

  function addCustomChip(arr: string[], setArr: (v: string[]) => void, max: number, item: string) {
    if (!arr.includes(item) && arr.length < max) setArr([...arr, item])
  }

  const toggleRole = (role: ExtendedUserRole) => {
    if (role === 'all') {
      if (roles.includes('all')) {
        setRoles(['student_researcher'])
      } else {
        setRoles(['student_researcher', 'collaborator', 'technical_expert', 'mentor', 'all'])
      }
    } else {
      if (roles.includes(role)) {
        const filtered = roles.filter(r => r !== role && r !== 'all')
        if (filtered.length > 0) setRoles(filtered)
      } else {
        const newRoles = [...roles.filter(r => r !== 'all'), role]
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

    const data: Record<string, unknown> = { onboarding_step: step }

    if (step >= 1) { data.full_name = fullName; data.bio = bio }
    if (step >= 2) {
      data.university_id = (isNigeria ? universityId : customUniversity) || null
      data.department = department
      data.academic_level = academicLevel || null
      data.roles = roles.filter(r => r !== 'all')
    }
    if (step >= 3) { data.research_interests = researchInterests }
    if (step >= 4) {
      data.skills = skills
      data.looking_for = lookingFor
      data.weekly_hours_available = weeklyHours
    }
    if (step >= 5) { data.profile_background = profileBackground }

    const result = await updateProfile(data)
    if (result.error) { setError(result.error); setIsLoading(false); return false }
    setIsLoading(false)
    return true
  }

  const handleNext = async () => {
    if (step === 1 && !fullName.trim()) { setError('Please enter your full name'); return }
    if (step === 2) {
      const hasUniversity = isNigeria ? universityId.trim() : customUniversity.trim()
      if (!hasUniversity) { setError('Please select or enter your university'); return }
    }
    if (step === 3 && researchInterests.length === 0) { setError('Please select at least one research interest'); return }
    if (step === 4 && lookingFor.length === 0) { setError('Please select at least one thing you are looking for in collaborators'); return }
    // step 5 (identity) always valid — has default value

    const saved = await saveProgress()
    if (saved) setStep(step + 1)
  }

  const handleBack = () => setStep(step - 1)

  const handleComplete = async () => {
    setIsLoading(true)
    setError(null)

    const result = await completeOnboarding({
      full_name: fullName,
      bio,
      university_id: (isNigeria ? universityId : customUniversity) || null,
      department,
      academic_level: academicLevel || null,
      roles: roles.filter(r => r !== 'all'),
      research_interests: researchInterests,
      skills,
      looking_for: lookingFor,
      weekly_hours_available: weeklyHours,
      profile_background: profileBackground,
    })

    if (result?.error) { setError(result.error); setIsLoading(false) }
    else if (result?.redirectTo) { celebrateAchievement(); window.location.href = result.redirectTo }
  }

  const isMentorSelected = roles.includes('mentor') || roles.includes('all')
  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#05010F' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(139,92,246,0.12)', backgroundColor: 'rgba(5,1,15,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo variant="horizontal" width={160} />
          </Link>
          <div className="text-sm text-muted-foreground">Step {step} of {STEPS.length}</div>
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
                    : { background: 'rgba(255,255,255,0.05)', color: 'var(--muted-foreground)', border: '1px solid rgba(139,92,246,0.2)' }
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
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7C3AED,#06B6D4)', boxShadow: '2px 0 8px rgba(124,58,237,0.3)' }} />
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
                <CardDescription className="text-muted-foreground">Let&apos;s start with your basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-muted-foreground">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-muted-foreground">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself and your research interests..."
                    rows={4}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                  />
                  <p className="text-xs text-muted-foreground">This will be visible on your profile</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Academic Details & Roles */}
          {step === 2 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Academic Details & Roles</CardTitle>
                <CardDescription className="text-muted-foreground">Tell us about your academic background and how you want to participate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Country *</Label>
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

                <div className="space-y-2">
                  <Label className="text-muted-foreground">University / Institution *</Label>
                  {isNigeria ? (
                    <UniversityPicker
                      value={universityId}
                      onChange={setUniversityId}
                    />
                  ) : (
                    <Input
                      value={customUniversity}
                      onChange={(e) => setCustomUniversity(e.target.value)}
                      placeholder="Enter your university name"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {isNigeria ? 'Select from the list of Nigerian universities' : 'Enter the full name of your institution'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-muted-foreground">Department / Faculty</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Computer Science, Medicine"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Academic Level</Label>
                  <Select value={academicLevel} onValueChange={(v) => setAcademicLevel(v as AcademicLevel)}>
                    <SelectTrigger style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-muted-foreground">Your Role(s) - Select all that apply</Label>
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
                            <div className="text-sm mt-0.5 text-muted-foreground">{role.description}</div>
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
                <CardDescription className="text-muted-foreground">
                  Select your research areas (up to 10). Tap &quot;+ Other&quot; to search or add a custom one.
                  {researchInterests.length > 0 && <span style={{ color: '#A855F7' }}> {researchInterests.length} selected</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChipSelector
                  featuredOptions={RESEARCH_AREAS_FEATURED}
                  allOptions={RESEARCH_AREAS}
                  selected={researchInterests}
                  maxSelections={10}
                  onToggle={(item) => toggleChip(researchInterests, setResearchInterests, 10, item)}
                  onAddCustom={(item) => addCustomChip(researchInterests, setResearchInterests, 10, item)}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Skills & Looking For */}
          {step === 4 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Skills & Collaborators</CardTitle>
                <CardDescription className="text-muted-foreground">What skills do you have, and what are you looking for?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Your Skills */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-lg font-medium" style={{ color: '#F3F0FF' }}>Your Skills</Label>
                    <p className="text-sm mt-1 text-muted-foreground">
                      Select skills you can offer (up to 15). Tap &quot;+ Other&quot; to add a custom skill.
                      {skills.length > 0 && <span style={{ color: '#A855F7' }}> {skills.length} selected</span>}
                    </p>
                  </div>
                  <ChipSelector
                    featuredOptions={SKILLS_FEATURED}
                    allOptions={SKILLS_OFFERED}
                    selected={skills}
                    maxSelections={15}
                    onToggle={(item) => toggleChip(skills, setSkills, 15, item)}
                    onAddCustom={(item) => addCustomChip(skills, setSkills, 15, item)}
                  />
                </div>

                <div className="h-px" style={{ background: 'rgba(139,92,246,0.2)' }} />

                {/* Looking For */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-lg font-medium" style={{ color: '#F3F0FF' }}>What are you looking for in collaborators? *</Label>
                    <p className="text-sm mt-1" style={{ color: lookingFor.length === 0 ? '#EF4444' : 'var(--muted-foreground)' }}>
                      {lookingFor.length === 0
                        ? 'At least 1 required — tap any pill to select'
                        : <span style={{ color: '#A855F7' }}>{lookingFor.length} selected</span>
                      }
                    </p>
                  </div>
                  <ChipSelector
                    featuredOptions={COLLABORATOR_TYPES_FEATURED}
                    allOptions={COLLABORATOR_TYPES}
                    selected={lookingFor}
                    maxSelections={10}
                    onToggle={(item) => toggleChip(lookingFor, setLookingFor, 10, item)}
                    onAddCustom={(item) => addCustomChip(lookingFor, setLookingFor, 10, item)}
                  />
                </div>

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
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 hour</span>
                    <span>40 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Research Identity */}
          {step === 5 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Choose Your Research Identity</CardTitle>
                <CardDescription className="text-muted-foreground">This will become the animated background on your public profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Baobab option */}
                  <button
                    type="button"
                    onClick={() => setProfileBackground('baobab')}
                    className="p-5 rounded-xl text-left transition-all duration-200 space-y-3"
                    style={profileBackground === 'baobab'
                      ? { background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(168,85,247,0.7)', boxShadow: '0 0 20px rgba(124,58,237,0.2)' }
                      : { background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(139,92,246,0.2)' }
                    }
                  >
                    {/* Baobab mini SVG preview */}
                    <div className="w-full h-28 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: '#05010F' }}>
                      <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
                        <defs>
                          <linearGradient id="ob-trunk" x1="55" y1="30" x2="55" y2="90" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#5B21B6"/>
                            <stop offset="100%" stopColor="#2E1065"/>
                          </linearGradient>
                        </defs>
                        <radialGradient id="ob-glow" cx="55" cy="90" r="30" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
                        </radialGradient>
                        <circle cx="55" cy="88" r="28" fill="url(#ob-glow)"/>
                        <polygon points="48,32 62,32 66,90 44,90" fill="url(#ob-trunk)"/>
                        {/* branches */}
                        <line x1="55" y1="32" x2="22" y2="14" stroke="#7C3AED" strokeWidth="3"/>
                        <line x1="55" y1="32" x2="55" y2="8" stroke="#7C3AED" strokeWidth="3"/>
                        <line x1="55" y1="32" x2="88" y2="14" stroke="#7C3AED" strokeWidth="3"/>
                        {/* nodes */}
                        <circle cx="22" cy="14" r="7" fill="#8B5CF6"/>
                        <circle cx="55" cy="8" r="9" fill="#FBBF24"/>
                        <circle cx="88" cy="14" r="7" fill="#A855F7"/>
                        {/* arcs */}
                        <path d="M22,14 Q38,4 55,8" stroke="rgba(196,181,253,0.5)" strokeWidth="1.2" fill="none"/>
                        <path d="M55,8 Q72,4 88,14" stroke="rgba(196,181,253,0.5)" strokeWidth="1.2" fill="none"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: profileBackground === 'baobab' ? '#C084FC' : '#F3F0FF' }}>
                        The Baobab
                      </p>
                      <p className="text-xs mt-1 leading-relaxed text-muted-foreground">
                        Growing from strong roots. Your profile reflects your place in the African research ecosystem — branches represent your fields, nodes your connections.
                      </p>
                    </div>
                  </button>

                  {/* Constellation option */}
                  <button
                    type="button"
                    onClick={() => setProfileBackground('constellation')}
                    className="p-5 rounded-xl text-left transition-all duration-200 space-y-3"
                    style={profileBackground === 'constellation'
                      ? { background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(168,85,247,0.7)', boxShadow: '0 0 20px rgba(124,58,237,0.2)' }
                      : { background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(139,92,246,0.2)' }
                    }
                  >
                    {/* Constellation mini SVG preview */}
                    <div className="w-full h-28 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: '#030812' }}>
                      <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
                        {/* bg stars */}
                        {[[15,12],[90,8],[8,70],[100,65],[50,80],[30,45],[85,40]].map(([x,y],i) => (
                          <circle key={i} cx={x} cy={y} r="0.8" fill="white" opacity="0.25"/>
                        ))}
                        {/* lines */}
                        <line x1="35" y1="18" x2="75" y2="38" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2"/>
                        <line x1="75" y1="38" x2="55" y2="68" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2"/>
                        <line x1="55" y1="68" x2="35" y2="18" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2"/>
                        {/* stars */}
                        <circle cx="35" cy="18" r="6" fill="#FBBF24" opacity="0.9"/>
                        <circle cx="35" cy="18" r="2.5" fill="white"/>
                        <circle cx="75" cy="38" r="5" fill="#67E8F9" opacity="0.9"/>
                        <circle cx="75" cy="38" r="2" fill="white"/>
                        <circle cx="55" cy="68" r="4.5" fill="#C4B5FD" opacity="0.9"/>
                        <circle cx="55" cy="68" r="1.8" fill="white"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: profileBackground === 'constellation' ? '#C084FC' : '#F3F0FF' }}>
                        The Constellation
                      </p>
                      <p className="text-xs mt-1 leading-relaxed text-muted-foreground">
                        Reaching for new frontiers. Your profile becomes your mark on the research universe — each star a field you&apos;re exploring, each line a connection you&apos;ve forged.
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Complete */}
          {step === 6 && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardContent className="py-12 text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold font-heading mb-3" style={{ color: '#F3F0FF' }}>You&apos;re all set!</h2>
                <p className="mb-8 max-w-md mx-auto text-muted-foreground">
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
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Setting up your profile...</>
                  ) : (
                    <>{isMentorSelected ? 'Continue to Mentor Verification' : 'Go to Dashboard'}<ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          {step < 6 && (
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
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  <>Next<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
