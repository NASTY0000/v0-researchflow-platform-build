import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Users, 
  Lightbulb, 
  BookOpen, 
  ArrowRight, 
  GraduationCap,
  Globe,
  Rocket,
  Star,
  Zap,
} from 'lucide-react'

const features = [
  { icon: Lightbulb, title: 'Idea Board', description: 'Share your research ideas and discover opportunities to collaborate with peers across Africa.', color: '#A855F7' },
  { icon: Users, title: 'Smart Matching', description: 'Our algorithm connects you with researchers who complement your skills and share your interests.', color: '#06B6D4' },
  { icon: GraduationCap, title: 'Mentor Network', description: 'Access experienced academics and industry professionals for guidance on your research journey.', color: '#C084FC' },
  { icon: BookOpen, title: 'Project Workspace', description: 'Manage your research projects with Kanban boards, file sharing, and real-time collaboration.', color: '#818CF8' },
  { icon: Globe, title: 'Research Showcase', description: 'Publish and share your completed research with the academic community.', color: '#06B6D4' },
  { icon: Rocket, title: 'Task Marketplace', description: 'Find help or offer your expertise on specific research tasks.', color: '#A855F7' },
]

const stats = [
  { value: '30+', label: 'African Universities' },
  { value: '10K+', label: 'Student Researchers' },
  { value: '500+', label: 'Active Projects' },
  { value: '95%', label: 'Match Success Rate' },
]

const testimonials = [
  {
    quote: "ResearchFlow helped me find collaborators for my thesis on renewable energy. We published our first paper together!",
    author: "Amara Okonkwo",
    role: "PhD Candidate, University of Lagos",
    initial: "A",
  },
  {
    quote: "The mentor network is incredible. I got guidance from a professor at UCT that completely transformed my research approach.",
    author: "Kwame Asante",
    role: "Masters Student, KNUST",
    initial: "K",
  },
  {
    quote: "Finally, a platform built for African researchers by people who understand our unique challenges and opportunities.",
    author: "Dr. Fatima Hassan",
    role: "Faculty Mentor, Cairo University",
    initial: "F",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#05010F', color: '#F3F0FF' }}>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: 'rgba(5,1,15,0.85)', borderColor: 'rgba(139,92,246,0.15)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold font-heading gradient-text-cyan">ResearchFlow</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How It Works', 'Testimonials'].map((item) => (
                <Link key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-sm transition-colors" style={{ color: '#7C6A9C' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#F3F0FF')}
                  onMouseOut={e => (e.currentTarget.style.color = '#7C6A9C')}
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild style={{ color: '#7C6A9C' }}>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none' }}>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-1/4 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.18),transparent 70%)', filter: 'blur(1px)' }} />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(168,85,247,0.1),transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(6,182,212,0.04),transparent 60%)' }} />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Tag pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: '#C084FC' }} />
              <span className="text-sm font-medium" style={{ color: '#C084FC' }}>Built for African researchers, by African innovators</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading leading-none mb-6 animate-fade-up" style={{ letterSpacing: '-0.03em' }}>
              <span className="gradient-text">Collaborate.</span>{' '}
              <span className="gradient-text">Discover.</span>{' '}
              <span className="gradient-text">Publish.</span>
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up stagger-1" style={{ color: '#7C6A9C' }}>
              The premier research collaboration platform connecting university students across Africa.
              Find collaborators, access mentors, and bring your research ideas to life.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-2">
              <Button size="lg" asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 24px rgba(124,58,237,0.45)', border: 'none', borderRadius: '8px', transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)' }}>
                <Link href="/auth/signup">
                  Start Collaborating
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild style={{ borderColor: 'rgba(168,85,247,0.4)', color: '#C084FC', background: 'transparent', borderRadius: '8px' }}>
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 max-w-4xl mx-auto animate-fade-up stagger-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <div className="text-4xl font-bold font-heading stat-number">{stat.value}</div>
                <div className="text-sm mt-1" style={{ color: '#7C6A9C' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="label-section mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4" style={{ letterSpacing: '-0.03em' }}>
              Everything You Need to Succeed
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: '#7C6A9C' }}>
              From ideation to publication, ResearchFlow provides all the tools for successful research collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl transition-all duration-300 cursor-default animate-fade-up stagger-${Math.min(i + 1, 4)}`}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(139,92,246,0.15)',
                  backdropFilter: 'blur(12px)',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.45)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 30px rgba(124,58,237,0.15)'
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.15)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${feature.color}18`, border: `1px solid ${feature.color}30` }}>
                  <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold font-heading mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7C6A9C' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4" style={{ background: 'linear-gradient(135deg, rgba(30,5,51,0.4) 0%, transparent 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="label-section mb-3">Getting Started</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4" style={{ letterSpacing: '-0.03em' }}>
              Get Started in Minutes
            </h2>
            <p style={{ color: '#7C6A9C' }}>Join thousands of researchers already collaborating on ResearchFlow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Create Your Profile', description: 'Sign up with your university email, add your skills and research interests.' },
              { step: '02', title: 'Find Your Match', description: 'Browse ideas, get matched with collaborators, or connect with mentors.' },
              { step: '03', title: 'Start Collaborating', description: 'Form teams, manage projects, and publish your research together.' },
            ].map((item, i) => (
              <div key={item.step} className={`relative animate-fade-up stagger-${i + 1}`}>
                <div className="text-7xl font-black font-heading mb-4" style={{ color: 'rgba(124,58,237,0.12)', letterSpacing: '-0.05em' }}>{item.step}</div>
                <div className="w-10 h-0.5 mb-4 rounded" style={{ background: 'linear-gradient(90deg,#7C3AED,#06B6D4)' }} />
                <h3 className="text-xl font-semibold font-heading mb-2">{item.title}</h3>
                <p style={{ color: '#7C6A9C' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="label-section mb-3">Social Proof</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading" style={{ letterSpacing: '-0.03em' }}>
              Trusted by Researchers Across Africa
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl animate-fade-up stagger-${i + 1}`}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: '#C084FC' }} />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed" style={{ color: '#F3F0FF' }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#F3F0FF' }}>
                    {t.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-xs" style={{ color: '#7C6A9C' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-10 sm:p-16 rounded-3xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1E0533 0%,#050118 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.25),transparent 60%)' }} />
            <div className="relative">
              <p className="label-section mb-4">Join the movement</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4" style={{ letterSpacing: '-0.03em' }}>
                Ready to Transform Your Research?
              </h2>
              <p className="mb-10 max-w-2xl mx-auto" style={{ color: '#7C6A9C' }}>
                Join the growing community of African researchers collaborating, learning, and publishing together.
              </p>
              <Button size="lg" asChild style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 24px rgba(124,58,237,0.5)', border: 'none', borderRadius: '8px' }}>
                <Link href="/auth/signup">
                  Create Free Account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4" style={{ borderTop: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold font-heading gradient-text-cyan">ResearchFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: '#7C6A9C' }}>
            {['About', 'Terms', 'Privacy', 'Contact'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                style={{ color: '#7C6A9C', transition: 'color 200ms' }}
                onMouseOver={e => (e.currentTarget.style.color = '#F3F0FF')}
                onMouseOut={e => (e.currentTarget.style.color = '#7C6A9C')}
              >{item}</Link>
            ))}
          </div>
          <div className="text-sm" style={{ color: '#7C6A9C' }}>
            &copy; {new Date().getFullYear()} ResearchFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
