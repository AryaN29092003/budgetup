import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency } from '@/utils/currency'
import type { CategorySpending } from '@/utils/calculations'
import type { Category, Currency } from '@/types'

interface CategoryBreakdownProps {
  items: CategorySpending[]
  categories: Category[]
  currency: Currency
  /** max rows to show before truncating */
  limit?: number
}

export function CategoryBreakdown({
  items,
  categories,
  currency,
  limit = 5,
}: CategoryBreakdownProps) {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const visible = items.slice(0, limit)

  if (visible.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {visible.map((item) => {
        const cat = catMap.get(item.categoryId)
        const color = cat?.color ?? '#6B7280'

        return (
          <div key={item.categoryId} className="flex items-center gap-3">
            {/* Icon */}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: color + '22' }}
            >
              <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={15} style={{ color }} />
            </span>

            {/* Name + bar */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm text-[var(--color-text-primary)]">
                  {item.categoryName}
                </span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
                  {formatCurrency(item.amount, currency)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>

            {/* Percentage */}
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
              {item.percentage}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
