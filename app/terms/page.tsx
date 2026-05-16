'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'eligibility', title: 'Eligibility' },
  { id: 'account', title: 'Account Registration' },
  { id: 'conduct', title: 'User Conduct' },
  { id: 'ip', title: 'Intellectual Property' },
  { id: 'privacy', title: 'Privacy' },
  { id: 'disclaimer', title: 'Disclaimer of Warranties' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'termination', title: 'Termination' },
  { id: 'changes', title: 'Changes to Terms' },
]

export default function TermsPage() {
  const [active, setActive] = useState('acceptance')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between bg-background/90 backdrop-blur-xl border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/icon.svg" alt="ResearchFlow" width={32} height={32} />
          </div>
          <span className="font-bold font-heading" style={{ background: 'linear-gradient(135deg,#06B6D4,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ResearchFlow</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-sm" style={{ color: '#A855F7' }}>
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12 flex gap-10">
        {/* TOC Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-muted-foreground">Contents</p>
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-sm py-1.5 px-3 rounded-lg transition-all"
                style={{
                  color: active === s.id ? '#A855F7' : '#7C6A9C',
                  background: active === s.id ? 'rgba(168,85,247,0.1)' : 'transparent',
                  borderLeft: active === s.id ? '2px solid #A855F7' : '2px solid transparent',
                }}
              >
                {s.title}
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <article className="flex-1 max-w-3xl space-y-12">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold font-heading">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: May 1, 2026</p>
            <p className="text-muted-foreground">
              Welcome to ResearchFlow. By accessing or using our platform, you agree to be bound by these Terms of Service.
              Please read them carefully before using our services.
            </p>
          </div>

          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>By creating an account or using ResearchFlow, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use the platform.</p>
            <p>These Terms constitute a legally binding agreement between you and ResearchFlow. We reserve the right to modify these terms at any time, and your continued use of the platform following any changes constitutes acceptance of the revised terms.</p>
          </Section>

          <Section id="eligibility" title="2. Eligibility">
            <p>ResearchFlow is intended for use by students, researchers, academics, and professionals affiliated with recognized universities or research institutions. You must be at least 16 years of age to use our platform.</p>
            <p>By registering, you represent that:</p>
            <ul>
              <li>You are affiliated with or enrolled at a recognized educational or research institution</li>
              <li>The information you provide during registration is accurate and complete</li>
              <li>You will maintain the accuracy of your account information</li>
              <li>Your use of the platform complies with all applicable laws and regulations</li>
            </ul>
          </Section>

          <Section id="account" title="3. Account Registration">
            <p>To access certain features of ResearchFlow, you must create an account. When creating an account, you agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete registration information</li>
              <li>Keep your password confidential and secure</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activity that occurs under your account</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or our community guidelines.</p>
          </Section>

          <Section id="conduct" title="4. User Conduct">
            <p>You agree to use ResearchFlow only for lawful purposes and in accordance with these Terms. You must not:</p>
            <ul>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Attempt to gain unauthorized access to any part of the platform</li>
              <li>Use the platform for commercial solicitation without prior written consent</li>
              <li>Upload malicious code, viruses, or any software designed to damage or disrupt services</li>
              <li>Engage in academic dishonesty or assist others in doing so</li>
            </ul>
            <p>Violation of these conduct standards may result in immediate account suspension or permanent termination.</p>
          </Section>

          <Section id="ip" title="5. Intellectual Property">
            <p>ResearchFlow respects intellectual property rights and expects users to do the same.</p>
            <p><strong style={{ color: '#C4B5FD' }}>Your Content:</strong> You retain ownership of any research, ideas, or materials you upload to ResearchFlow. By posting content, you grant ResearchFlow a non-exclusive, royalty-free license to display and distribute your content solely for the purpose of operating the platform.</p>
            <p><strong style={{ color: '#C4B5FD' }}>Platform Content:</strong> All other content on ResearchFlow, including the software, design, logos, and text, is owned by ResearchFlow and protected by applicable intellectual property laws.</p>
            <p>If you believe your intellectual property rights have been infringed, please contact us at legal@researchflowafrica.com.</p>
          </Section>

          <Section id="privacy" title="6. Privacy">
            <p>Your use of ResearchFlow is also governed by our <Link href="/privacy" style={{ color: '#A855F7' }}>Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the platform, you consent to the collection and use of information as described in the Privacy Policy.</p>
            <p>We are committed to protecting the privacy and security of your personal data in accordance with applicable data protection laws, including the African Union Convention on Cyber Security and Personal Data Protection where applicable.</p>
          </Section>

          <Section id="disclaimer" title="7. Disclaimer of Warranties">
            <p>ResearchFlow is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that:</p>
            <ul>
              <li>The platform will be uninterrupted, secure, or error-free</li>
              <li>The results obtained from use of the platform will be accurate or reliable</li>
              <li>Any errors in the platform will be corrected</li>
            </ul>
            <p>Your use of the platform is at your sole risk. We expressly disclaim all warranties of any kind, express or implied.</p>
          </Section>

          <Section id="liability" title="8. Limitation of Liability">
            <p>To the fullest extent permitted by applicable law, ResearchFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, revenue, or profits, arising out of or in connection with your use of the platform.</p>
            <p>Our total liability to you for any claims under these Terms shall not exceed the amount you paid us in the twelve months preceding the claim, or USD 100, whichever is greater.</p>
          </Section>

          <Section id="termination" title="9. Termination">
            <p>You may terminate your account at any time by contacting us or using the account deletion feature in Settings. Upon termination, your right to use the platform ceases immediately.</p>
            <p>We may suspend or terminate your account at any time, with or without notice, if we believe you have violated these Terms. We are not liable to you or any third party for any termination of your access to the platform.</p>
          </Section>

          <Section id="changes" title="10. Changes to Terms">
            <p>We reserve the right to modify these Terms at any time. We will notify registered users of material changes via email or a prominent notice on the platform at least 14 days before the changes take effect.</p>
            <p>Your continued use of ResearchFlow after the effective date of revised Terms constitutes your acceptance of the changes. If you do not agree to the revised Terms, you must stop using the platform.</p>
          </Section>

          <div className="border-t border-border pt-8 space-y-2 text-muted-foreground">
            <p className="text-sm">For questions about these Terms, contact us at <a href="mailto:legal@researchflowafrica.com" style={{ color: '#A855F7' }}>legal@researchflowafrica.com</a>.</p>
            <p className="text-sm">See also: <Link href="/privacy" style={{ color: '#A855F7' }}>Privacy Policy</Link></p>
          </div>
        </article>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <h2 className="text-xl font-semibold font-heading text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  )
}
