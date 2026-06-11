import { MessageSquare, CheckCircle, Trophy, Star, BarChart, ShoppingBag } from 'lucide-react'
import { HubPageHeader, HubCardGrid, type HubCard } from '@/components/dashboard/hub-page'

const cards: HubCard[] = [
  {
    title: 'Forums',
    icon: MessageSquare,
    href: '/forums',
    description: 'Discuss research topics with fellow researchers',
    image: 'https://source.unsplash.com/400x200/?discussion,forum,community',
  },
  {
    title: 'Peer Review',
    icon: CheckCircle,
    href: '/peer-review',
    description: 'Give and receive structured feedback on research',
    image: 'https://source.unsplash.com/400x200/?review,feedback,academic',
  },
  {
    title: 'Challenges',
    icon: Trophy,
    href: '/challenges',
    description: 'Compete and collaborate on research challenges',
    image: 'https://source.unsplash.com/400x200/?challenge,competition,trophy',
  },
  {
    title: 'Showcase',
    icon: Star,
    href: '/showcase',
    description: 'Share and celebrate research achievements',
    image: 'https://source.unsplash.com/400x200/?showcase,presentation,stage',
  },
  {
    title: 'Leaderboard',
    icon: BarChart,
    href: '/leaderboard',
    description: 'See the most active researchers on the platform',
    image: 'https://source.unsplash.com/400x200/?leaderboard,ranking,success',
  },
  {
    title: 'Marketplace',
    icon: ShoppingBag,
    href: '/marketplace',
    description: 'Find and offer research skills and services',
    image: 'https://source.unsplash.com/400x200/?marketplace,skills,work',
  },
]

export default function CommunityPage() {
  return (
    <div>
      <HubPageHeader title="Community" subtitle="Engage with the ResearchFlow research community" />
      <HubCardGrid cards={cards} />
    </div>
  )
}
