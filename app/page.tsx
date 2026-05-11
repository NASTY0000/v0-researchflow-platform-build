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
  CheckCircle,
  Star
} from 'lucide-react'

const features = [
  {
    icon: Lightbulb,
    title: 'Idea Board',
    description: 'Share your research ideas and discover opportunities to collaborate with peers across Africa.',
  },
  {
    icon: Users,
    title: 'Smart Matching',
    description: 'Our algorithm connects you with researchers who complement your skills and share your interests.',
  },
  {
    icon: GraduationCap,
    title: 'Mentor Network',
    description: 'Access experienced academics and industry professionals for guidance on your research journey.',
  },
  {
    icon: BookOpen,
    title: 'Project Workspace',
    description: 'Manage your research projects with Kanban boards, file sharing, and real-time collaboration.',
  },
  {
    icon: Globe,
    title: 'Research Showcase',
    description: 'Publish and share your completed research with the academic community.',
  },
  {
    icon: Rocket,
    title: 'Task Marketplace',
    description: 'Find help or offer your expertise on specific research tasks.',
  },
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
  },
  {
    quote: "The mentor network is incredible. I got guidance from a professor at UCT that completely transformed my research approach.",
    author: "Kwame Asante",
    role: "Masters Student, KNUST",
  },
  {
    quote: "Finally, a platform built for African researchers by people who understand our unique challenges and opportunities.",
    author: "Dr. Fatima Hassan",
    role: "Faculty Mentor, Cairo University",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-heading">ResearchFlow</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Star className="w-4 h-4" />
              <span>Built for African researchers, by African innovators</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-tight mb-6">
              <span className="gradient-text">Collaborate.</span>{' '}
              <span className="gradient-text">Discover.</span>{' '}
              <span className="gradient-text">Publish.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
              The premier research collaboration platform connecting university students across Africa. 
              Find collaborators, access mentors, and bring your research ideas to life.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/auth/signup">
                  Start Collaborating
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="#how-it-works">
                  See How It Works
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold font-heading gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From ideation to publication, ResearchFlow provides all the tools you need 
              for successful research collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold font-heading mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of researchers already collaborating on ResearchFlow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Profile',
                description: 'Sign up with your university email, add your skills and research interests.',
              },
              {
                step: '02',
                title: 'Find Your Match',
                description: 'Browse ideas, get matched with collaborators, or connect with mentors.',
              },
              {
                step: '03',
                title: 'Start Collaborating',
                description: 'Form teams, manage projects, and publish your research together.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold font-heading text-primary/10 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold font-heading mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Trusted by Researchers Across Africa
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl border border-border/50 bg-card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-3xl gradient-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white mb-4">
                Ready to Transform Your Research?
              </h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Join the growing community of African researchers collaborating, 
                learning, and publishing together.
              </p>
              <Button size="lg" variant="secondary" asChild>
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
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold font-heading">ResearchFlow</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>

            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ResearchFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
