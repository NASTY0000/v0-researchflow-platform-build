import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
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
    <div className="min-h-screen bg-[#05010F] text-[#F3F0FF]">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05010F]/85 border-b border-violet-500/15 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden">
                <Image src="/icon.svg" alt="ResearchFlow" width={36} height={36} className="w-9 h-9" />
              </div>
              <span className="text-xl font-bold font-heading gradient-text-cyan">ResearchFlow</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How It Works', 'Testimonials'].map((item) => (
                <Link key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-sm text-[#7C6A9C] hover:text-[#F3F0FF] transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-[#7C6A9C] hover:text-[#F3F0FF]">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-gradient-to-br from-violet-600 to-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.35)] border-none hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]">
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
          <div className="absolute top-16 left-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse,rgba(124,58,237,0.18),transparent_70%)] blur-sm" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(168,85,247,0.1),transparent_70%)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(ellipse,rgba(6,182,212,0.04),transparent_60%)]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Tag pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in bg-violet-600/12 border border-violet-500/25">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-sm font-medium text-violet-400">Built for African researchers, by African innovators</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading leading-none mb-6 animate-fade-up tracking-tight">
              <span className="gradient-text">Collaborate.</span>{' '}
              <span className="gradient-text">Discover.</span>{' '}
              <span className="gradient-text">Publish.</span>
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up stagger-1 text-[#7C6A9C]">
              The premier research collaboration platform connecting university students across Africa.
              Find collaborators, access mentors, and bring your research ideas to life.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-2">
              <Button size="lg" asChild className="bg-gradient-to-br from-violet-600 to-violet-500 shadow-[0_0_24px_rgba(124,58,237,0.45)] border-none rounded-lg hover:shadow-[0_0_32px_rgba(124,58,237,0.55)] transition-all">
                <Link href="/auth/signup">
                  Start Collaborating
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-violet-500/40 text-violet-400 bg-transparent rounded-lg hover:bg-violet-500/10 hover:border-violet-500/60">
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 max-w-4xl mx-auto animate-fade-up stagger-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-violet-500/15">
                <div className="text-4xl font-bold font-heading stat-number">{stat.value}</div>
                <div className="text-sm mt-1 text-[#7C6A9C]">{stat.label}</div>
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
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4 tracking-tight">
              Everything You Need to Succeed
            </h2>
            <p className="max-w-2xl mx-auto text-[#7C6A9C]">
              From ideation to publication, ResearchFlow provides all the tools for successful research collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl transition-all duration-300 cursor-default animate-fade-up stagger-${Math.min(i + 1, 4)} bg-white/[0.03] border border-violet-500/15 backdrop-blur-xl hover:border-violet-500/45 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]`}
              >
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feature.color}18`, border: `1px solid ${feature.color}30` }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold font-heading mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[#7C6A9C]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-gradient-to-br from-[#1E0533]/40 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="label-section mb-3">Getting Started</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4 tracking-tight">
              Get Started in Minutes
            </h2>
            <p className="text-[#7C6A9C]">Join thousands of researchers already collaborating on ResearchFlow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Create Your Profile', description: 'Sign up with your university email, add your skills and research interests.' },
              { step: '02', title: 'Find Your Match', description: 'Browse ideas, get matched with collaborators, or connect with mentors.' },
              { step: '03', title: 'Start Collaborating', description: 'Form teams, manage projects, and publish your research together.' },
            ].map((item, i) => (
              <div key={item.step} className={`relative animate-fade-up stagger-${i + 1}`}>
                <div className="text-7xl font-black font-heading mb-4 text-violet-600/12 tracking-tighter">{item.step}</div>
                <div className="w-10 h-0.5 mb-4 rounded bg-gradient-to-r from-violet-600 to-cyan-500" />
                <h3 className="text-xl font-semibold font-heading mb-2">{item.title}</h3>
                <p className="text-[#7C6A9C]">{item.description}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">
              Trusted by Researchers Across Africa
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl animate-fade-up stagger-${i + 1} bg-white/[0.03] border border-violet-500/15`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current text-violet-400" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-[#F3F0FF]">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-violet-600 to-violet-500 text-[#F3F0FF]">
                    {t.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-xs text-[#7C6A9C]">{t.role}</div>
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
          <div className="p-10 sm:p-16 rounded-3xl relative overflow-hidden bg-gradient-to-br from-[#1E0533] to-[#050118] border border-violet-500/30">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.25),transparent_60%)]" />
            <div className="relative">
              <p className="label-section mb-4">Join the movement</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4 tracking-tight">
                Ready to Transform Your Research?
              </h2>
              <p className="mb-10 max-w-2xl mx-auto text-[#7C6A9C]">
                Join the growing community of African researchers collaborating, learning, and publishing together.
              </p>
              <Button size="lg" asChild className="bg-gradient-to-br from-violet-600 to-violet-500 shadow-[0_0_24px_rgba(124,58,237,0.5)] border-none rounded-lg hover:shadow-[0_0_32px_rgba(124,58,237,0.6)]">
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
      <footer className="py-12 px-4 border-t border-violet-500/12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/icon.svg" alt="ResearchFlow" width={32} height={32} className="w-8 h-8" />
            </div>
            <span className="font-bold font-heading gradient-text-cyan">ResearchFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#7C6A9C]">
            {['About', 'Terms', 'Privacy', 'Contact'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="hover:text-[#F3F0FF] transition-colors">{item}</Link>
            ))}
          </div>
          <div className="text-sm text-[#7C6A9C]">
            &copy; {new Date().getFullYear()} ResearchFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
