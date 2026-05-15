import twilio from 'twilio'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { ChannelNotificationType } from '@/lib/notifications/constants'
import {
  SMS_DAILY_LIMIT,
  WHATSAPP_DAILY_LIMIT,
} from '@/lib/notifications/constants'

export type { ChannelNotificationType } from '@/lib/notifications/constants'

export function getPublicBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (u) return u.replace(/\/$/, '')
  return 'https://researchflowafrica.com'
}

/** Display host without scheme for copy templates */
export function getPublicHost(): string {
  try {
    return new URL(getPublicBaseUrl()).host
  } catch {
    return 'researchflowafrica.com'
  }
}

function pathForDisplay(link: string | null): string {
  if (!link) return ''
  return link.startsWith('/') ? link.slice(1) : link
}

function buildWhatsAppBody(plainMessage: string, link: string | null): string {
  const host = getPublicHost()
  const p = pathForDisplay(link)
  const pathPart = p ? `${host}/${p}` : `${host}/`
  return `*ResearchFlow* 🔬\n${plainMessage}\nView here: ${pathPart}`
}

function buildSmsBody(short: string): string {
  const host = getPublicHost()
  const maxShort = 120
  const s = short.length > maxShort ? `${short.slice(0, maxShort - 1)}…` : short
  return `ResearchFlow: ${s}. Visit ${host}`
}

