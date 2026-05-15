'use client'

import { useState, useEffect } from 'react'
import { X, Wifi, WifiOff } from 'lucide-react'
import { syncPendingActions } from '@/lib/offline/sync'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBackOnline, setShowBackOnline] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)
      setDismissed(false)
      setShowBackOnline(true)

      // Sync any queued actions when connection is restored
      try {
        await syncPendingActions()
      } catch {
        // Ignore sync errors
      }

      const timer = setTimeout(() => setShowBackOnline(false), 4000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setDismissed(false)
      setShowBackOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !showBackOnline) return null

  if (showBackOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-900"
        style={{ background: 'linear-gradient(to right, #bbf7d0, #86efac)', borderBottom: '1px solid #4ade80' }}>
        <Wifi className="w-4 h-4 shrink-0" />
        <span>✓ Back online. Your changes have been synced.</span>
      </div>
    )
  }

  if (dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-amber-900"
      style={{ background: 'linear-gradient(to right, #fef3c7, #fde68a)', borderBottom: '1px solid #f59e0b' }}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span className="truncate">
          📡 You are offline. Showing saved data. Changes will sync when connection is restored.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-0.5 rounded hover:bg-amber-200/60 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
