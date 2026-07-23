"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { CheckCircle2, Loader2 } from "lucide-react"
import type { PhaseQuestion } from "@/lib/projects/phase-questions"
import type { EvidenceAnswer } from "@/lib/actions/projects"

interface PhaseCompletionModalProps {
  open: boolean
  phaseName: string
  phaseNumber: number
  questions: PhaseQuestion[]
  onConfirm: (evidence: EvidenceAnswer[]) => Promise<string | null>
  onCancel: () => void
}

export function PhaseCompletionModal({
  open,
  phaseName,
  phaseNumber,
  questions,
  onConfirm,
  onCancel,
}: PhaseCompletionModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map(q => [q.id, ""]))
  )
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function setAnswer(id: string, value: string) {
    setAnswers((prev: Record<string, string>) => ({ ...prev, [id]: value }))
  }

  const hasMinimumContent = questions.some(q => (answers[q.id] ?? "").trim().length >= 10)

  async function handleSubmit() {
    if (!hasMinimumContent) return
    setSubmitting(true)
    setServerError(null)

    const evidence: EvidenceAnswer[] = questions.map(q => ({
      id: q.id,
      q: q.question,
      a: answers[q.id] ?? "",
    }))

    const error = await onConfirm(evidence)
    if (error) {
      setServerError(error)
      setSubmitting(false)
    }
    // on success the parent closes the modal
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen && !submitting) onCancel() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Complete Phase {phaseNumber}: {phaseName}
          </DialogTitle>
          <DialogDescription>
            Answer the questions below to verify and record your progress before marking this phase complete.
          </DialogDescription>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Your team can see this submission. Anonymised patterns may be used to improve ResearchFlow.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {questions.map((q, i) => (
            <div key={q.id} className="space-y-2">
              <label className="text-sm font-medium leading-snug">
                <span className="text-muted-foreground mr-1.5 tabular-nums">{i + 1}.</span>
                {q.question}
              </label>
              <Textarea
                value={answers[q.id] ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(q.id, e.target.value)}
                placeholder={q.placeholder}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          ))}

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasMinimumContent || submitting}
            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
          >
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving…</>
              : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Mark Complete</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
