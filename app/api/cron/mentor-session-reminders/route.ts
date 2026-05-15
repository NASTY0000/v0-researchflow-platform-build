import { NextResponse } from 'next/server'
import { runMentorSessionReminders } from '@/lib/notifications/session-reminders-cron'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runMentorSessionReminders()
  if ('error' in result) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}
