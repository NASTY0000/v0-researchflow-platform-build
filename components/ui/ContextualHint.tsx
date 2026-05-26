'use client'

import { useState, useEffect } from 'react'

interface ContextualHintProps {
  hintKey: string
  title: string
  description: string
  icon?: string
}

export function ContextualHint({
  hintKey, title, description, icon = '💡'
}: ContextualHintProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(`rf_${hintKey}`)
    if (!dismissed) setVisible(true)
  }, [hintKey])

  const dismiss = () => {
    localStorage.setItem(`rf_${hintKey}`, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative mb-5 p-4 rounded-xl bg-purple-500/8 border border-purple-500/20 flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/90 mb-0.5">{title}</p>
        <p className="text-xs text-purple-300/55 leading-relaxed">{description}</p>
      </div>

      <button
        onClick={dismiss}
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-purple-400/40 hover:text-purple-400 hover:bg-purple-500/15 transition-all text-xs font-bold mt-0.5"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
