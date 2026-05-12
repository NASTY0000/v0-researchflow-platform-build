import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#05010F', color: '#F3F0FF' }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: '#A855F7' }}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="text-4xl font-bold font-heading mb-2" style={{ letterSpacing: '-0.03em' }}>Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: '#7C6A9C' }}>Last updated: May 2025</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#C4B5D8' }}>
          {[
            {
              title: '1. Information We Collect',
              body: 'We collect information you provide directly (name, email, university, research interests) and usage data generated when you interact with the platform.',
            },
            {
              title: '2. How We Use Your Information',
              body: 'We use your information to provide and improve the platform, match you with collaborators and mentors, send service-related communications, and ensure platform security.',
            },
            {
              title: '3. Information Sharing',
              body: 'Your profile information is visible to other ResearchFlow users according to your privacy settings. We do not sell your personal data to third parties.',
            },
            {
              title: '4. Data Security',
              body: 'We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest.',
            },
            {
              title: '5. Cookies',
              body: 'We use essential cookies to maintain your session and preferences. You can control cookie settings through your browser.',
            },
            {
              title: '6. Your Rights',
              body: 'You have the right to access, correct, or delete your personal data. You can manage your data in your account settings or by contacting us.',
            },
            {
              title: '7. Data Retention',
              body: 'We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and data at any time.',
            },
            {
              title: '8. Contact',
              body: 'For privacy-related questions or requests, contact our Data Protection Officer at privacy@researchflow.app.',
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
