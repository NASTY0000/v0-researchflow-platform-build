'use server'

import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function inviteByEmail(projectId: string, email: string, role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get inviter's name for the notification message
  const { data: inviter } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const inviterName = inviter?.full_name || 'Someone'

  // Check if email belongs to an existing user
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    // User exists, add to team directly and send notification
    const { data: project } = await supabase.from('projects').select('team_id, title').eq('id', projectId).single()
    if (!project) return { error: 'Project not found' }

    // Check not already a member
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', project.team_id)
      .eq('user_id', existingProfile.id)
      .maybeSingle()

    if (existing) return { error: `${existingProfile.full_name} is already on this team` }

    await supabase.from('team_members').insert({
      team_id: project.team_id,
      user_id: existingProfile.id,
      role,
    })

    await supabase.from('notifications').insert({
      user_id: existingProfile.id,
      type: 'system',
      title: 'You were added to a project',
      message: `${inviterName} added you to the project "${project.title}"`,
      link: `/projects/${projectId}`,
      is_read: false,
    })

    return { success: true, existing: true, name: existingProfile.full_name }
  }

  // User doesn't exist, create invitation record
  const token = randomUUID().replace(/-/g, '')
  const { data: project } = await supabase.from('projects').select('title').eq('id', projectId).single()

  const { error } = await supabase.from('project_invitations').insert({
    project_id: projectId,
    invited_by: user.id,
    email,
    token,
    role,
  })

  if (error) {
    if (error.code === '42P01') return { error: 'Invitation system not set up yet' }
    return { error: error.message }
  }

  return { success: true, existing: false, token, projectTitle: project?.title }
}

export async function acceptInvitation(token: string, userId: string) {
  const supabase = await createClient()

  const { data: invitation } = await supabase
    .from('project_invitations')
    .select('*, project:projects(id, title, team_id)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!invitation) return { error: 'Invitation not found or expired' }

  const project = Array.isArray(invitation.project) ? invitation.project[0] : invitation.project
  if (!project) return { error: 'Project not found' }

  // Add to team
  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: project.team_id,
    user_id: userId,
    role: invitation.role || 'collaborator',
  })

  if (memberError && memberError.code !== '23505') return { error: memberError.message }

  // Mark invitation as accepted
  await supabase.from('project_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invitation.id)

  return { success: true, projectId: project.id, projectTitle: project.title }
}
