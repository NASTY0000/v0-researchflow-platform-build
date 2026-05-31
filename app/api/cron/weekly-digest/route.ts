import { createServiceRoleClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const admin = createServiceRoleClient()

  const { data: users } = await admin
    .from('profiles')
    .select('id, email, full_name, university_id, research_interests, akili_score')
    .eq('onboarding_completed', true)
    .not('email', 'is', null)

  if (!users?.length) {
    return NextResponse.json({ sent: 0 })
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: newIdeas }, { count: newMembers }, { data: trendingIdeas }, { data: topResearchers }] =
    await Promise.all([
      admin.from('research_ideas').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
      admin
        .from('research_ideas')
        .select('id, title, research_area, upvotes')
        .gte('created_at', oneWeekAgo)
        .order('upvotes', { ascending: false })
        .limit(3),
      admin
        .from('profiles')
        .select('full_name, akili_score, department')
        .eq('onboarding_completed', true)
        .order('akili_score', { ascending: false })
        .limit(3),
    ])

  let sentCount = 0

  for (const user of users) {
    if (!user.email) continue

    const { data: newMatches } = await admin
      .from('matches')
      .select('matched_user_id, match_score')
      .eq('user_id', user.id)
      .gte('created_at', oneWeekAgo)
      .order('match_score', { ascending: false })
      .limit(3)

    const digestHtml = generateDigestEmail({
      userName: user.full_name || 'Researcher',
      newIdeasCount: newIdeas || 0,
      newMembersCount: newMembers || 0,
      trendingIdeas: trendingIdeas || [],
      topResearchers: topResearchers || [],
      newMatchesCount: newMatches?.length || 0,
      userAkiliScore: user.akili_score || 0,
    })

    try {
      await resend.emails.send({
        from: 'ResearchFlow <noreply@researchflowafrica.com>',
        to: user.email,
        subject: 'Your Weekly Research Digest 🔬',
        html: digestHtml,
      })
      sentCount++
    } catch (err) {
      console.error('Digest send error for', user.email, err)
    }

    await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json({ sent: sentCount, total: users.length })
}

function generateDigestEmail({
  userName,
  newIdeasCount,
  newMembersCount,
  trendingIdeas,
  topResearchers,
  newMatchesCount,
  userAkiliScore,
}: {
  userName: string
  newIdeasCount: number
  newMembersCount: number
  trendingIdeas: { id: string; title: string; research_area: string; upvotes: number }[]
  topResearchers: { full_name: string | null; akili_score: number; department: string | null }[]
  newMatchesCount: number
  userAkiliScore: number
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="background:#05010F;margin:0;padding:40px 20px;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;">

    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#C084FC;font-size:28px;margin:0 0 8px;">ResearchFlow</h1>
      <p style="color:#71717A;font-size:14px;margin:0;">Your Weekly Research Digest</p>
    </div>

    <div style="background:#0B0117;border-radius:16px;padding:32px;border:1px solid #1E1033;margin-bottom:20px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 12px;">Good morning, ${userName} 👋</h2>
      <p style="color:#D4D4D8;font-size:15px;line-height:1.7;margin:0;">
        Here's what happened on ResearchFlow this week.
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td width="33%" style="padding-right:6px;">
          <div style="background:#0B0117;border-radius:12px;padding:20px;border:1px solid #1E1033;text-align:center;">
            <p style="color:#C084FC;font-size:28px;font-weight:800;margin:0 0 4px;">${newIdeasCount}</p>
            <p style="color:#71717A;font-size:12px;margin:0;">New Ideas</p>
          </div>
        </td>
        <td width="33%" style="padding:0 3px;">
          <div style="background:#0B0117;border-radius:12px;padding:20px;border:1px solid #1E1033;text-align:center;">
            <p style="color:#22D3EE;font-size:28px;font-weight:800;margin:0 0 4px;">${newMembersCount}</p>
            <p style="color:#71717A;font-size:12px;margin:0;">New Researchers</p>
          </div>
        </td>
        <td width="33%" style="padding-left:6px;">
          <div style="background:#0B0117;border-radius:12px;padding:20px;border:1px solid #1E1033;text-align:center;">
            <p style="color:#A855F7;font-size:28px;font-weight:800;margin:0 0 4px;">${newMatchesCount}</p>
            <p style="color:#71717A;font-size:12px;margin:0;">Your New Matches</p>
          </div>
        </td>
      </tr>
    </table>

    ${trendingIdeas.length > 0 ? `
    <div style="background:#0B0117;border-radius:16px;padding:24px;border:1px solid #1E1033;margin-bottom:20px;">
      <h3 style="color:#C084FC;font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">
        🔥 Trending This Week
      </h3>
      ${trendingIdeas.map(idea => `
        <div style="padding:12px 0;border-bottom:1px solid #1E1033;">
          <a href="https://researchflowafrica.com/ideas/${idea.id}"
            style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
            ${idea.title}
          </a>
          <p style="color:#71717A;font-size:12px;margin:4px 0 0;">
            ${idea.research_area} · ${idea.upvotes || 0} upvotes
          </p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div style="background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(34,211,238,0.1));border-radius:16px;padding:24px;border:1px solid rgba(124,58,237,0.3);margin-bottom:20px;text-align:center;">
      <p style="color:#A855F7;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">
        Your Akili Score
      </p>
      <p style="color:#C084FC;font-size:48px;font-weight:800;margin:0 0 4px;">${userAkiliScore}</p>
      <p style="color:#71717A;font-size:13px;margin:0;">Keep contributing to earn more points</p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://researchflowafrica.com/dashboard"
        style="display:inline-block;background:#9333EA;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:bold;">
        View Your Dashboard →
      </a>
    </div>

    <p style="color:#71717A;font-size:12px;text-align:center;line-height:1.7;margin:0;">
      © 2026 ResearchFlow · researchflowafrica.com<br>
      <a href="https://researchflowafrica.com/settings" style="color:#71717A;">Manage email preferences</a>
    </p>
  </div>
</body>
</html>
  `
}
