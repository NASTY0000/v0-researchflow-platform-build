'use server'

import { createServiceRoleClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import {
  connectionAcceptedEmail,
  mentorshipRequestEmail,
  showcaseApprovedEmail,
  matchFoundEmail,
} from '@/lib/email/templates'

async function getUserEmail(userId: string): Promise<{ email: string; fullName: string } | null> {
  const admin = createServiceRoleClient()
  const { data } = await admin.auth.admin.getUserById(userId)
  if (!data?.user?.email) return null
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', userId).single()
  return { email: data.user.email, fullName: profile?.full_name || 'Researcher' }
}

export async function notifyConnectionAccepted(requesterId: string, acceptorId: string) {
  try {
    const [requester, acceptor] = await Promise.all([
      getUserEmail(requesterId),
      getUserEmail(acceptorId),
    ])
    if (!requester || !acceptor) return

    const { subject, html } = connectionAcceptedEmail({
      recipientName: requester.fullName,
      acceptorName: acceptor.fullName,
      profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://researchflow.app'}/profile/${acceptorId}`,
    })
    await sendEmail(requester.email, subject, html)
  } catch (err) {
    console.error('[email] notifyConnectionAccepted error:', err)
  }
}

export async function notifyMentorshipRequest(mentorId: string, studentId: string, message: string | null) {
  try {
    const [mentor, student] = await Promise.all([
      getUserEmail(mentorId),
      getUserEmail(studentId),
    ])
    if (!mentor || !student) return

    const { subject, html } = mentorshipRequestEmail({
      mentorName: mentor.fullName,
      studentName: student.fullName,
      message,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://researchflow.app'}/mentor-dashboard`,
    })
    await sendEmail(mentor.email, subject, html)
  } catch (err) {
    console.error('[email] notifyMentorshipRequest error:', err)
  }
}

export async function notifyShowcaseApproved(authorId: string, title: string, showcaseId: string) {
  try {
    const author = await getUserEmail(authorId)
    if (!author) return

    const { subject, html } = showcaseApprovedEmail({
      authorName: author.fullName,
      title,
      showcaseUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://researchflow.app'}/showcase/${showcaseId}`,
    })
    await sendEmail(author.email, subject, html)
  } catch (err) {
    console.error('[email] notifyShowcaseApproved error:', err)
  }
}

export async function notifyMatchFound(userId: string, matchedUserId: string, matchType: string, matchScore: number) {
  try {
    const [user, matched] = await Promise.all([
      getUserEmail(userId),
      getUserEmail(matchedUserId),
    ])
    if (!user || !matched) return

    const { subject, html } = matchFoundEmail({
      recipientName: user.fullName,
      matchedName: matched.fullName,
      matchType,
      matchScore,
      profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://researchflow.app'}/profile/${matchedUserId}`,
    })
    await sendEmail(user.email, subject, html)
  } catch (err) {
    console.error('[email] notifyMatchFound error:', err)
  }
}
