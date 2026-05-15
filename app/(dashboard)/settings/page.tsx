"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User, Bell, Shield, LogOut, Save, Loader2, X, Plus, Camera,
  Check, Lock, Download, Trash2, AlertTriangle, Globe, EyeOff,
  MessageSquare, Search, Activity, Mail, Key,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, University } from "@/lib/types/database"

// ─── Notification types ───────────────────────────────────────────────────────
const NOTIFICATION_TYPES = [
  { key: "new_match", label: "New match suggestion" },
  { key: "connection_request", label: "Connection request received" },
  { key: "connection_accepted", label: "Connection request accepted" },
  { key: "project_invite", label: "Invited to join project" },
  { key: "mentorship_request", label: "Mentorship request received" },
  { key: "mentorship_response", label: "Mentorship request accepted/declined" },
  { key: "task_assigned", label: "Task assigned to me" },
  { key: "task_application", label: "Task application received" },
  { key: "workspace_message", label: "New message in workspace" },
  { key: "session_reminder", label: "Upcoming session reminder" },
  { key: "milestone_completed", label: "Milestone completed by team" },
  { key: "showcase_update", label: "Showcase submission status update" },
  { key: "akili_earned", label: "New Akili score earned" },
] as const

type NotifKey = (typeof NOTIFICATION_TYPES)[number]["key"]

interface NotifPrefs {
  [key: string]: { whatsapp: boolean; sms: boolean }
}

