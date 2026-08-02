'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { awardAkiliPoints } from './akili'

const resend = new Resend(process.env.RESEND_API_KEY)

// ── Check if an email domain belongs to a recognised African university ───────

export async function checkUniversityEmail(
  email: string
): Promise<{ isValid: boolean; universityName?: string; country?: string }> {
  const supabase = await createClient()
  const emailLower = email.toLowerCase().trim()

  const parts = emailLower.split('@')
  if (parts.length !== 2) return { isValid: false }

  const domain = parts[1]
  const domainParts = domain.split('.')

  // Build patterns from most-specific to least: e.g. unilag.edu.ng, edu.ng, ng
  const patternsToCheck: string[] = []
  for (let i = 0; i < domainParts.length - 1; i++) {
    patternsToCheck.push(domainParts.slice(i).join('.'))
  }

  const { data } = await supabase
    .from('verified_university_domains')
    .select('domain, university_name, country')
    .in('domain', patternsToCheck)
    .eq('is_active', true)
    .order('domain', { ascending: false }) // longer domain = more specific
    .limit(1)
    .maybeSingle()

  if (!data) return { isValid: false }

  return {
    isValid: true,
    universityName: data.university_name ?? undefined,
    country: data.country ?? undefined,
  }
}

// ── Send OTP to university email ──────────────────────────────────────────────

export async function sendVerificationOTP(
  universityEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Not authenticated' }

    // Validate university email domain
    const check = await checkUniversityEmail(universityEmail)
    if (!check.isValid) {
      return {
        success: false,
        error: 'This email domain is not recognised as an African university. Contact support if your institution should be listed.',
      }
    }

    // Rate limiting: 2-minute cooldown
    const { data: existing } = await supabase
      .from('verification_requests')
      .select('last_sent_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.last_sent_at) {
      const lastSent = new Date(existing.last_sent_at)
      if (lastSent > new Date(Date.now() - 2 * 60 * 1000)) {
        return { success: false, error: 'Please wait 2 minutes before requesting another code.' }
      }
    }

    // Generate 6-digit OTP and hash it, never store plaintext
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash = crypto
      .createHash('sha256')
      .update(otp + user.id + (process.env.OTP_SECRET ?? ''))
      .digest('hex')

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { error: upsertError } = await supabase
      .from('verification_requests')
      .upsert(
        {
          user_id: user.id,
          university_email: universityEmail.toLowerCase().trim(),
          otp_hash: otpHash,
          expires_at: expiresAt,
          attempts: 0,
          last_sent_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) throw upsertError

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const firstName = profile?.full_name?.split(' ')[0] ?? 'Researcher'

    const { error: emailError } = await resend.emails.send({
      from: 'ResearchFlow <verify@researchflowafrica.com>',
      to: universityEmail,
      subject: 'Your ResearchFlow verification code',
      html: `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;background:#07030F;color:#F0ECF8;padding:40px 24px;max-width:480px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#FBBF24;font-size:24px;margin:0;">Research<span style="color:#F0ECF8;">Flow</span></h1>
    <p style="color:#7C6A9C;font-size:13px;margin:4px 0 0;">Collaborate &amp; Discover</p>
  </div>
  <div style="background:#0F0A1E;border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:32px;text-align:center;">
    <p style="color:#C4B5FD;margin:0 0 8px;font-size:14px;">Hi ${firstName},</p>
    <p style="color:#F0ECF8;margin:0 0 28px;font-size:16px;line-height:1.6;">
      Here is your verification code for<br>
      <strong style="color:#A855F7;">${universityEmail}</strong>
    </p>
    <div style="background:rgba(124,58,237,0.15);border:2px solid rgba(139,92,246,0.4);border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#FBBF24;font-family:monospace;">
        ${otp}
      </div>
    </div>
    <p style="color:#7C6A9C;font-size:13px;margin:0 0 8px;">
      This code expires in <strong style="color:#C4B5FD;">15 minutes</strong>.
    </p>
    <p style="color:#7C6A9C;font-size:12px;margin:0;">
      If you did not request this, you can safely ignore this email.
    </p>
  </div>
  <p style="text-align:center;color:#3D2A58;font-size:11px;margin-top:24px;">
    ResearchFlow Africa · Built for African researchers, by African innovators
  </p>
</body>
</html>`,
    })

    if (emailError) throw emailError

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send verification code. Please try again.'
    console.error('sendVerificationOTP error:', error)
    return { success: false, error: msg }
  }
}

// ── Verify submitted OTP and mark profile as verified ─────────────────────────

export async function verifyOTP(
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Not authenticated' }

    const { data: request, error: fetchError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError || !request) {
      return { success: false, error: 'No verification request found. Please request a new code.' }
    }

    if (new Date(request.expires_at) < new Date()) {
      await supabase.from('verification_requests').delete().eq('user_id', user.id)
      return { success: false, error: 'This code has expired. Please request a new one.' }
    }

    if (request.attempts >= 5) {
      await supabase.from('verification_requests').delete().eq('user_id', user.id)
      return { success: false, error: 'Too many incorrect attempts. Please request a new verification code.' }
    }

    const submittedHash = crypto
      .createHash('sha256')
      .update(otp.trim() + user.id + (process.env.OTP_SECRET ?? ''))
      .digest('hex')

    if (submittedHash !== request.otp_hash) {
      await supabase
        .from('verification_requests')
        .update({ attempts: request.attempts + 1 })
        .eq('user_id', user.id)
      const remaining = 4 - request.attempts
      return {
        success: false,
        error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      }
    }

    // OTP valid, fetch university info and mark profile verified
    const emailCheck = await checkUniversityEmail(request.university_email)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_type: 'email',
        university_email: request.university_email,
        university_name: emailCheck.universityName ?? null,
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    await supabase.from('verification_requests').delete().eq('user_id', user.id)

    // Award 50 Akili knowledge points for verification (silently, never block)
    await awardAkiliPoints({
      userId: user.id,
      eventType: 'institutional_verification',
      points: 50,
      dimension: 'knowledge',
      description: 'Verified university email affiliation',
    })

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Verification failed. Please try again.'
    console.error('verifyOTP error:', error)
    return { success: false, error: msg }
  }
}
