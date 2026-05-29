'use client'

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useState } from 'react'

/* ── Magnetic Button ── */
export function MagneticButton({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  function handleMouse(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Ripple Effect ── */
export function RippleEffect({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  function addRipple(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
    onClick?.()
  }

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={addRipple}>
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{ left: ripple.x, top: ripple.y, transform: 'translate(-50%, -50%)' }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

/* ── Tilt Card ── */
export function TiltCard({
  children,
  className = '',
  intensity = 8,
}: {
  children: React.ReactNode
  className?: string
  intensity?: number
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [intensity, -intensity])
  const rotateY = useTransform(x, [-100, 100], [-intensity, intensity])

  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 30 })

  function handleMouse(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Pulse on Hover ── */
export function PulseOnHover({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ scale: [1, 1.02, 1.01], transition: { duration: 0.3, times: [0, 0.6, 1] } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Number Ticker ── */
export function NumberTicker({
  value,
  className = '',
}: {
  value: number
  className?: string
}) {
  return (
    <motion.span
      key={value}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-block ${className}`}
    >
      {value.toLocaleString()}
    </motion.span>
  )
}
