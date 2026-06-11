import Link from 'next/link'

export interface HubCard {
  title: string
  description: string
  href: string
  icon: React.ElementType
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
            <div className="group rounded-xl border bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
