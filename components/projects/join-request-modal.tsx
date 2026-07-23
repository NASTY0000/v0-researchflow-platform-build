"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2, UserPlus, Check } from "lucide-react"

interface JoinRequestModalProps {
  open: boolean
  projectTitle: string
  userSkills: string[]
  onConfirm: (message: string, skillsOffered: string[]) => Promise<string | null>
  onCancel: () => void
}

export function JoinRequestModal({
  open,
  projectTitle,
  userSkills,
  onConfirm,
  onCancel,
}: JoinRequestModalProps) {
  const [message, setMessage]               = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [submitting, setSubmitting]         = useState(false)
  const [serverError, setServerError]       = useState<string | null>(null)

  const isValid = message.trim().length >= 50

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  async function handleConfirm() {
    if (!isValid) return
    setSubmitting(true)
    setServerError(null)
    const error = await onConfirm(message, selectedSkills)
    if (error) {
      setServerError(error)
      setSubmitting(false)
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !submitting) {
      setMessage("")
      setSelectedSkills([])
      setServerError(null)
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Request to Join
          </DialogTitle>
          <DialogDescription>
            Send a collaboration request to <span className="font-medium text-foreground">{projectTitle}</span>. The team lead will review it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {userSkills.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Skills you bring
                <span className="text-xs font-normal text-muted-foreground ml-1">(optional — select what's relevant)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {userSkills.map(skill => {
                  const active = selectedSkills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors
                        ${active
                          ? 'bg-primary/15 border-primary/40 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Why do you want to join?
              <span className="text-destructive ml-1">*</span>
            </label>
            <Textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Describe your interest in this research, what you can contribute, and how your background is relevant..."
              rows={4}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {message.trim().length} / 50 characters minimum
            </p>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || submitting}>
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Sending…</>
              : <><UserPlus className="h-3.5 w-3.5 mr-1.5" />Send Request</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
