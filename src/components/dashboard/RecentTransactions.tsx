import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency } from '@/utils/currency'
import type { Transaction, Category, Currency } from '@/types'

interface RecentTransactionsProps {
  transactions: Transaction[]
  categories: Category[]
  currency: Currency
  limit?: number
}

export function RecentTransactions({
  transactions,
  categories,
  currency,
  limit = 5,
}: RecentTransactionsProps) {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const visible = transactions.slice(0, limit)

  return (
    <div className="flex flex-col gap-1">
      {visible.map((t) => {
        const cat = catMap.get(t.categoryId)
        const color = cat?.color ?? '#6B7280'
        const isIncome = t.type === 'income'

        return (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5"
          >
            {/* Icon */}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: color + '22' }}
            >
              <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={15} style={{ color }} />
            </span>

            {/* Label */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--color-text-primary)]">
                {t.note || cat?.name || 'Unknown'}
              </p>
              {t.note && (
                <p className="text-xs text-[var(--color-text-muted)]">{cat?.name}</p>
              )}
            </div>

            {/* Amount */}
            <span
              className={cn(
                'shrink-0 text-sm font-semibold tabular-nums',
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-[var(--color-text-primary)]'
              )}
            >
              {isIncome ? '+' : '−'}{formatCurrency(t.amount, currency)}
            </span>
          </div>
        )
      })}

      {/* Link to full history */}
      <Link
        to="/transactions"
        className="mt-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface-muted)] transition-colors"
      >
        View all transactions
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
