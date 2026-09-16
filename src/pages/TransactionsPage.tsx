import { useState, useCallback, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/components/ui/Toast'
import { useAddTransaction } from '@/contexts/AddTransactionContext'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionGroup } from '@/components/transactions/TransactionGroup'
import { SearchFilterBar, type FilterType } from '@/components/transactions/SearchFilterBar'
import { DeleteConfirmDialog } from '@/components/transactions/DeleteConfirmDialog'
import { Button } from '@/components/ui/Button'
import { groupTransactionsByDate } from '@/utils/groupByDate'
import { formatCurrency } from '@/utils/currency'
import type { Transaction, TransactionType } from '@/types'
import type { TransactionFormValues } from '@/components/transactions/TransactionForm'

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£',
}

export function TransactionsPage() {
  const { settings } = useSettings()
  const { categories } = useCategories()
  const { open: openAddSheet } = useAddTransaction()
  const toast = useToast()

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch]         = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')

  const filters = useMemo(() => ({
    type:   filterType === 'all' ? undefined : filterType as TransactionType,
    search: search.trim() || undefined,
  }), [filterType, search])

  const { transactions, loading, update, remove, restore } = useTransactions(filters)

  // ── Edit / delete state ───────────────────────────────────────────────────
  const [editTarget,   setEditTarget]   = useState<Transaction | undefined>()
  const [editOpen,     setEditOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  const handleEdit = useCallback((t: Transaction) => {
    setEditTarget(t)
    setEditOpen(true)
  }, [])

  const handleEditClose = useCallback(() => {
    setEditOpen(false)
    setEditTarget(undefined)
  }, [])

  const handleEditSubmit = useCallback(
    async (values: TransactionFormValues, parsedAmount: number) => {
      if (!editTarget) return
      await update(editTarget.id, {
        type:          values.type,
        amount:        parsedAmount,
        categoryId:    values.categoryId,
        date:          values.date,
        note:          values.note || undefined,
        paymentMethod: values.paymentMethod as Transaction['paymentMethod'] || undefined,
      })
    },
    [editTarget, update]
  )

  const handleDeleteRequest = useCallback((t: Transaction) => setDeleteTarget(t), [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    const snapshot = deleteTarget
    setDeleteTarget(null)
    await remove(snapshot.id)
    toast.success('Transaction deleted', {
      label: 'Undo',
      onClick: async () => {
        await restore(snapshot)
        toast.success('Transaction restored')
      },
    })
  }, [deleteTarget, remove, restore, toast])

  // ── Grouping + summary ────────────────────────────────────────────────────
  const groups = useMemo(() => groupTransactionsByDate(transactions), [transactions])

  const { totalIncome, totalExpense } = useMemo(() => {
    const now = new Date()
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const month  = transactions.filter((t) => t.date.startsWith(prefix))
    return {
      totalIncome:   month.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      totalExpense:  month.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions])

  const currency       = settings.currency
  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? '₹'

  return (
    <div className="flex flex-col">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 pb-3 pt-4 lg:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Transactions</h1>
          <Button size="sm" onClick={() => openAddSheet('expense')} className="gap-1.5">
            <Plus size={15} strokeWidth={2.5} />
            Add
          </Button>
        </div>

        {/* This-month income/expense strip */}
        {!loading && transactions.length > 0 && (
          <div className="mb-3 flex gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Income</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(totalIncome, currency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Expenses</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                −{formatCurrency(totalExpense, currency)}
              </p>
            </div>
          </div>
        )}

        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
        />
      </div>

      {/* ── List ── */}
      <div aria-live="polite" aria-atomic="false" className="flex-1 px-2 pb-4 lg:px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            isFiltered={!!(search || filterType !== 'all')}
            onAdd={() => openAddSheet('expense')}
          />
        ) : (
          groups.map((group) => (
            <TransactionGroup
              key={group.date}
              label={group.label}
              transactions={group.transactions}
              categories={categories}
              currency={currency}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))
        )}
      </div>

      {/* ── Edit sheet (add is handled globally in AppLayout) ── */}
      <TransactionForm
        open={editOpen}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
        initial={editTarget}
        currencySymbol={currencySymbol}
      />

      {/* ── Delete confirmation ── */}
      <DeleteConfirmDialog
        transaction={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ isFiltered, onAdd }: { isFiltered: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-2xl">
        {isFiltered ? '🔍' : '📋'}
      </div>
      <div>
        <p className="font-medium text-[var(--color-text-primary)]">
          {isFiltered ? 'No matching transactions' : 'No transactions yet'}
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {isFiltered
            ? 'Try a different search or filter'
            : 'Start tracking your spending to see where your money goes'}
        </p>
      </div>
      {!isFiltered && (
        <Button onClick={onAdd} className="mt-1 gap-2">
          <Plus size={15} />
          Add transaction
        </Button>
      )}
    </div>
  )
}
