'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, ArrowRight, Plus, Trash2, Search, CheckCircle, FileText, Users, Scale, Send } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Project Details', icon: FileText },
  { id: 2, label: 'Co-authors', icon: Users },
  { id: 3, label: 'Terms', icon: Scale },
  { id: 4, label: 'Review & Send', icon: Send },
]

export default function NewAgreementPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: '',
    project_title: '',
    research_objectives: '',
    methodology: '',
    expected_outputs: '',
    start_date: '',
    end_date: '',
    intellectual_property_terms:
      'All intellectual property created during this research project shall be jointly owned by all co-authors in proportion to their contributions as outlined in this agreement.',
    publication_order: '',
    dispute_resolution:
      'Any disputes arising from this agreement shall first be addressed through good-faith negotiation between all parties. If unresolved within 30 days, disputes shall be referred to mediation.',
    additional_terms: '',
  })

  const [coauthors, setCoauthors] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
  }, [])

  async function searchResearchers(query: string) {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, department, university_id')
      .ilike('full_name', `%${query}%`)
      .eq('onboarding_completed', true)
      .neq('id', currentUser?.id)
      .limit(5)

    setSearchResults(data || [])
  }

  function addCoauthor(researcher: any) {
    if (coauthors.find(c => c.id === researcher.id)) return
    setCoauthors(prev => [...prev, {
      ...researcher,
      role: 'Co-author',
      contribution: '',
      authorship_position: prev.length + 2,
    }])
    setSearchQuery('')
    setSearchResults([])
  }

  function removeCoauthor(id: string) {
    setCoauthors(prev => prev.filter(c => c.id !== id))
  }

  function updateCoauthor(id: string, field: string, value: any) {
    setCoauthors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.project_title.trim()) {
      setError('Title and project title required')
      return
    }

    setLoading(true)
    setError('')

    const { data: agreement, error: agreementError } = await supabase
      .from('coauthorship_agreements')
      .insert({
        ...formData,
        initiator_id: currentUser.id,
        status: coauthors.length > 0 ? 'pending' : 'draft',
      })
      .select()
      .single()

    if (agreementError || !agreement) {
      setError(agreementError?.message || 'Failed to create agreement')
      setLoading(false)
      return
    }

    if (coauthors.length > 0) {
      await supabase
        .from('coauthorship_signatories')
        .insert(
          coauthors.map(c => ({
            agreement_id: agreement.id,
            user_id: c.id,
            role: c.role,
            contribution: c.contribution,
            authorship_position: c.authorship_position,
            has_signed: false,
          }))
        )

      for (const coauthor of coauthors) {
        await supabase
          .from('notifications')
          .insert({
            user_id: coauthor.id,
            type: 'coauthorship_invite',
            title: 'Co-authorship agreement',
            message: `You have been invited to sign a co-authorship agreement for "${formData.project_title}"`,
            link: `/agreements/${agreement.id}`,
            is_read: false,
          })
      }
    }

    router.push(`/agreements/${agreement.id}`)
  }

  const canProceed = () => {
    if (step === 1) return formData.title.trim() && formData.project_title.trim()
    return true
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">New Co-authorship Agreement</h1>
        <p className="text-muted-foreground">Formalize your research collaboration</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
              ${step === s.id
                ? 'bg-primary text-primary-foreground'
                : step > s.id
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
              }`}>
              {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
            </div>
            <span className={`text-xs hidden sm:block ${step === s.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Project Details */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="font-semibold">Agreement Title *</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Co-authorship Agreement for Climate Research"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Research Project Title *</Label>
            <Input
              value={formData.project_title}
              onChange={e => setFormData(prev => ({ ...prev, project_title: e.target.value }))}
              placeholder="The actual title of your research"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Research Objectives</Label>
            <Textarea
              value={formData.research_objectives}
              onChange={e => setFormData(prev => ({ ...prev, research_objectives: e.target.value }))}
              placeholder="What are the main goals of this research?"
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Methodology</Label>
            <Textarea
              value={formData.methodology}
              onChange={e => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
              placeholder="How will the research be conducted?"
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Expected Outputs</Label>
            <Textarea
              value={formData.expected_outputs}
              onChange={e => setFormData(prev => ({ ...prev, expected_outputs: e.target.value }))}
              placeholder="e.g. Journal paper, conference presentation, dataset"
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold">Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Co-authors */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
            <p className="font-semibold text-primary mb-1">You are Author #1</p>
            <p className="text-muted-foreground">
              Search for and add your co-authors below. You can add up to 10 co-authors.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Search Co-authors</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  searchResearchers(e.target.value)
                }}
                placeholder="Search by name..."
                className="pl-9"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addCoauthor(r)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 text-left"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={r.avatar_url} />
                      <AvatarFallback>{r.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">{r.department}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary ml-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {coauthors.length > 0 && (
            <div className="space-y-3">
              <Label className="font-semibold">Co-authors ({coauthors.length})</Label>
              {coauthors.map((c, i) => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={c.avatar_url} />
                        <AvatarFallback>{c.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">Author #{i + 2}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCoauthor(c.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Role</Label>
                      <Input
                        value={c.role}
                        onChange={e => updateCoauthor(c.id, 'role', e.target.value)}
                        placeholder="e.g. Co-investigator"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Contribution</Label>
                      <Input
                        value={c.contribution}
                        onChange={e => updateCoauthor(c.id, 'contribution', e.target.value)}
                        placeholder="e.g. Data analysis"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {coauthors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No co-authors added yet. You can proceed without co-authors and add them later.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Terms */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="font-semibold">Authorship Order & Publication</Label>
            <Textarea
              value={formData.publication_order}
              onChange={e => setFormData(prev => ({ ...prev, publication_order: e.target.value }))}
              placeholder="e.g. First authorship will be determined by contribution level. All authors will review and approve the manuscript before submission."
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Intellectual Property Terms</Label>
            <Textarea
              value={formData.intellectual_property_terms}
              onChange={e => setFormData(prev => ({ ...prev, intellectual_property_terms: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Dispute Resolution</Label>
            <Textarea
              value={formData.dispute_resolution}
              onChange={e => setFormData(prev => ({ ...prev, dispute_resolution: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">
              Additional Terms{' '}
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <Textarea
              value={formData.additional_terms}
              onChange={e => setFormData(prev => ({ ...prev, additional_terms: e.target.value }))}
              placeholder="Any other terms or conditions..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold">Agreement Summary</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Title</p>
                <p className="font-medium">{formData.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Project</p>
                <p>{formData.project_title}</p>
              </div>
              {formData.research_objectives && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Objectives</p>
                  <p className="text-muted-foreground line-clamp-2">{formData.research_objectives}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Co-authors</p>
                {coauthors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {coauthors.map(c => (
                      <div key={c.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs">
                        <Avatar className="w-4 h-4">
                          <AvatarImage src={c.avatar_url} />
                          <AvatarFallback className="text-[8px]">{c.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {c.full_name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No co-authors (solo agreement)</p>
                )}
              </div>
            </div>
          </div>

          {coauthors.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
              <p className="font-semibold text-primary mb-1">Notifications will be sent</p>
              <p className="text-muted-foreground">
                All {coauthors.length} co-author{coauthors.length !== 1 ? 's' : ''}{' '}
                will receive a notification to review and sign this agreement.
              </p>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="flex-1 gap-2">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 gap-2">
            {loading ? (
              <div className="w-4 h-4 rounded-full animate-spin border-2 border-white border-t-transparent" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {coauthors.length > 0 ? 'Create & Send to Co-authors' : 'Create Agreement'}
          </Button>
        )}
      </div>
    </div>
  )
}
