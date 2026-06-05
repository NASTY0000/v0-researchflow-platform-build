'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteButtonProps {
  onDelete: () => Promise<void>
  label?: string
  confirmMessage?: string
  variant?: 'icon' | 'button'
}

export function DeleteButton({
  onDelete,
  label = 'Delete',
  variant = 'icon',
}: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 4000)
      return
    }

    setLoading(true)
    try {
      await onDelete()
      toast.success('Deleted successfully')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete. Please try again.')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={`
          flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors
          ${confirming ? 'bg-destructive text-white' : 'text-destructive hover:bg-destructive/10'}
          disabled:opacity-50
        `}
      >
        {loading ? (
          <div className="w-4 h-4 rounded-full animate-spin border-2 border-current border-t-transparent" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        {confirming ? 'Tap again to confirm deletion' : label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-200
        ${confirming
          ? 'bg-destructive text-white animate-pulse'
          : 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 rounded-full animate-spin border-2 border-current border-t-transparent" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      {confirming ? 'Tap again to confirm' : label}
    </button>
  )
}