// ─── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "" }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { level: 1, label: "Weak", color: "bg-red-500" },
    { level: 2, label: "Fair", color: "bg-orange-500" },
    { level: 3, label: "Good", color: "bg-yellow-500" },
    { level: 4, label: "Strong", color: "bg-green-500" },
  ]
  return levels[score - 1] ?? { level: 0, label: "", color: "" }
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // ── Avatar upload ──
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Profile tab ──
  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [universityId, setUniversityId] = useState("")
  const [department, setDepartment] = useState("")
  const [academicLevel, setAcademicLevel] = useState("")
  const [researchInterests, setResearchInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState("")
  const [newSkill, setNewSkill] = useState("")

  // ── Privacy tab ──
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
  const [profileVisibility, setProfileVisibility] = useState<"public" | "university_only" | "connections_only">("public")
  const [showAvailability, setShowAvailability] = useState(true)
  const [allowDmFromNonConnections, setAllowDmFromNonConnections] = useState(true)
  const [appearInSearch, setAppearInSearch] = useState(true)

  // ── Notifications tab ──
  const [isSavingNotifs, setIsSavingNotifs] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({})
  const [emailDigest, setEmailDigest] = useState(true)
  const [emailMarketing, setEmailMarketing] = useState(false)

  // ── Account tab (password) ──
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // ── Data tab ──
  const [isRequestingExport, setIsRequestingExport] = useState(false)
  const [hasGoogleAccount, setHasGoogleAccount] = useState(false)
  const [googleEmail, setGoogleEmail] = useState("")
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)

  // Delete account
  const [activeProjectsOwned, setActiveProjectsOwned] = useState<{ id: string; title: string }[]>([])
  const [activeMentorships, setActiveMentorships] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const [profileRes, unisRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("universities").select("*").order("name"),
    ])

    if (unisRes.data) setUniversities(unisRes.data)

    if (profileRes.data) {
      const p = profileRes.data as Profile
      setProfile(p)
      setFullName(p.full_name || "")
      setBio(p.bio || "")
      setUniversityId(p.university_id || "")
      setDepartment(p.department || "")
      setAcademicLevel(p.academic_level || "")
      setResearchInterests(p.research_interests || [])
      setSkills(p.skills || [])
      setProfileVisibility(p.profile_visibility || "public")
      setShowAvailability(p.show_availability !== false)
      setAllowDmFromNonConnections(p.allow_dm_from_non_connections !== false)
      setAppearInSearch(p.appear_in_search !== false)
      setEmailDigest(p.email_digest !== false)
      setEmailMarketing(p.email_marketing === true)
      setNotifPrefs(p.notification_prefs || {})
    }

    // Check Google identity
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const googleId = authUser?.identities?.find(i => i.provider === "google")
    if (googleId) {
      setHasGoogleAccount(true)
      setGoogleEmail((googleId.identity_data as { email?: string })?.email || "")
    }

    // Check owned active projects
    const { data: teams } = await supabase
      .from("teams")
      .select("id, projects!inner(id, title, status)")
      .eq("leader_id", user.id)
    if (teams) {
      const owned: { id: string; title: string }[] = []
      for (const t of teams) {
        const projs = (t as unknown as { projects: { id: string; title: string; status: string }[] }).projects
        if (Array.isArray(projs)) {
          for (const p of projs) {
            if (p.status === "active") owned.push({ id: p.id, title: p.title })
          }
        }
      }
      setActiveProjectsOwned(owned)
    }

    // Check active mentorships
    const { count } = await supabase
      .from("mentor_sessions")
      .select("*", { count: "exact", head: true })
      .eq("mentor_id", user.id)
      .eq("status", "upcoming")
    setActiveMentorships(count || 0)

    setIsLoading(false)
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────────
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5MB")
      return
    }

    setIsUploadingAvatar(true)
    setAvatarError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsUploadingAvatar(false); return }

    const fileExt = file.name.split(".").pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase
      .storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      setAvatarError(uploadError.message)
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const { data: urlData } = supabase
      .storage
      .from("avatars")
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id)

    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev)
    setIsUploadingAvatar(false)

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Save profile ─────────────────────────────────────────────────────────────
  async function handleSaveProfile() {
    setIsSaving(true)
    setMessage(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      bio: bio.trim(),
      university_id: universityId || null,
      department: department.trim(),
      academic_level: academicLevel,
      research_interests: researchInterests,
      skills,
    }).eq("id", user.id)
    setMessage(error ? { type: "error", text: "Failed to save changes" } : { type: "success", text: "Profile updated successfully" })
    setIsSaving(false)
  }

  // ── Save privacy ─────────────────────────────────────────────────────────────
  async function handleSavePrivacy() {
    setIsSavingPrivacy(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from("profiles").update({
      profile_visibility: profileVisibility,
      show_availability: showAvailability,
      allow_dm_from_non_connections: allowDmFromNonConnections,
      appear_in_search: appearInSearch,
    }).eq("id", user.id)
    setMessage(error ? { type: "error", text: "Failed to save privacy settings" } : { type: "success", text: "Privacy settings saved" })
    setIsSavingPrivacy(false)
  }

  // ── Save notifications ────────────────────────────────────────────────────────
  async function handleSaveNotifications() {
    setIsSavingNotifs(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from("profiles").update({
      notification_prefs: notifPrefs,
      email_digest: emailDigest,
      email_marketing: emailMarketing,
    }).eq("id", user.id)
    setMessage(error ? { type: "error", text: "Failed to save notification preferences" } : { type: "success", text: "Notification preferences saved" })
    setIsSavingNotifs(false)
  }

  function toggleNotif(key: NotifKey, channel: "whatsapp" | "sms") {
    setNotifPrefs(prev => ({
      ...prev,
      [key]: {
        whatsapp: prev[key]?.whatsapp ?? false,
        sms: prev[key]?.sms ?? false,
        [channel]: !(prev[key]?.[channel] ?? false),
      },
    }))
  }

  // ── Change password ───────────────────────────────────────────────────────────
  async function handleChangePassword() {
    setPasswordMessage(null)
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }
    setIsSavingPassword(true)
    const supabase = createClient()
    // Verify current password by re-signing in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setIsSavingPassword(false); return }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
    if (signInErr) {
      setPasswordMessage({ type: "error", text: "Current password is incorrect" })
      setIsSavingPassword(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMessage({ type: "error", text: error.message })
    } else {
      setPasswordMessage({ type: "success", text: "Password changed successfully" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
    setIsSavingPassword(false)
  }

  // ── Request data export ───────────────────────────────────────────────────────
  async function handleRequestExport() {
    setIsRequestingExport(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("profiles").update({ data_export_requested_at: new Date().toISOString() }).eq("id", user.id)
    setMessage({ type: "success", text: "Data export requested. You'll receive an email within 24 hours with your download link." })
    setIsRequestingExport(false)
  }

  // ── Close a project ───────────────────────────────────────────────────────────
  async function handleCloseProject(projectId: string) {
    const supabase = createClient()
    await supabase.from("projects").update({ status: "archived" }).eq("id", projectId)
    setActiveProjectsOwned(prev => prev.filter(p => p.id !== projectId))
  }

  // ── Delete account ────────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return
    setIsDeleting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Anonymize profile
    await supabase.from("profiles").update({
      full_name: "Deleted User",
      email: `deleted_${user.id}@deleted.invalid`,
      bio: null,
      avatar_url: null,
      account_status: "deleted",
      deletion_requested_at: new Date().toISOString(),
    }).eq("id", user.id)

    // Remove from active teams
    await supabase.from("team_members").delete().eq("user_id", user.id)

    // Cancel pending mentorship requests
    await supabase.from("mentorship_requests")
      .update({ status: "declined" })
      .eq("student_id", user.id)
      .eq("status", "pending")

    await supabase.auth.signOut()
    router.push("/")
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  function addInterest() {
    if (newInterest.trim() && !researchInterests.includes(newInterest.trim()) && researchInterests.length < 10) {
      setResearchInterests([...researchInterests, newInterest.trim()])
      setNewInterest("")
    }
  }

  function addSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 15) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const pwStrength = getPasswordStrength(newPassword)
  const canDelete = activeProjectsOwned.length === 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-500/40 bg-green-500/10" : ""}>
          <AlertDescription className="flex items-center gap-2">
            {message.type === "success" && <Check className="h-4 w-4 text-green-500" />}
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2"><Shield className="h-4 w-4" />Privacy</TabsTrigger>
          <TabsTrigger value="account" className="gap-2"><Key className="h-4 w-4" />Account</TabsTrigger>
          <TabsTrigger value="data" className="gap-2"><Download className="h-4 w-4" />Data</TabsTrigger>
        </TabsList>

        {/* ════════════ PROFILE ════════════ */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Your profile photo visible to other users</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">{fullName?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                  <Camera className="mr-2 h-4 w-4" />
                  {isUploadingAvatar ? "Uploading..." : "Change Photo"}
                </Button>
                <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
                {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your personal and academic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ""} disabled className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself and your research..." rows={4} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select value={universityId} onValueChange={setUniversityId}>
                    <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Computer Science" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Academic Level</Label>
                <Select value={academicLevel} onValueChange={setAcademicLevel}>
                  <SelectTrigger className="w-full md:w-[300px]"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="masters">Master&apos;s Student</SelectItem>
                    <SelectItem value="phd">PhD Candidate</SelectItem>
                    <SelectItem value="postdoc">Post-doctoral</SelectItem>
                    <SelectItem value="faculty">Faculty/Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Research Interests</CardTitle>
              <CardDescription>Add topics you&apos;re interested in researching (max 10)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder="Add an interest" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest() } }} />
                <Button variant="outline" onClick={addInterest}><Plus className="h-4 w-4" /></Button>
              </div>
              {researchInterests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {researchInterests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="gap-1">
                      {interest}
                      <button onClick={() => setResearchInterests(researchInterests.filter(i => i !== interest))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>List your technical and research skills (max 15)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }} />
                <Button variant="outline" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="gap-1">
                      {skill}
                      <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
            </Button>
          </div>
        </TabsContent>

        {/* ════════════ NOTIFICATIONS ════════════ */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                In-app notifications are always on. Toggle WhatsApp and SMS per notification type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-full">Notification</TableHead>
                    <TableHead className="text-center whitespace-nowrap">In-App</TableHead>
                    <TableHead className="text-center whitespace-nowrap">WhatsApp</TableHead>
                    <TableHead className="text-center whitespace-nowrap">SMS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {NOTIFICATION_TYPES.map(({ key, label }) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch checked disabled className="opacity-60" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={notifPrefs[key]?.whatsapp ?? false}
                            onCheckedChange={() => toggleNotif(key, "whatsapp")}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={notifPrefs[key]?.sms ?? false}
                            onCheckedChange={() => toggleNotif(key, "sms")}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>Control the emails you receive from ResearchFlow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Research Digest</Label>
                  <p className="text-sm text-muted-foreground">Send me a weekly research digest email</p>
                </div>
                <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Platform Updates</Label>
                  <p className="text-sm text-muted-foreground">Send me platform updates and announcements</p>
                </div>
                <Switch checked={emailMarketing} onCheckedChange={setEmailMarketing} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications} disabled={isSavingNotifs}>
              {isSavingNotifs ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Notification Preferences</>}
            </Button>
          </div>
        </TabsContent>

        {/* ════════════ PRIVACY ════════════ */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Profile Visibility</CardTitle>
              <CardDescription>Control who can view your full profile</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={profileVisibility} onValueChange={(v) => setProfileVisibility(v as typeof profileVisibility)} className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="public" id="vis-public" className="mt-0.5" />
                  <Label htmlFor="vis-public" className="cursor-pointer flex-1">
                    <span className="font-medium block">Public</span>
                    <span className="text-sm text-muted-foreground">Anyone can view your full profile</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="university_only" id="vis-uni" className="mt-0.5" />
                  <Label htmlFor="vis-uni" className="cursor-pointer flex-1">
                    <span className="font-medium block">University Only</span>
                    <span className="text-sm text-muted-foreground">Only users from your university can view your full profile</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="connections_only" id="vis-conn" className="mt-0.5" />
                  <Label htmlFor="vis-conn" className="cursor-pointer flex-1">
                    <span className="font-medium block">Connections Only</span>
                    <span className="text-sm text-muted-foreground">Only your connected researchers can view your full profile</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity & Discoverability</CardTitle>
              <CardDescription>Manage how others interact with you on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <Label className="text-base">Availability Status</Label>
                    <p className="text-sm text-muted-foreground">Show when I&apos;m active on platform</p>
                  </div>
                </div>
                <Switch checked={showAvailability} onCheckedChange={setShowAvailability} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <Label className="text-base">Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">Allow direct messages from people I&apos;m not connected with</p>
                  </div>
                </div>
                <Switch checked={allowDmFromNonConnections} onCheckedChange={setAllowDmFromNonConnections} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <Label className="text-base">Search Visibility</Label>
                    <p className="text-sm text-muted-foreground">Appear in collaborator search results and match suggestions</p>
                  </div>
                </div>
                <Switch checked={appearInSearch} onCheckedChange={setAppearInSearch} />
              </div>
              {!appearInSearch && (
                <Alert className="border-amber-500/30 bg-amber-500/10">
                  <EyeOff className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-600">
                    You are hidden from search results and match suggestions.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSavePrivacy} disabled={isSavingPrivacy}>
              {isSavingPrivacy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Privacy Settings</>}
            </Button>
          </div>
        </TabsContent>

        {/* ════════════ ACCOUNT ════════════ */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMessage && (
                <Alert variant={passwordMessage.type === "error" ? "destructive" : "default"} className={passwordMessage.type === "success" ? "border-green-500/40 bg-green-500/10" : ""}>
                  <AlertDescription className="flex items-center gap-2">
                    {passwordMessage.type === "success" && <Check className="h-4 w-4 text-green-500" />}
                    {passwordMessage.text}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= pwStrength.level ? pwStrength.color : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Strength: <span className="font-medium">{pwStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <Button onClick={handleChangePassword} disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}>
                {isSavingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing...</> : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Email Preferences</CardTitle>
              <CardDescription>Control your email communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Research Digest</Label>
                  <p className="text-sm text-muted-foreground">Send me a weekly research digest email</p>
                </div>
                <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Platform Updates</Label>
                  <p className="text-sm text-muted-foreground">Send me platform updates and announcements</p>
                </div>
                <Switch checked={emailMarketing} onCheckedChange={setEmailMarketing} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════ DATA ════════════ */}
        <TabsContent value="data" className="space-y-6">
          {/* Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Download My Data</CardTitle>
              <CardDescription>
                Download a copy of all your ResearchFlow data including your profile, ideas, projects, messages, and Akili Score history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your data will be exported as a ZIP file containing JSON files. You&apos;ll receive an email with the download link within 24 hours of requesting.
              </p>
              {profile?.data_export_requested_at && (
                <Alert className="border-blue-500/30 bg-blue-500/10">
                  <AlertDescription>
                    Last requested: {new Date(profile.data_export_requested_at).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}
              <Button variant="outline" onClick={handleRequestExport} disabled={isRequestingExport}>
                {isRequestingExport ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Requesting...</> : <><Download className="mr-2 h-4 w-4" />Request Download</>}
              </Button>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage third-party accounts linked to ResearchFlow</CardDescription>
            </CardHeader>
            <CardContent>
              {hasGoogleAccount ? (
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Google</p>
                      <p className="text-sm text-muted-foreground">{googleEmail}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowDisconnectModal(true)}>Disconnect</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No connected accounts.</p>
              )}
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>Permanently delete your ResearchFlow account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-destructive/40 bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Deleting your account is permanent and cannot be undone. All your data will be removed from ResearchFlow.
                </AlertDescription>
              </Alert>

              {/* Blocking: owned active projects */}
              {activeProjectsOwned.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-destructive">
                    You own {activeProjectsOwned.length} active project{activeProjectsOwned.length > 1 ? "s" : ""}. Please transfer ownership or close these projects before deleting your account.
                  </p>
                  <div className="space-y-2">
                    {activeProjectsOwned.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium truncate">{p.title}</span>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                            <a href={`/projects/${p.id}`}>Transfer Ownership</a>
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleCloseProject(p.id)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning: active mentorships */}
              {activeMentorships > 0 && (
                <Alert className="border-amber-500/30 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-600">
                    You have {activeMentorships} active mentorship{activeMentorships > 1 ? "s" : ""}. Students will be notified when you delete your account.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                variant="destructive"
                disabled={!canDelete}
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Disconnect Google Modal ── */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-lg">Disconnect Google Account</h3>
            <p className="text-sm text-muted-foreground">
              You will need to use email/password to sign in after disconnecting Google. Make sure you have set a password first.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={() => {
                // Supabase doesn't expose identity unlinking in the client SDK directly;
                // this would require an edge function in production
                setMessage({ type: "error", text: "To disconnect Google, please contact support or use account settings in your email provider." })
                setShowDisconnectModal(false)
              }}>
                Disconnect
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowDisconnectModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Delete Account</h3>
                <p className="text-xs text-muted-foreground">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your profile will be anonymized, and you will be removed from all active teams. Your published ideas and showcase entries will remain but show as &quot;Deleted User&quot;.
            </p>
            <div className="space-y-2">
              <Label>Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="border-destructive/40 focus-visible:ring-destructive"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Confirm Delete"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText("") }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
