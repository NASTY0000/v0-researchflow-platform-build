import { FolderOpen, Users, GraduationCap, FileText, Network } from 'lucide-react'
import { HubPageHeader, HubCardGrid, type HubCard } from '@/components/dashboard/hub-page'

const cards: HubCard[] = [
  {
    title: 'My Projects',
    icon: FolderOpen,
    href: '/projects',
    description: 'Manage your active research projects and workspaces',
  },
  {
    title: 'Find Collaborators',
    icon: Users,
    href: '/matches',
    description: 'Discover researchers who share your interests',
  },
  {
    title: 'Mentor Directory',
    icon: GraduationCap,
    href: '/mentors',
    description: 'Connect with verified research mentors',
  },
  {
    title: 'Agreements',
    icon: FileText,
    href: '/agreements',
    description: 'Manage your research partnership agreements',
  },
  {
    title: 'My Network',
    icon: Network,
    href: '/network',
    description: 'View and grow your research connections',
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
