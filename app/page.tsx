import { LandingNavbar } from '@/components/landing/navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { UniversityMarquee } from '@/components/landing/university-marquee'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { FaqSection } from '@/components/landing/faq-section'
import { CtaSection } from '@/components/landing/cta-section'
import { LandingFooter } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05010F] text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <UniversityMarquee />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