function startOfUtcDayIso(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function normalizeE164(phone: string): string {
  const t = phone.trim()
  if (t.startsWith('whatsapp:')) return t.replace(/^whatsapp:/i, '').trim()
  return t
}

function toWhatsAppTo(phoneE164: string): string {
  const n = normalizeE164(phoneE164)
  if (n.startsWith('whatsapp:')) return n
  return `whatsapp:${n}`
}

async function countLogsToday(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  channel: 'whatsapp' | 'sms',
): Promise<number> {
  const { count, error } = await admin
    .from('notification_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('channel', channel)
    .eq('status', 'sent')
    .gte('created_at', startOfUtcDayIso())

  if (error) {
    console.error('[notifications] count logs', error)
    return 999
  }
  return count ?? 0
}

async function insertLog(
  admin: ReturnType<typeof createServiceRoleClient>,
  row: {
    user_id: string
    channel: 'whatsapp' | 'sms'
    notification_type: string
    provider_id: string | null
    status: 'sent' | 'failed' | 'skipped'
    error: string | null
    metadata?: Record<string, unknown>
  },
) {
  const { error } = await admin.from('notification_logs').insert({
    user_id: row.user_id,
    channel: row.channel,
    notification_type: row.notification_type,
    provider_id: row.provider_id,
    status: row.status,
    error: row.error,
    metadata: row.metadata ?? {},
  })
  if (error) console.error('[notifications] log insert', error)
}

export type SendNotificationInput = {
  recipientUserId: string
  type: ChannelNotificationType
  title: string
  message: string
  link: string | null
  metadata?: Record<string, unknown>
  /** Middle section of WhatsApp template (between title line and View here). */
  whatsappPlainBody: string
  /** Short fragment for SMS before “Visit …”. */
  smsShortBody: string
}

/**
 * Always inserts in-app notification; optionally sends WhatsApp/SMS via Twilio
 * when user preferences, verification, limits, and env allow.
 * Server-only — call from Server Actions or Route Handlers.
 */
export async function sendNotification(
  input: SendNotificationInput,
): Promise<{ ok: boolean; notificationId?: string; error?: string }> {
  const admin = createServiceRoleClient()

  const { data: notif, error: insErr } = await admin
    .from('notifications')
    .insert({
      user_id: input.recipientUserId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      is_read: false,
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single()

  if (insErr || !notif) {
    console.error('[notifications] in-app insert', insErr)
    return { ok: false, error: insErr?.message ?? 'Failed to create notification' }
  }

  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('phone_number, phone_verified, whatsapp_enabled, sms_enabled')
    .eq('id', input.recipientUserId)
    .single()

  if (profErr || !profile) {
    return { ok: true, notificationId: notif.id }
  }

  const phone = profile.phone_number as string | null
  const verified = profile.phone_verified === true
  const masterWa = profile.whatsapp_enabled === true
  const masterSms = profile.sms_enabled === true

  const { data: pref } = await admin
    .from('notification_preferences')
    .select('in_app, whatsapp, sms')
    .eq('user_id', input.recipientUserId)
    .eq('notification_type', input.type)
    .maybeSingle()

  const allowWa = verified && !!phone && masterWa && (pref?.whatsapp === true)
  const allowSms = verified && !!phone && masterSms && (pref?.sms === true)

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioReady = !!(twilioSid && twilioToken)
  const client = twilioReady ? twilio(twilioSid!, twilioToken!) : null

  const waEnabledFlag = process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === 'true'
  const waFrom = process.env.TWILIO_WHATSAPP_NUMBER?.trim()
  const smsFrom = process.env.TWILIO_PHONE_NUMBER?.trim()

  // WhatsApp
  if (allowWa && waEnabledFlag && client && waFrom && phone) {
    const used = await countLogsToday(admin, input.recipientUserId, 'whatsapp')
    if (used >= WHATSAPP_DAILY_LIMIT) {
      await insertLog(admin, {
        user_id: input.recipientUserId,
        channel: 'whatsapp',
        notification_type: input.type,
        provider_id: null,
        status: 'skipped',
        error: 'Daily WhatsApp limit reached',
        metadata: { notification_id: notif.id },
      })
    } else {
      const body = buildWhatsAppBody(input.whatsappPlainBody, input.link)
      try {
        const msg = await client.messages.create({
          from: waFrom,
          to: toWhatsAppTo(phone),
          body,
        })
        await insertLog(admin, {
          user_id: input.recipientUserId,
          channel: 'whatsapp',
          notification_type: input.type,
          provider_id: msg.sid,
          status: 'sent',
          error: null,
          metadata: { notification_id: notif.id },
        })
      } catch (e: unknown) {
        const err = e instanceof Error ? e.message : String(e)
        await insertLog(admin, {
          user_id: input.recipientUserId,
          channel: 'whatsapp',
          notification_type: input.type,
          provider_id: null,
          status: 'failed',
          error: err,
          metadata: { notification_id: notif.id },
        })
      }
    }
  } else if (allowWa && !waEnabledFlag) {
    await insertLog(admin, {
      user_id: input.recipientUserId,
      channel: 'whatsapp',
      notification_type: input.type,
      provider_id: null,
      status: 'skipped',
      error: 'NEXT_PUBLIC_WHATSAPP_ENABLED is not true',
      metadata: { notification_id: notif.id },
    })
  }

  // SMS (fallback channel; still respects prefs)
  if (allowSms && client && smsFrom && phone) {
    const used = await countLogsToday(admin, input.recipientUserId, 'sms')
    if (used >= SMS_DAILY_LIMIT) {
      await insertLog(admin, {
        user_id: input.recipientUserId,
        channel: 'sms',
        notification_type: input.type,
        provider_id: null,
        status: 'skipped',
        error: 'Daily SMS limit reached',
        metadata: { notification_id: notif.id },
      })
    } else {
      const body = buildSmsBody(input.smsShortBody)
      try {
        const msg = await client.messages.create({
          from: smsFrom,
          to: normalizeE164(phone),
          body,
        })
        await insertLog(admin, {
          user_id: input.recipientUserId,
          channel: 'sms',
          notification_type: input.type,
          provider_id: msg.sid,
          status: 'sent',
          error: null,
          metadata: { notification_id: notif.id },
        })
      } catch (e: unknown) {
        const err = e instanceof Error ? e.message : String(e)
        await insertLog(admin, {
          user_id: input.recipientUserId,
          channel: 'sms',
          notification_type: input.type,
          provider_id: null,
          status: 'failed',
          error: err,
          metadata: { notification_id: notif.id },
        })
      }
    }
  }

  return { ok: true, notificationId: notif.id }
}
