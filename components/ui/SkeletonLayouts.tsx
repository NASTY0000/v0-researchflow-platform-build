function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div data-slot="skeleton" className={`relative overflow-hidden rounded-lg ${className}`}>
      <div className="absolute inset-0 skeleton-sweep" />
    </div>
  )
}

// Re-export as Skeleton so pages can import it for ad-hoc blocks
export { SkeletonBlock as Skeleton }

export function ResearcherCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 space-y-3 border border-border bg-card">
      <div className="flex gap-3">
        <SkeletonBlock className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-5/6" />
      <div className="flex gap-2">
        <SkeletonBlock className="h-6 w-16 rounded-full" />
        <SkeletonBlock className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function IdeaCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 space-y-3 border border-border bg-card">
      <div className="flex justify-between">
        <SkeletonBlock className="h-4 w-1/2" />
        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
      <SkeletonBlock className="h-3 w-3/5" />
      <div className="flex gap-2 pt-1">
        <SkeletonBlock className="h-7 w-20 rounded-lg" />
        <SkeletonBlock className="h-7 w-24 rounded-lg" />
      </div>
    </div>
  )
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden mb-4 border border-border bg-card">
      <SkeletonBlock className="h-52 w-full rounded-none" />
      <div className="px-5 pb-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <SkeletonBlock className="w-24 h-24 rounded-full" />
          <div className="flex gap-2 pb-1">
            <SkeletonBlock className="h-9 w-28 rounded-lg" />
            <SkeletonBlock className="h-9 w-28 rounded-lg" />
          </div>
        </div>
        <SkeletonBlock className="h-7 w-2/3 mb-2" />
        <SkeletonBlock className="h-4 w-1/3 mb-4" />
        <SkeletonBlock className="h-3 w-full mb-2" />
        <SkeletonBlock className="h-3 w-5/6" />
      </div>
    </div>
  )
}

export function NotificationSkeleton() {
  return (
    <div className="p-4 rounded-2xl space-y-2 border border-border bg-card">
      <div className="flex gap-3">
        <SkeletonBlock className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-1/2" />
          <SkeletonBlock className="h-3 w-3/4" />
        </div>
        <SkeletonBlock className="h-3 w-14 flex-shrink-0" />
      </div>
    </div>
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 space-y-4 border border-border bg-card">
      <div className="flex gap-3">
        <SkeletonBlock className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-5 w-2/3" />
          <SkeletonBlock className="h-3 w-1/2" />
          <SkeletonBlock className="h-3 w-2/5" />
        </div>
      </div>
      <SkeletonBlock className="h-2 w-full rounded-full" />
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 flex-1 rounded-lg" />
        <SkeletonBlock className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  )
}
