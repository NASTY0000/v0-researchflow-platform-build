import { MessageSquare, CheckCircle, Trophy, Star, BarChart, ShoppingBag } from 'lucide-react'
import { HubPageHeader, HubCardGrid, type HubCard } from '@/components/dashboard/hub-page'

const cards: HubCard[] = [
  {
    title: 'Forums',
    icon: MessageSquare,
    href: '/forums',
    description: 'Discuss research topics with fellow researchers',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=200&fit=crop',
  },
  {
    title: 'Peer Review',
    icon: CheckCircle,
    href: '/peer-review',
    description: 'Give and receive structured feedback on research',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop',
  },
  {
    title: 'Challenges',
    icon: Trophy,
    href: '/challenges',
    description: 'Compete and collaborate on research challenges',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
  },
  {
    title: 'Showcase',
    icon: Star,
    href: '/showcase',
    description: 'Share and celebrate research achievements',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
  },
  {
    title: 'Leaderboard',
    icon: BarChart,
    href: '/leaderboard',
    description: 'See the most active researchers on the platform',
    image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=400&h=200&fit=crop',
  },
  {
    title: 'Marketplace',
    icon: ShoppingBag,
    href: '/marketplace',
    description: 'Find and offer research skills and services',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
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
