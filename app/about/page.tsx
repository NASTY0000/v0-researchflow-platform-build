import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 text-primary">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="text-4xl font-bold font-heading mb-4" style={{ letterSpacing: '-0.03em' }}>About ResearchFlow</h1>
        <p className="text-lg mb-10 text-muted-foreground">
          Connecting African researchers to collaborate, grow, and publish together.
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          {[
            {
              title: 'Our Mission',
              body: 'ResearchFlow exists to break down the barriers that prevent talented researchers across Africa from reaching their full potential. We believe that great research happens when the right people find each other, and we build the tools to make that happen.',
            },
            {
              title: 'What We Do',
              body: 'We provide a platform where undergraduate students, postgraduate researchers, PhD candidates, and faculty members can discover each other, share research ideas, collaborate on projects, and access mentorship from experienced academics.',
            },
            {
              title: 'Why Africa',
              body: 'African universities are producing world-class researchers, but collaboration infrastructure has not kept pace with the talent. We are building the connective tissue that allows these brilliant minds to work together across institutions, cities, and disciplines.',
            },
            {
              title: 'Our Team',
              body: 'We are a team of researchers and engineers who experienced firsthand the friction of finding collaborators and mentors. We built the platform we wished existed when we were students.',
            },
          ].map(section => (
            <div key={section.title} className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold font-heading mb-3 text-foreground">{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white" style={{ background: 'var(--cta-bg)', boxShadow: 'var(--brand-glow)' }}>
            Join ResearchFlow
          </Link>
        </div>
      </div>
    </div>
  )
}
