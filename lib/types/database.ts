// Database types for ResearchFlow

export type AcademicLevel = 'undergraduate' | 'masters' | 'phd' | 'postdoc' | 'faculty'

export type UserRole = 'student_researcher' | 'collaborator' | 'technical_expert' | 'mentor' | 'admin'

export type ConnectionType = 'collaboration' | 'mentorship'

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export type TeamStatus = 'forming' | 'active' | 'completed' | 'disbanded'

export type ProjectPhase = 
  | 'problem_identification' 
  | 'literature_review' 
  | 'methodology' 
  | 'data_collection' 
  | 'analysis' 
  | 'writing' 
  | 'review' 
  | 'publication'

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type CollaborationType = 'open' | 'invite_only' | 'team_based'

export type IdeaStatus = 'open' | 'in_progress' | 'completed' | 'closed'

export type MarketplaceTaskType = 'data_analysis' | 'writing' | 'coding' | 'design' | 'research' | 'review' | 'other'

export type CompensationType = 'paid' | 'collaboration' | 'credit'

export type SessionType = 'video' | 'chat' | 'in_person'

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type MessageType = 'text' | 'file' | 'system'

export type ConversationType = 'direct' | 'team' | 'project'

export type NotificationType = 
  | 'connection_request' 
  | 'connection_accepted' 
  | 'team_invite' 
  | 'task_assigned' 
  | 'task_completed' 
  | 'message' 
  | 'mention'
  | 'session_reminder' 
  | 'match_found' 
  | 'idea_comment' 
  | 'system'
  | 'announcement'
  | 'mentor_verification'
  | 'mentor_rejected'
  | 'moderation_warning'

export type PortfolioItemType = 'publication' | 'project' | 'certificate' | 'award' | 'presentation' | 'other'

export type MatchType = 'collaborator' | 'mentor' | 'idea'

export type MatchStatus = 'suggested' | 'viewed' | 'contacted' | 'dismissed'

export type ShowcaseStatus = 'draft' | 'submitted' | 'published' | 'featured' | 'archived'

export type AccountStatus = 'active' | 'suspended'

export type UniversityType = 'federal' | 'state' | 'private'

export type MentorVerificationStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'revoked'

export type ContentReportType = 'idea' | 'task' | 'message'

export type ContentReportQueueStatus = 'open' | 'dismissed' | 'actioned'

export type BroadcastAudience = 'all' | 'university' | 'role'

// Database row types
export interface University {
  id: string
  name: string
  country: string
  email_domain: string | null
  is_verified: boolean
  university_type?: UniversityType | null
  is_active?: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  university_id: string | null
  department: string | null
  academic_level: AcademicLevel | null
  bio: string | null
  roles: UserRole[]
  research_interests: string[]
  skills: string[]
  looking_for: string[]
  weekly_hours_available: number
  onboarding_completed: boolean
  onboarding_step: number
  projects_completed: number
  connections_count: number
  portfolio_views: number
  email_notifications: boolean
  public_profile: boolean
  is_admin?: boolean
  account_status?: AccountStatus
  suspension_reason?: string | null
  suspended_until?: string | null
  akili_score?: number
  created_at: string
  updated_at: string
  // Joined fields
  university?: University
}

export interface MentorProfile {
  id: string
  user_id: string
  tier: 1 | 2 | 3
  is_verified: boolean
  specializations: string[]
  mentorship_areas: string[]
  available_slots: number
  slots_used: number
  hourly_rate: number | null
  total_sessions: number
  rating: number
  review_count: number
  verification_status?: MentorVerificationStatus
  institutional_email?: string | null
  staff_id_document_url?: string | null
  supervisor_letter_url?: string | null
  verification_submitted_at?: string | null
  verification_rejection_reason?: string | null
  created_at: string
  updated_at: string
  // Joined fields
  profile?: Profile
}

export interface ResearchIdea {
  id: string
  author_id: string
  title: string
  description: string
  research_area: string
  tags: string[]
  roles_needed: string[]
  skills_needed: string[]
  estimated_duration: string | null
  collaboration_type: CollaborationType | null
  status: IdeaStatus
  upvotes: number
  views: number
  is_featured: boolean
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
  user_has_upvoted?: boolean
}

