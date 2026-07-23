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
import { Loader2, Send } from "lucide-react"

interface SendEnquiryModalProps {
  open: boolean
  targetTitle: string
  onConfirm: (message: string) => Promise<string | null>
  onCancel: () => void
}

export function SendEnquiryModal({
  open,
  targetTitle,
  onConfirm,
  onCancel,
}: SendEnquiryModalProps) {
  const [message, setMessage]     = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const charCount = message.trim().length
  const isValid   = charCount >= 50

  async function handleConfirm() {
    if (!isValid) return
    setSubmitting(true)
    setServerError(null)
    const error = await onConfirm(message)
    if (error) { setServerError(error); setSubmitting(false) }
  }

  function handleOpenChange(open: boolean) {
    if (!open && !submitting) {
      setMessage("")
      setServerError(null)
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Send enquiry
          </DialogTitle>
          <DialogDescription>
            Enquiring about: <span className="font-medium text-foreground">{targetTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Your message <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder="Introduce yourself, describe what you need, and ask any questions you have..."
            rows={5}
            className="resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {charCount} / 50 characters minimum
          </p>
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!isValid || submitting}>
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Sending…</>
              : <><Send className="h-3.5 w-3.5 mr-1.5" />Send enquiry</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
