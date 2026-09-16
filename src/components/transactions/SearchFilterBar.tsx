import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransactionType } from '@/types'

export type FilterType = TransactionType | 'all'

interface SearchFilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  filterType: FilterType
  onFilterTypeChange: (f: FilterType) => void
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income',  label: 'Income' },
]

export function SearchFilterBar({
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          role="searchbox"
          aria-label="Search transactions by note or category"
          placeholder="Search by note or category…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] pl-9 pr-8 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Type filter chips */}
      <div role="group" aria-label="Filter by transaction type" className="flex gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterTypeChange(opt.value)}
            aria-pressed={filterType === opt.value}
            className={cn(
              'rounded-full border px-3.5 py-1 text-xs font-medium transition-colors',
              filterType === opt.value
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
