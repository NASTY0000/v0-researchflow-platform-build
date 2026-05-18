// Email HTML templates for ResearchFlow notifications

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0D0A1A;
  color: #E8E4F0;
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 24px;
  border-radius: 16px;
`

const btnStyle = `
  display: inline-block;
  background: linear-gradient(135deg,#7C3AED,#A855F7);
  color: #fff;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  margin-top: 20px;
`

const mutedStyle = `color:#7C6A9C;font-size:12px;margin-top:24px;`

function footer() {
  return `<p style="${mutedStyle}">You're receiving this because you have an account on ResearchFlow. Manage your email preferences in your profile settings.</p>`
}

export function matchFoundEmail(opts: {
  recipientName: string
  matchedName: string
  matchType: string
  matchScore: number
  profileUrl: string
}) {
  return {
    subject: `New ${opts.matchType} match found on ResearchFlow`,
    html: `
<div style="${baseStyle}">
  <h2 style="color:#C084FC;font-size:22px;margin:0 0 8px">New Match Found ✦</h2>
  <p style="color:#C4B5D8;margin:0 0 16px">Hi ${opts.recipientName},</p>
  <p style="color:#C4B5D8;">We found a new <strong>${opts.matchType}</strong> match for you on ResearchFlow.</p>
  <div style="background:rgba(124,58,237,0.12);border:1px solid rgba(139,92,246,0.25);border-radius:12px;padding:16px;margin:20px 0;">
    <p style="margin:0;font-size:18px;font-weight:600;">${opts.matchedName}</p>
    <p style="margin:4px 0 0;color:#A855F7;font-size:13px;">Match score: ${opts.matchScore}%</p>
  </div>
  <a href="${opts.profileUrl}" style="${btnStyle}">View Profile</a>
  ${footer()}
</div>`,
  }
}

export function connectionAcceptedEmail(opts: {
  recipientName: string
  acceptorName: string
  profileUrl: string
}) {
  return {
    subject: `${opts.acceptorName} accepted your connection request`,
    html: `
<div style="${baseStyle}">
  <h2 style="color:#C084FC;font-size:22px;margin:0 0 8px">Connection Accepted</h2>
  <p style="color:#C4B5D8;margin:0 0 16px">Hi ${opts.recipientName},</p>
  <p style="color:#C4B5D8;"><strong>${opts.acceptorName}</strong> has accepted your connection request. You can now collaborate and message each other on ResearchFlow.</p>
  <a href="${opts.profileUrl}" style="${btnStyle}">View Their Profile</a>
  ${footer()}
</div>`,
  }
}

export function mentorshipRequestEmail(opts: {
  mentorName: string
  studentName: string
  message: string | null
  dashboardUrl: string
}) {
  return {
    subject: `${opts.studentName} sent you a mentorship request`,
    html: `
<div style="${baseStyle}">
  <h2 style="color:#C084FC;font-size:22px;margin:0 0 8px">New Mentorship Request</h2>
  <p style="color:#C4B5D8;margin:0 0 16px">Hi ${opts.mentorName},</p>
  <p style="color:#C4B5D8;"><strong>${opts.studentName}</strong> has requested your mentorship.</p>
  ${opts.message ? `<blockquote style="border-left:3px solid #7C3AED;padding:8px 12px;margin:16px 0;color:#C4B5D8;font-style:italic;">"${opts.message}"</blockquote>` : ''}
  <a href="${opts.dashboardUrl}" style="${btnStyle}">Review Request</a>
  ${footer()}
</div>`,
  }
}

export function showcaseApprovedEmail(opts: {
  authorName: string
  title: string
  showcaseUrl: string
}) {
  return {
    subject: `Your showcase "${opts.title}" has been approved!`,
    html: `
<div style="${baseStyle}">
  <h2 style="color:#22C55E;font-size:22px;margin:0 0 8px">Showcase Approved ✓</h2>
  <p style="color:#C4B5D8;margin:0 0 16px">Hi ${opts.authorName},</p>
  <p style="color:#C4B5D8;">Congratulations! Your research showcase <strong>"${opts.title}"</strong> has been reviewed and approved. It is now publicly visible on ResearchFlow.</p>
  <a href="${opts.showcaseUrl}" style="${btnStyle}">View Your Showcase</a>
  ${footer()}
</div>`,
  }
}
