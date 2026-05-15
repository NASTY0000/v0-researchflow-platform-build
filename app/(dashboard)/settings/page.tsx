"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield, Bell, Key, Download, Trash2, AlertTriangle,
  Loader2, Check, LogOut, Save, Globe, MessageSquare,
  Search, Activity,
} from "lucide-react"

const NOTIF_TYPES = [
  { key: "new_match",            label: "New match suggestion" },
  { key: "connection_request",   label: "Connection request received" },
  { key: "mentorship_request",   label: "Mentorship request received" },
  { key: "task_assigned",        label: "Task assigned to me" },
  { key: "workspace_message",    label: "New message in workspace" },
  { key: "session_reminder",     label: "Upcoming session reminder" },
  { key: "showcase_update",      label: "Showcase submission status update" },
] as const

type NotifKey = (typeof NOTIF_TYPES)[number]["key"]

function pwScore(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const PW_LEVELS = ["", "Weak", "Fair", "Good", "Strong"]
const PW_COLORS = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"]

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(139,92,246,0.2)",
  borderRadius: "16px",
  backdropFilter: "blur(12px)",
}

const sectionHeading = "text-lg font-semibold font-heading mb-1"
const rowClass = "flex items-center justify-between gap-4 py-3"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [dataExportedAt, setDataExportedAt] = useState<string | null>(null)

  // ── Privacy ──
  const [profileVisibility, setProfileVisibility] =
    useState<"public" | "university_only" | "connections_only">("public")
  const [showAvailability, setShowAvailability] = useState(true)
  const [allowDm, setAllowDm] = useState(true)
  const [appearInSearch, setAppearInSearch] = useState(true)
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
  const [privacyMsg, setPrivacyMsg] = useState<string | null>(null)

  // ── Notifications ──
  const [notifEnabled, setNotifEnabled] = useState<Record<NotifKey, boolean>>({
    new_match: true,
    connection_request: true,
    mentorship_request: true,
    task_assigned: true,
    workspace_message: true,
    session_reminder: true,
    showcase_update: true,
  })
  const [isSavingNotifs, setIsSavingNotifs] = useState(false)
  const [notifMsg, setNotifMsg] = useState<string | null>(null)

  // ── Password ──
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [isSavingPw, setIsSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // ── Data export ──
  const [isExporting, setIsExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState<string | null>(null)

  // ── Delete account ──
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }
    setUserId(user.id)

    const { data: p } = await supabase
      .from("profiles")
      .select("profile_visibility,show_availability,allow_dm_from_non_connections,appear_in_search,notification_prefs,data_export_requested_at")
      .eq("id", user.id)
      .single()

    if (p) {
      setProfileVisibility(p.profile_visibility || "public")
      setShowAvailability(p.show_availability !== false)
      setAllowDm(p.allow_dm_from_non_connections !== false)
      setAppearInSearch(p.appear_in_search !== false)
      setDataExportedAt(p.data_export_requested_at || null)

      // Hydrate per-type in-app toggles from notification_prefs
      const prefs = p.notification_prefs || {}
      setNotifEnabled(prev => {
        const next = { ...prev }
        for (const k of NOTIF_TYPES.map(t => t.key)) {
          if (typeof prefs[k]?.in_app === "boolean") next[k] = prefs[k].in_app
        }
        return next
      })
    }

    setIsLoading(false)
  }

  // ── Handlers ──

  async function savePrivacy() {
    setIsSavingPrivacy(true)
    setPrivacyMsg(null)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({
      profile_visibility: profileVisibility,
      show_availability: showAvailability,
      allow_dm_from_non_connections: allowDm,
      appear_in_search: appearInSearch,
    }).eq("id", userId)
    setPrivacyMsg(error ? "Failed to save. Please try again." : "Privacy settings saved.")
    setIsSavingPrivacy(false)
  }

  async function saveNotifs() {
    setIsSavingNotifs(true)
    setNotifMsg(null)
    const supabase = createClient()
    // Build prefs JSONB — store in_app per type
    const prefs: Record<string, { in_app: boolean }> = {}
    for (const k of NOTIF_TYPES.map(t => t.key)) {
      prefs[k] = { in_app: notifEnabled[k] }
    }
    const { error } = await supabase.from("profiles")
      .update({ notification_prefs: prefs })
      .eq("id", userId)
    setNotifMsg(error ? "Failed to save. Please try again." : "Notification preferences saved.")
    setIsSavingNotifs(false)
  }

  async function changePassword() {
    setPwMsg(null)
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: "Passwords do not match." }); return }
    if (newPw.length < 8)    { setPwMsg({ ok: false, text: "Password must be at least 8 characters." }); return }
    setIsSavingPw(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setIsSavingPw(false); return }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw })
    if (signInErr) { setPwMsg({ ok: false, text: "Current password is incorrect." }); setIsSavingPw(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setPwMsg({ ok: false, text: error.message })
    } else {
      setPwMsg({ ok: true, text: "Password changed successfully." })
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
    }
    setIsSavingPw(false)
  }

  async function requestExport() {
    setIsExporting(true)
    setExportMsg(null)
    const supabase = createClient()
    await supabase.from("profiles")
      .update({ data_export_requested_at: new Date().toISOString() })
      .eq("id", userId)
    setDataExportedAt(new Date().toISOString())
    setExportMsg("Export requested. You'll receive an email within 24 hours.")
    setIsExporting(false)
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE") return
    setIsDeleting(true)
    const supabase = createClient()
    await supabase.from("profiles").update({
      full_name: "Deleted User",
      email: null,
      bio: null,
      avatar_url: null,
      account_status: "deleted",
      deletion_requested_at: new Date().toISOString(),
    }).eq("id", userId)
    await supabase.from("team_members").delete().eq("user_id", userId)
    await supabase.auth.signOut()
    router.push("/")
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const score = pwScore(newPw)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full animate-spin mx-auto"
            style={{ border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7C3AED" }} />
          <p style={{ color: "#7C6A9C" }}>Loading settings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold font-heading" style={{ letterSpacing: "-0.03em" }}>Settings</h1>
        <p style={{ color: "#7C6A9C" }} className="mt-1 text-sm">Manage your privacy, notifications, and account</p>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1 — PRIVACY SETTINGS
      ══════════════════════════════════════════ */}
      <div style={card} className="p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: "#A855F7" }} />
          <h2 className={sectionHeading}>Privacy Settings</h2>
        </div>

        {/* Profile Visibility */}
        <div className="space-y-3">
          <Label className="text-sm font-medium" style={{ color: "#C4B5FD" }}>Profile Visibility</Label>
          <RadioGroup
            value={profileVisibility}
            onValueChange={v => setProfileVisibility(v as typeof profileVisibility)}
            className="space-y-2"
          >
            {([
              ["public",           "Public",           "Anyone can view your full profile"],
              ["university_only",  "University Only",  "Only users from your university can view your full profile"],
              ["connections_only", "Connections Only",  "Only your connected researchers can view your full profile"],
            ] as const).map(([val, title, desc]) => (
              <label key={val}
                htmlFor={`vis-${val}`}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: profileVisibility === val ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                  border: profileVisibility === val ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(139,92,246,0.15)",
                }}
              >
                <RadioGroupItem value={val} id={`vis-${val}`} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#7C6A9C" }}>{desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        <Separator style={{ borderColor: "rgba(139,92,246,0.15)" }} />

        {/* Toggle rows */}
        {([
          {
            icon: <Activity className="w-4 h-4" style={{ color: "#7C6A9C" }} />,
            label: "Availability Status",
            desc: "Show when I'm active on platform",
            checked: showAvailability,
            set: setShowAvailability,
          },
          {
            icon: <MessageSquare className="w-4 h-4" style={{ color: "#7C6A9C" }} />,
            label: "Direct Messages",
            desc: "Allow direct messages from people I'm not connected with",
            checked: allowDm,
            set: setAllowDm,
          },
          {
            icon: <Search className="w-4 h-4" style={{ color: "#7C6A9C" }} />,
            label: "Appear in Collaborator Search",
            desc: "Show up in match suggestions and search results",
            checked: appearInSearch,
            set: setAppearInSearch,
          },
        ]).map(({ icon, label, desc, checked, set }) => (
          <div key={label} className={rowClass}>
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="mt-0.5 shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs" style={{ color: "#7C6A9C" }}>{desc}</p>
              </div>
            </div>
            <Switch checked={checked} onCheckedChange={set} />
          </div>
        ))}

        {privacyMsg && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: privacyMsg.startsWith("Failed") ? "#f87171" : "#4ade80" }}>
            {!privacyMsg.startsWith("Failed") && <Check className="w-3.5 h-3.5" />}
            {privacyMsg}
          </p>
        )}

        <div className="pt-1">
          <Button onClick={savePrivacy} disabled={isSavingPrivacy}
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: "8px" }}>
            {isSavingPrivacy
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : <><Save className="mr-2 h-4 w-4" />Save Privacy Settings</>}
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — NOTIFICATION PREFERENCES
      ══════════════════════════════════════════ */}
      <div style={card} className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-5 h-5" style={{ color: "#A855F7" }} />
          <h2 className={sectionHeading}>Notification Preferences</h2>
        </div>
        <p className="text-xs" style={{ color: "#7C6A9C" }}>
          Toggle in-app notifications on or off per event type.
        </p>

        <div className="space-y-1">
          {NOTIF_TYPES.map(({ key, label }, i) => (
            <div key={key}>
              <div className={rowClass}>
                <Label className="text-sm cursor-pointer" htmlFor={`notif-${key}`}>{label}</Label>
                <Switch
                  id={`notif-${key}`}
                  checked={notifEnabled[key]}
                  onCheckedChange={v => setNotifEnabled(prev => ({ ...prev, [key]: v }))}
                />
              </div>
              {i < NOTIF_TYPES.length - 1 && (
                <Separator style={{ borderColor: "rgba(139,92,246,0.1)" }} />
              )}
            </div>
          ))}
        </div>

        {notifMsg && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: notifMsg.startsWith("Failed") ? "#f87171" : "#4ade80" }}>
            {!notifMsg.startsWith("Failed") && <Check className="w-3.5 h-3.5" />}
            {notifMsg}
          </p>
        )}

        <div className="pt-1">
          <Button onClick={saveNotifs} disabled={isSavingNotifs}
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: "8px" }}>
            {isSavingNotifs
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : <><Save className="mr-2 h-4 w-4" />Save Preferences</>}
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 3 — ACCOUNT SETTINGS
      ══════════════════════════════════════════ */}
      <div style={card} className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-5 h-5" style={{ color: "#A855F7" }} />
          <h2 className={sectionHeading}>Account</h2>
        </div>

        <p className="text-sm font-medium" style={{ color: "#C4B5FD" }}>Change Password</p>

        {pwMsg && (
          <Alert variant={pwMsg.ok ? "default" : "destructive"}
            className={pwMsg.ok ? "border-green-500/40 bg-green-500/10" : ""}>
            <AlertDescription className="flex items-center gap-2 text-sm">
              {pwMsg.ok && <Check className="h-4 w-4 text-green-400" />}
              {pwMsg.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: "#7C6A9C" }}>Current Password</Label>
            <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "8px" }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: "#7C6A9C" }}>New Password</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Enter new password"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "8px" }} />
            {newPw && (
              <div className="space-y-1 pt-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? PW_COLORS[score] : "bg-white/10"}`} />
                  ))}
                </div>
                <p className="text-xs" style={{ color: "#7C6A9C" }}>
                  Strength: <span className="font-medium text-[#F3F0FF]">{PW_LEVELS[score] || "—"}</span>
                </p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: "#7C6A9C" }}>Confirm New Password</Label>
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="Confirm new password"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "8px" }} />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>
        </div>

        <Button onClick={changePassword}
          disabled={isSavingPw || !currentPw || !newPw || !confirmPw}
          style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: "8px" }}>
          {isSavingPw
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing…</>
            : "Change Password"}
        </Button>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 4 — DATA MANAGEMENT
      ══════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Download */}
        <div style={card} className="p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-5 h-5" style={{ color: "#A855F7" }} />
            <h2 className={sectionHeading}>Data Management</h2>
          </div>

          <p className="text-sm font-medium" style={{ color: "#C4B5FD" }}>Download My Data</p>
          <p className="text-sm" style={{ color: "#7C6A9C" }}>
            Download a copy of all your ResearchFlow data including your profile, ideas, projects, messages, and Akili Score history.
            You&apos;ll receive an email within 24 hours.
          </p>
          {dataExportedAt && (
            <p className="text-xs" style={{ color: "#7C6A9C" }}>
              Last requested: {new Date(dataExportedAt).toLocaleDateString()}
            </p>
          )}
          {exportMsg && (
            <p className="text-sm flex items-center gap-1.5" style={{ color: "#4ade80" }}>
              <Check className="w-3.5 h-3.5" />{exportMsg}
            </p>
          )}
          <Button variant="outline" onClick={requestExport} disabled={isExporting}
            style={{ border: "1px solid rgba(139,92,246,0.35)", borderRadius: "8px" }}>
            {isExporting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Requesting…</>
              : <><Download className="mr-2 h-4 w-4" />Request Download</>}
          </Button>
        </div>

        {/* Delete Account */}
        <div className="p-6 rounded-2xl space-y-4"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-semibold font-heading text-red-400">Delete Account</h3>
          </div>
          <p className="text-sm" style={{ color: "#FCA5A5" }}>
            Deleting your account is permanent and cannot be undone. All your data will be removed from ResearchFlow.
          </p>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 5 — SIGN OUT
      ══════════════════════════════════════════ */}
      <div style={card} className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sign Out</p>
            <p className="text-sm" style={{ color: "#7C6A9C" }}>Sign out of your account on this device</p>
          </div>
          <Button variant="outline" onClick={signOut}
            style={{ border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px" }}>
            <LogOut className="mr-2 h-4 w-4" />Sign Out
          </Button>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: "#0E0320", border: "1px solid rgba(239,68,68,0.4)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.15)" }}>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold">Delete Account</h3>
                <p className="text-xs" style={{ color: "#7C6A9C" }}>This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: "#7C6A9C" }}>
              Your profile will be anonymised and you&apos;ll be removed from all teams. Published ideas and showcase entries will remain as &quot;Deleted User&quot;.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs" style={{ color: "#7C6A9C" }}>
                Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm
              </Label>
              <Input value={deleteText} onChange={e => setDeleteText(e.target.value)}
                placeholder="DELETE"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px" }} />
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={deleteText !== "DELETE" || isDeleting}
                onClick={deleteAccount}>
                {isDeleting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
                  : "Confirm Delete"}
              </Button>
              <Button variant="outline" className="flex-1"
                onClick={() => { setShowDeleteModal(false); setDeleteText("") }}
                style={{ border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px" }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
