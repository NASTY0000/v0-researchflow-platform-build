'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  MessageSquare,
  Plus,
  ChevronRight,
  Bell,
  FileText
} from 'lucide-react'

// Mock data for demo
const MOCK_PENDING_REQUESTS = [
  {
    id: '1',
    studentName: 'Adebayo Ogundimu',
    studentAvatar: '',
    projectTitle: 'Machine Learning for Malaria Diagnosis',
    researchArea: 'Health Informatics',
    message: 'I am working on a project to use ML for malaria diagnosis and would love your guidance on the data analysis approach.',
    requestedAt: '2024-01-15',
  },
  {
    id: '2',
    studentName: 'Chioma Nwosu',
    studentAvatar: '',
    projectTitle: 'Sustainable Agriculture in Nigeria',
    researchArea: 'Agricultural Economics',
    message: 'Seeking mentorship for my research on sustainable farming practices in the Niger Delta region.',
    requestedAt: '2024-01-14',
  },
]

const MOCK_ACTIVE_MENTORSHIPS = [
  {
    id: '1',
    menteeName: 'Emeka Okafor',
    menteeAvatar: '',
    projectTitle: 'Renewable Energy Adoption',
    currentPhase: 'Data Collection',
    lastActivity: '2024-01-16',
    totalSessions: 4,
  },
  {
    id: '2',
    menteeName: 'Funke Adeleke',
    menteeAvatar: '',
    projectTitle: 'Public Health Communication',
    currentPhase: 'Literature Review',
    lastActivity: '2024-01-15',
    totalSessions: 2,
  },
]

