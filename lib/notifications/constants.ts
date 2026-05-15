export type ChannelNotificationType =
  | 'match_found'
  | 'connection_request'
  | 'mentorship_request'
  | 'mentorship_accepted'
  | 'session_reminder'
  | 'task_assigned'
  | 'showcase_published'

/** Types that may trigger WhatsApp/SMS (per user preferences + rate limits). */
export const CHANNEL_NOTIFICATION_TYPES: ChannelNotificationType[] = [
  'match_found',
  'connection_request',
  'mentorship_request',
  'mentorship_accepted',
  'session_reminder',
  'task_assigned',
  'showcase_published',
]

export const CHANNEL_NOTIFICATION_LABELS: Record<ChannelNotificationType, string> = {
  match_found: 'New match suggestions',
  connection_request: 'Connection requests',
  mentorship_request: 'Mentorship requests (to mentor)',
  mentorship_accepted: 'Mentorship accepted (to student)',
  session_reminder: 'Mentor session reminders (24h before)',
  task_assigned: 'Tasks assigned to you',
  showcase_published: 'Showcase entry approved',
}

export const WHATSAPP_DAILY_LIMIT = 10
export const SMS_DAILY_LIMIT = 5
