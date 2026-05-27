'use client'

import { useEffect, useRef, useState } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const threshold = 72

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return
      const distance = e.touches[0].clientY - startY.current
      if (distance > 0) {
        setIsPulling(true)
        setPullDistance(Math.min(distance * 0.5, threshold + 20))
      }
    }

    const onTouchEnd = async () => {
      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        setPullDistance(threshold)
        await onRefresh()
        setIsRefreshing(false)
      }
      setIsPulling(false)
      setPullDistance(0)
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [isRefreshing, pullDistance, onRefresh])

  return { isPulling, pullDistance, isRefreshing, threshold }
}
