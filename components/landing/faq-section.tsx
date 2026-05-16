'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: 'Who can join ResearchFlow?',
    a: 'ResearchFlow is open to university students, postgraduate researchers, faculty members, and research professionals affiliated with recognized institutions across Africa. Whether you are an undergraduate with a fresh idea or a seasoned professor, there is a place for you here.',
  },
  {
    q: 'Is ResearchFlow free to use?',
    a: 'Yes! The core platform — including idea posting, collaborator matching, project workspaces, and the mentor directory — is completely free. We believe quality research tools should be accessible to every African researcher regardless of their institution\'s budget.',
  },
  {
    q: 'How does the collaborator matching work?',
    a: 'Our matching algorithm compares your research interests, skills, and what you are looking for against all active researchers and ideas on the platform. Each potential match receives a score based on skill overlap, interest alignment, and availability, so you always see the most relevant collaborators first.',
  },
  {
    q: 'Can I join projects from other universities?',
    a: 'Absolutely. Cross-institutional collaboration is one of our core missions. ResearchFlow connects researchers from over 100 African universities, and many of our most successful projects involve teams spanning multiple countries and disciplines.',
  },
  {
    q: 'How do I earn Akili Score points?',
    a: 'Akili Score is our research reputation system. You earn points by completing projects, mentoring peers, contributing to ideas, publishing in the Showcase, completing project roadmap phases, and receiving high ratings. Your score reflects your overall contribution to the African research community.',
  },
  {
    q: 'What happens to my research data?',
    a: 'You retain full ownership of any research, ideas, or materials you upload. ResearchFlow only uses your content to operate the platform. We never sell your data or research to third parties. See our Privacy Policy for complete details.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="label-section mb-3">Got Questions?</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl px-6 overflow-hidden bg-card border border-border"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5 hover:text-violet-500 transition-colors">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed pb-5 text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
