'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ChevronRight } from 'lucide-react'
import { submitToChallenge } from '@/lib/actions/challenges'
import { toast } from 'sonner'

interface SubmissionFormProps {
  challengeId: string
  teamId?: string
  onSuccess?: () => void
}

type Step = 1 | 2 | 3

export function SubmissionForm({ challengeId, teamId, onSuccess }: SubmissionFormProps) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    submissionUrl: '',
    additionalNotes: '',
  })

  function isStep1Valid() {
    return formData.title.trim().length > 0 && formData.abstract.trim().length >= 100
  }

  async function handleSubmit() {
    if (!isStep1Valid()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    const result = await submitToChallenge({
      challengeId,
      teamId,
      title: formData.title.trim(),
      abstract: formData.abstract.trim(),
      submissionUrl: formData.submissionUrl.trim() || undefined,
      additionalNotes: formData.additionalNotes.trim() || undefined,
    })

    if (result.success) {
      toast.success('Submission successful! You earned 25 Akili points.')
      setFormData({ title: '', abstract: '', submissionUrl: '', additionalNotes: '' })
      setStep(1)
      onSuccess?.()
    } else {
      toast.error(result.error || 'Failed to submit')
    }
    setLoading(false)
  }

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Title & abstract' },
    { number: 2, title: 'Details', description: 'Links & notes' },
    { number: 3, title: 'Review', description: 'Confirm submission' },
  ]

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((s, idx) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                s.number < step
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : s.number === step
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {s.number < step ? <Check className="w-5 h-5" /> : s.number}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full ${
                  s.number < step ? 'bg-green-500/50' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Title and abstract for your submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Submission Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Novel Framework for Climate Adaptation"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abstract">
                Abstract *
                <span className="text-xs text-muted-foreground ml-1">
                  (min 100 characters)
                </span>
              </Label>
              <Textarea
                id="abstract"
                placeholder="Describe your research submission. Include key objectives, methodology, and expected impact..."
                className="min-h-32"
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {formData.abstract.length}/100 characters
              </p>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Links and additional notes (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Submission URL</Label>
              <Input
                id="url"
                placeholder="e.g., https://drive.google.com/... or https://github.com/..."
                type="url"
                value={formData.submissionUrl}
                onChange={(e) => setFormData({ ...formData, submissionUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Link to your full submission document, code repository, or research paper
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional context, team members, or special information..."
                className="min-h-24"
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Review
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Submission</CardTitle>
            <CardDescription>Please review before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Title</p>
                <p className="text-sm font-medium">{formData.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Abstract</p>
                <p className="text-sm whitespace-pre-wrap">{formData.abstract}</p>
              </div>
              {formData.submissionUrl && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">URL</p>
                  <a
                    href={formData.submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 hover:underline break-all"
                  >
                    {formData.submissionUrl}
                  </a>
                </div>
              )}
              {formData.additionalNotes && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{formData.additionalNotes}</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400">
                ✓ You'll earn <span className="font-semibold">25 Akili points</span> for submitting to this challenge
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