const MOCK_SESSION_HISTORY = [
  {
    id: '1',
    studentName: 'Emeka Okafor',
    date: '2024-01-10',
    project: 'Renewable Energy Adoption',
    notes: 'Discussed survey methodology and sampling techniques.',
    rating: 5,
  },
  {
    id: '2',
    studentName: 'Funke Adeleke',
    date: '2024-01-08',
    project: 'Public Health Communication',
    notes: 'Reviewed literature review structure and key sources.',
    rating: 4,
  },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']

interface MentorDashboardProps {
  mentorProfile?: {
    id: string
    tier: 1 | 2 | 3
    isVerified: boolean
    totalSessions: number
    rating: number
    reviewCount: number
    availableSlots: number
    slotsUsed: number
  }
}

export function MentorDashboard({ mentorProfile }: MentorDashboardProps) {
  const [activeTab, setActiveTab] = useState('requests')
  const [availability, setAvailability] = useState<Record<string, string[]>>({
    Mon: ['10:00 AM', '2:00 PM'],
    Tue: ['10:00 AM', '11:00 AM'],
    Wed: ['3:00 PM', '4:00 PM'],
    Thu: [],
    Fri: ['9:00 AM', '10:00 AM'],
    Sat: [],
    Sun: [],
  })
  
  // Post Open Call form state
  const [showOpenCallForm, setShowOpenCallForm] = useState(false)
  const [openCallTitle, setOpenCallTitle] = useState('')
  const [openCallDescription, setOpenCallDescription] = useState('')
  const [openCallArea, setOpenCallArea] = useState('')
  const [openCallMaxApplicants, setOpenCallMaxApplicants] = useState(5)
  const [openCallDeadline, setOpenCallDeadline] = useState('')

  const toggleSlot = (day: string, time: string) => {
    setAvailability(prev => {
      const daySlots = prev[day] || []
      if (daySlots.includes(time)) {
        return { ...prev, [day]: daySlots.filter(t => t !== time) }
      } else {
        return { ...prev, [day]: [...daySlots, time] }
      }
    })
  }

  const profile = mentorProfile || {
    tier: 1,
    isVerified: true,
    totalSessions: 12,
    rating: 4.8,
    reviewCount: 8,
    availableSlots: 5,
    slotsUsed: 2,
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
                <Users className="w-5 h-5" style={{ color: '#A855F7' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#F3F0FF' }}>{MOCK_ACTIVE_MENTORSHIPS.length}</p>
                <p className="text-xs" style={{ color: '#7C6A9C' }}>Active Mentees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                <Calendar className="w-5 h-5" style={{ color: '#06B6D4' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#F3F0FF' }}>{profile.totalSessions}</p>
                <p className="text-xs" style={{ color: '#7C6A9C' }}>Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.15)' }}>
                <Star className="w-5 h-5" style={{ color: '#EAB308' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#F3F0FF' }}>{profile.rating}</p>
                <p className="text-xs" style={{ color: '#7C6A9C' }}>{profile.reviewCount} Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <Clock className="w-5 h-5" style={{ color: '#22C55E' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#F3F0FF' }}>{profile.availableSlots - profile.slotsUsed}</p>
                <p className="text-xs" style={{ color: '#7C6A9C' }}>Slots Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start gap-1 p-1 h-auto flex-wrap" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <TabsTrigger 
            value="requests" 
            className="relative data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2"
          >
            Pending Requests
            {MOCK_PENDING_REQUESTS.length > 0 && (
              <span className="ml-2 w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ background: '#EF4444', color: 'white' }}>
                {MOCK_PENDING_REQUESTS.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2">
            Active Mentorships
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2">
            Availability
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2">
            Session History
          </TabsTrigger>
          <TabsTrigger value="open-call" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white px-4 py-2">
            Post Open Call
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="requests" className="mt-6">
          <div className="space-y-4">
            {MOCK_PENDING_REQUESTS.length === 0 ? (
              <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: '#7C6A9C' }} />
                  <p style={{ color: '#7C6A9C' }}>No pending mentorship requests</p>
                </CardContent>
              </Card>
            ) : (
              MOCK_PENDING_REQUESTS.map((request) => (
                <Card key={request.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.studentAvatar} />
                        <AvatarFallback style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF' }}>
                          {request.studentName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold" style={{ color: '#F3F0FF' }}>{request.studentName}</h4>
                            <p className="text-sm" style={{ color: '#C084FC' }}>{request.projectTitle}</p>
                            <Badge className="mt-1" style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: 'none' }}>
                              {request.researchArea}
                            </Badge>
                          </div>
                          <span className="text-xs whitespace-nowrap" style={{ color: '#7C6A9C' }}>
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mt-3" style={{ color: '#7C6A9C' }}>{request.message}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}>
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                          <Button size="sm" variant="ghost" style={{ color: '#A855F7' }}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Active Mentorships */}
        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {MOCK_ACTIVE_MENTORSHIPS.length === 0 ? (
              <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#7C6A9C' }} />
                  <p style={{ color: '#7C6A9C' }}>No active mentorships yet</p>
                </CardContent>
              </Card>
            ) : (
              MOCK_ACTIVE_MENTORSHIPS.map((mentorship) => (
                <Card key={mentorship.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={mentorship.menteeAvatar} />
                        <AvatarFallback style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF' }}>
                          {mentorship.menteeName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold" style={{ color: '#F3F0FF' }}>{mentorship.menteeName}</h4>
                        <p className="text-sm" style={{ color: '#C084FC' }}>{mentorship.projectTitle}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#7C6A9C' }}>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {mentorship.currentPhase}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {mentorship.totalSessions} sessions
                          </span>
                          <span>Last active: {new Date(mentorship.lastActivity).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" style={{ color: '#A855F7' }}>
                        View Project
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Availability Calendar */}
        <TabsContent value="calendar" className="mt-6">
          <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <CardHeader>
              <CardTitle style={{ color: '#F3F0FF' }}>Weekly Availability</CardTitle>
              <CardDescription style={{ color: '#7C6A9C' }}>
                Click on time slots to toggle your availability. Students can only book from these slots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Header row with days */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div></div>
                    {DAYS.map(day => (
                      <div key={day} className="text-center text-sm font-medium py-2" style={{ color: '#F3F0FF' }}>
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Time slots */}
                  {TIME_SLOTS.map(time => (
                    <div key={time} className="grid grid-cols-8 gap-2 mb-2">
                      <div className="text-xs flex items-center justify-end pr-2" style={{ color: '#7C6A9C' }}>
                        {time}
                      </div>
                      {DAYS.map(day => {
                        const isSelected = availability[day]?.includes(time)
                        return (
                          <button
                            key={`${day}-${time}`}
                            onClick={() => toggleSlot(day, time)}
                            className="h-10 rounded-lg transition-all text-xs"
                            style={isSelected 
                              ? { background: 'rgba(34,197,94,0.3)', border: '1px solid rgba(34,197,94,0.5)', color: '#22C55E' }
                              : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', color: '#7C6A9C' }
                            }
                          >
                            {isSelected ? 'Available' : '-'}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-6 pt-4" style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: 'rgba(34,197,94,0.3)', border: '1px solid rgba(34,197,94,0.5)' }} />
                  <span className="text-xs" style={{ color: '#7C6A9C' }}>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }} />
                  <span className="text-xs" style={{ color: '#7C6A9C' }}>Not Available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session History */}
        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {MOCK_SESSION_HISTORY.length === 0 ? (
              <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#7C6A9C' }} />
                  <p style={{ color: '#7C6A9C' }}>No session history yet</p>
                </CardContent>
              </Card>
            ) : (
              MOCK_SESSION_HISTORY.map((session) => (
                <Card key={session.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold" style={{ color: '#F3F0FF' }}>{session.studentName}</h4>
                          <span className="text-xs" style={{ color: '#7C6A9C' }}>
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mb-2" style={{ color: '#C084FC' }}>{session.project}</p>
                        <p className="text-sm" style={{ color: '#7C6A9C' }}>{session.notes}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className="w-4 h-4" 
                            style={{ 
                              color: i < session.rating ? '#EAB308' : '#7C6A9C',
                              fill: i < session.rating ? '#EAB308' : 'transparent'
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Post Open Call */}
        <TabsContent value="open-call" className="mt-6">
          <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <CardHeader>
              <CardTitle style={{ color: '#F3F0FF' }}>Post a Research Opportunity</CardTitle>
              <CardDescription style={{ color: '#7C6A9C' }}>
                Create an open call for students to apply to your research project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label style={{ color: '#7C6A9C' }}>Title *</Label>
                <Input
                  value={openCallTitle}
                  onChange={(e) => setOpenCallTitle(e.target.value)}
                  placeholder="e.g., Research Assistant for Climate Change Study"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: '#7C6A9C' }}>Description *</Label>
                <Textarea
                  value={openCallDescription}
                  onChange={(e) => setOpenCallDescription(e.target.value)}
                  placeholder="Describe the research opportunity, expected responsibilities, and what you're looking for..."
                  rows={4}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#7C6A9C' }}>Research Area *</Label>
                  <Select value={openCallArea} onValueChange={setOpenCallArea}>
                    <SelectTrigger style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="public-health">Public Health</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="social-sciences">Social Sciences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#7C6A9C' }}>Max Applicants</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={openCallMaxApplicants}
                    onChange={(e) => setOpenCallMaxApplicants(Number(e.target.value))}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ color: '#7C6A9C' }}>Application Deadline *</Label>
                <Input
                  type="date"
                  value={openCallDeadline}
                  onChange={(e) => setOpenCallDeadline(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF' }}
                />
              </div>

              <Button 
                className="w-full"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 14px rgba(124,58,237,0.3)', border: 'none' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Open Call
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
