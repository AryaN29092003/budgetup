import { useState, useEffect, useCallback } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { X, TrendingDown, TrendingUp, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useCategories } from '@/hooks/useCategories'
import { todayISO } from '@/utils/date'
import type { Transaction, TransactionType, PaymentMethod } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionFormValues {
  type: TransactionType
  amount: string // string while editing, parsed on submit
  categoryId: string
  date: string
  note: string
  paymentMethod: PaymentMethod | ''
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'upi',           label: 'UPI' },
  { value: 'card',          label: 'Card' },
  { value: 'cash',          label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other',         label: 'Other' },
]

function defaultValues(type: TransactionType = 'expense'): TransactionFormValues {
  return { type, amount: '', categoryId: '', date: todayISO(), note: '', paymentMethod: '' }
}

function toFormValues(t: Transaction): TransactionFormValues {
  return {
    type: t.type,
    amount: String(t.amount),
    categoryId: t.categoryId,
    date: t.date,
    note: t.note ?? '',
    paymentMethod: t.paymentMethod ?? '',
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  amount?: string
  categoryId?: string
  date?: string
}

function validate(values: TransactionFormValues): FormErrors {
  const errors: FormErrors = {}
  const amt = parseFloat(values.amount)
  if (!values.amount.trim())       errors.amount = 'Amount is required'
  else if (isNaN(amt))             errors.amount = 'Enter a valid number'
  else if (amt <= 0)               errors.amount = 'Amount must be greater than zero'
  else if (!isFinite(amt))         errors.amount = 'Enter a valid number'
  if (!values.categoryId)          errors.categoryId = 'Pick a category'
  if (!values.date)                errors.date = 'Date is required'
  return errors
}

// ─── CategoryPicker ───────────────────────────────────────────────────────────

interface CategoryPickerProps {
  type: TransactionType
  value: string
  onChange: (id: string) => void
  error?: string
}

function CategoryPicker({ type, value, onChange, error }: CategoryPickerProps) {
  const { forType } = useCategories()
  const cats = forType(type)
  const errorId = 'category-picker-error'

  return (
    <div className="flex flex-col gap-1.5">
      <span id="category-picker-label" className="text-sm font-medium text-[var(--color-text-secondary)]">Category</span>
      <div
        role="radiogroup"
        aria-labelledby="category-picker-label"
        aria-describedby={error ? errorId : undefined}
        className="grid grid-cols-4 gap-2 sm:grid-cols-5"
      >
        {cats.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={value === cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-all active:scale-95',
              value === cat.id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-[var(--color-primary)]/40'
            )}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: (cat.color ?? '#6B7280') + '22' }}
              aria-hidden="true"
            >
              <CategoryIcon name={cat.icon} size={16} style={{ color: cat.color }} />
            </span>
            <span className="text-[10px] leading-tight text-[var(--color-text-secondary)]">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-destructive)]">{error}</p>
      )}
    </div>
  )
}

// ─── Success flash ────────────────────────────────────────────────────────────

function SuccessFlash({ type, onDone }: { type: TransactionType; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full',
          type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-[var(--color-primary)]/10'
        )}
      >
        <CheckCircle2
          size={36}
          className={type === 'income' ? 'text-emerald-500' : 'text-[var(--color-primary)]'}
          strokeWidth={1.5}
        />
      </div>
      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        {type === 'income' ? 'Income added!' : 'Expense added!'}
      </p>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: TransactionFormValues, parsedAmount: number) => Promise<void>
  initial?: Transaction          // if provided → edit mode
  defaultType?: TransactionType
  currencySymbol?: string        // e.g. '₹', '$' — shown as prefix in amount field
  title?: string
}

