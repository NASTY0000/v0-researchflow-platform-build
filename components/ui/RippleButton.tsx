'use client'

import { useRef, MouseEvent, TouchEvent, ReactNode } from 'react'

interface RippleButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'primary'
}

export function RippleButton({ children, onClick, className = '', variant = 'default' }: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  function spawnRipple(x: number, y: number) {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2.2
    const ripple = document.createElement('span')
    Object.assign(ripple.style, {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      left: `${x - rect.left - size / 2}px`,
      top: `${y - rect.top - size / 2}px`,
      borderRadius: '50%',
      background: variant === 'primary' ? 'rgba(255,255,255,0.25)' : 'rgba(124,58,237,0.25)',
      transform: 'scale(0)',
      pointerEvents: 'none',
    })
    button.appendChild(ripple)
    ripple.animate(
      [{ transform: 'scale(0)', opacity: '1' }, { transform: 'scale(1)', opacity: '0' }],
      { duration: 550, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' }
    ).onfinish = () => ripple.remove()
    button.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }],
      { duration: 200, easing: 'ease-out' }
    )
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    spawnRipple(e.clientX, e.clientY)
    onClick?.()
  }

  const handleTouch = (e: TouchEvent<HTMLButtonElement>) => {
    const t = e.touches[0]
    if (t) spawnRipple(t.clientX, t.clientY)
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onTouchStart={handleTouch}
      className={`relative overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {children}
    </button>
  )
}
