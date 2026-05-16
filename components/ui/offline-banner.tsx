'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }
    const handleOnline = () => {
      setIsOnline(true)
      setTimeout(() => setWasOffline(false), 3000)
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (isOnline && wasOffline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all"
        style={{ background: 'rgba(34,197,94,0.92)', color: 'white', backdropFilter: 'blur(8px)' }}
      >
        <CheckCircle2 className="h-4 w-4" />
        Back online — you are reconnected
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 text-sm font-medium"
        style={{ background: 'rgba(239,68,68,0.92)', color: 'white', backdropFilter: 'blur(8px)' }}
      >
        <WifiOff className="h-4 w-4" />
        You are offline — showing cached content
      </div>
    )
  }

  return null
}
