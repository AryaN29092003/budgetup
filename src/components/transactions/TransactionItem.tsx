import { useState } from 'react'
import { Trash2, Pencil, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency } from '@/utils/currency'
import type { Transaction, Category, Currency } from '@/types'

interface TransactionItemProps {
  transaction: Transaction
  category: Category | undefined
  currency: Currency
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
}

export function TransactionItem({
  transaction,
  category,
  currency,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isIncome = transaction.type === 'income'
  const color = category?.color ?? '#6B7280'

  return (
    <div className="relative">
      {/* Main tappable row — tap anywhere to edit (mobile-first) */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${category?.name ?? 'Transaction'}, ${isIncome ? '+' : '−'}${formatCurrency(transaction.amount, currency)}, tap to edit`}
        onClick={() => onEdit(transaction)}
        onKeyDown={(e) => e.key === 'Enter' && onEdit(transaction)}
        className="flex items-center gap-3 px-3 py-3.5 transition-colors active:bg-[var(--color-surface-muted)] cursor-pointer select-none
                   hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:bg-[var(--color-surface-muted)]"
      >
        {/* Category icon */}
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: color + '22' }}
        >
          <CategoryIcon name={category?.icon ?? 'MoreHorizontal'} size={18} style={{ color }} />
        </span>

        {/* Label */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {category?.name ?? 'Unknown'}
          </p>
          {transaction.note
            ? <p className="truncate text-xs text-[var(--color-text-muted)] mt-0.5">{transaction.note}</p>
            : <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {new Date(transaction.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
          }
        </div>

        {/* Amount */}
        <span
          className={cn(
            'shrink-0 text-sm font-semibold tabular-nums mr-1',
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--color-text-primary)]'
          )}
        >
          {isIncome ? '+' : '−'}{formatCurrency(transaction.amount, currency)}
        </span>

        {/* ⋮ menu button — always visible, stops propagation so it doesn't trigger edit */}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
          onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          aria-label="More options"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)]
                     hover:bg-[var(--color-border)] active:bg-[var(--color-border)]"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div role="menu" aria-label="Transaction options" className="absolute right-3 top-12 z-20 min-w-[130px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(transaction) }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] active:bg-[var(--color-surface-muted)]"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit
          </button>
          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(transaction) }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-50"
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
