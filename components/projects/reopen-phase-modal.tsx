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
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react"

interface ReopenPhaseModalProps {
  open: boolean
  phaseName: string
  hasLaterCompleted: boolean
  onConfirm: (reason: string) => Promise<string | null>
  onCancel: () => void
}

export function ReopenPhaseModal({
  open,
  phaseName,
  hasLaterCompleted,
  onConfirm,
  onCancel,
}: ReopenPhaseModalProps) {
  const [reason, setReason]         = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const isValid = reason.trim().length >= 20

  async function handleConfirm() {
    if (!isValid) return
    setSubmitting(true)
    setServerError(null)
    const error = await onConfirm(reason)
    if (error) {
      setServerError(error)
      setSubmitting(false)
    }
    // on success the parent closes the modal and clears state
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !submitting) {
      setReason("")
      setServerError(null)
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-400" />
            Reopen: {phaseName}
          </DialogTitle>
          <DialogDescription>
            This phase will return to in progress and the team will need to complete it again.
            The previous submission will be saved to the phase history.
          </DialogDescription>
        </DialogHeader>

        {hasLaterCompleted && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300/90">
              Note: later phases of this project are already marked complete. Reopening this phase does not change them.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Why is this phase being reopened?
            <span className="text-destructive ml-1">*</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            placeholder="Describe what went wrong and why this phase needs to be redone..."
            rows={3}
            className="resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {reason.trim().length} / 20 characters minimum
          </p>
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || submitting}
          >
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Reopening…</>
              : <><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reopen Phase</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
