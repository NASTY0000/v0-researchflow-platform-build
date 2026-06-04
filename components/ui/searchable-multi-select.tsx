'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X, Search, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SearchableMultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  maxSelections?: number
  allowCustom?: boolean
  className?: string
}

export function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  maxSelections,
  allowCustom = false,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = options.filter(
    (opt) =>
      opt.toLowerCase().includes(search.toLowerCase()) && !value.includes(opt)
  )

  const canAddMore = maxSelections === undefined || value.length < maxSelections

  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt))
    } else if (canAddMore) {
      onChange([...value, opt])
    }
  }

  function addCustom() {
    const trimmed = search.trim()
    if (!trimmed || value.includes(trimmed)) return
    if (!canAddMore) return
    onChange([...value, trimmed])
    setSearch('')
  }

  const showCustomOption =
    allowCustom &&
    search.trim().length > 0 &&
    !options.includes(search.trim()) &&
    !value.includes(search.trim()) &&
    canAddMore

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          minHeight: '42px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '8px',
          padding: '8px 36px 8px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
          position: 'relative',
          color: '#F3F0FF',
        }}
      >
        {value.length === 0 ? (
          <span style={{ color: 'rgba(139,92,246,0.5)', fontSize: '14px' }}>{placeholder}</span>
        ) : (
          value.map((v) => (
            <Badge
              key={v}
              style={{
                background: 'rgba(124,58,237,0.3)',
                border: '1px solid rgba(168,85,247,0.5)',
                color: '#E2D9F3',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                paddingRight: '4px',
                fontSize: '12px',
              }}
              onClick={(e) => {
                e.stopPropagation()
                toggle(v)
              }}
            >
              {v}
              <X className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" />
            </Badge>
          ))
        )}
        <ChevronDown
          className="w-4 h-4 absolute"
          style={{
            right: '10px',
            top: '50%',
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: 'transform 0.2s',
            color: 'rgba(139,92,246,0.6)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: '#0F0520',
            border: '1px solid rgba(139,92,246,0.35)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            maxHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderBottom: '1px solid rgba(139,92,246,0.18)',
            }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(139,92,246,0.5)' }} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (showCustomOption) addCustom()
                  else if (filtered.length > 0) toggle(filtered[0])
                }
                if (e.key === 'Escape') { setOpen(false); setSearch('') }
              }}
              placeholder={searchPlaceholder}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#F3F0FF',
                fontSize: '14px',
                width: '100%',
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
            {maxSelections && value.length >= maxSelections && (
              <p
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  color: 'rgba(168,85,247,0.7)',
                  borderBottom: '1px solid rgba(139,92,246,0.12)',
                }}
              >
                Max {maxSelections} selections reached
              </p>
            )}

            {/* Custom add option */}
            {showCustomOption && (
              <button
                type="button"
                onClick={addCustom}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(124,58,237,0.12)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#C4B5FD',
                  fontSize: '14px',
                  borderBottom: '1px solid rgba(139,92,246,0.12)',
                  textAlign: 'left',
                }}
              >
                <Plus className="w-4 h-4" />
                Add &ldquo;{search.trim()}&rdquo;
              </button>
            )}

            {filtered.length === 0 && !showCustomOption ? (
              <p
                style={{
                  padding: '12px 14px',
                  fontSize: '14px',
                  color: 'rgba(139,92,246,0.4)',
                  textAlign: 'center',
                }}
              >
                No options found
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  disabled={!canAddMore}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: canAddMore ? 'pointer' : 'not-allowed',
                    color: canAddMore ? '#D4C8F0' : 'rgba(139,92,246,0.35)',
                    fontSize: '14px',
                    textAlign: 'left',
                    opacity: canAddMore ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (canAddMore) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <span>{opt}</span>
                  {value.includes(opt) && <Check className="w-4 h-4" style={{ color: '#A855F7' }} />}
                </button>
              ))
            )}

            {/* Already selected items shown with checkmarks */}
            {value.length > 0 && search === '' && (
              <>
                <div
                  style={{
                    padding: '6px 14px 4px',
                    fontSize: '11px',
                    color: 'rgba(139,92,246,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderTop: filtered.length > 0 ? '1px solid rgba(139,92,246,0.12)' : undefined,
                  }}
                >
                  Selected
                </div>
                {value.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(124,58,237,0.08)',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#C4B5FD',
                      fontSize: '14px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.18)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.08)'
                    }}
                  >
                    <span>{opt}</span>
                    <Check className="w-4 h-4" style={{ color: '#A855F7' }} />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
