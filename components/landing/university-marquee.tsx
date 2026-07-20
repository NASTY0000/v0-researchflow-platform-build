'use client'

const FALLBACK_UNIVERSITIES = [
  'University of Ibadan',
  'University of Cape Town',
  'Makerere University',
  'University of Nairobi',
  'Ahmadu Bello University',
  'Cairo University',
  'University of Ghana',
  'Obafemi Awolowo University',
  'Addis Ababa University',
  'University of Lagos',
  'KNUST',
  'University of the Witwatersrand',
]

function MarqueeRow({ names, reverse, duration }: { names: string[]; reverse?: boolean; duration: number }) {
  const row = (ariaHidden: boolean) => (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {names.map((name) => (
        <span key={name} className="flex items-center whitespace-nowrap px-7 text-sm font-medium tracking-wide text-[#7E6BA3]">
          <span className="mr-7 inline-block h-1 w-1 rounded-full bg-violet-500/60" />
          {name}
        </span>
      ))}
    </div>
  )

  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div
        className={`flex w-max group-hover:[animation-play-state:paused] motion-reduce:animate-none ${
          reverse ? 'animate-marquee-reverse' : 'animate-marquee'
        }`}
        style={{ animationDuration: `${duration}s` }}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}

export function UniversityMarquee({ universities }: { universities?: string[] }) {
  const names = universities?.length ? universities : FALLBACK_UNIVERSITIES

  const mid = Math.ceil(names.length / 2)
  const rowA = names.slice(0, mid)
  const rowB = names.length > 6 ? names.slice(mid) : rowA

  return (
    <section className="relative border-y border-violet-500/10 bg-[#080214] py-6">
      {/* Sentence-case label — not an uppercase eyebrow */}
      <p className="mb-5 text-center text-xs text-[#6B5694]">
        Trusted by researchers at{' '}
        {universities?.length ? `${universities.length}+ universities` : 'universities across Africa'}
      </p>
      <div className="space-y-4">
        <MarqueeRow names={rowA} duration={Math.max(30, rowA.length * 3)} />
        <MarqueeRow names={rowB} reverse duration={Math.max(34, rowB.length * 3.4)} />
      </div>
    </section>
  )
}
