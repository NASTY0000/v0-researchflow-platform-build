'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Reveal } from './reveal'

const faqs = [
  {
    q: 'Who can join ResearchFlow?',
    a: 'ResearchFlow is open to university students, postgraduate researchers, faculty members, and research professionals affiliated with recognized institutions across Africa. Whether you are an undergraduate with a fresh idea or a seasoned professor, there is a place for you here.',
  },
  {
    q: 'Is ResearchFlow free to use?',
    a: 'Yes! The core platform, including idea posting, collaborator matching, project workspaces, and the mentor directory, is completely free. We believe quality research tools should be accessible to every African researcher regardless of their institution\'s budget.',
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
    <section id="faq" className="relative scroll-mt-16 overflow-hidden bg-[#070213] px-4 py-28">
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-violet-700/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* No "Got Questions?" eyebrow, heading carries its own weight */}
        <Reveal className="mb-12 text-center">
          <h2
            data-reveal
            className="font-heading font-extrabold text-white"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
          >
            Frequently Asked{' '}
            <span className="text-[#C084FC]">Questions</span>
          </h2>
        </Reveal>

        <Reveal stagger={0.06}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <div data-reveal key={i}>
                <AccordionItem
                  value={`item-${i}`}
                  className="overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.025] px-6 backdrop-blur-sm transition-colors duration-300 data-[state=open]:border-violet-400/40 data-[state=open]:bg-white/[0.04]"
                >
                  <AccordionTrigger className="py-5 text-left font-semibold text-white transition-colors hover:text-violet-300 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-[#9D8BB8]">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
