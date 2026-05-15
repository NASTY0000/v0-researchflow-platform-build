import { createClient } from '@/lib/supabase/client'
import {
  saveProfile, saveNotifications, saveProjects, saveIdeas,
  loadProfile, loadNotifications, loadProjects, loadIdeas,
  saveMessages, loadMessages,
  getPendingActions, removePendingAction,
} from './db'

export async function syncToLocal() {
  if (typeof window === 'undefined') return

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (profile) {
      await saveProfile(user.id, profile)
      localStorage.setItem('rf_last_sync', Date.now().toString())
    }

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (notifications) await saveNotifications(notifications)

    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('projects!inner(*)')
      .eq('user_id', user.id)
      .eq('projects.status', 'active')
    if (teamMembers) {
      const projects = teamMembers.map((m: { projects: Record<string, unknown> }) => m.projects)
      await saveProjects(projects)
    }

    const { data: ideas } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (ideas) await saveIdeas(ideas)
  } catch {
    // Silently fail when offline
  }
}

export async function loadFromLocal(
  type: 'profile' | 'notifications' | 'projects' | 'ideas' | 'messages',
  id?: string
) {
  if (typeof window === 'undefined') return null

  switch (type) {
    case 'profile':
      return id ? loadProfile(id) : null
    case 'notifications':
      return loadNotifications()
    case 'projects':
      return loadProjects()
    case 'ideas':
      return loadIdeas()
    case 'messages':
      return id ? loadMessages(id) : null
    default:
      return null
  }
}

export async function syncPendingActions() {
  if (typeof window === 'undefined') return

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const pending = await getPendingActions()

  for (const action of pending) {
    try {
      switch (action.type) {
        case 'mark_notification_read':
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', action.payload.id)
          break
        case 'send_message':
          await supabase.from('messages').insert(action.payload)
          break
        case 'post_idea':
          await supabase.from('ideas').insert(action.payload)
          break
      }
      await removePendingAction(action.id)
    } catch {
      // Keep in queue if sync fails
    }
  }
}

export { saveMessages, loadMessages }

export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null
  const ts = localStorage.getItem('rf_last_sync')
  if (!ts) return null
  return new Date(parseInt(ts)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
