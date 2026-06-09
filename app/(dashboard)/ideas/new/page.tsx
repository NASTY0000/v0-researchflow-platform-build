"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Lightbulb, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { postResearchIdea } from "@/lib/actions/akili"
import { generateMatchesForNewIdea } from "@/lib/actions/matching"
import { TagInput } from "@/components/ui/tag-input"
import { RESEARCH_AREAS, SKILLS_LIST, LOOKING_FOR_OPTIONS } from "@/lib/constants/tags"

const ROLES = [
  "Data Scientist",
  "Software Developer",
  "Research Assistant",
  "Statistical Analyst",
  "Lab Technician",
  "Project Manager",
  "Technical Writer",
  "Domain Expert",
  "Designer",
  "Other",
]

const COLLABORATION_TYPES = [
  { value: "open", label: "Open Collaboration", description: "Anyone can request to join" },
  { value: "invite_only", label: "Invite Only", description: "You select who can join" },
  { value: "team_based", label: "Team Based", description: "Looking for a complete team" },
]

export default function NewIdeaPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [researchArea, setResearchArea] = useState<string[]>([])
  const [collaborationType, setCollaborationType] = useState("open")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [rolesNeeded, setRolesNeeded] = useState<string[]>([])
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([])

  function toggleRole(role: string) {
    if (rolesNeeded.includes(role)) {
      setRolesNeeded(rolesNeeded.filter((r) => r !== role))
    } else if (rolesNeeded.length < 5) {
      setRolesNeeded([...rolesNeeded, role])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !description.trim() || researchArea.length === 0) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to post an idea")
        setIsSubmitting(false)
        return
      }

      const { data, error: insertError } = await supabase
        .from("research_ideas")
        .insert({
          author_id: user.id,
          title: title.trim(),
          description: description.trim(),
          research_area: researchArea[0],
          collaboration_type: collaborationType,
          estimated_duration: estimatedDuration || null,
          tags,
          roles_needed: rolesNeeded,
          skills_needed: skillsNeeded,
          status: "open",
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating idea:", insertError)
        setError("Failed to create idea. Please try again.")
        setIsSubmitting(false)
        return
      }

      await postResearchIdea(user.id, data.id)
      generateMatchesForNewIdea(data.id, user.id).catch(() => {})
      router.push(`/ideas/${data.id}`)
    } catch (err) {
      console.error("Error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ideas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-heading">Post Research Idea</h1>
          <p className="text-muted-foreground">Share your concept and find collaborators</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Idea Details
            </CardTitle>
            <CardDescription>
              Describe your research idea clearly to attract the right collaborators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="A clear, descriptive title for your research idea"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{title.length}/200 characters</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Explain your research idea in detail. What problem does it solve? What are your goals? What methodology would you use?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">{description.length}/2000 characters</p>
            </div>

            {/* Research Area */}
            <div className="space-y-2">
              <Label>Research Area *</Label>
              <TagInput
                options={RESEARCH_AREAS}
                value={researchArea}
                onChange={setResearchArea}
                placeholder="Search research area..."
                maxItems={1}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (up to 5)</Label>
              <TagInput
                options={[]}
                value={tags}
                onChange={setTags}
                placeholder="Type a tag and press Enter..."
                maxItems={5}
              />
            </div>

            {/* Collaboration Type */}
            <div className="space-y-2">
              <Label>Collaboration Type</Label>
              <div className="grid md:grid-cols-3 gap-3">
                {COLLABORATION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCollaborationType(type.value)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      collaborationType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Roles Needed */}
            <div className="space-y-2">
              <Label>Roles Needed (select up to 5)</Label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <Badge
                    key={role}
                    variant={rolesNeeded.includes(role) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20"
                    onClick={() => toggleRole(role)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skills Needed */}
            <div className="space-y-2">
              <Label>Skills Needed (up to 10)</Label>
              <TagInput
                options={SKILLS_LIST}
                value={skillsNeeded}
                onChange={setSkillsNeeded}
                placeholder="Search skills..."
                maxItems={10}
              />
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration</Label>
              <Select value={estimatedDuration} onValueChange={setEstimatedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select estimated duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3 months">1-3 months</SelectItem>
                  <SelectItem value="3-6 months">3-6 months</SelectItem>
                  <SelectItem value="6-12 months">6-12 months</SelectItem>
                  <SelectItem value="1-2 years">1-2 years</SelectItem>
                  <SelectItem value="2+ years">2+ years</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/ideas">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Post Idea
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
