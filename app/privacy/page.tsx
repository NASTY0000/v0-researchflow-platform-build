'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'collection', title: 'Information We Collect' },
  { id: 'use', title: 'How We Use Information' },
  { id: 'sharing', title: 'Information Sharing' },
  { id: 'storage', title: 'Data Storage & Security' },
  { id: 'rights', title: 'Your Rights' },
  { id: 'cookies', title: 'Cookies & Tracking' },
  { id: 'children', title: "Children's Privacy" },
  { id: 'international', title: 'International Transfers' },
  { id: 'contact', title: 'Contact Us' },
]

export default function PrivacyPage() {
  const [active, setActive] = useState('overview')

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
          <Logo variant="horizontal" width={160} />
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
                  color: active === s.id ? '#A855F7' : 'var(--muted-foreground)',
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
            <h1 className="text-4xl font-bold font-heading">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: May 1, 2026</p>
            <p className="text-muted-foreground">
              ResearchFlow is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our platform.
            </p>
          </div>

          <Section id="overview" title="1. Overview">
            <p>ResearchFlow (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates researchflowafrica.com and related services. This policy applies to all information collected through our platform and any related services, sales, marketing, or events.</p>
            <p>We process your data to provide and improve the ResearchFlow platform, facilitate research collaboration, and build a connected academic community across Africa. We are committed to transparency about how we use your data and to giving you meaningful control over your information.</p>
          </Section>

          <Section id="collection" title="2. Information We Collect">
            <p><strong style={{ color: '#C4B5FD' }}>Information You Provide:</strong></p>
            <ul>
              <li>Account information: name, email address, university affiliation, academic level, department</li>
              <li>Profile information: bio, skills, research interests, profile photo, portfolio items</li>
              <li>Content you create: research ideas, project data, messages, comments, showcase entries</li>
              <li>Communications: emails and messages you send to us or through our platform</li>
            </ul>
            <p><strong style={{ color: '#C4B5FD' }}>Information Collected Automatically:</strong></p>
            <ul>
              <li>Usage data: pages visited, features used, time spent on the platform</li>
              <li>Device information: browser type, operating system, IP address</li>
              <li>Interaction data: clicks, searches, matches viewed, collaborations initiated</li>
            </ul>
          </Section>

          <Section id="use" title="3. How We Use Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your account and provide platform services</li>
              <li>Match you with potential research collaborators based on your interests and skills</li>
              <li>Send you notifications about activity relevant to your research and network</li>
              <li>Improve the platform through analytics and user feedback</li>
              <li>Ensure the security and integrity of our services</li>
              <li>Comply with legal obligations</li>
              <li>Communicate important updates about the platform</li>
            </ul>
            <p>We do not sell your personal information to third parties or use it for advertising purposes unrelated to ResearchFlow.</p>
          </Section>

          <Section id="sharing" title="4. Information Sharing">
            <p>We share your information only in the following circumstances:</p>
            <ul>
              <li><strong style={{ color: '#C4B5FD' }}>With other users:</strong> Profile information you set as public is visible to other ResearchFlow users for collaboration purposes</li>
              <li><strong style={{ color: '#C4B5FD' }}>Service providers:</strong> We use trusted third-party services (Supabase for database and authentication) that process data on our behalf under strict data processing agreements</li>
              <li><strong style={{ color: '#C4B5FD' }}>Legal requirements:</strong> We may disclose your information if required by law or in response to valid legal process</li>
              <li><strong style={{ color: '#C4B5FD' }}>Business transfers:</strong> In the event of a merger or acquisition, your data may be transferred as a business asset</li>
            </ul>
          </Section>

          <Section id="storage" title="5. Data Storage & Security">
            <p>Your data is stored on secure servers provided by Supabase, with infrastructure located in appropriate regions. We implement industry-standard security measures including:</p>
            <ul>
              <li>Encryption in transit (TLS) and at rest</li>
              <li>Row-level security policies to ensure data access controls</li>
              <li>Regular security audits and monitoring</li>
              <li>Secure authentication with support for multi-factor authentication</li>
            </ul>
            <p>We retain your data for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it by law.</p>
          </Section>

          <Section id="rights" title="6. Your Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul>
              <li><strong style={{ color: '#C4B5FD' }}>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong style={{ color: '#C4B5FD' }}>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong style={{ color: '#C4B5FD' }}>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
              <li><strong style={{ color: '#C4B5FD' }}>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong style={{ color: '#C4B5FD' }}>Objection:</strong> Object to processing of your data for certain purposes</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:privacy@researchflowafrica.com" style={{ color: '#A855F7' }}>privacy@researchflowafrica.com</a>. We will respond to your request within 30 days.</p>
          </Section>

          <Section id="cookies" title="7. Cookies & Tracking">
            <p>ResearchFlow uses essential cookies necessary for the platform to function. These include:</p>
            <ul>
              <li>Authentication cookies to keep you logged in</li>
              <li>Session cookies to maintain your preferences during a visit</li>
              <li>Security cookies to detect and prevent fraudulent activity</li>
            </ul>
            <p>We do not use third-party advertising cookies or tracking pixels. You can disable cookies in your browser settings, but this may prevent some features of the platform from functioning properly.</p>
          </Section>

          <Section id="children" title="8. Children's Privacy">
            <p>ResearchFlow is not directed to children under the age of 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.</p>
            <p>If we learn that we have collected personal information from a child under 16, we will take steps to delete that information promptly.</p>
          </Section>

          <Section id="international" title="9. International Transfers">
            <p>ResearchFlow serves researchers across Africa and may process your data in countries outside your own. When we transfer data internationally, we ensure appropriate safeguards are in place, including standard contractual clauses or other legally recognized mechanisms.</p>
            <p>We are committed to compliance with applicable data protection laws across African jurisdictions, including Kenya&apos;s Data Protection Act, Nigeria&apos;s NDPR, South Africa&apos;s POPIA, and other relevant legislation.</p>
          </Section>

          <Section id="contact" title="10. Contact Us">
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Officer:</p>
            <ul>
              <li>Email: <a href="mailto:privacy@researchflowafrica.com" style={{ color: '#A855F7' }}>privacy@researchflowafrica.com</a></li>
              <li>Response time: We aim to respond within 5 business days</li>
            </ul>
            <p>You also have the right to lodge a complaint with your local data protection authority if you believe we have handled your data improperly.</p>
          </Section>

          <div className="border-t border-border pt-8 space-y-2 text-muted-foreground">
            <p className="text-sm">See also: <Link href="/terms" style={{ color: '#A855F7' }}>Terms of Service</Link></p>
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
