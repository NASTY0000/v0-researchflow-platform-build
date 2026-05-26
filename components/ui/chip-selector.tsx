'use client'

import { useState, useEffect } from 'react'

interface ChipSelectorProps {
  featuredOptions: string[]
  allOptions: string[]
  selected: string[]
  onToggle: (item: string) => void
  maxSelections: number
  onAddCustom?: (item: string) => void
}

export default function ChipSelector({
  featuredOptions,
  allOptions,
  selected,
  onToggle,
  maxSelections,
  onAddCustom,
}: ChipSelectorProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtered, setFiltered] = useState<string[]>([])

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const results = allOptions.filter(
        o => o.toLowerCase().includes(searchTerm.toLowerCase()) && !selected.includes(o)
      )
      setFiltered(results)
    } else {
      setFiltered([])
    }
  }, [searchTerm, allOptions, selected])

  function handleSearchSelect(item: string) {
    onToggle(item)
    setSearchTerm('')
    setShowSearch(false)
  }

  function handleAddCustom() {
    if (!searchTerm.trim()) return
    const custom = searchTerm.trim()
    if (!selected.includes(custom)) onAddCustom?.(custom)
    setSearchTerm('')
    setShowSearch(false)
  }

  const extraSelected = selected.filter(s => !featuredOptions.includes(s))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Selected items not in featured list — shown first so user can deselect */}
        {extraSelected.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground border border-primary"
          >
            ✓ {item}
          </button>
        ))}

        {/* Featured options */}
        {featuredOptions.map(option => {
          const isSelected = selected.includes(option)
          const isDisabled = !isSelected && selected.length >= maxSelections
          return (
            <button
              key={option}
              type="button"
              disabled={isDisabled}
              onClick={() => onToggle(option)}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : isDisabled
                  ? 'bg-muted text-muted-foreground border-border opacity-40 cursor-not-allowed'
                  : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer',
              ].join(' ')}
            >
              {isSelected && <span className="mr-1">✓</span>}
              {option}
            </button>
          )
        })}

        {/* Other — opens search */}
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-primary/40 text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-150"
        >
          + Other
        </button>
      </div>

      {showSearch && (
        <div className="space-y-2">
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (filtered.length > 0) handleSearchSelect(filtered[0])
                  else if (searchTerm.trim()) handleAddCustom()
                }
                if (e.key === 'Escape') { setShowSearch(false); setSearchTerm('') }
              }}
              placeholder="Type to search or add custom..."
              className="w-full px-4 py-2.5 rounded-xl border border-primary/30 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => { setShowSearch(false); setSearchTerm('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg"
            >
              ×
            </button>
          </div>

          {filtered.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              {filtered.slice(0, 8).map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSearchSelect(item)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 hover:text-primary transition-colors border-b border-border/50 last:border-0"
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {searchTerm.trim().length > 1 && filtered.length === 0 && (
            <button
              type="button"
              onClick={handleAddCustom}
              className="w-full px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-sm text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-left"
            >
              + Add &quot;{searchTerm}&quot; as custom
            </button>
          )}
        </div>
      )}
    </div>
  )
}
