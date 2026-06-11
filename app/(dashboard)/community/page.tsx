import { MessageSquare, CheckCircle, Trophy, Star, BarChart, ShoppingBag } from 'lucide-react'
import { HubPageHeader, HubCardGrid, type HubCard } from '@/components/dashboard/hub-page'

const cards: HubCard[] = [
  {
    title: 'Forums',
    icon: MessageSquare,
    href: '/forums',
    description: 'Discuss research topics with fellow researchers',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop',
  },
  {
    title: 'Peer Review',
    icon: CheckCircle,
    href: '/peer-review',
    description: 'Give and receive structured feedback on research',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=200&fit=crop',
  },
  {
    title: 'Challenges',
    icon: Trophy,
    href: '/challenges',
    description: 'Compete and collaborate on research challenges',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=200&fit=crop',
  },
  {
    title: 'Showcase',
    icon: Star,
    href: '/showcase',
    description: 'Share and celebrate research achievements',
    image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=400&h=200&fit=crop',
  },
  {
    title: 'Leaderboard',
    icon: BarChart,
    href: '/leaderboard',
    description: 'See the most active researchers on the platform',
    image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=200&fit=crop',
  },
  {
    title: 'Marketplace',
    icon: ShoppingBag,
    href: '/marketplace',
    description: 'Find and offer research skills and services',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
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
