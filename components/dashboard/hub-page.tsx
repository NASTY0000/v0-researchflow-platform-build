import Link from 'next/link'

export interface HubCard {
  title: string
  description: string
  href: string
  icon: React.ElementType
  image: string
}

export function HubPageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold font-heading">{title}</h1>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

export function HubCardGrid({ cards }: { cards: HubCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link key={card.href + card.title} href={card.href}>
            <div className="rounded-xl border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group h-full">
              <div className="relative h-36 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                <div className="absolute bottom-3 left-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
