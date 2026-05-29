'use client'

import { motion } from 'framer-motion'

interface Tab {
  key: string
  label: string
  count?: number
}

interface AnimatedTabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
  className?: string
}

export function AnimatedTabs({ tabs, activeTab, onChange, className = '' }: AnimatedTabsProps) {
  return (
    <div className={`flex gap-1 border-b border-border ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {activeTab === tab.key && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
            />
          )}

          {tab.label}

          {tab.count !== undefined && (
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
