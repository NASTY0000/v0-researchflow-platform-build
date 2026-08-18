import { AdminGrantsFeatureGate } from '@/components/feature-gate'
export default function Layout({ children }: { children: React.ReactNode }) { return <AdminGrantsFeatureGate>{children}</AdminGrantsFeatureGate> }

