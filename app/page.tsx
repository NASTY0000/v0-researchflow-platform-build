import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import {
  ArrowRight,
  Zap,
  User,
  Users,
  Award,
  Star,
} from 'lucide-react'
import {
  GlobalIllustrations,
  FeaturesIllustrations,
  StatsIllustrations,
  FooterIllustrations
} from '@/components/landing/floating-illustrations'
import { FaqSection } from '@/components/landing/faq-section'
import { BaobabTree } from '@/components/landing/baobab-tree'
import { ParallaxHeroWrapper } from '@/components/landing/parallax-hero'
import { MagneticButton } from '@/components/ui/micro-interactions'
import { GradientText } from '@/components/ui/gradient-text'

// ── Custom SVG feature icons ──────────────────────────────────────────────────

const CollaborateIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="6" r="3" fill="#7C3AED"/>
    <circle cx="16" cy="6" r="5" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.4"/>
    <circle cx="6" cy="22" r="2.5" fill="#7C3AED"/>
    <circle cx="6" cy="22" r="4" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.4"/>
    <circle cx="26" cy="22" r="2.5" fill="#7C3AED"/>
    <circle cx="26" cy="22" r="4" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.4"/>
    <circle cx="16" cy="18" r="2" fill="#A855F7"/>
    <path d="M16 9 Q14 13 11 15 Q9 17 6 20" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M16 9 Q18 13 21 15 Q23 17 26 20" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M16 9 L16 16" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="11" cy="15" r="1.5" fill="#C084FC" opacity="0.7"/>
    <circle cx="21" cy="15" r="1.5" fill="#C084FC" opacity="0.7"/>
  </svg>
)

const IdeasIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="6" y="4" width="16" height="20" rx="2" stroke="#7C3AED" strokeWidth="1.5" fill="none"/>
    <rect x="6" y="4" width="16" height="20" rx="2" fill="#7C3AED" opacity="0.08"/>
    <line x1="10" y1="10" x2="18" y2="10" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="14" x2="18" y2="14" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="18" x2="15" y2="18" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="25" cy="10" r="4" fill="#FBBF24" opacity="0.9"/>
    <circle cx="25" cy="10" r="6" stroke="#FBBF24" strokeWidth="1" fill="none" opacity="0.3"/>
    <line x1="22" y1="10" x2="18" y2="12" stroke="#FBBF24" strokeWidth="1" opacity="0.6"/>
    <text x="23.5" y="13.5" fontSize="6" fill="white" fontWeight="bold">✦</text>
  </svg>
)

const MentorIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="9" r="5" stroke="#7C3AED" strokeWidth="1.5" fill="none"/>
    <circle cx="16" cy="9" r="5" fill="#7C3AED" opacity="0.1"/>
    <path d="M8 28 Q8 20 16 20 Q24 20 24 28" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M13 6 L16 4 L19 6" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <line x1="11" y1="6" x2="21" y2="6" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="25" cy="16" r="3" fill="#A855F7" opacity="0.8"/>
    <path d="M19 12 Q22 13 24 15" stroke="#A855F7" strokeWidth="1" strokeLinecap="round" opacity="0.6" fill="none"/>
    <circle cx="25" cy="16" r="5" stroke="#A855F7" strokeWidth="0.8" fill="none" opacity="0.3"/>
  </svg>
)

const GrantsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="9" stroke="#FBBF24" strokeWidth="1.5" fill="none"/>
    <circle cx="16" cy="16" r="9" fill="#FBBF24" opacity="0.08"/>
    <text x="13" y="21" fontSize="11" fill="#FBBF24" fontWeight="bold">$</text>
    <circle cx="5" cy="8" r="2.5" fill="#7C3AED" opacity="0.8"/>
    <circle cx="27" cy="8" r="2.5" fill="#7C3AED" opacity="0.8"/>
    <circle cx="5" cy="24" r="2.5" fill="#7C3AED" opacity="0.8"/>
    <circle cx="27" cy="24" r="2.5" fill="#7C3AED" opacity="0.8"/>
    <line x1="7" y1="9" x2="10" y2="11" stroke="#7C3AED" strokeWidth="1" opacity="0.5"/>
    <line x1="25" y1="9" x2="22" y2="11" stroke="#7C3AED" strokeWidth="1" opacity="0.5"/>
    <line x1="7" y1="23" x2="10" y2="21" stroke="#7C3AED" strokeWidth="1" opacity="0.5"/>
    <line x1="25" y1="23" x2="22" y2="21" stroke="#7C3AED" strokeWidth="1" opacity="0.5"/>
  </svg>
)

const ReputationIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M10 20 L10 14 Q10 8 16 8 Q22 8 22 14 L22 20 Z" stroke="#7C3AED" strokeWidth="1.5" fill="#7C3AED" opacity="0.15" strokeLinejoin="round"/>
    <path d="M10 14 Q6 14 6 10 Q6 6 10 8" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M22 14 Q26 14 26 10 Q26 6 22 8" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <rect x="12" y="20" width="8" height="3" rx="1" fill="#7C3AED" opacity="0.6"/>
    <rect x="10" y="23" width="12" height="2.5" rx="1" fill="#7C3AED" opacity="0.8"/>
    <circle cx="16" cy="13" r="3" fill="#FBBF24"/>
    <circle cx="16" cy="13" r="5" stroke="#FBBF24" strokeWidth="1" fill="none" opacity="0.3"/>
    <path d="M14 10 Q14 7 12 5" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    <path d="M18 10 Q18 7 20 5" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    <path d="M16 9 L16 4" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    <circle cx="12" cy="5" r="1.5" fill="#A855F7" opacity="0.8"/>
    <circle cx="20" cy="5" r="1.5" fill="#A855F7" opacity="0.8"/>
    <circle cx="16" cy="4" r="1.5" fill="#FBBF24" opacity="0.9"/>
  </svg>
)

const ShowcaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="8" y="6" width="16" height="20" rx="2" stroke="#7C3AED" strokeWidth="1.5" fill="#7C3AED" opacity="0.08"/>
    <line x1="12" y1="12" x2="20" y2="12" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12" y1="16" x2="20" y2="16" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12" y1="20" x2="17" y2="20" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="24" cy="8" r="1.5" fill="#FBBF24"/>
    <circle cx="28" cy="14" r="1.5" fill="#A855F7" opacity="0.8"/>
    <circle cx="26" cy="20" r="1.5" fill="#7C3AED" opacity="0.8"/>
    <line x1="24" y1="8" x2="22" y2="10" stroke="#FBBF24" strokeWidth="1" opacity="0.6"/>
    <line x1="28" y1="14" x2="22" y2="15" stroke="#A855F7" strokeWidth="1" opacity="0.5"/>
    <line x1="26" y1="20" x2="22" y2="19" stroke="#7C3AED" strokeWidth="1" opacity="0.5"/>
    <circle cx="24" cy="8" r="3" stroke="#FBBF24" strokeWidth="0.8" fill="none" opacity="0.3"/>
    <circle cx="28" cy="14" r="3" stroke="#A855F7" strokeWidth="0.8" fill="none" opacity="0.25"/>
  </svg>
)

// ── Feature card data ─────────────────────────────────────────────────────────

const features = [
  {
    icon: IdeasIcon,
    title: 'Idea Board',
    description: 'Share your research ideas and discover opportunities to collaborate with peers across Africa.',
    color: '#A855F7',
  },
  {
    icon: CollaborateIcon,
    title: 'Smart Matching',
    description: 'Our algorithm connects you with researchers who complement your skills and share your interests.',
    color: '#06B6D4',
  },
  {
    icon: MentorIcon,
    title: 'Mentor Network',
    description: 'Access experienced academics and industry professionals for guidance on your research journey.',
    color: '#C084FC',
  },
  {
    icon: ReputationIcon,
    title: 'Project Workspace',
    description: 'Manage your research projects with Kanban boards, file sharing, and real-time collaboration.',
    color: '#818CF8',
  },
  {
    icon: ShowcaseIcon,
    title: 'Research Showcase',
    description: 'Publish and share your completed research with the academic community.',
    color: '#06B6D4',
  },
  {
    icon: GrantsIcon,
    title: 'Task Marketplace',
    description: 'Find help or offer your expertise on specific research tasks.',
    color: '#A855F7',
  },
]

// ── Testimonials ──────────────────────────────────────────────────────────────

