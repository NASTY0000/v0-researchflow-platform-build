"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Loader2, ArrowLeft } from "lucide-react"

export default function NotificationsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

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
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)

    setItems((data as Notification[]) || [])
    setLoading(false)
  }

  async function markRead(n: Notification) {
    if (n.is_read) {
      if (n.link) router.push(n.link)
      return
    }
    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    if (n.link) router.push(n.link)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Stay on top of your research activity</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent</CardTitle>
          <CardDescription>Open a notification to mark it read and go to the linked page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">You&apos;re all caught up.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void markRead(n)}
                className={`w-full text-left rounded-lg border p-4 transition-colors hover:bg-muted/40 ${
                  n.is_read ? "border-border opacity-80" : "border-primary/30 bg-primary/5"
                }`}
              >
                <p className="font-medium text-sm">{n.title}</p>
                {n.message && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
