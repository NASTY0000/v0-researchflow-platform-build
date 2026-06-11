'use client'

const UNIVERSITIES = [
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

export function UniversityMarquee() {
  const row = (ariaHidden: boolean) => (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {UNIVERSITIES.map((name) => (
        <span key={name} className="flex items-center whitespace-nowrap px-7 text-sm font-medium tracking-wide text-[#7E6BA3]">
          <span className="mr-7 inline-block h-1 w-1 rounded-full bg-violet-500/60" />
          {name}
        </span>
      ))}
    </div>
  )

  return (
    <section className="relative border-y border-violet-500/10 bg-[#080214] py-6">
      <p className="mb-5 text-center text-[10px] uppercase tracking-[0.35em] text-[#6B5694]">
        Trusted by researchers at
      </p>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  )
}
