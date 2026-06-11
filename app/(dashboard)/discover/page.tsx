import { Lightbulb, Target, BookOpen, Sparkles } from 'lucide-react'
import { HubPageHeader, HubCardGrid, type HubCard } from '@/components/dashboard/hub-page'

const cards: HubCard[] = [
  {
    title: 'Idea Board',
    icon: Lightbulb,
    href: '/ideas',
    description: 'Browse and share research ideas with the community',
  },
  {
    title: 'Grants & Funding',
    icon: Target,
    href: '/grants',
    description: 'Find funding opportunities matched to your research areas',
  },
  {
    title: 'Journals & Conferences',
    icon: BookOpen,
    href: '/publications',
    description: 'Discover publications and academic events in your field',
  },
  {
    title: 'AI Research Assistant',
    icon: Sparkles,
    href: '/assistant',
    description: 'Get AI-powered help with your research questions',
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
