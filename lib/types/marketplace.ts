import type { Profile } from './database'

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface ServiceListing {
  id: string
  provider_id: string
  category_id: string
  title: string
  description: string
  tools: string[]
  research_areas: string[]
  rate_note: string | null
  turnaround_note: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  provider?: Profile
  category?: ServiceCategory
}

export interface ServiceRequest {
  id: string
  requester_id: string
  category_id: string
  title: string
  description: string
  budget_note: string | null
  deadline: string | null
  project_id: string | null
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
  requester?: Profile
  category?: ServiceCategory
}

export interface ServiceEnquiry {
  id: string
  sender_id: string
  recipient_id: string
  listing_id: string | null
  request_id: string | null
  message: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  sender?: Profile
  recipient?: Profile
  listing?: Pick<ServiceListing, 'id' | 'title'>
  request?: Pick<ServiceRequest, 'id' | 'title'>
}
