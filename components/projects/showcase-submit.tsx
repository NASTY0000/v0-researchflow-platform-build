'use client'

import { useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Send, X, CheckCircle2, Upload, FileText, AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { submitToShowcase } from '@/lib/actions/akili'
import type { Project } from '@/lib/types/database'

const RESEARCH_AREAS = [
  'Computer Science', 'Data Science', 'Artificial Intelligence', 'Machine Learning',
  'Biotechnology', 'Environmental Science', 'Public Health', 'Economics',
  'Social Sciences', 'Engineering', 'Mathematics', 'Physics', 'Chemistry',
  'Medicine', 'Agriculture', 'Education', 'Other',
]

const METHODOLOGY_OPTIONS = [
  'Qualitative', 'Quantitative', 'Mixed Methods', 'Systematic Review',
  'Case Study', 'Experimental', 'Survey', 'Observational',
]

interface Props {
  project: Project
  currentUserId: string | null
  isOwner: boolean
  allPhasesComplete: boolean
}

export function ShowcaseSubmit({ project, currentUserId, isOwner, allPhasesComplete }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    title: project.title,
    abstract: '',
    researchAreaTags: [] as string[],
    methodologyTags: [] as string[],
    visibility: 'public' as 'public' | 'university',
    declared: false,
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingSubmission, setExistingSubmission] = useState(false)
  const supabase = createClient()

  if (!isOwner) return null

  const wordCount = form.abstract.trim() ? form.abstract.trim().split(/\s+/).length : 0
  const isFormValid =
    form.title.trim() &&
    form.abstract.trim() &&
    wordCount <= 300 &&
    form.researchAreaTags.length > 0 &&
    form.declared

  function toggleTag(tag: string, field: 'researchAreaTags' | 'methodologyTags', max: number) {
    setForm(prev => {
      const list = prev[field]
      if (list.includes(tag)) return { ...prev, [field]: list.filter(t => t !== tag) }
      if (list.length >= max) return prev
      return { ...prev, [field]: [...list, tag] }
    })
  }

  function handlePdfChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Only PDF files are accepted.'); return }
    if (file.size > 20 * 1024 * 1024) { alert('File must be under 20MB.'); return }
    setPdfFile(file)
  }

  async function openModal() {
    if (!currentUserId) return
    // Check if a pending/needs_revision submission already exists
    const { data } = await supabase
      .from('showcase_submissions')
      .select('id, status')
      .eq('project_id', project.id)
      .in('status', ['pending', 'needs_revision'])
      .maybeSingle()
    if (data) { setExistingSubmission(true) }
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!currentUserId || !isFormValid) return
    setSubmitting(true)

    let pdfUrl: string | null = null
    if (pdfFile) {
      const fileName = `${currentUserId}/${Date.now()}_${pdfFile.name}`
      const { data: uploadData } = await supabase.storage
        .from('showcase-pdfs')
        .upload(fileName, pdfFile, { upsert: false })
      if (uploadData) {
        const { data: pub } = supabase.storage.from('showcase-pdfs').getPublicUrl(uploadData.path)
        pdfUrl = pub.publicUrl
      }
    }

    const { data: submission, error } = await supabase
      .from('showcase_submissions')
      .insert({
        project_id: project.id,
        submitted_by: currentUserId,
        title: form.title.trim(),
        abstract: form.abstract.trim(),
        research_area_tags: form.researchAreaTags,
        methodology_tags: form.methodologyTags,
        pdf_url: pdfUrl,
        visibility: form.visibility,
        status: 'pending',
      })
      .select()
      .single()

    if (!error && submission) {
      // Award Akili
      await submitToShowcase(currentUserId, submission.id)

      // Notify admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .contains('roles', ['admin'])
      if (admins && admins.length > 0) {
        await supabase.from('notifications').insert(
          admins.map((a: { id: string }) => ({
            user_id: a.id,
            title: 'New Showcase Submission',
            message: `"${form.title.trim()}" has been submitted for review.`,
            type: 'admin_review',
            related_id: submission.id,
          }))
        )
      }

      // Confirm to submitter
      await supabase.from('notifications').insert({
        user_id: currentUserId,
        title: 'Submission Received',
        message: 'Your research has been submitted for review. You will be notified within 48 hours.',
        type: 'showcase_submitted',
        related_id: submission.id,
      })

      setSubmitted(true)
    }

    setSubmitting(false)
  }

  return (
    <>
      {/* Trigger button */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-base">Submit to Showcase</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allPhasesComplete
                ? 'Your research is ready to be published to the community.'
                : 'Complete all 6 research phases to unlock showcase submission.'}
            </p>
          </div>
          <div className="relative group flex-shrink-0">
            <Button
              onClick={openModal}
              disabled={!allPhasesComplete}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Submit to Showcase
            </Button>
            {!allPhasesComplete && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-popover border shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Complete all research phases before submitting
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Submit Research to Showcase</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Share your work with the research community</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {submitted ? (
              <div className="p-12 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold">Submission Received!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Your research has been submitted for review. You will be notified within 48 hours.
                </p>
                <Button onClick={() => setShowModal(false)} className="mt-2">Close</Button>
              </div>
            ) : existingSubmission ? (
              <div className="p-12 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
                <h3 className="text-xl font-bold">Submission Already Pending</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  This project already has a submission under review. You will be notified when a decision is made.
                </p>
                <Button onClick={() => setShowModal(false)} variant="outline">Close</Button>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <Label>Research Title <span className="text-destructive">*</span></Label>
                    <Input
                      className="mt-1.5"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Enter research title"
                    />
                  </div>

                  {/* Abstract */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label>Abstract <span className="text-destructive">*</span></Label>
                      <span className={`text-xs ${wordCount > 300 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {wordCount} / 300 words
                      </span>
                    </div>
                    <Textarea
                      value={form.abstract}
                      onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))}
                      placeholder="Summarise your research, findings, and contribution..."
                      rows={5}
                      className={wordCount > 300 ? 'border-destructive' : ''}
                    />
                  </div>

                  {/* Research Area Tags */}
                  <div>
                    <Label>Research Areas <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal text-xs">(select up to 3)</span></Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {RESEARCH_AREAS.map(area => {
                        const selected = form.researchAreaTags.includes(area)
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleTag(area, 'researchAreaTags', 3)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              selected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {area}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Methodology Tags */}
                  <div>
                    <Label>Methodology <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {METHODOLOGY_OPTIONS.map(method => {
                        const selected = form.methodologyTags.includes(method)
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => toggleTag(method, 'methodologyTags', 8)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              selected
                                ? 'bg-accent text-accent-foreground border-accent'
                                : 'bg-background text-muted-foreground border-border hover:border-accent/50'
                            }`}
                          >
                            {method}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* PDF Upload */}
                  <div>
                    <Label>Final Output (PDF, max 20MB)</Label>
                    <div className="mt-1.5">
                      {pdfFile ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm flex-1 truncate">{pdfFile.name}</span>
                          <Button size="sm" variant="ghost" onClick={() => setPdfFile(null)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground text-center">
                            Click to upload PDF<br />
                            <span className="text-xs">PDF only · max 20MB</span>
                          </span>
                          <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfChange} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div>
                    <Label>Visibility</Label>
                    <div className="space-y-2 mt-2">
                      {(['public', 'university'] as const).map(v => (
                        <label key={v} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="visibility"
                            value={v}
                            checked={form.visibility === v}
                            onChange={() => setForm(f => ({ ...f, visibility: v }))}
                            className="mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {v === 'public' ? 'Public' : 'University Only'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {v === 'public'
                                ? 'Visible to everyone on the platform'
                                : 'Only visible to researchers at your university'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Declaration */}
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.declared}
                        onChange={e => setForm(f => ({ ...f, declared: e.target.checked }))}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <p className="text-sm leading-relaxed">
                        I confirm this is original research and I have permission from all team members to submit this work to the ResearchFlow Showcase.
                      </p>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t">
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid || submitting}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
