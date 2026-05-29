'use client'

import { motion } from 'framer-motion'

export function HoverCardLift({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
