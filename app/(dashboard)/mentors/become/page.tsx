import Link from 'next/link'
import { ArrowLeft, GraduationCap } from 'lucide-react'

export default function BecomeMentorPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/mentors" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#A855F7' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Mentors
        </Link>
        <h1 className="text-2xl font-bold font-heading mt-4" style={{ letterSpacing: '-0.02em' }}>Become a Mentor</h1>
        <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Share your expertise with the next generation of researchers</p>
      </div>

      <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <GraduationCap className="w-8 h-8" style={{ color: '#A855F7' }} />
        </div>
        <h2 className="text-xl font-bold font-heading mb-2">Coming Soon</h2>
        <p className="text-sm max-w-sm mx-auto" style={{ color: '#7C6A9C' }}>
          Mentor applications are opening soon. To be considered as a mentor, select the <strong style={{ color: '#C084FC' }}>Mentor</strong> role during onboarding or update it in your profile settings.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link href="/mentors" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#C084FC' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <Link href="/settings" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF' }}>
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
