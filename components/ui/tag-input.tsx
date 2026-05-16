'use client'

import { useState, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from './input'
import { Badge } from './badge'

interface TagInputProps {
  options: string[]
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxItems?: number
  label?: string
}

export function TagInput({
  options,
  value,
  onChange,
  placeholder = 'Search or type...',
  maxItems,
}: TagInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.length > 0
    ? options
        .filter(o =>
          o.toLowerCase().includes(query.toLowerCase()) &&
          !value.includes(o)
        )
        .slice(0, 8)
    : options
        .filter(o => !value.includes(o))
        .slice(0, 8)

  const canAdd = maxItems ? value.length < maxItems : true

  function addTag(tag: string) {
    if (!value.includes(tag) && canAdd) {
      onChange([...value, tag])
    }
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  const showCustomAdd =
    query.trim().length > 0 &&
    !options.some(o => o.toLowerCase() === query.trim().toLowerCase()) &&
    !value.includes(query.trim()) &&
    canAdd

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Input with dropdown */}
      {canAdd && (
        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => setOpen(false), 150)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim()) {
                e.preventDefault()
                if (filtered.length > 0) {
                  addTag(filtered[0])
                } else if (showCustomAdd) {
                  addTag(query.trim())
                }
              }
              if (e.key === 'Backspace' && !query && value.length > 0) {
                removeTag(value[value.length - 1])
              }
            }}
            placeholder={
              maxItems && value.length >= maxItems
                ? `Maximum ${maxItems} items selected`
                : placeholder
            }
            disabled={!!(maxItems && value.length >= maxItems)}
          />

          {open && (filtered.length > 0 || showCustomAdd) && (
            <div className="absolute z-50 w-full mt-1 rounded-xl border bg-popover shadow-lg overflow-hidden">
              {filtered.map(option => (
                <button
                  key={option}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onMouseDown={e => {
                    e.preventDefault()
                    addTag(option)
                  }}
                >
                  {option}
                </button>
              ))}
              {showCustomAdd && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2 text-primary border-t border-border"
                  onMouseDown={e => {
                    e.preventDefault()
                    addTag(query.trim())
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add &quot;{query.trim()}&quot;
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {maxItems && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxItems} selected
        </p>
      )}
    </div>
  )
}
