import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#05010F', color: '#F3F0FF' }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: '#A855F7' }}>
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="text-4xl font-bold font-heading mb-4" style={{ letterSpacing: '-0.03em' }}>Contact Us</h1>
        <p className="text-lg mb-10 text-muted-foreground">We&apos;d love to hear from you.</p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Mail className="w-5 h-5" style={{ color: '#A855F7' }} />
            </div>
            <h2 className="font-semibold font-heading mb-1">Email</h2>
            <p className="text-sm mb-2 text-muted-foreground">For general enquiries</p>
            <a href="mailto:hello@researchflow.app" className="text-sm font-medium" style={{ color: '#A855F7' }}>
              hello@researchflow.app
            </a>
          </div>

          <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <MessageSquare className="w-5 h-5" style={{ color: '#A855F7' }} />
            </div>
            <h2 className="font-semibold font-heading mb-1">Support</h2>
            <p className="text-sm mb-2 text-muted-foreground">For platform support</p>
            <a href="mailto:support@researchflow.app" className="text-sm font-medium" style={{ color: '#A855F7' }}>
              support@researchflow.app
            </a>
          </div>
        </div>

        <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <p className="text-sm text-muted-foreground">
            Response times are typically within 1–2 business days.
          </p>
        </div>
      </div>
    </div>
  )
}