const testimonials = [
  {
    quote: "Within two weeks of joining ResearchFlow, I had three collaborators for my climate adaptation study. We submitted to a peer-reviewed journal six months later — something I could not have done alone.",
    author: "Amara Okafor",
    role: "PhD Candidate, University of Ibadan",
    initial: "A",
  },
  {
    quote: "The Akili Score system genuinely motivates students to contribute meaningfully. My lab has seen a 40% increase in cross-departmental project proposals since we started using ResearchFlow.",
    author: "Dr. Chukwuemeka Adeyemi",
    role: "Associate Professor, Obafemi Awolowo University",
    initial: "C",
  },
  {
    quote: "As a female researcher in northern Nigeria, finding a mentor felt impossible. ResearchFlow connected me with a senior researcher in Nairobi in days. That relationship changed my career.",
    author: "Fatima Al-Hassan",
    role: "Masters Student, Ahmadu Bello University",
    initial: "F",
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const stats = [
    { value: '100+', label: 'African Universities' },
    { value: '10K+', label: 'Student Researchers' },
    { value: '500+', label: 'Active Projects' },
    { value: '95%', label: 'Match Success Rate' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Global particle field + ambient glows */}
      <GlobalIllustrations />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 border-b border-border backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo variant="horizontal" width={160} uid="nav" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How It Works', 'Testimonials'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-gradient-to-br from-violet-600 to-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.35)] border-none hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <ParallaxHeroWrapper>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in bg-violet-600/12 border border-violet-500/25">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-sm font-medium text-violet-400">Built for African researchers, by African innovators</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading leading-none mb-6 animate-fade-up tracking-tight">
                <GradientText animate>Collaborate.</GradientText>{' '}
                <GradientText animate>Discover.</GradientText>{' '}
                <GradientText animate>Publish.</GradientText>
              </h1>

              <p className="text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-fade-up stagger-1 text-muted-foreground">
                The premier research collaboration platform connecting university students across Africa.
                Find collaborators, access mentors, and bring your research ideas to life.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-up stagger-2">
                <MagneticButton>
                  <Button
                    size="lg"
                    asChild
                    className="bg-gradient-to-br from-violet-600 to-violet-500 shadow-[0_0_24px_rgba(124,58,237,0.45)] border-none rounded-lg hover:shadow-[0_0_32px_rgba(124,58,237,0.55)] transition-all"
                  >
                    <Link href="/auth/signup">
                      Start Collaborating
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </MagneticButton>
                <MagneticButton>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-violet-500/40 text-violet-400 bg-transparent rounded-lg hover:bg-violet-500/10 hover:border-violet-500/60"
                  >
                    <Link href="#how-it-works">See How It Works</Link>
                  </Button>
                </MagneticButton>
              </div>
            </div>

            {/* Right: Baobab tree */}
            <div className="relative flex items-center justify-center lg:justify-end w-full h-full min-h-[400px]">
              <BaobabTree />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto animate-fade-up stagger-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="text-4xl font-bold font-heading stat-number">{stat.value}</div>
                <div className="text-sm mt-1 text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </ParallaxHeroWrapper>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 relative">
        <FeaturesIllustrations />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="label-section mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4 tracking-tight">
              Everything You Need to{' '}
              <GradientText>Succeed</GradientText>
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground">
              From ideation to publication, ResearchFlow provides all the tools for successful research collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl transition-all duration-300 cursor-default animate-fade-up stagger-${Math.min(i + 1, 4)} bg-card border border-border hover:border-primary/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.12)]`}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feature.color}18`, border: `1px solid ${feature.color}30` }}
                >
                  <feature.icon />
                </div>
                <h3 className="text-lg font-semibold font-heading mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="label-section mb-3">Getting Started</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4 tracking-tight">
              Get Started in Minutes
            </h2>
            <p className="text-muted-foreground">Join thousands of researchers already collaborating on ResearchFlow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: User,
                iconColor: '#A855F7',
                title: 'Create Your Profile',
                description: "Sign up with your university email, add your skills, research interests, and what you're looking to achieve. Your profile is your academic identity on ResearchFlow.",
              },
              {
                step: '02',
                icon: Users,
                iconColor: '#06B6D4',
                title: 'Find Your Match',
                description: 'Our smart algorithm surfaces collaborators, ideas, and mentors tailored to your research goals. Browse opportunities or let matches come to you.',
              },
              {
                step: '03',
                icon: Award,
                iconColor: '#C084FC',
                title: 'Publish & Grow',
                description: 'Form teams, manage projects with built-in tools, earn Akili Score points, and publish your completed research to the African academic community.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`relative p-8 rounded-2xl animate-fade-up stagger-${i + 1} bg-card border border-border hover:border-primary/35 transition-all duration-300`}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${item.iconColor}18`, border: `1px solid ${item.iconColor}30` }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: item.iconColor }} />
                  </div>
                  <span className="text-4xl font-black font-heading text-violet-600/20 tracking-tighter leading-none">{item.step}</span>
                </div>
                <div className="w-8 h-0.5 mb-4 rounded bg-gradient-to-r from-violet-600 to-cyan-500" />
                <h3 className="text-xl font-semibold font-heading mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4 relative">
        <StatsIllustrations />
        <div className="max-w-7xl mx-auto relative z-10">
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
                className={`p-6 rounded-2xl animate-fade-up stagger-${i + 1} bg-card border border-border`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current text-violet-400" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-violet-600 to-violet-500 text-primary-foreground">
                    {t.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection />

      {/* ── CTA ── */}
      <section className="py-24 px-4 relative">
        <FooterIllustrations />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="p-10 sm:p-16 rounded-3xl relative overflow-hidden bg-gradient-to-r from-purple-700 to-purple-900 dark:from-purple-900 dark:to-[#050118]">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="relative text-white">
              <p className="label-section mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Join the movement</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4 tracking-tight text-white">
                Ready to Transform Your Research?
              </h2>
              <p className="mb-10 max-w-2xl mx-auto text-white/80">
                Join the growing community of African researchers collaborating, learning, and publishing together.
              </p>
              <Button
                size="lg"
                asChild
                className="bg-white text-purple-800 hover:bg-white/90 border-none rounded-lg shadow-[0_0_24px_rgba(255,255,255,0.2)] hover:shadow-[0_0_32px_rgba(255,255,255,0.3)]"
              >
                <Link href="/auth/signup">
                  Create Free Account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <Logo variant="horizontal" width={160} uid="footer" />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {['About', 'Terms', 'Privacy', 'Contact'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="hover:text-foreground transition-colors">
                {item}
              </Link>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ResearchFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
