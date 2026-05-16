'use client'

import { useState, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface TagInputProps {
  options: string[]
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxItems?: number
}

export function TagInput({
  options,
  value,
  onChange,
  placeholder = 'Search or type to add...',
  maxItems,
}: TagInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const available = options.filter(
    o => !value.includes(o)
  )

  const filtered = query.trim().length > 0
    ? available.filter(o =>
        o.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : available.slice(0, 8)

  const atMax = maxItems ? value.length >= maxItems : false

  const showAddCustom =
    query.trim().length > 0 &&
    !value.includes(query.trim()) &&
    !options.some(
      o => o.toLowerCase() === query.trim().toLowerCase()
    ) &&
    !atMax

  function add(tag: string) {
    if (!value.includes(tag) && !atMax) {
      onChange([...value, tag])
    }
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function remove(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1 cursor-default"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="ml-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          disabled={atMax}
          placeholder={
            atMax
              ? `Maximum ${maxItems} selected`
              : placeholder
          }
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (filtered.length > 0) {
                add(filtered[0])
              } else if (showAddCustom) {
                add(query.trim())
              }
            }
            if (
              e.key === 'Backspace' &&
              !query &&
              value.length > 0
            ) {
              remove(value[value.length - 1])
            }
          }}
        />

        {open && (filtered.length > 0 || showAddCustom) && (
          <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-lg overflow-hidden">
            {filtered.map(option => (
              <button
                key={option}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onMouseDown={e => {
                  e.preventDefault()
                  add(option)
                }}
              >
                {option}
              </button>
            ))}
            {showAddCustom && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 text-primary border-t border-border"
                onMouseDown={e => {
                  e.preventDefault()
                  add(query.trim())
                }}
              >
                <Plus className="h-3 w-3" />
                Add &quot;{query.trim()}&quot;
              </button>
            )}
          </div>
        )}
      </div>

      {maxItems && (
        <p className="text-xs text-muted-foreground">
          {value.length} / {maxItems} selected
        </p>
      )}
    </div>
  )
}
