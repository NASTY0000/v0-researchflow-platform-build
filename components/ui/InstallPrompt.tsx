'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('pwa-dismissed')
      if (!dismissed) setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setShow(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl p-4 flex items-center gap-3 shadow-2xl"
      style={{
        background: 'rgba(18,8,31,0.95)',
        border: '1px solid rgba(139,92,246,0.3)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(124,58,237,0.2)' }}
      >
        <Download className="w-5 h-5" style={{ color: '#A855F7' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Add ResearchFlow to your home screen</p>
        <p className="text-xs mt-0.5 text-muted-foreground">
          Access it like a native app
        </p>
      </div>
      <Button
        size="sm"
        onClick={handleInstall}
        style={{
          background: 'var(--cta-bg)',
          border: 'none',
          flexShrink: 0,
        }}
      >
        Install
      </Button>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg"
        className="text-muted-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
