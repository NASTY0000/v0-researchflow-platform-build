import { FolderOpen, Users, GraduationCap, FileText, Network } from 'lucide-react'
import { HubPageHeader, HubCardGrid, type HubCard } from '@/components/dashboard/hub-page'

const cards: HubCard[] = [
  {
    title: 'My Projects',
    icon: FolderOpen,
    href: '/projects',
    description: 'Manage your active research projects and workspaces',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop',
  },
  {
    title: 'Find Collaborators',
    icon: Users,
    href: '/matches',
    description: 'Discover researchers who share your interests',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=200&fit=crop',
  },
  {
    title: 'Mentor Directory',
    icon: GraduationCap,
    href: '/mentors',
    description: 'Connect with verified research mentors',
    image: 'https://images.unsplash.com/photo-1543269664-647163f8f9b0?w=400&h=200&fit=crop',
  },
  {
    title: 'Agreements',
    icon: FileText,
    href: '/agreements',
    description: 'Manage your research partnership agreements',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=200&fit=crop',
  },
  {
    title: 'My Network',
    icon: Network,
    href: '/network',
    description: 'View and grow your research connections',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=200&fit=crop',
  },
]

export default function CollaboratePage() {
  return (
    <div>
      <HubPageHeader title="Collaborate" subtitle="Connect, build, and grow your research network" />
      <HubCardGrid cards={cards} />
    </div>
  )
}
