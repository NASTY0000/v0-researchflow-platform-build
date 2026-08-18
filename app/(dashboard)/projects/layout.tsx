import { ProjectsFeatureGate } from '@/components/feature-gate'
export default function Layout({ children }: { children: React.ReactNode }) { return <ProjectsFeatureGate>{children}</ProjectsFeatureGate> }

