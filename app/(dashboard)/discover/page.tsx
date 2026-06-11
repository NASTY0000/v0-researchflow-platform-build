import { Lightbulb, Target, BookOpen, Sparkles } from 'lucide-react'
import { HubPageHeader, HubCardGrid, type HubCard } from '@/components/dashboard/hub-page'

const cards: HubCard[] = [
  {
    title: 'Idea Board',
    icon: Lightbulb,
    href: '/ideas',
    description: 'Browse and share research ideas with the community',
    image: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=400&h=200&fit=crop',
  },
  {
    title: 'Grants & Funding',
    icon: Target,
    href: '/grants',
    description: 'Find funding opportunities matched to your research areas',
    image: 'https://images.unsplash.com/photo-1568234928966-359c35dd8327?w=400&h=200&fit=crop',
  },
  {
    title: 'Journals & Conferences',
    icon: BookOpen,
    href: '/publications',
    description: 'Discover publications and academic events in your field',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop',
  },
  {
    title: 'AI Research Assistant',
    icon: Sparkles,
    href: '/assistant',
    description: 'Get AI-powered help with your research questions',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=200&fit=crop',
  },
]

export default function DiscoverPage() {
  return (
    <div>
      <HubPageHeader title="Discover" subtitle="Explore ideas, funding, and resources for your research" />
      <HubCardGrid cards={cards} />
    </div>
  )
}
