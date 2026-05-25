'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Upload,
  GraduationCap,
  Briefcase,
  User,
  X,
  Search,
  Clock,
  Shield
} from 'lucide-react'
import { ALL_RESEARCH_INTERESTS, MENTOR_TIERS, type MentorTier } from '@/lib/data/research-data'

interface MentorVerificationProps {
  userId: string
  onComplete: () => void
  onSkip: () => void
}

export function MentorVerification({ userId, onComplete, onSkip }: MentorVerificationProps) {
  const router = useRouter()
  const [step, setStep] = useState<'tier' | 'details' | 'confirmation'>('tier')
  const [selectedTier, setSelectedTier] = useState<MentorTier | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form fields - Tier 1
  const [staffEmail, setStaffEmail] = useState('')
  const [staffId, setStaffId] = useState('')
  const [staffIdFile, setStaffIdFile] = useState<File | null>(null)
  const [facultyDepartment, setFacultyDepartment] = useState('')
  const [faculty, setFaculty] = useState('')
  
  // Form fields - Tier 2
  const [institutionalEmail, setInstitutionalEmail] = useState('')
  const [programme, setProgramme] = useState<'msc' | 'phd' | ''>('')
  const [supervisorName, setSupervisorName] = useState('')
  const [endorsementFile, setEndorsementFile] = useState<File | null>(null)
  
  // Form fields - Tier 3
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [professionalFile, setProfessionalFile] = useState<File | null>(null)
  
  // Common fields
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([])
  const [expertiseSearch, setExpertiseSearch] = useState('')
  const [availableSlots, setAvailableSlots] = useState(5)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredExpertise = expertiseSearch.trim() 
    ? ALL_RESEARCH_INTERESTS.filter(i => i.toLowerCase().includes(expertiseSearch.toLowerCase()))
    : ALL_RESEARCH_INTERESTS

  const toggleExpertise = (item: string) => {
    if (expertiseAreas.includes(item)) {
      setExpertiseAreas(expertiseAreas.filter(e => e !== item))
    } else {
      setExpertiseAreas([...expertiseAreas, item])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        setError('Please upload a JPG, PNG, or PDF file')
        return
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setter(file)
      setError(null)
    }
  }

  const validateTier1 = () => {
    if (!staffEmail.trim()) return 'Please enter your institutional staff email'
    if (!staffEmail.includes('@')) return 'Please enter a valid email address'
    if (!staffId.trim()) return 'Please enter your staff ID'
    if (!staffIdFile) return 'Please upload your staff ID card'
    if (!facultyDepartment.trim()) return 'Please enter your department'
    if (!faculty.trim()) return 'Please enter your faculty'
    if (expertiseAreas.length === 0) return 'Please select at least one expertise area'
    return null
  }

  const validateTier2 = () => {
    if (!institutionalEmail.trim()) return 'Please enter your institutional email'
    if (!institutionalEmail.includes('@')) return 'Please enter a valid email address'
    if (!programme) return 'Please select your programme'
    if (!supervisorName.trim()) return 'Please enter your supervisor name'
    if (!endorsementFile) return 'Please upload your supervisor endorsement letter'
    if (expertiseAreas.length === 0) return 'Please select at least one expertise area'
    return null
  }

  const validateTier3 = () => {
    if (!linkedinUrl.trim()) return 'Please enter your LinkedIn profile URL'
    if (!linkedinUrl.includes('linkedin.com')) return 'Please enter a valid LinkedIn URL'
    if (!jobTitle.trim()) return 'Please enter your job title'
    if (!organisation.trim()) return 'Please enter your organisation'
    if (!professionalFile) return 'Please upload a professional document'
    if (expertiseAreas.length === 0) return 'Please select at least one expertise area'
    return null
  }

  const handleSubmit = async () => {
    setError(null)
    
    // Validate based on tier
    let validationError: string | null = null
    if (selectedTier === 1) validationError = validateTier1()
    else if (selectedTier === 2) validationError = validateTier2()
    else if (selectedTier === 3) validationError = validateTier3()
    
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsLoading(true)
    
    try {
      // TODO: Submit mentor verification data to Supabase
      // This would include file uploads to Vercel Blob
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setStep('confirmation')
    } catch {
      setError('Failed to submit verification. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const tierIcons = {
    1: GraduationCap,
    2: User,
    3: Briefcase,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#05010F' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(139,92,246,0.12)', backgroundColor: 'rgba(5,1,15,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo variant="horizontal" width={160} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: '#7C3AED' }} />
            <span className="text-sm" style={{ color: '#7C6A9C' }}>Mentor Verification</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Select Tier */}
          {step === 'tier' && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Select Your Mentor Tier</CardTitle>
                <CardDescription style={{ color: '#7C6A9C' }}>
                  Choose the category that best describes you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {MENTOR_TIERS.map((tier) => {
                  const Icon = tierIcons[tier.tier]
                  return (
                    <button
                      key={tier.tier}
                      onClick={() => setSelectedTier(tier.tier)}
                      className="w-full p-5 rounded-xl text-left transition-all duration-200"
                      style={selectedTier === tier.tier
                        ? { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.5)', boxShadow: '0 0 20px rgba(124,58,237,0.2)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }
                      }
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={selectedTier === tier.tier
                            ? { background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 14px rgba(124,58,237,0.4)' }
                            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)' }
                          }
                        >
                          <Icon className="w-6 h-6" style={{ color: selectedTier === tier.tier ? '#F3F0FF' : '#7C6A9C' }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}>
                              Tier {tier.tier}
                            </span>
                          </div>
                          <div className="font-semibold text-lg mb-1" style={{ color: selectedTier === tier.tier ? '#C084FC' : '#F3F0FF' }}>
                            {tier.title}
                          </div>
                          <div className="text-sm mb-3" style={{ color: '#7C6A9C' }}>{tier.subtitle}</div>
                          <div className="space-y-1">
                            <div className="text-xs font-medium" style={{ color: '#7C6A9C' }}>Verified by:</div>
                            {tier.requirements.map((req, i) => (
                              <div key={i} className="text-xs flex items-center gap-1.5" style={{ color: '#7C6A9C' }}>
                                <span className="w-1 h-1 rounded-full" style={{ background: '#7C3AED' }} />
                                {req}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    style={{ color: '#7C6A9C' }}
                  >
                    Skip for now
                  </Button>
                  <Button
                    onClick={() => selectedTier && setStep('details')}
                    disabled={!selectedTier}
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 14px rgba(124,58,237,0.3)', border: 'none' }}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Enter Details */}
          {step === 'details' && selectedTier && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}>
                    Tier {selectedTier}
                  </span>
                  <span className="text-sm" style={{ color: '#7C6A9C' }}>
                    {MENTOR_TIERS.find(t => t.tier === selectedTier)?.title}
                  </span>
                </div>
                <CardTitle className="text-2xl font-heading" style={{ color: '#F3F0FF' }}>Verification Details</CardTitle>
                <CardDescription style={{ color: '#7C6A9C' }}>
                  Please provide the required information for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tier 1: Faculty */}
                {selectedTier === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>Institutional Staff Email *</Label>
                      <Input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="yourname@university.edu.ng"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>Staff ID *</Label>
                      <Input
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        placeholder="Enter your staff ID number"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>Staff ID Card Upload * (JPG, PNG, or PDF, max 5MB)</Label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
                        style={{ borderColor: staffIdFile ? 'rgba(34,197,94,0.5)' : 'rgba(139,92,246,0.3)', background: 'rgba(255,255,255,0.02)' }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileChange(e, setStaffIdFile)}
                          className="hidden"
                        />
                        {staffIdFile ? (
                          <div className="flex items-center justify-center gap-2" style={{ color: '#22C55E' }}>
                            <CheckCircle className="w-5 h-5" />
                            <span>{staffIdFile.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setStaffIdFile(null) }}>
                              <X className="w-4 h-4 hover:text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#7C6A9C' }} />
                            <p style={{ color: '#7C6A9C' }}>Click to upload or drag and drop</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label style={{ color: '#7C6A9C' }}>Department *</Label>
                        <Input
                          value={facultyDepartment}
                          onChange={(e) => setFacultyDepartment(e.target.value)}
                          placeholder="e.g., Biochemistry"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label style={{ color: '#7C6A9C' }}>Faculty *</Label>
                        <Input
                          value={faculty}
                          onChange={(e) => setFaculty(e.target.value)}
                          placeholder="e.g., Faculty of Science"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Tier 2: Postgraduate */}
                {selectedTier === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>Institutional Email *</Label>
                      <Input
                        type="email"
                        value={institutionalEmail}
                        onChange={(e) => setInstitutionalEmail(e.target.value)}
                        placeholder="yourname@university.edu.ng"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>Programme Enrolled *</Label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setProgramme('msc')}
                          className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all"
                          style={programme === 'msc' 
                            ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: '#C084FC' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', color: '#7C6A9C' }
                          }
                        >
                          MSc
                        </button>
                        <button
                          type="button"
                          onClick={() => setProgramme('phd')}
                          className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all"
                          style={programme === 'phd' 
                            ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: '#C084FC' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', color: '#7C6A9C' }
                          }
                        >
                          PhD
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>Supervisor Name *</Label>
                      <Input
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        placeholder="Dr. / Prof. Full Name"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>Supervisor Endorsement Letter * (PDF only, max 5MB)</Label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
                        style={{ borderColor: endorsementFile ? 'rgba(34,197,94,0.5)' : 'rgba(139,92,246,0.3)', background: 'rgba(255,255,255,0.02)' }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, setEndorsementFile)}
                          className="hidden"
                        />
                        {endorsementFile ? (
                          <div className="flex items-center justify-center gap-2" style={{ color: '#22C55E' }}>
                            <CheckCircle className="w-5 h-5" />
                            <span>{endorsementFile.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setEndorsementFile(null) }}>
                              <X className="w-4 h-4 hover:text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#7C6A9C' }} />
                            <p style={{ color: '#7C6A9C' }}>Click to upload or drag and drop</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Tier 3: Industry */}
                {selectedTier === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>LinkedIn Profile URL *</Label>
                      <Input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label style={{ color: '#7C6A9C' }}>Job Title *</Label>
                        <Input
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g., Senior Data Scientist"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label style={{ color: '#7C6A9C' }}>Organisation *</Label>
                        <Input
                          value={organisation}
                          onChange={(e) => setOrganisation(e.target.value)}
                          placeholder="e.g., Tech Company Ltd"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label style={{ color: '#7C6A9C' }}>Professional Document * (CV or Certificate, max 5MB)</Label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
                        style={{ borderColor: professionalFile ? 'rgba(34,197,94,0.5)' : 'rgba(139,92,246,0.3)', background: 'rgba(255,255,255,0.02)' }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileChange(e, setProfessionalFile)}
                          className="hidden"
                        />
                        {professionalFile ? (
                          <div className="flex items-center justify-center gap-2" style={{ color: '#22C55E' }}>
                            <CheckCircle className="w-5 h-5" />
                            <span>{professionalFile.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setProfessionalFile(null) }}>
                              <X className="w-4 h-4 hover:text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#7C6A9C' }} />
                            <p style={{ color: '#7C6A9C' }}>Click to upload or drag and drop</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Common fields: Expertise Areas */}
                <div className="space-y-4">
                  <div>
                    <Label style={{ color: '#F3F0FF' }}>Expertise Areas *</Label>
                    <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Select your areas of expertise for mentoring</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7C6A9C' }} />
                    <Input
                      value={expertiseSearch}
                      onChange={(e) => setExpertiseSearch(e.target.value)}
                      placeholder="Search expertise areas..."
                      className="pl-10"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                    />
                  </div>

                  <div className="text-sm" style={{ color: '#7C6A9C' }}>
                    {expertiseAreas.length} selected
                  </div>

                  <div className="max-h-48 overflow-y-auto pr-2 -mr-2">
                    <div className="flex flex-wrap gap-2">
                      {filteredExpertise.map((area) => (
                        <Badge
                          key={area}
                          className="cursor-pointer transition-all text-sm py-1.5 px-3"
                          onClick={() => toggleExpertise(area)}
                          style={expertiseAreas.includes(area)
                            ? { background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(168,85,247,0.6)', color: '#C084FC' }
                            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#7C6A9C' }
                          }
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Available Slots */}
                <div className="space-y-3">
                  <Label style={{ color: '#F3F0FF' }}>Available Mentorship Slots Per Month: {availableSlots}</Label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={availableSlots}
                    onChange={(e) => setAvailableSlots(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #7C3AED 0%, #7C3AED ${(availableSlots / 20) * 100}%, rgba(255,255,255,0.1) ${(availableSlots / 20) * 100}%, rgba(255,255,255,0.1) 100%)` }}
                  />
                  <div className="flex justify-between text-xs" style={{ color: '#7C6A9C' }}>
                    <span>1 slot</span>
                    <span>20 slots</span>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('tier')}
                    disabled={isLoading}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 14px rgba(124,58,237,0.3)', border: 'none' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit for Verification
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <CardContent className="py-12 text-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}
                >
                  <Clock className="w-10 h-10" style={{ color: '#06B6D4' }} />
                </div>
                <h2 className="text-3xl font-bold font-heading mb-3" style={{ color: '#F3F0FF' }}>
                  {selectedTier === 3 ? 'Under Manual Review' : 'Profile Under Review'}
                </h2>
                <p className="mb-8 max-w-md mx-auto" style={{ color: '#7C6A9C' }}>
                  {selectedTier === 3 
                    ? 'Your application is under manual review. This takes 24-48 hours. We will notify you by email once approved.'
                    : 'Your mentor profile is under review. You will be notified within 24 hours once verified. In the meantime, you can complete your researcher or collaborator profile.'
                  }
                </p>

                <Button
                  onClick={onComplete}
                  className="h-12 px-8 text-base"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none' }}
                >
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