export interface Team {
  id: string
  name: string
  description: string | null
  idea_id: string | null
  leader_id: string
  max_members: number
  status: TeamStatus
  created_at: string
  updated_at: string
  // Joined fields
  leader?: Profile
  members?: TeamMember[]
  idea?: ResearchIdea
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'leader' | 'co-leader' | 'member'
  responsibilities: string[]
  joined_at: string
  // Joined fields
  profile?: Profile
}

export interface Connection {
  id: string
  requester_id: string
  recipient_id: string
  connection_type: ConnectionType
  status: ConnectionStatus
  message: string | null
  idea_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  requester?: Profile
  recipient?: Profile
  idea?: ResearchIdea
}

export interface Project {
  id: string
  team_id: string
  title: string
  description: string | null
  research_area: string | null
  current_phase: ProjectPhase
  phase_progress: number
  start_date: string
  target_end_date: string | null
  status: ProjectStatus
  is_public: boolean
  created_at: string
  updated_at: string
  // Joined fields
  team?: Team
  tasks?: Task[]
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  assignee_id?: string | null
  due_date: string | null
  phase: string | null
  order_index: number
  created_at: string
  updated_at: string
  // Joined fields
  assignee?: Profile
}

export interface MarketplaceTask {
  id: string
  poster_id: string
  project_id: string | null
  title: string
  description: string
  skills_required: string[]
  task_type: MarketplaceTaskType
  compensation_type: CompensationType
  budget: number | null
  deadline: string | null
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to: string | null
  applications_count: number
  created_at: string
  updated_at: string
  // Joined fields
  poster?: Profile
  assignee?: Profile
}

export interface MentorshipSession {
  id: string
  mentor_id: string
  mentee_id: string
  project_id: string | null
  scheduled_at: string
  duration_minutes: number
  session_type: SessionType
  topic: string | null
  notes: string | null
  status: SessionStatus
  rating: number | null
  feedback: string | null
  created_at: string
  updated_at: string
  // Joined fields
  mentor?: Profile
  mentee?: Profile
}

export interface Conversation {
  id: string
  conversation_type: ConversationType
  team_id: string | null
  project_id: string | null
  title: string | null
  last_message_at: string
  created_at: string
  // Joined fields
  participants?: ConversationParticipant[]
  last_message?: Message
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  last_read_at: string
  joined_at: string
  // Joined fields
  profile?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: MessageType
  file_url: string | null
  file_name: string | null
  is_edited: boolean
  created_at: string
  updated_at: string
  // Joined fields
  sender?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface PortfolioItem {
  id: string
  user_id: string
  title: string
  description: string | null
  item_type: PortfolioItemType
  url: string | null
  file_url: string | null
  date: string | null
  collaborators: string[]
  tags: string[]
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  user_id: string
  matched_user_id: string
  match_type: MatchType
  match_score: number
  matching_tags: string[]
  matching_skills: string[]
  reason: string | null
  status: MatchStatus
  created_at: string
  expires_at: string
  // Joined fields
  matched_user?: Profile
}

export interface ShowcaseEntry {
  id: string
  project_id: string | null
  author_id: string
  title: string
  abstract: string
  content: string | null
  research_area: string
  tags: string[]
  thumbnail_url: string | null
  document_url: string | null
  external_url: string | null
  collaborators: string[]
  status: ShowcaseStatus
  views: number
  likes: number
  published_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
  user_has_liked?: boolean
}

export interface ProjectFile {
  id: string
  project_id: string
  uploaded_by: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  folder: string
  created_at: string
  // Joined fields
  uploader?: Profile
}

export interface PlatformEvent {
  id: string
  event_type: string
  actor_id: string | null
  subject_type: string | null
  subject_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface ContentReport {
  id: string
  reporter_id: string
  content_type: ContentReportType
  content_id: string
  reason: string
  status: ContentReportQueueStatus
  created_at: string
  reporter?: Profile
}

export interface Broadcast {
  id: string
  title: string
  message: string
  audience: BroadcastAudience
  audience_filter: string | null
  sent_by: string
  recipient_count: number
  created_at: string
}

// Onboarding form data
export interface OnboardingData {
  step: number
  full_name?: string
  university_id?: string
  department?: string
  academic_level?: AcademicLevel
  roles?: UserRole[]
  research_interests?: string[]
  skills?: string[]
  looking_for?: string[]
  weekly_hours_available?: number
  bio?: string
}
