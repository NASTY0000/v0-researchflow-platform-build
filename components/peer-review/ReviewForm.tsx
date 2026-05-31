'use client'

import { useState } from 'react'
import { submitReview, type ReviewSubmission } from '@/lib/actions/peer-reviews'

interface ReviewCriterion {
  key: keyof Pick<ReviewSubmission,
    'score_methodology' | 'score_clarity' | 'score_originality' |
    'score_feasibility' | 'score_african_context'
  >
  commentKey: keyof Pick<ReviewSubmission,
    'comment_methodology' | 'comment_clarity' | 'comment_originality' |
    'comment_feasibility' | 'comment_african_context'
  >
  label: string
  description: string
  icon: string
}

const CRITERIA: ReviewCriterion[] = [
  {
    key: 'score_methodology',
    commentKey: 'comment_methodology',
    label: 'Research Methodology',
    description: 'Is the proposed approach sound and appropriate for the research question?',
    icon: '🔬',
  },
  {
    key: 'score_clarity',
    commentKey: 'comment_clarity',
    label: 'Clarity & Communication',
    description: 'Is the idea clearly explained and easy to understand?',
    icon: '💬',
  },
  {
    key: 'score_originality',
    commentKey: 'comment_originality',
    label: 'Originality & Innovation',
    description: 'Does this bring a genuinely new perspective or approach?',
    icon: '✨',
  },
  {
    key: 'score_feasibility',
    commentKey: 'comment_feasibility',
    label: 'Practical Feasibility',
    description: 'Can this realistically be executed with available resources?',
    icon: '⚙️',
  },
  {
    key: 'score_african_context',
    commentKey: 'comment_african_context',
    label: 'African Context Relevance',
    description: 'Does this address genuine African research needs or challenges?',
    icon: '🌍',
  },
]

const VERDICTS = [
  {
    value: 'promising',
    label: 'Promising',
    description: 'Strong idea worth pursuing',
    colorClass: 'emerald',
  },
  {
    value: 'needs_work',
    label: 'Needs Work',
    description: 'Good foundation but requires refinement',
    colorClass: 'amber',
  },
  {
    value: 'not_viable',
    label: 'Not Viable',
    description: 'Significant issues need addressing',
    colorClass: 'red',
  },
]

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <svg viewBox="0 0 20 20" width="28" height="28">
            <path
              d="M10 1l2.5 5.5L18 7.5l-4 3.75L15 17l-5-2.75L5 17l1-5.75L2 7.5l5.5-1L10 1z"
              fill={star <= (hovered || value) ? '#FBBF24' : 'rgba(255,255,255,0.08)'}
              stroke={star <= (hovered || value) ? '#F59E0B' : 'rgba(255,255,255,0.12)'}
              strokeWidth="1"
            />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-amber-400/70 ml-1 self-center font-semibold">
          {labels[value]}
        </span>
      )}
    </div>
  )
}

interface ReviewFormProps {
  reviewId: string
  ideaTitle: string
  ideaDescription: string
  deadlineAt: string
  onSuccess: () => void
}

