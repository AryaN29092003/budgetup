import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonth } from '@/utils/date'

interface MonthPickerProps {
  month: string          // YYYY-MM
  onChange: (month: string) => void
  maxMonth?: string      // don't allow navigating past this (default: current month)
}

function offsetMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function MonthPicker({ month, onChange, maxMonth }: MonthPickerProps) {
  const limit = maxMonth ?? new Date().toISOString().slice(0, 7)
  const isAtMax = month >= limit

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(offsetMonth(month, -1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
        aria-label="Previous month"
      >
        <ChevronLeft size={17} />
      </button>

      <span className="min-w-[7rem] text-center text-sm font-semibold text-[var(--color-text-primary)]">
        {formatMonth(month)}
      </span>

      <button
        onClick={() => { if (!isAtMax) onChange(offsetMonth(month, 1)) }}
        disabled={isAtMax}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next month"
      >
        <ChevronRight size={17} />
      </button>
    </div>
  )
}
