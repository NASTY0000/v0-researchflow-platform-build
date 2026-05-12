import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#05010F', color: '#F3F0FF' }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: '#A855F7' }}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="text-4xl font-bold font-heading mb-2" style={{ letterSpacing: '-0.03em' }}>Terms of Service</h1>
        <p className="text-sm mb-10" style={{ color: '#7C6A9C' }}>Last updated: May 2025</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#C4B5D8' }}>
          {[
            {
              title: '1. Acceptance of Terms',
              body: 'By accessing or using ResearchFlow, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.',
            },
            {
              title: '2. Use of the Platform',
              body: 'ResearchFlow is a research collaboration platform for academic and professional researchers. You agree to use the platform only for lawful purposes and in accordance with these terms.',
            },
            {
              title: '3. User Accounts',
              body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use.',
            },
            {
              title: '4. Intellectual Property',
              body: 'Content you post on ResearchFlow remains your intellectual property. By posting, you grant ResearchFlow a non-exclusive licence to display and distribute that content within the platform.',
            },
            {
              title: '5. Privacy',
              body: 'Your use of ResearchFlow is also governed by our Privacy Policy. Please review it to understand our practices.',
            },
            {
              title: '6. Limitation of Liability',
              body: 'ResearchFlow is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform.',
            },
            {
              title: '7. Changes to Terms',
              body: 'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.',
            },
            {
              title: '8. Contact',
              body: 'If you have questions about these terms, please contact us at legal@researchflow.app.',
            },
          ].map(section => (
            <div key={section.title} className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <h2 className="font-semibold font-heading mb-3" style={{ color: '#F3F0FF' }}>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
