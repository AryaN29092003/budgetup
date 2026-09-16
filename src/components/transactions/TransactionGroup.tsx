import { formatCurrency } from '@/utils/currency'
import { TransactionItem } from './TransactionItem'
import type { Transaction, Category, Currency } from '@/types'

interface TransactionGroupProps {
  label: string          // "Today", "Yesterday", "Mon 12 Aug"
  transactions: Transaction[]
  categories: Category[]
  currency: Currency
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
}

export function TransactionGroup({
  label,
  transactions,
  categories,
  currency,
  onEdit,
  onDelete,
}: TransactionGroupProps) {
  const catById = new Map(categories.map((c) => [c.id, c]))

  // Net for the day — used as a subtle summary
  const net = transactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount
  }, 0)

  return (
    <section>
      {/* Date header */}
      <div className="flex items-center justify-between px-3 pb-2 pt-5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        <span
          className={
            net >= 0
              ? 'text-xs font-medium text-emerald-600 dark:text-emerald-400'
              : 'text-xs font-medium text-[var(--color-text-muted)]'
          }
        >
          {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net), currency)}
        </span>
      </div>

      <div className="flex flex-col">
        {transactions.map((t) => (
          <TransactionItem
            key={t.id}
            transaction={t}
            category={catById.get(t.categoryId)}
            currency={currency}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  )
}
