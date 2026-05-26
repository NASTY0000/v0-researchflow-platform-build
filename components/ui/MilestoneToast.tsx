'use client'

import { useEffect } from 'react'

interface MilestoneToastProps {
  title: string
  description: string
  icon: string
  onClose: () => void
  duration?: number
}

export function MilestoneToast({
  title, description, icon, onClose, duration = 5000,
}: MilestoneToastProps) {
  useEffect(() => {
    triggerConfetti()
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="relative overflow-hidden rounded-2xl p-5 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg,rgba(30,5,51,0.97),rgba(10,4,30,0.97))',
          border: '1px solid rgba(251,191,36,0.3)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(124,58,237,0.4)',
        }}>
        {/* Shimmer line at top */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.6),transparent)' }} />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(124,58,237,0.2))',
              border: '1px solid rgba(251,191,36,0.25)',
              boxShadow: '0 0 20px rgba(251,191,36,0.25)',
            }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black mb-0.5 tracking-tight" style={{ color: '#FBBF24' }}>
              {title}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'rgba(196,181,253,0.7)' }}>
              {description}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center transition-all text-xs"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)' }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)' }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function triggerConfetti() {
  const colors = ['#FBBF24', '#A855F7', '#7C3AED', '#C4B5FD', '#F59E0B', '#E879F9']

  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div')
    const size = Math.random() * 8 + 4
    const isRect = Math.random() > 0.4

    Object.assign(el.style, {
      position: 'fixed',
      width: `${size}px`,
      height: `${isRect ? size * 0.4 : size}px`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: isRect ? '2px' : '50%',
      left: `${Math.random() * 100}vw`,
      top: '-10px',
      zIndex: '99999',
      pointerEvents: 'none',
      transform: `rotate(${Math.random() * 360}deg)`,
    })

    document.body.appendChild(el)

    const duration = 2000 + Math.random() * 2000
    const delay    = Math.random() * 800
    const xDrift   = (Math.random() - 0.5) * 200

    el.animate(
      [
        { transform: `translateX(0) translateY(0) rotate(0deg)`,              opacity: '1' },
        { transform: `translateX(${xDrift}px) translateY(110vh) rotate(${Math.random() * 720}deg)`, opacity: '0' },
      ],
      { duration, delay, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' }
    ).onfinish = () => el.remove()
  }
}
