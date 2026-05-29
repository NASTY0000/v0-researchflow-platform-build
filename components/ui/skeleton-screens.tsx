'use client'

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-white/5 ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.08) 50%, transparent 100%)',
          animation: 'shimmer 1.8s infinite',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  )
}

export function IdeaCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Shimmer className="w-9 h-9 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-3.5 w-32" />
          <Shimmer className="h-3 w-20" />
        </div>
        <Shimmer className="h-5 w-16 rounded-full" />
      </div>
      <Shimmer className="h-5 w-3/4" />
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-5/6" />
      <div className="flex gap-2 pt-1">
        <Shimmer className="h-6 w-20 rounded-full" />
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Shimmer className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-5 w-36" />
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-28" />
        </div>
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-6 w-24 rounded-full" />
        <Shimmer className="h-6 w-20 rounded-full" />
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Shimmer className="h-9 flex-1 rounded-lg" />
        <Shimmer className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  )
}

export function GrantCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Shimmer className="h-4 w-24 rounded-full" />
          <Shimmer className="h-5 w-3/4" />
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-4/5" />
        </div>
        <Shimmer className="w-20 h-14 rounded-lg shrink-0" />
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-6 w-20 rounded-full" />
        <Shimmer className="h-6 w-24 rounded-full" />
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function ForumCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-4">
        <Shimmer className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-48" />
          <Shimmer className="h-3.5 w-full" />
        </div>
        <Shimmer className="w-10 h-8 rounded-lg" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-lg shrink-0" />
        <div className="space-y-1.5">
          <Shimmer className="h-6 w-16" />
          <Shimmer className="h-3.5 w-24" />
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Shimmer className="h-8 w-64" />
        <Shimmer className="h-5 w-48" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <IdeaCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
