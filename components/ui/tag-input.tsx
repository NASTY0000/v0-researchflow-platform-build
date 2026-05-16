'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus, Search } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  placeholder?: string
  maxTags?: number
}

export function TagInput({ value, onChange, suggestions, placeholder = 'Search or add custom...', maxTags = 20 }: TagInputProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = search.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : suggestions

  const canAddCustom = search.trim().length > 0 &&
    !suggestions.some(s => s.toLowerCase() === search.trim().toLowerCase()) &&
    !value.includes(search.trim())

  function toggle(tag: string) {
    if (value.includes(tag)) {
      onChange(value.filter(v => v !== tag))
    } else if (value.length < maxTags) {
      onChange([...value, tag])
    }
  }

  function addCustom() {
    const trimmed = search.trim()
    if (!trimmed || value.includes(trimmed) || value.length >= maxTags) return
    onChange([...value, trimmed])
    setSearch('')
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (canAddCustom) addCustom()
      else if (filtered.length === 1) toggle(filtered[0])
    }
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {search.trim() && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch('')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected count */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">{value.length} selected</p>
      )}

      {/* Tags grid */}
      <div className="max-h-64 overflow-y-auto pr-1 -mr-1">
        <div className="flex flex-wrap gap-2">
          {filtered.map(tag => (
            <Badge
              key={tag}
              className="cursor-pointer transition-all text-sm py-1.5 px-3"
              onClick={() => toggle(tag)}
              style={value.includes(tag)
                ? { background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(168,85,247,0.6)', color: '#C084FC' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#7C6A9C' }
              }
            >
              {tag}
            </Badge>
          ))}

          {/* "Other" — add-custom chip */}
          {canAddCustom && (
            <Badge
              className="cursor-pointer transition-all text-sm py-1.5 px-3 gap-1"
              style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', color: '#06B6D4' }}
              onClick={addCustom}
            >
              <Plus className="w-3 h-3" />
              Add &quot;{search.trim()}&quot;
            </Badge>
          )}

          {filtered.length === 0 && !canAddCustom && (
            <p className="text-sm text-muted-foreground py-2">No results found.</p>
          )}
        </div>
      </div>

      {/* Custom (non-suggestion) selected tags */}
      {value.filter(v => !suggestions.includes(v)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.filter(v => !suggestions.includes(v)).map(tag => (
            <Badge
              key={tag}
              className="gap-1 py-1.5 px-3"
              style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)', color: '#06B6D4' }}
            >
              {tag}
              <button type="button" onClick={() => toggle(tag)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
