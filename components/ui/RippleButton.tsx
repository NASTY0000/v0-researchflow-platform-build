'use client'

import { useRef, MouseEvent, ReactNode } from 'react'

interface RippleButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'primary'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export function RippleButton({
  children,
  onClick,
  className = '',
  variant = 'default',
  type = 'button',
  disabled = false,
}: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const size = Math.max(rect.width, rect.height) * 2.2

    const ripple = document.createElement('span')
    Object.assign(ripple.style, {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      borderRadius: '50%',
      background: variant === 'primary'
        ? 'rgba(255,255,255,0.25)'
        : 'rgba(124,58,237,0.25)',
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

    onClick?.()
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {children}
    </button>
  )
}
