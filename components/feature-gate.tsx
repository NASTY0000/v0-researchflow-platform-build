'use client'

import { usePathname } from 'next/navigation'
import { featureLabels, featureFlags, type FeatureFlag } from '@/lib/config/feature-flags'

function UnavailableState({ feature }: { feature: FeatureFlag }) {
  return <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col justify-center text-center"><h1 className="font-heading text-2xl font-bold">{featureLabels[feature]} is temporarily unavailable</h1><p className="mt-3 text-sm text-muted-foreground">We&apos;re making a few updates. Please check back soon.</p></div>
}

export function FeatureGate({ feature, children }: { feature: FeatureFlag; children: React.ReactNode }) {
  return featureFlags[feature] ? <>{children}</> : <UnavailableState feature={feature} />
}

export function ProjectsFeatureGate({ children }: { children: React.ReactNode }) {
  return <FeatureGate feature={usePathname().startsWith('/projects/discover') ? 'openProjects' : 'myProjects'}>{children}</FeatureGate>
}

export function AdminGrantsFeatureGate({ children }: { children: React.ReactNode }) {
  return <FeatureGate feature={usePathname().startsWith('/admin/grants/applications') ? 'adminGrantApplications' : 'adminGrants'}>{children}</FeatureGate>
}
