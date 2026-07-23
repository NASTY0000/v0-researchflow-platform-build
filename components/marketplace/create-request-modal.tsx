"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertTriangle } from "lucide-react"
import ChipSelector from "@/components/ui/chip-selector"
import { RESEARCH_AREAS, RESEARCH_AREAS_FEATURED } from "@/lib/constants/onboarding"
import type { ServiceCategory, ServiceRequest } from "@/lib/types/marketplace"
import { createRequest, updateRequest } from "@/lib/actions/marketplace"

const PROHIBITED_USE_NOTICE =
  "ResearchFlow Marketplace is for legitimate research support services. " +
  "Do not offer or request the writing of thesis or dissertation content, " +
  "completion of assessed coursework, ghost authorship, or any work to be " +
  "presented as your own without acknowledgement. " +
  "Listings that breach this will be removed."

interface Props {
  open: boolean
  categories: ServiceCategory[]
  userProjects: { id: string; title: string }[]
  editRequest?: ServiceRequest | null
  onSuccess: () => void
  onCancel: () => void
}

export function CreateRequestModal({ open, categories, userProjects, editRequest, onSuccess, onCancel }: Props) {
  const isEditing = !!editRequest

  const [categoryId, setCategoryId]         = useState("")
  const [title, setTitle]                   = useState("")
  const [description, setDescription]       = useState("")
  const [budgetNote, setBudgetNote]         = useState("")
  const [deadline, setDeadline]             = useState("")
  const [projectId, setProjectId]           = useState("")
  const [researchAreas, setResearchAreas]   = useState<string[]>([])
  const [confirmed, setConfirmed]           = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [serverError, setServerError]       = useState<string | null>(null)

  useEffect(() => {
    if (editRequest) {
      setCategoryId(editRequest.category_id)
      setTitle(editRequest.title)
      setDescription(editRequest.description)
      setBudgetNote(editRequest.budget_note ?? "")
      setDeadline(editRequest.deadline ?? "")
      setProjectId(editRequest.project_id ?? "")
      setResearchAreas(editRequest.research_areas ?? [])
      setConfirmed(true)
    }
  }, [editRequest])

  function reset() {
    setCategoryId(""); setTitle(""); setDescription("")
    setBudgetNote(""); setDeadline(""); setProjectId("")
    setResearchAreas([]); setConfirmed(false); setServerError(null)
  }

  function handleOpenChange(o: boolean) {
    if (!o && !submitting) { reset(); onCancel() }
  }

  function toggleArea(area: string) {
    setResearchAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const descLen = description.trim().length
  const isValid = categoryId && title.trim().length >= 5 && descLen >= 100 && confirmed

  async function handleSubmit() {
    if (!isValid) return
    setSubmitting(true)
    setServerError(null)
    const data = { categoryId, title, description, budgetNote, deadline, projectId, researchAreas }
    const result = isEditing
      ? await updateRequest(editRequest!.id, data)
      : await createRequest(data)
    if ('error' in result && result.error) {
      setServerError(result.error)
      setSubmitting(false)
    } else {
      reset()
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditing ? "Edit request" : "Post a request"}</DialogTitle>
          <DialogDescription>
            Describe what your research project needs and let providers come to you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Academic integrity notice */}
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{PROHIBITED_USE_NOTICE}</p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category <span className="text-destructive">*</span></label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
              <span className="text-xs font-normal text-muted-foreground ml-2">max 100 chars</span>
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              placeholder="e.g. Need help transcribing and coding qualitative interviews"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={4}
              className="resize-none text-sm"
              placeholder="Describe what you need: context, scope, deliverables, any specific requirements or tools..."
            />
            <p className={`text-xs ${descLen < 100 ? 'text-muted-foreground' : 'text-primary'}`}>
              {descLen} / 100 characters minimum
            </p>
          </div>

          {/* Research areas */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Research areas</label>
            <ChipSelector
              featuredOptions={RESEARCH_AREAS_FEATURED.slice(0, 20)}
              allOptions={RESEARCH_AREAS}
              selected={researchAreas}
              onToggle={toggleArea}
              maxSelections={5}
              onAddCustom={area => setResearchAreas(prev => [...prev, area])}
            />
          </div>

          {/* Budget note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Budget note</label>
            <p className="text-xs text-muted-foreground">Payment is arranged privately between parties.</p>
            <Input
              value={budgetNote}
              onChange={e => setBudgetNote(e.target.value)}
              placeholder="e.g. Negotiable, or 10,000–15,000 NGN"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Deadline</label>
            <Input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Project link */}
          {userProjects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Linked project</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Select a project (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {userProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I confirm this request does not breach the academic integrity notice above and does not seek someone to produce assessed work to be submitted as my own.
            </span>
          </label>
        </div>

        {serverError && <p className="shrink-0 text-sm text-destructive">{serverError}</p>}

        <DialogFooter className="shrink-0 gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />{isEditing ? 'Saving…' : 'Posting…'}</>
              : isEditing ? 'Save changes' : 'Post request'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
