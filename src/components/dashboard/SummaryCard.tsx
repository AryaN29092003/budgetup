import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currency'
import type { Currency } from '@/types'

interface SummaryCardProps {
  income: number
  spent: number
  remaining: number
  currency: Currency
}

export function SummaryCard({ income, spent, remaining, currency }: SummaryCardProps) {
  const isNegative = remaining < 0

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      {/* Remaining — strongest emphasis */}
      <div className="mb-5 text-center">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Remaining
        </p>
        <p
          className={cn(
            'text-4xl font-bold tabular-nums tracking-tight',
            isNegative
              ? 'text-[var(--color-destructive)]'
              : 'text-[var(--color-primary)]'
          )}
        >
          {isNegative ? '−' : ''}{formatCurrency(Math.abs(remaining), currency)}
        </p>
        {isNegative && (
          <p className="mt-1 text-xs text-[var(--color-destructive)]">Over budget</p>
        )}
      </div>

      {/* Income / Spent row */}
      <div className="flex divide-x divide-[var(--color-border)]">
        <div className="flex-1 pr-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Income
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(income, currency)}
          </p>
        </div>
        <div className="flex-1 pl-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Spent
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-[var(--color-text-primary)]">
            −{formatCurrency(spent, currency)}
          </p>
        </div>
      </div>
    </div>
  )
}
