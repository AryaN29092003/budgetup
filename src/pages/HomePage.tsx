import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight, Plus, TrendingDown, TrendingUp, BarChart2 } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useSettings'
import { useAddTransaction } from '@/contexts/AddTransactionContext'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/currency'
import {
  monthlyIncome,
  monthlyExpenses,
  remainingMoney,
  spendingByCategory,
} from '@/utils/calculations'
import { cn } from '@/lib/utils'
import type { Currency } from '@/types'

// ─── Month navigation helpers ─────────────────────────────────────────────────

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  income,
  spent,
  remaining,
  currency,
}: {
  income: number
  spent: number
  remaining: number
  currency: Currency
}) {
  const isNegative = remaining < 0

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      {/* Remaining — strongest emphasis */}
      <div className="mb-5 text-center">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Remaining this month
        </p>
        <p
          className={cn(
            'text-4xl font-bold tabular-nums sm:text-5xl',
            isNegative
              ? 'text-red-500 dark:text-red-400'
              : 'text-[var(--color-primary)]'
          )}
        >
          {isNegative ? '−' : ''}{formatCurrency(Math.abs(remaining), currency)}
        </p>
        {isNegative && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">Over budget</p>
        )}
      </div>

      {/* Income / Spent row */}
      <div className="grid grid-cols-2 divide-x divide-[var(--color-border)]">
        <div className="flex flex-col items-center gap-1 pr-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <TrendingUp size={12} className="text-emerald-500" />
            Income
          </div>
          <p className="text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(income, currency)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 pl-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <TrendingDown size={12} className="text-red-400" />
            Spent
          </div>
          <p className="text-base font-semibold tabular-nums text-[var(--color-text-primary)]">
            −{formatCurrency(spent, currency)}
          </p>
        </div>
      </div>

      {/* Spent progress bar */}
      {income > 0 && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isNegative ? 'bg-red-500' : 'bg-[var(--color-primary)]'
              )}
              style={{ width: `${Math.min(100, (spent / income) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-[var(--color-text-muted)]">
            {income > 0 ? Math.round((spent / income) * 100) : 0}% of income spent
          </p>
        </div>
      )}
    </div>
  )
}

function CategoryBreakdown({
  transactions,
  categories,
  currency,
}: {
  transactions: ReturnType<typeof useTransactions>['transactions']
  categories: ReturnType<typeof useCategories>['categories']
  currency: Currency
}) {
  const breakdown = useMemo(
    () => spendingByCategory(transactions, categories).slice(0, 6),
    [transactions, categories]
  )

  if (breakdown.length === 0) return null

  const maxAmount = breakdown[0].amount

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
        Spending by category
      </h2>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
        {breakdown.map((item) => {
          const cat = categories.find((c) => c.id === item.categoryId)
          const color = cat?.color ?? '#6B7280'
          return (
            <div key={item.categoryId} className="flex items-center gap-3 px-4 py-3">
              {/* Icon */}
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: color + '22' }}
              >
                <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={15} style={{ color }} />
              </span>

              {/* Name + bar */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-[var(--color-text-primary)]">{item.categoryName}</span>
                  <span className="text-sm font-medium tabular-nums text-[var(--color-text-primary)]">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.amount / maxAmount) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>

              {/* Percentage */}
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                {item.percentage}%
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RecentTransactions({
  transactions,
  categories,
  currency,
}: {
  transactions: ReturnType<typeof useTransactions>['transactions']
  categories: ReturnType<typeof useCategories>['categories']
  currency: Currency
}) {
  const recent = transactions.slice(0, 5)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Recent transactions
        </h2>
        <Link
          to="/transactions"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline active:opacity-70"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
        {recent.map((t) => {
          const cat = categories.find((c) => c.id === t.categoryId)
          const color = cat?.color ?? '#6B7280'
          const isIncome = t.type === 'income'
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: color + '22' }}
              >
                <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={15} style={{ color }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--color-text-primary)]">
                  {t.note || cat?.name || 'Unknown'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short',
                  })}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 text-sm font-semibold tabular-nums',
                  isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--color-text-primary)]'
                )}
              >
                {isIncome ? '+' : '−'}{formatCurrency(t.amount, currency)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function EmptyDashboard({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-3xl">
        💸
      </div>
      <div>
        <p className="font-semibold text-[var(--color-text-primary)]">No transactions yet</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Add your first transaction to see your monthly summary
        </p>
      </div>
      <Button onClick={onAdd} className="gap-2">
        <Plus size={15} />
        Add transaction
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HomePage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const prefix = monthPrefix(year, month)

  // Load only this month's transactions
  const filters = useMemo(() => ({ dateFrom: `${prefix}-01`, dateTo: `${prefix}-31` }), [prefix])
  const { transactions, loading } = useTransactions(filters)
  const { categories } = useCategories()
  const { settings } = useSettings()
  const { open: openAdd } = useAddTransaction()

  const currency = settings.currency
  const income    = useMemo(() => monthlyIncome(transactions),    [transactions])
  const spent     = useMemo(() => monthlyExpenses(transactions),  [transactions])
  const remaining = useMemo(() => remainingMoney(transactions),   [transactions])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (isCurrentMonth) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{greeting()}</p>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Dashboard</h1>
        </div>
        <Link
          to="/insights"
          className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
          aria-label="View insights"
        >
          <BarChart2 size={14} aria-hidden="true" />
          Insights
        </Link>
      </header>

      {/* Month switcher */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {monthLabel(year, month)}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyDashboard onAdd={() => openAdd('expense')} />
      ) : (
        <>
          <SummaryCard income={income} spent={spent} remaining={remaining} currency={currency} />
          <CategoryBreakdown transactions={transactions} categories={categories} currency={currency} />
          <RecentTransactions transactions={transactions} categories={categories} currency={currency} />
        </>
      )}
    </div>
  )
}
