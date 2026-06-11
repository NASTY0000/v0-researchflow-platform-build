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
    image: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=400&h=200&fit=crop',
  },
  {
    title: 'Challenges',
    icon: Trophy,
    href: '/challenges',
    description: 'Compete and collaborate on research challenges',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=200&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&h=200&fit=crop',
  },
  {
    title: 'Marketplace',
    icon: ShoppingBag,
    href: '/marketplace',
    description: 'Find and offer research skills and services',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop',
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