export function TransactionForm({
  open,
  onClose,
  onSubmit,
  initial,
  defaultType = 'expense',
  currencySymbol = '₹',
  title,
}: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>(() =>
    initial ? toFormValues(initial) : defaultValues(defaultType)
  )
  const [errors, setErrors]     = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded]   = useState(false)
  const [showMore, setShowMore]     = useState(false)

  // Reset whenever the sheet opens
  useEffect(() => {
    if (open) {
      setValues(initial ? toFormValues(initial) : defaultValues(defaultType))
      setErrors({})
      setSubmitting(false)
      setSucceeded(false)
      setShowMore(!!initial?.note || !!initial?.paymentMethod)
    }
  }, [open, initial, defaultType])

  const set = useCallback(
    <K extends keyof TransactionFormValues>(key: K, val: TransactionFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: val }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    },
    []
  )

  const handleAmountInput = (raw: string) => {
    // Allow digits and a single decimal point only
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d*).*$/, '$1')
    set('amount', cleaned)
  }

  const handleSubmit = async () => {
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      await onSubmit(values, parseFloat(values.amount))
      setSucceeded(true)
      // SuccessFlash calls onClose after 1.2 s via its own timer
    } catch (e) {
      setErrors({ amount: e instanceof Error ? e.message : 'Something went wrong' })
      setSubmitting(false)
    }
  }

  const isEditing  = !!initial
  const formTitle  = title ?? (isEditing ? 'Edit Transaction' : 'Add Transaction')

  return (
    <RadixDialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

        {/* Bottom sheet on mobile, centered modal on desktop */}
        <RadixDialog.Content
          className={cn(
            'fixed z-50 bg-[var(--color-surface)] focus:outline-none',
            'bottom-0 left-0 right-0 rounded-t-2xl border-t border-[var(--color-border)]',
            'lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:right-auto lg:w-full lg:max-w-md',
            'lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border lg:shadow-xl'
          )}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 lg:hidden">
            <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <RadixDialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
              {formTitle}
            </RadixDialog.Title>
            <RadixDialog.Close className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]">
              <X size={18} />
            </RadixDialog.Close>
          </div>

          {/* Body */}
          <div
            className="overflow-y-auto px-5 pb-6 pt-2 scroll-touch"
            style={{ maxHeight: '85dvh' }}
          >
            {/* ── Success flash ── */}
            {succeeded ? (
              <SuccessFlash type={values.type} onDone={onClose} />
            ) : (
              <div className="flex flex-col gap-5">

                {/* Type toggle */}
                <div className="flex gap-2 rounded-xl bg-[var(--color-surface-muted)] p-1">
                  {(['expense', 'income'] as TransactionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { set('type', t); set('categoryId', '') }}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
                        values.type === t
                          ? t === 'expense'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-emerald-500 text-white shadow-sm'
                          : 'text-[var(--color-text-muted)]'
                      )}
                    >
                      {t === 'expense' ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
                      {t === 'expense' ? 'Expense' : 'Income'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="txn-amount" className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-medium text-[var(--color-text-muted)]" aria-hidden="true">
                      {currencySymbol}
                    </span>
                    <input
                      id="txn-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={values.amount}
                      onChange={(e) => handleAmountInput(e.target.value)}
                      autoFocus={!isEditing}
                      aria-label={`Amount in ${currencySymbol}`}
                      aria-invalid={errors.amount ? 'true' : undefined}
                      aria-describedby={errors.amount ? 'txn-amount-error' : undefined}
                      className={cn(
                        'h-16 w-full rounded-xl border bg-[var(--color-surface-muted)] pl-10 pr-4 text-3xl font-semibold',
                        'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                        'focus:outline-none focus:ring-2',
                        errors.amount
                          ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]'
                          : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
                      )}
                    />
                  </div>
                  {errors.amount && (
                    <p id="txn-amount-error" role="alert" className="text-xs text-[var(--color-destructive)]">{errors.amount}</p>
                  )}
                </div>

                {/* Category picker */}
                <CategoryPicker
                  type={values.type}
                  value={values.categoryId}
                  onChange={(id) => set('categoryId', id)}
                  error={errors.categoryId}
                />

                {/* Date */}
                <Input
                  label="Date"
                  type="date"
                  value={values.date}
                  onChange={(e) => set('date', e.target.value)}
                  error={errors.date}
                  max={todayISO()}
                />

                {/* Optional fields — hidden behind disclosure to keep the fast flow short */}
                {!showMore ? (
                  <button
                    type="button"
                    onClick={() => setShowMore(true)}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  >
                    <ChevronRight size={14} />
                    Add note &amp; payment method
                  </button>
                ) : (
                  <>
                    <Input
                      label="Note (optional)"
                      type="text"
                      placeholder="e.g. Lunch with team"
                      value={values.note}
                      onChange={(e) => set('note', e.target.value)}
                    />

                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Payment method (optional)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHODS.map((pm) => (
                          <button
                            key={pm.value}
                            type="button"
                            onClick={() =>
                              set('paymentMethod', values.paymentMethod === pm.value ? '' : pm.value)
                            }
                            className={cn(
                              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                              values.paymentMethod === pm.value
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                            )}
                          >
                            {pm.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Submit */}
                <Button
                  variant="primary"
                  size="lg"
                  className="mt-1 w-full"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? 'Saving…'
                    : isEditing
                      ? 'Save changes'
                      : 'Add transaction'}
                </Button>

              </div>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
