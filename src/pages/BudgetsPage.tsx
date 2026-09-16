import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency } from '@/utils/currency'
import { BUDGET_STATUS_LABEL } from '@/utils/calculations'
import { cn } from '@/lib/utils'
import type { Budget, Category } from '@/types'
import type { BudgetStatus } from '@/utils/calculations'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function prevMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, '0')}`
}

function nextMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, '0')}`
}

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<BudgetStatus, { bar: string; text: string; badge: string }> = {
  'healthy':        { bar: 'bg-[var(--color-primary)]',         text: 'text-[var(--color-primary)]',         badge: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
  'getting-close':  { bar: 'bg-amber-400',                      text: 'text-amber-600 dark:text-amber-400',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'almost-reached': { bar: 'bg-orange-500',                     text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  'over-budget':    { bar: 'bg-red-500',                        text: 'text-red-600 dark:text-red-400',      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

// ─── Budget form dialog ───────────────────────────────────────────────────────

interface BudgetFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (categoryId: string, amount: number) => Promise<void>
  categories: Category[]
  existingCategoryIds: string[]   // to disable already-budgeted cats when creating
  initial?: Budget                // edit mode
  currency: string
}

function BudgetFormDialog({
  open, onClose, onSave, categories, existingCategoryIds, initial, currency,
}: BudgetFormDialogProps) {
  const expenseCategories = categories.filter(c => c.type === 'expense')
  const isEditing = !!initial

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [amount, setAmount]         = useState(initial ? String(initial.amount) : '')
  const [errors, setErrors]         = useState<{ categoryId?: string; amount?: string }>({})
  const [saving, setSaving]         = useState(false)

  // Reset on open
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setCategoryId(initial?.categoryId ?? '')
      setAmount(initial ? String(initial.amount) : '')
      setErrors({})
    } else {
      onClose()
    }
  }

  const handleSave = async () => {
    const errs: typeof errors = {}
    if (!categoryId)                          errs.categoryId = 'Select a category'
    const parsed = parseFloat(amount)
    if (!amount.trim())                        errs.amount = 'Amount is required'
    else if (isNaN(parsed) || parsed <= 0)    errs.amount = 'Enter a positive amount'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      await onSave(categoryId, parsed)
      onClose()
    } catch (e) {
      setErrors({ amount: e instanceof Error ? e.message : 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const availableCategories = isEditing
    ? expenseCategories
    : expenseCategories.filter(c => !existingCategoryIds.includes(c.id) || c.id === categoryId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent title={isEditing ? 'Edit budget' : 'Set budget'}>
        <div className="flex flex-col gap-4">
          {/* Category selector — grid on create, locked on edit */}
          {isEditing ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Category</span>
              {(() => {
                const cat = categories.find(c => c.id === initial?.categoryId)
                return (
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5">
                    <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={16} style={{ color: cat?.color }} />
                    <span className="text-sm text-[var(--color-text-primary)]">{cat?.name}</span>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Category</span>
              <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto">
                {availableCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setCategoryId(cat.id); setErrors(e => ({ ...e, categoryId: undefined })) }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all',
                      categoryId === cat.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-muted)]'
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: (cat.color ?? '#6B7280') + '22' }}>
                      <CategoryIcon name={cat.icon} size={15} style={{ color: cat.color }} />
                    </span>
                    <span className="text-[10px] leading-tight text-[var(--color-text-secondary)]">{cat.name}</span>
                  </button>
                ))}
              </div>
              {errors.categoryId && <p className="text-xs text-[var(--color-destructive)]">{errors.categoryId}</p>}
            </div>
          )}

          {/* Amount */}
          <Input
            label={`Monthly budget (${currency})`}
            type="text"
            inputMode="decimal"
            placeholder="e.g. 5000"
            value={amount}
            onChange={e => {
              setAmount(e.target.value.replace(/[^0-9.]/g, ''))
              setErrors(v => ({ ...v, amount: undefined }))
            }}
            error={errors.amount}
          />

          <div className="flex gap-2 pt-1">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DialogClose>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Set budget'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Category budget card ─────────────────────────────────────────────────────

interface BudgetCardProps {
  row: ReturnType<typeof useBudgets>['summary'] extends infer S
    ? S extends { categories: Array<infer R> } ? R : never
    : never
  category: Category | undefined
  currency: ReturnType<typeof useSettings>['settings']['currency']
  onEdit: (b: Budget) => void
  onDelete: (b: Budget) => void
}

function BudgetCard({ row, category, currency, onEdit, onDelete }: BudgetCardProps) {
  const styles    = STATUS_STYLES[row.status]
  const isOver    = row.status === 'over-budget'
  const color     = category?.color ?? '#6B7280'

  return (
    <div className={cn(
      'rounded-2xl border bg-[var(--color-surface)] p-4',
      isOver ? 'border-red-300 dark:border-red-800' : 'border-[var(--color-border)]'
    )}>
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color + '22' }}>
            <CategoryIcon name={category?.icon ?? 'MoreHorizontal'} size={16} style={{ color }} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{category?.name ?? 'Unknown'}</p>
            <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', styles.badge)}>
              {isOver && <AlertTriangle size={9} className="mr-0.5 inline" />}
              {BUDGET_STATUS_LABEL[row.status]}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            onClick={() => onEdit(row.budget)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
            aria-label="Edit budget"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(row.budget)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            aria-label="Delete budget"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <Progress
          value={Math.min(100, row.usagePercent)}
          indicatorClassName={styles.bar}
          label={`${category?.name ?? 'Category'}: ${row.usagePercent}% of budget used — ${BUDGET_STATUS_LABEL[row.status]}`}
        />
      </div>

      {/* Amounts row */}
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Budget</p>
          <p className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
            {formatCurrency(row.budget.amount, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Spent</p>
          <p className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
            {formatCurrency(row.spent, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Remaining</p>
          <p className={cn('text-xs font-semibold tabular-nums', isOver ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400')}>
            {isOver ? '−' : ''}{formatCurrency(Math.abs(row.remaining), currency)}
          </p>
        </div>
      </div>

      {/* Usage % */}
      <p className={cn('mt-1.5 text-right text-[10px] font-medium', styles.text)}>
        {row.usagePercent}% used
      </p>
    </div>
  )
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ summary, currency }: {
  summary: NonNullable<ReturnType<typeof useBudgets>['summary']>
  currency: ReturnType<typeof useSettings>['settings']['currency']
}) {
  const isOver = summary.totalSpent > summary.totalBudgeted
  const styles = STATUS_STYLES[summary.status]

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Monthly overview</p>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', styles.badge)}>
          {BUDGET_STATUS_LABEL[summary.status]}
        </span>
      </div>

      <Progress value={Math.min(100, summary.percentUsed)} indicatorClassName={styles.bar} className="mb-3 h-2.5"
        label={`Overall: ${summary.percentUsed}% of total budget used — ${BUDGET_STATUS_LABEL[summary.status]}`}
      />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Budgeted</p>
          <p className="text-sm font-bold tabular-nums text-[var(--color-text-primary)]">
            {formatCurrency(summary.totalBudgeted, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Spent</p>
          <p className="text-sm font-bold tabular-nums text-[var(--color-text-primary)]">
            {formatCurrency(summary.totalSpent, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Remaining</p>
          <p className={cn('text-sm font-bold tabular-nums', isOver ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400')}>
            {isOver ? '−' : ''}{formatCurrency(Math.abs(summary.totalRemaining), currency)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth)
  const isCurrent = month === currentMonth()

  const { summary, budgets, loading, upsert, remove } = useBudgets(month)
  const { categories } = useCategories()
  const { settings } = useSettings()
  const toast = useToast()

  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<Budget | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)

  const existingCategoryIds = budgets.map(b => b.categoryId)

  const handleSave = useCallback(async (categoryId: string, amount: number) => {
    await upsert(categoryId, amount)
    toast.success(editTarget ? 'Budget updated' : 'Budget set')
  }, [upsert, editTarget, toast])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
    toast.success('Budget removed')
  }, [deleteTarget, remove, toast])

  const catById = new Map(categories.map(c => [c.id, c]))

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Budgets</h1>
        {!loading && (
          <Button size="sm" onClick={() => { setEditTarget(undefined); setFormOpen(true) }} className="gap-1.5">
            <Plus size={14} strokeWidth={2.5} />
            Set budget
          </Button>
        )}
      </header>

      {/* Month switcher */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth(prevMonth)}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{monthLabel(month)}</span>
        <button
          onClick={() => setMonth(nextMonth)}
          disabled={isCurrent}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        </div>
      ) : summary && summary.categories.length > 0 ? (
        <>
          <SummaryStrip summary={summary} currency={settings.currency} />
          <div className="flex flex-col gap-3">
            {summary.categories.map(row => (
              <BudgetCard
                key={row.budget.id}
                row={row}
                category={catById.get(row.budget.categoryId)}
                currency={settings.currency}
                onEdit={b => { setEditTarget(b); setFormOpen(true) }}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-2xl">🎯</div>
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">No budgets yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Set a monthly spending limit for each category to stay on track
            </p>
          </div>
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true) }} className="gap-2">
            <Plus size={15} />
            Set your first budget
          </Button>
        </div>
      )}

      {/* Create / edit dialog */}
      <BudgetFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined) }}
        onSave={handleSave}
        categories={categories}
        existingCategoryIds={existingCategoryIds}
        initial={editTarget}
        currency={settings.currency}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent
          title="Remove budget?"
          description={`Remove the budget for "${catById.get(deleteTarget?.categoryId ?? '')?.name}"? Your transactions won't be affected.`}
        >
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteConfirm}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
