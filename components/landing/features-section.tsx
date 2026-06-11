'use client'

import { useCallback } from 'react'
import { Reveal } from './reveal'

// ── Custom SVG feature icons ──────────────────────────────────────────────────

const IdeasIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="6" y="4" width="16" height="20" rx="2" stroke="#A78BFA" strokeWidth="1.5" fill="none"/>
    <rect x="6" y="4" width="16" height="20" rx="2" fill="#7C3AED" opacity="0.12"/>
    <line x1="10" y1="10" x2="18" y2="10" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="14" x2="18" y2="14" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="18" x2="15" y2="18" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="25" cy="10" r="4" fill="#FBBF24" opacity="0.9"/>
    <circle cx="25" cy="10" r="6" stroke="#FBBF24" strokeWidth="1" fill="none" opacity="0.3"/>
    <line x1="22" y1="10" x2="18" y2="12" stroke="#FBBF24" strokeWidth="1" opacity="0.6"/>
  </svg>
)

const CollaborateIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="6" r="3" fill="#22D3EE"/>
    <circle cx="16" cy="6" r="5" stroke="#22D3EE" strokeWidth="1" fill="none" opacity="0.4"/>
    <circle cx="6" cy="22" r="2.5" fill="#A78BFA"/>
    <circle cx="6" cy="22" r="4" stroke="#A78BFA" strokeWidth="1" fill="none" opacity="0.4"/>
    <circle cx="26" cy="22" r="2.5" fill="#A78BFA"/>
    <circle cx="26" cy="22" r="4" stroke="#A78BFA" strokeWidth="1" fill="none" opacity="0.4"/>
    <circle cx="16" cy="18" r="2" fill="#C084FC"/>
    <path d="M16 9 Q14 13 11 15 Q9 17 6 20" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M16 9 Q18 13 21 15 Q23 17 26 20" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M16 9 L16 16" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const MentorIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="9" r="5" stroke="#C084FC" strokeWidth="1.5" fill="none"/>
    <circle cx="16" cy="9" r="5" fill="#C084FC" opacity="0.12"/>
    <path d="M8 28 Q8 20 16 20 Q24 20 24 28" stroke="#C084FC" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M13 6 L16 4 L19 6" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <line x1="11" y1="6" x2="21" y2="6" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="25" cy="16" r="3" fill="#A855F7" opacity="0.8"/>
    <circle cx="25" cy="16" r="5" stroke="#A855F7" strokeWidth="0.8" fill="none" opacity="0.3"/>
  </svg>
)

const WorkspaceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="6" width="7" height="14" rx="1.5" stroke="#818CF8" strokeWidth="1.5" fill="#818CF8" opacity="0.12"/>
    <rect x="4" y="6" width="7" height="14" rx="1.5" stroke="#818CF8" strokeWidth="1.5" fill="none"/>
    <rect x="13" y="6" width="7" height="20" rx="1.5" stroke="#818CF8" strokeWidth="1.5" fill="#818CF8" opacity="0.18"/>
    <rect x="13" y="6" width="7" height="20" rx="1.5" stroke="#818CF8" strokeWidth="1.5" fill="none"/>
    <rect x="22" y="6" width="7" height="10" rx="1.5" stroke="#818CF8" strokeWidth="1.5" fill="#818CF8" opacity="0.12"/>
    <rect x="22" y="6" width="7" height="10" rx="1.5" stroke="#818CF8" strokeWidth="1.5" fill="none"/>
    <circle cx="7.5" cy="24" r="1.5" fill="#FBBF24"/>
    <circle cx="25.5" cy="20" r="1.5" fill="#22D3EE"/>
  </svg>
)

const ShowcaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="8" y="6" width="16" height="20" rx="2" stroke="#22D3EE" strokeWidth="1.5" fill="#22D3EE" opacity="0.08"/>
    <rect x="8" y="6" width="16" height="20" rx="2" stroke="#22D3EE" strokeWidth="1.5" fill="none"/>
    <line x1="12" y1="12" x2="20" y2="12" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12" y1="16" x2="20" y2="16" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12" y1="20" x2="17" y2="20" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="24" cy="8" r="1.5" fill="#FBBF24"/>
    <circle cx="28" cy="14" r="1.5" fill="#A855F7" opacity="0.8"/>
    <circle cx="26" cy="20" r="1.5" fill="#C084FC" opacity="0.8"/>
  </svg>
)

const MarketplaceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="9" stroke="#FBBF24" strokeWidth="1.5" fill="none"/>
    <circle cx="16" cy="16" r="9" fill="#FBBF24" opacity="0.08"/>
    <text x="13" y="21" fontSize="11" fill="#FBBF24" fontWeight="bold">$</text>
    <circle cx="5" cy="8" r="2.5" fill="#A78BFA" opacity="0.8"/>
    <circle cx="27" cy="8" r="2.5" fill="#A78BFA" opacity="0.8"/>
    <circle cx="5" cy="24" r="2.5" fill="#A78BFA" opacity="0.8"/>
    <circle cx="27" cy="24" r="2.5" fill="#A78BFA" opacity="0.8"/>
    <line x1="7" y1="9" x2="10" y2="11" stroke="#A78BFA" strokeWidth="1" opacity="0.5"/>
    <line x1="25" y1="9" x2="22" y2="11" stroke="#A78BFA" strokeWidth="1" opacity="0.5"/>
    <line x1="7" y1="23" x2="10" y2="21" stroke="#A78BFA" strokeWidth="1" opacity="0.5"/>
    <line x1="25" y1="23" x2="22" y2="21" stroke="#A78BFA" strokeWidth="1" opacity="0.5"/>
  </svg>
)

const FEATURES = [
  {
    icon: IdeasIcon,
    title: 'Idea Board',
    description: 'Share your research ideas and discover opportunities to collaborate with peers across Africa.',
    accent: 'rgba(168,85,247,0.14)',
  },
  {
    icon: CollaborateIcon,
    title: 'Smart Matching',
    description: 'Our algorithm connects you with researchers who complement your skills and share your interests.',
    accent: 'rgba(34,211,238,0.12)',
  },
  {
    icon: MentorIcon,
    title: 'Mentor Network',
    description: 'Access experienced academics and industry professionals for guidance on your research journey.',
    accent: 'rgba(192,132,252,0.14)',
  },
  {
    icon: WorkspaceIcon,
    title: 'Project Workspace',
    description: 'Manage your research projects with Kanban boards, file sharing, and real-time collaboration.',
    accent: 'rgba(129,140,248,0.14)',
  },
  {
    icon: ShowcaseIcon,
    title: 'Research Showcase',
    description: 'Publish and share your completed research with the academic community.',
    accent: 'rgba(34,211,238,0.12)',
  },
  {
    icon: MarketplaceIcon,
    title: 'Task Marketplace',
    description: 'Find help or offer your expertise on specific research tasks.',
    accent: 'rgba(251,191,36,0.1)',
  },
]

export function FeaturesSection() {
  // Track the cursor per-card so the spotlight gradient follows it
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    card.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])

  return (
    <section id="features" className="relative scroll-mt-16 overflow-hidden bg-[#05010F] px-4 py-28">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-700/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <Reveal className="mb-16 text-center">
          <p data-reveal className="label-section mb-3 !text-violet-400/80">Platform Features</p>
          <h2 data-reveal className="mb-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-[#C084FC] to-[#22D3EE] bg-clip-text text-transparent">Succeed</span>
          </h2>
          <p data-reveal className="mx-auto max-w-2xl text-[#9D8BB8]">
            From ideation to publication, ResearchFlow provides all the tools for successful research collaboration.
          </p>
        </Reveal>

        <Reveal className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              data-reveal
              onMouseMove={handleMouseMove}
              className="spotlight-card group relative overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.025] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-400/40 hover:shadow-[0_16px_48px_rgba(124,58,237,0.22)]"
              style={{ '--spot-color': feature.accent } as React.CSSProperties}
            >
              <div className="relative z-10">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-600/10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <feature.icon />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[#9D8BB8]">{feature.description}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
