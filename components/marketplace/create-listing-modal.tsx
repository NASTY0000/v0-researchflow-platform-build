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
import { Loader2, X, AlertTriangle } from "lucide-react"
import ChipSelector from "@/components/ui/chip-selector"
import { RESEARCH_AREAS, RESEARCH_AREAS_FEATURED } from "@/lib/constants/onboarding"
import type { ServiceCategory, ServiceListing } from "@/lib/types/marketplace"
import { createListing, updateListing } from "@/lib/actions/marketplace"

const PROHIBITED_USE_NOTICE =
  "ResearchFlow Marketplace is for legitimate research support services. " +
  "Do not offer or request the writing of thesis or dissertation content, " +
  "completion of assessed coursework, ghost authorship, or any work to be " +
  "presented as your own without acknowledgement. " +
  "Listings that breach this will be removed."

interface Props {
  open: boolean
  categories: ServiceCategory[]
  editListing?: ServiceListing | null
  onSuccess: () => void
  onCancel: () => void
}

export function CreateListingModal({ open, categories, editListing, onSuccess, onCancel }: Props) {
  const isEditing = !!editListing

  const [categoryId, setCategoryId]         = useState("")
  const [title, setTitle]                   = useState("")
  const [description, setDescription]       = useState("")
  const [tools, setTools]                   = useState<string[]>([])
  const [toolInput, setToolInput]           = useState("")
  const [researchAreas, setResearchAreas]   = useState<string[]>([])
  const [rateNote, setRateNote]             = useState("")
  const [turnaroundNote, setTurnaroundNote] = useState("")
  const [confirmed, setConfirmed]           = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [serverError, setServerError]       = useState<string | null>(null)

  useEffect(() => {
    if (editListing) {
      setCategoryId(editListing.category_id)
      setTitle(editListing.title)
      setDescription(editListing.description)
      setTools(editListing.tools ?? [])
      setResearchAreas(editListing.research_areas ?? [])
      setRateNote(editListing.rate_note ?? "")
      setTurnaroundNote(editListing.turnaround_note ?? "")
      setConfirmed(true)
    }
  }, [editListing])

  function reset() {
    setCategoryId(""); setTitle(""); setDescription("")
    setTools([]); setToolInput(""); setResearchAreas([])
    setRateNote(""); setTurnaroundNote("")
    setConfirmed(false); setServerError(null)
  }

  function handleOpenChange(o: boolean) {
    if (!o && !submitting) { reset(); onCancel() }
  }

  function addTool() {
    const t = toolInput.trim()
    if (t && !tools.includes(t)) setTools(prev => [...prev, t])
    setToolInput("")
  }

  function removeTool(tool: string) {
    setTools(prev => prev.filter(t => t !== tool))
  }

  function toggleArea(area: string) {
    setResearchAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const descLen  = description.trim().length
  const isValid  = categoryId && title.trim().length >= 5 && descLen >= 100 && confirmed

  async function handleSubmit() {
    if (!isValid) return
    setSubmitting(true)
    setServerError(null)
    const data = { categoryId, title, description, tools, researchAreas, rateNote, turnaroundNote }
    const result = isEditing
      ? await updateListing(editListing!.id, data)
      : await createListing(data)
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
          <DialogTitle>{isEditing ? "Edit listing" : "Offer a service"}</DialogTitle>
          <DialogDescription>
            List your research support services for other researchers to find.
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
              placeholder="e.g. Statistical analysis and data cleaning"
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
              placeholder="Describe the service in detail: what you offer, your approach, relevant experience, and what clients can expect..."
            />
            <p className={`text-xs ${descLen < 100 ? 'text-muted-foreground' : 'text-primary'}`}>
              {descLen} / 100 characters minimum
            </p>
          </div>

          {/* Tools */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tools & software</label>
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tools.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
                    {t}
                    <button type="button" onClick={() => removeTool(t)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={toolInput}
                onChange={e => setToolInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTool() }}}
                placeholder="e.g. SPSS, R, NVivo — press Enter to add"
                className="flex-1 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTool}>Add</Button>
            </div>
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

          {/* Rate note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rate note</label>
            <p className="text-xs text-muted-foreground">e.g. Negotiable, or 5,000 per transcript hour. Payment is arranged privately between parties.</p>
            <Input
              value={rateNote}
              onChange={e => setRateNote(e.target.value)}
              placeholder="e.g. Negotiable"
            />
          </div>

          {/* Turnaround note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Turnaround note</label>
            <Input
              value={turnaroundNote}
              onChange={e => setTurnaroundNote(e.target.value)}
              placeholder="e.g. 3–5 business days per dataset"
            />
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I confirm this service does not breach the academic integrity notice above and does not involve producing assessed work to be submitted as another person&apos;s own.
            </span>
          </label>
        </div>

        {serverError && <p className="shrink-0 text-sm text-destructive">{serverError}</p>}

        <DialogFooter className="shrink-0 gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />{isEditing ? 'Saving…' : 'Posting…'}</>
              : isEditing ? 'Save changes' : 'Post listing'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
