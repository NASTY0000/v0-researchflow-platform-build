"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen,
  Search,
  Star,
  Clock,
  Calendar,
  GraduationCap,
  Building2,
  MessageSquare,
  Loader2,
  Filter,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { MentorProfile, Profile } from "@/lib/types/database"

interface MentorWithProfile extends MentorProfile {
  profile: Profile & { university?: { name: string } }
}

const EXPERTISE_AREAS = [
  "All Areas",
  "Research Methods",
  "Academic Writing",
  "Data Analysis",
  "Statistics",
  "Grant Writing",
  "Publishing",
  "Career Development",
  "Laboratory Skills",
  "Field Research",
]

export default function MentorsPage() {
  const [mentors, setMentors] = useState<MentorWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArea, setSelectedArea] = useState("All Areas")
  const [selectedMentor, setSelectedMentor] = useState<MentorWithProfile | null>(null)
  const [requestMessage, setRequestMessage] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    loadMentors()
  }, [selectedArea, searchQuery])

  async function loadMentors() {
    setIsLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("mentor_profiles")
      .select(`
        *,
        profile:profiles!mentor_profiles_user_id_fkey(
          *,
          university:universities(name)
        )
      `)
      .eq("is_accepting_mentees", true)
      .order("rating", { ascending: false })

    if (selectedArea !== "All Areas") {
      query = query.contains("expertise_areas", [selectedArea])
    }

    const { data, error } = await query.limit(30)

    if (data && !error) {
      let filtered = data
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        filtered = data.filter(
          (m) =>
            m.profile?.full_name?.toLowerCase().includes(search) ||
            m.profile?.department?.toLowerCase().includes(search) ||
            m.expertise_areas?.some((a: string) => a.toLowerCase().includes(search))
        )
      }
      setMentors(filtered)
    }

    setIsLoading(false)
  }

  async function handleRequestMentorship() {
    if (!selectedMentor) return

    setIsRequesting(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsRequesting(false)
      return
    }

    // Create mentorship session request
    await supabase.from("mentorship_sessions").insert({
      mentor_id: selectedMentor.user_id,
      mentee_id: user.id,
      status: "requested",
      notes: requestMessage || "I would like to request mentorship.",
    })

    // Create notification for mentor
    await supabase.from("notifications").insert({
      user_id: selectedMentor.user_id,
      type: "mentorship_request",
      title: "New Mentorship Request",
      message: "Someone has requested your mentorship",
      link: "/mentors/requests",
    })

    setSelectedMentor(null)
    setRequestMessage("")
    setIsRequesting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Find a Mentor
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with experienced researchers for guidance and support
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/mentors/become">Become a Mentor</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors by name, expertise, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Expertise Area" />
              </SelectTrigger>
              <SelectContent>
                {EXPERTISE_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mentors Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mentors.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={mentor.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {mentor.profile?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{mentor.profile?.full_name}</h3>
                    {mentor.profile?.department && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 shrink-0" />
                        <span className="truncate">{mentor.profile.department}</span>
                      </p>
                    )}
                    {mentor.profile?.university_id && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{mentor.profile.university_id}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {mentor.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{mentor.bio}</p>
                )}

                {/* Expertise */}
                {mentor.expertise_areas && mentor.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {mentor.expertise_areas.slice(0, 3).map((area) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                    {mentor.expertise_areas.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mentor.expertise_areas.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {mentor.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {Number(mentor.rating).toFixed(1)}
                    </span>
                  )}
                  {mentor.total_sessions && mentor.total_sessions > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {mentor.total_sessions} sessions
                    </span>
                  )}
                  {mentor.availability_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {mentor.availability_hours}h/week
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => setSelectedMentor(mentor)}
                  >
                    Request Mentorship
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/profile/${mentor.user_id}`}>Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No mentors found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedArea !== "All Areas"
                ? "Try adjusting your filters"
                : "No mentors are currently available"}
            </p>
            <Button variant="outline" asChild>
              <Link href="/mentors/become">Become a Mentor</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request Dialog */}
      <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              Send a message to {selectedMentor?.profile?.full_name} explaining what you&apos;re looking for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedMentor?.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedMentor?.profile?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{selectedMentor?.profile?.full_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMentor?.profile?.department}
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Introduce yourself and describe what kind of guidance you're seeking..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMentor(null)}>
              Cancel
            </Button>
            <Button onClick={handleRequestMentorship} disabled={isRequesting}>
              {isRequesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
