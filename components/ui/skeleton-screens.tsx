'use client'

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div data-slot="skeleton" className={`relative overflow-hidden rounded-lg ${className}`}>
      <div className="absolute inset-0 skeleton-sweep" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-full shrink-0"/>
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-4 w-32"/>
          <Shimmer className="h-3 w-20"/>
        </div>
        <Shimmer className="h-5 w-16 rounded-full"/>
      </div>
      <Shimmer className="h-5 w-3/4"/>
      <Shimmer className="h-4 w-full"/>
      <Shimmer className="h-4 w-5/6"/>
      <div className="flex gap-2">
        <Shimmer className="h-6 w-20 rounded-full"/>
        <Shimmer className="h-6 w-16 rounded-full"/>
      </div>
    </div>
  )
}

export function IdeaCardSkeleton() {
  return <CardSkeleton/>
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Shimmer className="w-16 h-16 rounded-full shrink-0"/>
        <div className="space-y-2 flex-1">
          <Shimmer className="h-5 w-36"/>
          <Shimmer className="h-4 w-24"/>
          <Shimmer className="h-4 w-28"/>
        </div>
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-6 w-24 rounded-full"/>
        <Shimmer className="h-6 w-20 rounded-full"/>
      </div>
      <div className="flex gap-3">
        <Shimmer className="h-9 flex-1 rounded-lg"/>
        <Shimmer className="h-9 flex-1 rounded-lg"/>
      </div>
    </div>
  )
}

export function GrantCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Shimmer className="h-4 w-24 rounded-full"/>
          <Shimmer className="h-5 w-3/4"/>
          <Shimmer className="h-4 w-40"/>
          <Shimmer className="h-4 w-full"/>
        </div>
        <Shimmer className="w-20 h-14 rounded-lg shrink-0"/>
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-6 w-20 rounded-full"/>
        <Shimmer className="h-6 w-24 rounded-full"/>
      </div>
    </div>
  )
}

export function ForumCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-4">
        <Shimmer className="w-12 h-12 rounded-xl shrink-0"/>
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-48"/>
          <Shimmer className="h-3 w-full"/>
        </div>
        <Shimmer className="w-10 h-8 rounded-lg shrink-0"/>
      </div>
    </div>
  )
}

export function ChallengeCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Shimmer className="h-4 w-20 rounded-full"/>
          <Shimmer className="h-6 w-3/4"/>
          <Shimmer className="h-4 w-full"/>
          <Shimmer className="h-4 w-5/6"/>
        </div>
        <Shimmer className="w-16 h-16 rounded-xl shrink-0"/>
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-6 w-24 rounded-full"/>
        <Shimmer className="h-6 w-20 rounded-full"/>
      </div>
      <Shimmer className="h-10 w-full rounded-lg"/>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-lg shrink-0"/>
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-6 w-16"/>
          <Shimmer className="h-3 w-24"/>
        </div>
      </div>
    </div>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Shimmer className="w-9 h-9 rounded-full shrink-0"/>
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-4 w-28"/>
          <Shimmer className="h-3 w-20"/>
        </div>
      </div>
      <Shimmer className="h-5 w-3/4"/>
      <Shimmer className="h-4 w-full"/>
      <Shimmer className="h-4 w-2/3"/>
      <div className="flex gap-4">
        <Shimmer className="h-4 w-16"/>
        <Shimmer className="h-4 w-16"/>
        <Shimmer className="h-4 w-16"/>
      </div>
    </div>
  )
}

export function MentorCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Shimmer className="w-16 h-16 rounded-full shrink-0"/>
        <div className="space-y-2 flex-1">
          <Shimmer className="h-5 w-32"/>
          <Shimmer className="h-4 w-24"/>
          <Shimmer className="h-4 w-20"/>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Shimmer className="h-6 w-20 rounded-full"/>
        <Shimmer className="h-6 w-24 rounded-full"/>
        <Shimmer className="h-6 w-16 rounded-full"/>
      </div>
      <Shimmer className="h-9 w-full rounded-lg"/>
    </div>
  )
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-border">
      <Shimmer className="w-10 h-10 rounded-full shrink-0"/>
      <div className="space-y-2 flex-1">
        <Shimmer className="h-4 w-3/4"/>
        <Shimmer className="h-3 w-1/2"/>
      </div>
    </div>
  )
}

export function ProfilePageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Shimmer className="h-40 w-full rounded-none"/>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <Shimmer className="w-20 h-20 rounded-full shrink-0 -mt-10"/>
            <div className="space-y-2 flex-1 pt-2">
              <Shimmer className="h-6 w-48"/>
              <Shimmer className="h-4 w-32"/>
              <Shimmer className="h-4 w-40"/>
            </div>
          </div>
          <Shimmer className="h-4 w-full"/>
          <Shimmer className="h-4 w-5/6"/>
          <div className="flex gap-2">
            <Shimmer className="h-9 w-28 rounded-lg"/>
            <Shimmer className="h-9 w-28 rounded-lg"/>
            <Shimmer className="h-9 w-28 rounded-lg"/>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <Shimmer className="h-4 w-32"/>
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5].map(i => (
            <Shimmer key={i} className="h-7 w-24 rounded-full"/>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <Shimmer className="h-8 w-64"/>
        <Shimmer className="h-5 w-48"/>
      </div>
      <Shimmer className="h-24 w-full rounded-2xl"/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <StatCardSkeleton key={i}/>)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <Shimmer key={i} className="h-24 rounded-2xl"/>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <CardSkeleton key={i}/>)}
      </div>
    </div>
  )
}

export function ListPageSkeleton({
  type = 'card',
  count = 4
}: {
  type?: 'card' | 'grant' | 'forum' | 'challenge' | 'profile' | 'mentor' | 'post'
  count?: number
}) {
  const skeletons: Record<string, React.FC> = {
    card: CardSkeleton,
    grant: GrantCardSkeleton,
    forum: ForumCardSkeleton,
    challenge: ChallengeCardSkeleton,
    profile: ProfileCardSkeleton,
    mentor: MentorCardSkeleton,
    post: PostCardSkeleton,
  }
  const Skeleton = skeletons[type] || CardSkeleton

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i}/>
      ))}
    </div>
  )
}
