'use client'

import { useState, useEffect } from 'react'
import { X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Track visit count
    const visits = parseInt(localStorage.getItem('rf_visit_count') || '0') + 1
    localStorage.setItem('rf_visit_count', visits.toString())

    const alreadyDismissed = localStorage.getItem('rf_install_dismissed') === 'true'
    if (alreadyDismissed) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Only show after 3 visits
      if (visits >= 3) {
        setShow(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('rf_install_dismissed', 'true')
    }
    setShow(false)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setShow(false)
    localStorage.setItem('rf_install_dismissed', 'true')
  }

  if (!show || !deferredPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-2xl shadow-2xl border border-violet-500/30 p-4"
      style={{ background: 'rgba(14,4,30,0.95)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Smartphone className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#F3F0FF]">Add to Home Screen</p>
          <p className="text-xs mt-0.5 text-[#7C6A9C]">
            📱 Add ResearchFlow to your home screen for the best experience
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none' }}
              onClick={handleInstall}
            >
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-8 text-xs text-[#7C6A9C] hover:text-[#F3F0FF]"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-[#7C6A9C] hover:text-[#F3F0FF] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