export function ReviewForm({
  reviewId,
  ideaTitle,
  ideaDescription,
  deadlineAt,
  onSuccess,
}: ReviewFormProps) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [verdict, setVerdict] = useState('')
  const [overallComments, setOverallComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const totalSteps = CRITERIA.length + 1
  const hoursLeft = Math.max(
    0,
    Math.round((new Date(deadlineAt).getTime() - Date.now()) / 3600000)
  )

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    const submission: ReviewSubmission = {
      score_methodology: scores['score_methodology'],
      score_clarity: scores['score_clarity'],
      score_originality: scores['score_originality'],
      score_feasibility: scores['score_feasibility'],
      score_african_context: scores['score_african_context'],
      comment_methodology: comments['comment_methodology'] ?? '',
      comment_clarity: comments['comment_clarity'] ?? '',
      comment_originality: comments['comment_originality'] ?? '',
      comment_feasibility: comments['comment_feasibility'] ?? '',
      comment_african_context: comments['comment_african_context'] ?? '',
      overall_verdict: verdict as 'promising' | 'needs_work' | 'not_viable',
      overall_comments: overallComments,
    }

    const result = await submitReview(reviewId, submission)
    setIsSubmitting(false)

    if (result.success) onSuccess()
    else setError(result.error ?? 'Submission failed')
  }

  const currentCriterion = currentStep < CRITERIA.length ? CRITERIA[currentStep] : null
  const canProceed = currentStep < CRITERIA.length
    ? (scores[CRITERIA[currentStep].key] ?? 0) > 0 &&
      (comments[CRITERIA[currentStep].commentKey] ?? '').trim().length >= 20
    : verdict !== '' && overallComments.trim().length >= 20

  return (
    <div className="space-y-5">
      {/* Idea being reviewed */}
      <div className="p-4 rounded-xl bg-white/3 border border-white/8">
        <p className="text-xs font-bold uppercase tracking-wider text-purple-300/50 mb-1.5">
          Reviewing
        </p>
        <p className="text-sm font-semibold text-white mb-1">{ideaTitle}</p>
        <p className="text-xs text-purple-300/50 line-clamp-2 leading-relaxed">
          {ideaDescription}
        </p>
      </div>

      {/* Deadline */}
      <div
        className={`flex items-center gap-2 text-xs font-medium ${
          hoursLeft < 12 ? 'text-red-400' : hoursLeft < 24 ? 'text-amber-400' : 'text-purple-300/50'
        }`}
      >
        <span>⏱</span>
        <span>
          {hoursLeft > 0
            ? `${hoursLeft}h remaining to complete this review`
            : 'Deadline passed'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-purple-300/40">
          <span>
            {currentStep < CRITERIA.length
              ? `Criterion ${currentStep + 1} of ${CRITERIA.length}`
              : 'Final verdict'}
          </span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Criterion step */}
      {currentCriterion ? (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{currentCriterion.icon}</span>
              <h3 className="text-sm font-bold text-white">{currentCriterion.label}</h3>
            </div>
            <p className="text-xs text-purple-300/50 leading-relaxed">
              {currentCriterion.description}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-purple-300/60 mb-2 uppercase tracking-wider">
              Your Score
            </p>
            <StarRating
              value={scores[currentCriterion.key] ?? 0}
              onChange={v => setScores(prev => ({ ...prev, [currentCriterion.key]: v }))}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-purple-300/60 mb-2 uppercase tracking-wider">
              Your Feedback{' '}
              <span className="text-purple-300/30 normal-case font-normal">(min 20 characters)</span>
            </p>
            <textarea
              value={comments[currentCriterion.commentKey] ?? ''}
              onChange={e =>
                setComments(prev => ({ ...prev, [currentCriterion.commentKey]: e.target.value }))
              }
              placeholder="Provide specific, constructive feedback..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10
                text-white placeholder:text-purple-300/25 resize-none
                focus:outline-none focus:border-purple-500/50 transition-colors leading-relaxed"
            />
            <div className="text-right mt-1">
              <span
                className={`text-[10px] ${
                  (comments[currentCriterion.commentKey] ?? '').length >= 20
                    ? 'text-emerald-400/60'
                    : 'text-purple-300/30'
                }`}
              >
                {(comments[currentCriterion.commentKey] ?? '').length} chars
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Final verdict step */
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Overall Verdict</h3>
            <p className="text-xs text-purple-300/50">
              Based on all your scores, what is your overall recommendation?
            </p>
          </div>

          <div className="space-y-2">
            {VERDICTS.map(v => (
              <button
                key={v.value}
                type="button"
                onClick={() => setVerdict(v.value)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all duration-150 ${
                  verdict === v.value
                    ? v.colorClass === 'emerald'
                      ? 'bg-emerald-500/15 border-emerald-500/40'
                      : v.colorClass === 'amber'
                      ? 'bg-amber-500/15 border-amber-500/40'
                      : 'bg-red-500/15 border-red-500/40'
                    : 'bg-white/3 border-white/8 hover:bg-white/5'
                }`}
              >
                <p
                  className={`text-sm font-bold mb-0.5 ${
                    verdict === v.value
                      ? v.colorClass === 'emerald'
                        ? 'text-emerald-400'
                        : v.colorClass === 'amber'
                        ? 'text-amber-400'
                        : 'text-red-400'
                      : 'text-white/80'
                  }`}
                >
                  {v.label}
                </p>
                <p className="text-xs text-purple-300/50">{v.description}</p>
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-purple-300/60 mb-2 uppercase tracking-wider">
              Overall Comments{' '}
              <span className="text-purple-300/30 normal-case font-normal">(min 20 characters)</span>
            </p>
            <textarea
              value={overallComments}
              onChange={e => setOverallComments(e.target.value)}
              placeholder="Summarise your overall assessment and any key recommendations for the researcher..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10
                text-white placeholder:text-purple-300/25 resize-none
                focus:outline-none focus:border-purple-500/50 transition-colors leading-relaxed"
            />
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            className="flex-1 h-11 rounded-xl text-sm font-semibold
              bg-white/5 border border-white/10 text-purple-300/60
              hover:text-purple-300 hover:bg-white/8 transition-all"
          >
            ← Back
          </button>
        )}

        {currentStep < totalSteps - 1 ? (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={!canProceed}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all ${
              canProceed
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-purple-800/40 text-purple-400/50 cursor-not-allowed'
            }`}
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed || isSubmitting}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all ${
              canProceed && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-emerald-900/40 text-emerald-400/50 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '↻ Submitting...' : '✓ Submit Review'}
          </button>
        )}
      </div>

      <p className="text-[10px] text-purple-300/30 text-center">
        Submitting earns you +30 Mentorship Akili points
      </p>
    </div>
  )
}
