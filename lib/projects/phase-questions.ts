export interface PhaseQuestion {
  id: string
  question: string
  placeholder: string
}

export const PHASE_QUESTIONS: Record<number, PhaseQuestion[]> = {
  1: [
    {
      id: "problem",
      question: "What specific research problem did you settle on?",
      placeholder: "Describe the exact problem or question your research addresses...",
    },
    {
      id: "gap",
      question: "What gap in existing knowledge does it address?",
      placeholder: "What's missing from current literature or understanding...",
    },
  ],
  2: [
    {
      id: "sources",
      question: "What key sources or works did you review?",
      placeholder: "List the most important papers, books, or resources you reviewed...",
    },
    {
      id: "findings",
      question: "What key themes or insights emerged from your review?",
      placeholder: "Summarise the main patterns, contradictions, or consensus areas you found...",
    },
  ],
  3: [
    {
      id: "approach",
      question: "What research approach or method did you choose?",
      placeholder: "Quantitative, qualitative, mixed methods, case study, survey, experiment...",
    },
    {
      id: "rationale",
      question: "Why is this methodology appropriate for your research question?",
      placeholder: "Explain why this approach best answers your specific research question...",
    },
  ],
  4: [
    {
      id: "data",
      question: "What data did you collect and how?",
      placeholder: "Describe the type of data, collection method, and sample size or scope...",
    },
    {
      id: "challenges",
      question: "What challenges did you encounter and how did you address them?",
      placeholder: "Data quality issues, access difficulties, unexpected findings...",
    },
  ],
  5: [
    {
      id: "findings",
      question: "What are the main findings from your analysis?",
      placeholder: "Summarise the key results, patterns, or conclusions from your data...",
    },
    {
      id: "significance",
      question: "What do these findings mean for your research question?",
      placeholder: "How do your findings answer (or complicate) the question you started with...",
    },
  ],
  6: [
    {
      id: "output",
      question: "What written output did you produce?",
      placeholder: "Paper, report, thesis chapter, article. Include the title if you have one...",
    },
    {
      id: "review",
      question: "Who reviewed it and what feedback did you incorporate?",
      placeholder: "Peer review, supervisor feedback, co-author revisions...",
    },
  ],
  7: [
    {
      id: "submission",
      question: "Where did you submit, publish, or present your research?",
      placeholder: "Platform, journal, conference, or event name...",
    },
    {
      id: "status",
      question: "What is the current status of your submission?",
      placeholder: "Submitted, under review, accepted, published, presented...",
    },
  ],
}
