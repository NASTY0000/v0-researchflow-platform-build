'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect } from 'react'

export function CursorGlow() {
  const mouseX = useMotionValue(-400)
  const mouseY = useMotionValue(-400)

  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 })

  useEffect(() => {
    function handleMouse(e: MouseEvent) {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [mouseX, mouseY])

  return (
    <>
      {/* Large outer glow */}
      <motion.div
        className="fixed pointer-events-none z-[9998] hidden md:block"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 65%)',
        }}
      />
      {/* Small inner dot */}
      <motion.div
        className="fixed pointer-events-none z-[9999] hidden md:block"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(124,58,237,0.5)',
          boxShadow: 'var(--brand-glow-sm)',
        }}
      />
    </>
  )
}
