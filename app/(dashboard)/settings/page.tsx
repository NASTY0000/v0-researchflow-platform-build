"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield, Bell, Key, Download, Trash2, AlertTriangle,
  Loader2, Check, LogOut, Save, MessageSquare,
  Search, Activity, Sun, Moon, Monitor, Sparkles,
} from "lucide-react"
import { ListPageSkeleton } from '@/components/ui/skeleton-screens'
import { VerificationSection } from '@/components/settings/VerificationSection'

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

const card = "p-6 rounded-2xl bg-card border border-border backdrop-blur-sm space-y-5"

const sectionHeading = "text-lg font-semibold font-heading mb-1"
const rowClass = "flex items-center justify-between gap-4 py-3"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [dataExportedAt, setDataExportedAt] = useState<string | null>(null)

  // ── Verification ──
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedUniversityName, setVerifiedUniversityName] = useState<string | null>(null)
  const [verifiedUniversityEmail, setVerifiedUniversityEmail] = useState<string | null>(null)

  // ── Profile background ──
  const [profileBg, setProfileBg] = useState<'baobab' | 'constellation'>('baobab')
  const [isSavingBg, setIsSavingBg] = useState(false)
  const [bgSaveError, setBgSaveError] = useState<string | null>(null)
  const [bgSaveSuccess, setBgSaveSuccess] = useState(false)

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
      .select("profile_visibility,show_availability,allow_dm_from_non_connections,appear_in_search,notification_prefs,data_export_requested_at,profile_background,is_verified,university_name,university_email")
      .eq("id", user.id)
      .single()

    if (p) {
      if (p.profile_background === 'constellation') setProfileBg('constellation')
      setIsVerified(p.is_verified ?? false)
      setVerifiedUniversityName((p as { university_name?: string | null }).university_name ?? null)
      setVerifiedUniversityEmail((p as { university_email?: string | null }).university_email ?? null)
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

  async function saveProfileBg() {
    setIsSavingBg(true)
    setBgSaveError(null)
    setBgSaveSuccess(false)
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      console.log('Saving profile_background:', profileBg, 'for user:', user.id)

      const { data, error } = await supabase
        .from("profiles")
        .update({ profile_background: profileBg })
        .eq("id", user.id)
        .select()

      if (error) {
        console.error("Supabase error:", { message: error.message, code: error.code, details: (error as any).details, hint: (error as any).hint })
        throw error
      }

      console.log('Save successful:', data)
      setBgSaveSuccess(true)
      setTimeout(() => setBgSaveSuccess(false), 2000)
    } catch (err: any) {
      console.error("saveProfileBg failed:", err)
      setBgSaveError(err?.message ? `Failed to save: ${err.message}` : 'Failed to save. Please try again.')
    } finally {
      setIsSavingBg(false)
    }
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
    return <div className="max-w-4xl mx-auto px-4 py-8"><ListPageSkeleton type="card" count={3} /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold font-heading" style={{ letterSpacing: "-0.03em" }}>Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your appearance, privacy, notifications, and account</p>
      </div>

      {/* ══════════════════════════════════════════
          SECTION — INSTITUTIONAL VERIFICATION
      ══════════════════════════════════════════ */}
      <div id="verification" className={card}>
        <VerificationSection
          isVerified={isVerified}
          universityName={verifiedUniversityName}
          universityEmail={verifiedUniversityEmail}
        />
      </div>

      {/* ══════════════════════════════════════════
          SECTION 0 — APPEARANCE
      ══════════════════════════════════════════ */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-5 h-5 text-primary" />
          <h2 className={sectionHeading}>Appearance</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">Choose how ResearchFlow looks for you.</p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {([
            { value: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
            { value: "dark",  label: "Dark",  icon: <Moon className="w-5 h-5" /> },
            { value: "system",label: "System",icon: <Monitor className="w-5 h-5" /> },
          ] as const).map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
              style={{
                background: theme === value ? "rgba(124,58,237,0.12)" : "transparent",
                borderColor: theme === value ? "rgba(168,85,247,0.5)" : "var(--border)",
                color: theme === value ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 0B — PROFILE APPEARANCE
      ══════════════════════════════════════════ */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className={sectionHeading}>Profile Appearance</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">Choose the animated background shown on your public profile.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Baobab */}
          <button
            type="button"
            onClick={() => setProfileBg('baobab')}
            className="p-4 rounded-xl text-left transition-all duration-200 space-y-3"
            style={profileBg === 'baobab'
              ? { background: "rgba(124,58,237,0.12)", border: "2px solid rgba(168,85,247,0.5)" }
              : { background: "transparent", border: "2px solid var(--border)" }
            }
          >
            <div className="w-full h-24 rounded-lg flex items-center justify-center" style={{ background: '#05010F' }}>
              <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
                <defs>
                  <linearGradient id="sb-trunk" x1="50" y1="26" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#5B21B6"/>
                    <stop offset="100%" stopColor="#2E1065"/>
                  </linearGradient>
                </defs>
                <polygon points="43,26 57,26 61,80 39,80" fill="url(#sb-trunk)"/>
                <line x1="50" y1="26" x2="20" y2="10" stroke="#7C3AED" strokeWidth="2.5"/>
                <line x1="50" y1="26" x2="50" y2="4" stroke="#7C3AED" strokeWidth="2.5"/>
                <line x1="50" y1="26" x2="80" y2="10" stroke="#7C3AED" strokeWidth="2.5"/>
                <circle cx="20" cy="10" r="6" fill="#8B5CF6"/>
                <circle cx="50" cy="4" r="8" fill="#FBBF24"/>
                <circle cx="80" cy="10" r="6" fill="#A855F7"/>
                <path d="M20,10 Q35,2 50,4" stroke="rgba(196,181,253,0.5)" strokeWidth="1.2" fill="none"/>
                <path d="M50,4 Q65,2 80,10" stroke="rgba(196,181,253,0.5)" strokeWidth="1.2" fill="none"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: profileBg === 'baobab' ? 'var(--primary)' : undefined }}>
                The Baobab
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Branches grow from your research interests, nodes pulse with each connection.</p>
            </div>
          </button>

          {/* Constellation */}
          <button
            type="button"
            onClick={() => setProfileBg('constellation')}
            className="p-4 rounded-xl text-left transition-all duration-200 space-y-3"
            style={profileBg === 'constellation'
              ? { background: "rgba(124,58,237,0.12)", border: "2px solid rgba(168,85,247,0.5)" }
              : { background: "transparent", border: "2px solid var(--border)" }
            }
          >
            <div className="w-full h-24 rounded-lg flex items-center justify-center" style={{ background: '#030812' }}>
              <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
                {[[14,10],[86,7],[7,63],[93,58],[47,72]].map(([x,y],i) => (
                  <circle key={i} cx={x} cy={y} r="0.7" fill="white" opacity="0.25"/>
                ))}
                <line x1="32" y1="16" x2="68" y2="34" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2"/>
                <line x1="68" y1="34" x2="50" y2="62" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2"/>
                <line x1="50" y1="62" x2="32" y2="16" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2"/>
                <circle cx="32" cy="16" r="6" fill="#FBBF24" opacity="0.9"/>
                <circle cx="32" cy="16" r="2.5" fill="white"/>
                <circle cx="68" cy="34" r="5" fill="#67E8F9" opacity="0.9"/>
                <circle cx="68" cy="34" r="2" fill="white"/>
                <circle cx="50" cy="62" r="4.5" fill="#C4B5FD" opacity="0.9"/>
                <circle cx="50" cy="62" r="1.8" fill="white"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: profileBg === 'constellation' ? 'var(--primary)' : undefined }}>
                The Constellation
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Stars map your research fields, lines trace your collaborations across the cosmos.</p>
            </div>
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={saveProfileBg}
            disabled={isSavingBg}
            className={[
              "w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200",
              "flex items-center justify-center gap-2",
              isSavingBg
                ? "bg-purple-800/50 text-purple-400 cursor-not-allowed"
                : bgSaveSuccess
                ? "bg-green-600 text-white"
                : "bg-purple-600 hover:bg-purple-500 text-white",
            ].join(" ")}
          >
            {isSavingBg ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
            ) : bgSaveSuccess ? (
              <><Check className="w-4 h-4" />Saved!</>
            ) : (
              <><Check className="w-4 h-4" />Save Appearance</>
            )}
          </button>
          {bgSaveError && (
            <p className="text-red-400 text-xs text-center mt-2">{bgSaveError}</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1 — PRIVACY SETTINGS
      ══════════════════════════════════════════ */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className={sectionHeading}>Privacy Settings</h2>
        </div>

        {/* Profile Visibility */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-primary/80">Profile Visibility</Label>
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
                  <p className="text-xs mt-0.5 text-muted-foreground">{desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        <Separator style={{ borderColor: "rgba(139,92,246,0.15)" }} />

        {/* Toggle rows */}
        {([
          {
            icon: <Activity className="w-4 h-4 text-muted-foreground" />,
            label: "Availability Status",
            desc: "Show when I'm active on platform",
            checked: showAvailability,
            set: setShowAvailability,
          },
          {
            icon: <MessageSquare className="w-4 h-4 text-muted-foreground" />,
            label: "Direct Messages",
            desc: "Allow direct messages from people I'm not connected with",
            checked: allowDm,
            set: setAllowDm,
          },
          {
            icon: <Search className="w-4 h-4 text-muted-foreground" />,
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
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
            <Switch checked={checked} onCheckedChange={set} />
          </div>
        ))}

        {privacyMsg && (
          <p className={`text-sm flex items-center gap-1.5 ${privacyMsg.startsWith("Failed") ? "text-red-400" : "text-green-400"}`}>
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
      <div className={card}>
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className={sectionHeading}>Notification Preferences</h2>
        </div>
        <p className="text-xs text-muted-foreground">
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
          <p className={`text-sm flex items-center gap-1.5 ${notifMsg.startsWith("Failed") ? "text-red-400" : "text-green-400"}`}>
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
      <div className={card}>
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-5 h-5 text-primary" />
          <h2 className={sectionHeading}>Account</h2>
        </div>

        <p className="text-sm font-medium text-primary/80">Change Password</p>

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
            <Label className="text-xs text-muted-foreground">Current Password</Label>
            <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              className="rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">New Password</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Enter new password"
              className="rounded-lg" />
            {newPw && (
              <div className="space-y-1 pt-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? PW_COLORS[score] : "bg-white/10"}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength: <span className="font-medium text-foreground">{PW_LEVELS[score] || "—"}</span>
                </p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="Confirm new password"
              className="rounded-lg" />
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
        <div className={card}>
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-5 h-5 text-primary" />
            <h2 className={sectionHeading}>Data Management</h2>
          </div>

          <p className="text-sm font-medium text-primary/80">Download My Data</p>
          <p className="text-sm text-muted-foreground">
            Download a copy of all your ResearchFlow data including your profile, ideas, projects, messages, and Akili Score history.
            You&apos;ll receive an email within 24 hours.
          </p>
          {dataExportedAt && (
            <p className="text-xs text-muted-foreground">
              Last requested: {new Date(dataExportedAt).toLocaleDateString()}
            </p>
          )}
          {exportMsg && (
            <p className="text-sm flex items-center gap-1.5 text-green-400">
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
        <div className="p-6 rounded-2xl space-y-4 bg-red-500/5 border border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-semibold font-heading text-red-400">Delete Account</h3>
          </div>
          <p className="text-sm text-red-300">
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
      <div className={card}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sign Out</p>
            <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
          </div>
          <Button variant="outline" onClick={signOut} className="border-primary/30 rounded-lg">
            <LogOut className="mr-2 h-4 w-4" />Sign Out
          </Button>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 bg-card border border-red-500/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/15">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold">Delete Account</h3>
                <p className="text-xs text-muted-foreground">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your profile will be anonymised and you&apos;ll be removed from all teams. Published ideas and showcase entries will remain as &quot;Deleted User&quot;.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm
              </Label>
              <Input value={deleteText} onChange={e => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="bg-red-500/8 border-red-500/30 rounded-lg" />
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
