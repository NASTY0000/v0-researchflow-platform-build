"use client"

import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Bell,
  Shield,
  LogOut,
  Save,
  Loader2,
  X,
  Plus,
  Camera,
  Check,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, University, NotificationPreference } from "@/lib/types/database"
import {
  CHANNEL_NOTIFICATION_LABELS,
  CHANNEL_NOTIFICATION_TYPES,
  type ChannelNotificationType,
} from "@/lib/notifications/constants"
import {
  confirmPhoneVerificationAction,
  requestPhoneVerificationAction,
  updateChannelMasterFlagsAction,
  updateNotificationPreferencesAction,
} from "@/lib/actions/notifications"

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form state
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [universityId, setUniversityId] = useState("")
  const [department, setDepartment] = useState("")
  const [academicLevel, setAcademicLevel] = useState("")
  const [researchInterests, setResearchInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [publicProfile, setPublicProfile] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [phoneInput, setPhoneInput] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSending, setOtpSending] = useState(false)
  const [otpConfirming, setOtpConfirming] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [masterWa, setMasterWa] = useState(false)
  const [masterSms, setMasterSms] = useState(false)
  const [prefRows, setPrefRows] = useState<Record<string, { whatsapp: boolean; sms: boolean }>>({})
  const [prefsSaving, setPrefsSaving] = useState(false)

  useEffect(() => {
    loadProfile()
    loadUniversities()
  }, [])

  async function loadProfile() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (data) {
      setProfile(data)
      setFullName(data.full_name || "")
      setBio(data.bio || "")
      setUniversityId(data.university_id || "")
      setDepartment(data.department || "")
      setAcademicLevel(data.academic_level || "")
      setResearchInterests(data.research_interests || [])
      setSkills(data.skills || [])
      setPublicProfile(data.public_profile !== false)
      setEmailNotifications(data.email_notifications !== false)
      setPhoneInput(data.phone_number || "")
      setPhoneVerified(data.phone_verified === true)
      setMasterWa(data.whatsapp_enabled === true)
      setMasterSms(data.sms_enabled === true)
      await loadPrefs(data.id)
    }

    setIsLoading(false)
  }

  async function loadPrefs(userId: string) {
    const supabase = createClient()
    const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", userId)
    const base: Record<string, { whatsapp: boolean; sms: boolean }> = {}
    for (const t of CHANNEL_NOTIFICATION_TYPES) {
      base[t] = { whatsapp: false, sms: false }
    }
    for (const row of data || []) {
      const r = row as NotificationPreference
      base[r.notification_type] = { whatsapp: r.whatsapp, sms: r.sms }
    }
    setPrefRows(base)
  }

  async function loadUniversities() {
    const supabase = createClient()
    const { data } = await supabase.from("universities").select("*").order("name")
    if (data) setUniversities(data)
  }

  async function handleSave() {
    setIsSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        bio: bio.trim(),
        university_id: universityId || null,
        department: department.trim(),
        academic_level: academicLevel,
        research_interests: researchInterests,
        skills,
        public_profile: publicProfile,
        email_notifications: emailNotifications,
      })
      .eq("id", user.id)

    if (error) {
      setMessage({ type: "error", text: "Failed to save changes" })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" })
    }

    setIsSaving(false)
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

  function removeInterest(interest: string) {
    setResearchInterests(researchInterests.filter((i) => i !== interest))
  }

  function addSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 15) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill))
  }

  async function handleSendOtp() {
    setMessage(null)
    setOtpSending(true)
    const res = await requestPhoneVerificationAction(phoneInput.trim())
    setOtpSending(false)
    if ("error" in res && res.error) setMessage({ type: "error", text: res.error })
    else setMessage({ type: "success", text: "We sent a code by SMS." })
  }

  async function handleConfirmOtp() {
    setMessage(null)
    setOtpConfirming(true)
    const res = await confirmPhoneVerificationAction(otpCode)
    setOtpConfirming(false)
    if ("error" in res && res.error) {
      setMessage({ type: "error", text: res.error })
      return
    }
    setMessage({ type: "success", text: "Phone verified." })
    setOtpCode("")
    await loadProfile()
  }

  async function handleSaveChannelPrefs() {
    setPrefsSaving(true)
    setMessage(null)
    const payload: Partial<Record<ChannelNotificationType, { whatsapp?: boolean; sms?: boolean }>> = {}
    for (const t of CHANNEL_NOTIFICATION_TYPES) {
      payload[t] = {
        whatsapp: prefRows[t]?.whatsapp ?? false,
        sms: prefRows[t]?.sms ?? false,
      }
    }
    const res = await updateNotificationPreferencesAction(payload)
    setPrefsSaving(false)
    if ("error" in res && res.error) setMessage({ type: "error", text: res.error })
    else setMessage({ type: "success", text: "Notification preferences saved." })
  }

  async function setMasterWhatsApp(checked: boolean) {
    setMessage(null)
    const res = await updateChannelMasterFlagsAction({ whatsapp_enabled: checked })
    if ("error" in res && res.error) {
      setMessage({ type: "error", text: res.error })
      return
    }
    setMasterWa(checked)
    if (!checked) {
      setPrefRows((prev) => {
        const next = { ...prev }
        for (const t of CHANNEL_NOTIFICATION_TYPES) {
          next[t] = { whatsapp: false, sms: next[t]?.sms ?? false }
        }
        return next
      })
    }
  }

  async function setMasterSmsEnabled(checked: boolean) {
    setMessage(null)
    const res = await updateChannelMasterFlagsAction({ sms_enabled: checked })
    if ("error" in res && res.error) {
      setMessage({ type: "error", text: res.error })
      return
    }
    setMasterSms(checked)
    if (!checked) {
      setPrefRows((prev) => {
        const next = { ...prev }
        for (const t of CHANNEL_NOTIFICATION_TYPES) {
          next[t] = { whatsapp: next[t]?.whatsapp ?? false, sms: false }
        }
        return next
      })
    }
  }

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
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="flex items-center gap-2">
            {message.type === "success" && <Check className="h-4 w-4" />}
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Your profile photo visible to other users</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {fullName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline">
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your personal and academic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ""} disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself and your research..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select value={universityId} onValueChange={setUniversityId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Academic Level</Label>
                <Select value={academicLevel} onValueChange={setAcademicLevel}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="masters">Master&apos;s Student</SelectItem>
                    <SelectItem value="phd">PhD Candidate</SelectItem>
                    <SelectItem value="postdoc">Post-doctoral</SelectItem>
                    <SelectItem value="faculty">Faculty/Professor</SelectItem>
                    <SelectItem value="industry">Industry Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Research Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Research Interests</CardTitle>
              <CardDescription>Add topics you&apos;re interested in researching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addInterest()
                    }
                  }}
                />
                <Button variant="outline" onClick={addInterest}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {researchInterests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {researchInterests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="gap-1">
                      {interest}
                      <button onClick={() => removeInterest(interest)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>List your technical and research skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                />
                <Button variant="outline" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
              <CardDescription>Product updates by email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp / SMS number</CardTitle>
              <CardDescription>
                Nigerian numbers in E.164 format (+234…). We send an SMS code to verify.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="phone">Phone (WhatsApp & SMS)</Label>
                  <Input
                    id="phone"
                    placeholder="+2348012345678"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    disabled={phoneVerified}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={phoneVerified || otpSending}
                  onClick={() => void handleSendOtp()}
                >
                  {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                </Button>
                {phoneVerified && (
                  <Badge variant="secondary" className="h-9 px-3 gap-1">
                    <Check className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              {!phoneVerified && (
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end max-w-md">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={otpConfirming || otpCode.length !== 6}
                    onClick={() => void handleConfirmOtp()}
                  >
                    {otpConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Channel switches</CardTitle>
              <CardDescription>Enable channels after your number is verified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">Allow WhatsApp for enabled alert types</p>
                </div>
                <Switch
                  checked={masterWa}
                  onCheckedChange={(c) => void setMasterWhatsApp(c)}
                  disabled={!phoneVerified}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS</Label>
                  <p className="text-sm text-muted-foreground">Short SMS fallback for enabled types</p>
                </div>
                <Switch
                  checked={masterSms}
                  onCheckedChange={(c) => void setMasterSmsEnabled(c)}
                  disabled={!phoneVerified}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts by type</CardTitle>
              <CardDescription>
                In-app is always on. WhatsApp and SMS follow your switches above.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-3 font-medium">Alert</th>
                      <th className="text-center p-3 font-medium w-28">In-app</th>
                      <th className="text-center p-3 font-medium w-28">WhatsApp</th>
                      <th className="text-center p-3 font-medium w-24">SMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNEL_NOTIFICATION_TYPES.map((t) => (
                      <tr key={t} className="border-b last:border-0">
                        <td className="p-3 align-middle">
                          <span className="font-medium">{CHANNEL_NOTIFICATION_LABELS[t]}</span>
                        </td>
                        <td className="p-3 text-center align-middle">
                          <Switch checked disabled aria-readonly />
                        </td>
                        <td className="p-3 text-center align-middle">
                          <Switch
                            checked={prefRows[t]?.whatsapp ?? false}
                            disabled={!phoneVerified || !masterWa}
                            onCheckedChange={(c) =>
                              setPrefRows((prev) => ({
                                ...prev,
                                [t]: { whatsapp: c, sms: prev[t]?.sms ?? false },
                              }))
                            }
                          />
                        </td>
                        <td className="p-3 text-center align-middle">
                          <Switch
                            checked={prefRows[t]?.sms ?? false}
                            disabled={!phoneVerified || !masterSms}
                            onCheckedChange={(c) =>
                              setPrefRows((prev) => ({
                                ...prev,
                                [t]: { whatsapp: prev[t]?.whatsapp ?? false, sms: c },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button type="button" disabled={prefsSaving} onClick={() => void handleSaveChannelPrefs()}>
                  {prefsSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save alert preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your profile visibility and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Allow others to discover and view your profile</p>
                </div>
                <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show in Matches</Label>
                  <p className="text-sm text-muted-foreground">Appear in collaborator suggestions</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
