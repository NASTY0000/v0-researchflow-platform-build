import { createClient } from '@supabase/supabase-js'
import { LandingNavbar } from '@/components/landing/navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { UniversityMarquee } from '@/components/landing/university-marquee'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { FaqSection } from '@/components/landing/faq-section'
import { CtaSection } from '@/components/landing/cta-section'
import { LandingFooter } from '@/components/landing/footer'

// Universities change rarely; refresh the static page hourly
export const revalidate = 3600

async function getUniversities(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    // Cookie-less anon client keeps this page statically renderable
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await supabase
      .from('universities')
      .select('name')
      .eq('is_active', true)
      .order('name')
    if (error) return []
    return data?.map((u) => u.name) ?? []
  } catch {
    return []
  }
}

export default async function LandingPage() {
  const universities = await getUniversities()

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05010F] text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <UniversityMarquee universities={universities} />
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
