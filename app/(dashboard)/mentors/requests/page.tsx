"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { acceptMentorshipRequestAction } from "@/lib/actions/notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Check, BookOpen } from "lucide-react"

type SessionRow = {
  id: string
  mentee_id: string
  notes: string | null
  created_at: string
  mentee: { full_name: string | null; avatar_url: string | null; email: string } | null
}

export default function MentorRequestsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("mentorship_sessions")
      .select("id, mentee_id, notes, created_at")
      .eq("mentor_id", user.id)
      .eq("status", "requested")
      .order("created_at", { ascending: false })

    const rows = data || []
    const menteeIds = [...new Set(rows.map((r) => r.mentee_id))]
    const { data: menteeProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .in("id", menteeIds)

    const byId = new Map((menteeProfiles || []).map((p) => [p.id, p]))
    setSessions(
      rows.map((r) => ({
        ...r,
        mentee: byId.get(r.mentee_id) || null,
      })) as SessionRow[],
    )
    setLoading(false)
  }

  async function accept(id: string) {
    setActingId(id)
    const res = await acceptMentorshipRequestAction(id)
    setActingId(null)
    if (!("error" in res && res.error)) {
      setSessions((s) => s.filter((x) => x.id !== id))
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/mentors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Mentorship requests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Accept or review pending requests from students.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <CardDescription>Students waiting for your response</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No pending requests.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-border"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={s.mentee?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(s.mentee?.full_name || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium">{s.mentee?.full_name || "Student"}</p>
                  <p className="text-xs text-muted-foreground">{s.mentee?.email}</p>
                  {s.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{s.notes}</p>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {new Date(s.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  disabled={actingId === s.id}
                  onClick={() => void accept(s.id)}
                  className="shrink-0"
                >
                  {actingId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
