'use server'

import { createClient } from '@/lib/supabase/server'

export async function createListing(data: {
  categoryId: string
  title: string
  description: string
  tools: string[]
  researchAreas: string[]
  rateNote: string
  turnaroundNote: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: listing, error } = await supabase
    .from('service_listings')
    .insert({
      provider_id:     user.id,
      category_id:     data.categoryId,
      title:           data.title.trim(),
      description:     data.description.trim(),
      tools:           data.tools,
      research_areas:  data.researchAreas,
      rate_note:       data.rateNote.trim() || null,
      turnaround_note: data.turnaroundNote.trim() || null,
      status:          'active',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, listing }
}

export async function updateListing(listingId: string, data: {
  categoryId: string
  title: string
  description: string
  tools: string[]
  researchAreas: string[]
  rateNote: string
  turnaroundNote: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: listing, error } = await supabase
    .from('service_listings')
    .update({
      category_id:     data.categoryId,
      title:           data.title.trim(),
      description:     data.description.trim(),
      tools:           data.tools,
      research_areas:  data.researchAreas,
      rate_note:       data.rateNote.trim() || null,
      turnaround_note: data.turnaroundNote.trim() || null,
    })
    .eq('id', listingId)
    .eq('provider_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, listing }
}

export async function createRequest(data: {
  categoryId: string
  title: string
  description: string
  budgetNote: string
  deadline: string
  projectId: string
  researchAreas: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: request, error } = await supabase
    .from('service_requests')
    .insert({
      requester_id:   user.id,
      category_id:    data.categoryId,
      title:          data.title.trim(),
      description:    data.description.trim(),
      budget_note:    data.budgetNote.trim() || null,
      deadline:       data.deadline || null,
      project_id:     data.projectId || null,
      research_areas: data.researchAreas,
      status:         'open',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, request }
}

export async function updateRequest(requestId: string, data: {
  categoryId: string
  title: string
  description: string
  budgetNote: string
  deadline: string
  projectId: string
  researchAreas: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: request, error } = await supabase
    .from('service_requests')
    .update({
      category_id:    data.categoryId,
      title:          data.title.trim(),
      description:    data.description.trim(),
      budget_note:    data.budgetNote.trim() || null,
      deadline:       data.deadline || null,
      project_id:     data.projectId || null,
      research_areas: data.researchAreas,
    })
    .eq('id', requestId)
    .eq('requester_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, request }
}

export async function sendServiceEnquiry({
  listingId,
  requestId,
  message,
}: {
  listingId?: string
  requestId?: string
  message: string
}) {
  if (!message || message.trim().length < 50) {
    return { error: 'Please write at least 50 characters.' }
  }
  if (!listingId && !requestId) {
    return { error: 'No target specified.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Resolve recipient from the listing or request owner
  let recipientId: string | null = null
  let contextTitle = ''
  let recipientName = ''

  if (listingId) {
    const { data: listing } = await supabase
      .from('service_listings')
      .select('provider_id, title, provider:profiles!service_listings_provider_id_fkey(full_name)')
      .eq('id', listingId)
      .single()
    if (!listing) return { error: 'Listing not found.' }
    if (listing.provider_id === user.id) return { error: 'You cannot enquire about your own listing.' }
    recipientId = listing.provider_id
    contextTitle = listing.title
    recipientName = (listing.provider as { full_name: string | null } | null)?.full_name ?? 'the provider'
  } else if (requestId) {
    const { data: req } = await supabase
      .from('service_requests')
      .select('requester_id, title, requester:profiles!service_requests_requester_id_fkey(full_name)')
      .eq('id', requestId)
      .single()
    if (!req) return { error: 'Request not found.' }
    if (req.requester_id === user.id) return { error: 'You cannot enquire about your own request.' }
    recipientId = req.requester_id
    contextTitle = req.title
    recipientName = (req.requester as { full_name: string | null } | null)?.full_name ?? 'the requester'
  }

  if (!recipientId) return { error: 'Could not resolve recipient.' }

  // Block duplicate pending enquiries
  const { data: existing } = await supabase
    .from('service_enquiries')
    .select('id, status')
    .eq('sender_id', user.id)
    .eq('recipient_id', recipientId)
    .match(listingId ? { listing_id: listingId } : { request_id: requestId })
    .eq('status', 'pending')
    .maybeSingle()
  if (existing) return { error: 'You already have a pending enquiry for this.' }

  const { error: insertError } = await supabase
    .from('service_enquiries')
    .insert({
      sender_id:    user.id,
      recipient_id: recipientId,
      listing_id:   listingId ?? null,
      request_id:   requestId ?? null,
      message:      message.trim(),
      status:       'pending',
    })
  if (insertError) return { error: insertError.message }

  const { data: sender } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const senderName = sender?.full_name ?? 'A researcher'

  await supabase.from('notifications').insert({
    user_id: recipientId,
    type:    'system',
    title:   `New enquiry: "${contextTitle}"`,
    message: `${senderName} sent you an enquiry. Review and respond in the Marketplace.`,
    link:    '/marketplace?tab=my',
    is_read: false,
  })

  return { success: true, recipientName }
}

export async function respondToEnquiry(
  enquiryId: string,
  action: 'accepted' | 'declined',
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: enquiry } = await supabase
    .from('service_enquiries')
    .select('id, sender_id, recipient_id, status, listing_id, request_id')
    .eq('id', enquiryId)
    .single()
  if (!enquiry) return { error: 'Enquiry not found.' }
  if (enquiry.recipient_id !== user.id) return { error: 'Not authorised.' }
  if (enquiry.status !== 'pending') return { error: 'This enquiry has already been responded to.' }

  const { error: updateError } = await supabase
    .from('service_enquiries')
    .update({ status: action })
    .eq('id', enquiryId)
  if (updateError) return { error: updateError.message }

  const { data: recipient } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const recipientName = recipient?.full_name ?? 'The provider'

  if (action === 'accepted') {
    // Notify sender — can now message directly
    await supabase.from('notifications').insert({
      user_id: enquiry.sender_id,
      type:    'system',
      title:   'Enquiry accepted!',
      message: `${recipientName} accepted your enquiry. You can now message them directly.`,
      link:    `/messages?user=${user.id}`,
      is_read: false,
    })

    // Agreements prompt to sender
    await supabase.from('notifications').insert({
      user_id: enquiry.sender_id,
      type:    'system',
      title:   'Record your agreement',
      message: 'Recording what was agreed protects both of you. Create an agreement covering scope, timeline, and how this contribution will be acknowledged.',
      link:    '/agreements',
      is_read: false,
    })

    // Agreements prompt to recipient (self)
    await supabase.from('notifications').insert({
      user_id: user.id,
      type:    'system',
      title:   'Record your agreement',
      message: 'Recording what was agreed protects both of you. Create an agreement covering scope, timeline, and how this contribution will be acknowledged.',
      link:    '/agreements',
      is_read: false,
    })
  } else {
    await supabase.from('notifications').insert({
      user_id: enquiry.sender_id,
      type:    'system',
      title:   'Enquiry declined',
      message: `${recipientName} was not able to take on your enquiry at this time.`,
      link:    '/marketplace',
      is_read: false,
    })
  }

  return { success: true }
}
