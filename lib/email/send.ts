'use server'

import { Resend } from 'resend'

const FROM = 'ResearchFlow <notifications@researchflow.app>'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend()
  if (!resend) {
    // Gracefully skip when key not configured — log for visibility
    console.log(`[email] would send "${subject}" to ${to}`)
    return { skipped: true }
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) console.error('[email] send error:', error)
    return { data, error }
  } catch (err) {
    console.error('[email] unexpected error:', err)
    return { error: err }
  }
}
