import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/utils/currency'
import {
  monthlyIncome, monthlyExpenses, savingsRate, spendingByCategory,
} from '@/utils/calculations'
import { cn } from '@/lib/utils'
import type { Currency } from '@/types'

// ─── Month helpers (shared with Dashboard / Budgets) ─────────────────────────

function toPrefix(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function addMonths(year: number, month: number, delta: number): [number, number] {
  const d = new Date(year, month - 1 + delta)
  return [d.getFullYear(), d.getMonth() + 1]
}

// ─── Deterministic observations ───────────────────────────────────────────────

interface Observation {
  text: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

function buildObservations(
  income: number,
  expenses: number,
  prevIncome: number,
  prevExpenses: number,
  topCategory: string | undefined,
  rate: number | null,
): Observation[] {
  const obs: Observation[] = []

  if (income === 0 && expenses === 0) return obs

  // Savings rate
  if (rate !== null) {
    if (rate >= 20) obs.push({ text: `You saved ${rate}% of your income — great discipline.`, sentiment: 'positive' })
    else if (rate > 0) obs.push({ text: `Savings rate is ${rate}% — aim for 20%+ where possible.`, sentiment: 'neutral' })
    else obs.push({ text: 'Expenses exceeded income this month.', sentiment: 'negative' })
  }

  // Expense vs prev month
  if (prevExpenses > 0 && expenses > 0) {
    const pct = Math.round(((expenses - prevExpenses) / prevExpenses) * 100)
    if (pct > 10) obs.push({ text: `Spending is up ${pct}% compared to last month.`, sentiment: 'negative' })
    else if (pct < -10) obs.push({ text: `Spending is down ${Math.abs(pct)}% compared to last month.`, sentiment: 'positive' })
    else obs.push({ text: 'Spending is roughly the same as last month.', sentiment: 'neutral' })
  }

  // Income change
  if (prevIncome > 0 && income > 0) {
    const pct = Math.round(((income - prevIncome) / prevIncome) * 100)
    if (pct > 5) obs.push({ text: `Income increased by ${pct}% from last month.`, sentiment: 'positive' })
    else if (pct < -5) obs.push({ text: `Income decreased by ${Math.abs(pct)}% from last month.`, sentiment: 'negative' })
  }

  // Top category
  if (topCategory) {
    obs.push({ text: `${topCategory} is your largest expense category this month.`, sentiment: 'neutral' })
  }

  return obs
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricRow({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <div className="text-right">
        <span className={cn('text-sm font-semibold tabular-nums',
          positive === true  && 'text-emerald-600 dark:text-emerald-400',
          positive === false && 'text-red-500 dark:text-red-400',
          positive === undefined && 'text-[var(--color-text-primary)]'
        )}>
          {value}
        </span>
        {sub && <p className="text-[10px] text-[var(--color-text-muted)]">{sub}</p>}
      </div>
    </div>
  )
}

function CompareCell({ label, current, prev, currency, invertColour = false }: {
  label: string; current: number; prev: number; currency: Currency; invertColour?: boolean
}) {
  const delta = current - prev
  const pct   = prev > 0 ? Math.round((delta / prev) * 100) : null
  const up    = delta > 0

  return (
    <div className="flex flex-col gap-0.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="text-sm font-bold tabular-nums text-[var(--color-text-primary)]">
        {formatCurrency(current, currency)}
      </p>
      {pct !== null && (
        <p className={cn('flex items-center justify-center gap-0.5 text-[10px] font-medium',
          (up !== invertColour) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
        )}>
          {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {up ? '+' : ''}{pct}%
        </p>
      )}
      {pct === null && prev === 0 && (
        <p className="text-[10px] text-[var(--color-text-muted)]">No prior data</p>
      )}
    </div>
  )
}

// Custom tooltip for the pie chart
function PieTooltip({ active, payload, currency }: {
  active?: boolean; payload?: Array<{ name: string; value: number; payload: { color?: string } }>; currency: Currency
}) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-[var(--color-text-primary)]">{name}</p>
      <p className="text-sm font-bold tabular-nums text-[var(--color-primary)]">{formatCurrency(value, currency)}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InsightsPage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1
  const [prevYear, prevMon] = addMonths(year, month, -1)

  const prefix     = toPrefix(year, month)
  const prevPrefix = toPrefix(prevYear, prevMon)

  const curFilters  = useMemo(() => ({ dateFrom: `${prefix}-01`,     dateTo: `${prefix}-31` }),     [prefix])
  const prevFilters = useMemo(() => ({ dateFrom: `${prevPrefix}-01`, dateTo: `${prevPrefix}-31` }), [prevPrefix])

  const { transactions: curTxns,  loading: loadCur  } = useTransactions(curFilters)
  const { transactions: prevTxns, loading: loadPrev } = useTransactions(prevFilters)
  const { categories } = useCategories()
  const { settings }   = useSettings()
  const currency = settings.currency

  // ── Current month figures ───────────────────────────────────────────────
  const income   = useMemo(() => monthlyIncome(curTxns),    [curTxns])
  const expenses = useMemo(() => monthlyExpenses(curTxns),  [curTxns])
  const savings  = income - expenses
  const rate     = income > 0 ? Math.round(savingsRate(curTxns)) : null

  // ── Previous month figures ──────────────────────────────────────────────
  const prevIncome   = useMemo(() => monthlyIncome(prevTxns),   [prevTxns])
  const prevExpenses = useMemo(() => monthlyExpenses(prevTxns), [prevTxns])
  const prevSavings  = prevIncome - prevExpenses

  // ── Category breakdown ──────────────────────────────────────────────────
  const breakdown = useMemo(() => spendingByCategory(curTxns, categories), [curTxns, categories])

  const pieData = breakdown.map(item => ({
    name:  item.categoryName,
    value: item.amount,
    color: categories.find(c => c.id === item.categoryId)?.color ?? '#6B7280',
  }))

  // ── Observations ────────────────────────────────────────────────────────
  const observations = useMemo(() => buildObservations(
    income, expenses, prevIncome, prevExpenses,
    breakdown[0]?.categoryName,
    rate,
  ), [income, expenses, prevIncome, prevExpenses, breakdown, rate])

  const loading = loadCur || loadPrev
  const hasData = curTxns.length > 0

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Insights</h1>
      </header>

      {/* Month switcher */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { const [y,m] = addMonths(year, month, -1); setYear(y); setMonth(m) }}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {monthLabel(year, month)}
        </span>
        <button
          onClick={() => { const [y,m] = addMonths(year, month, 1); setYear(y); setMonth(m) }}
          disabled={isCurrent}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        </div>
      ) : !hasData ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <div className="text-3xl">📊</div>
          <p className="font-medium text-[var(--color-text-primary)]">No data for this month</p>
          <p className="max-w-xs text-sm text-[var(--color-text-muted)]">
            Add at least one income and one expense transaction to see insights.
          </p>
        </div>
      ) : (
        <>
          {/* ── Summary card ── */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Summary</p>
            </div>
            <div className="px-4">
              <MetricRow label="Income"   value={formatCurrency(income,   currency)} positive={true} />
              <MetricRow label="Expenses" value={formatCurrency(expenses, currency)} />
              <MetricRow
                label="Savings"
                value={`${savings >= 0 ? '' : '−'}${formatCurrency(Math.abs(savings), currency)}`}
                positive={savings >= 0}
              />
              <MetricRow
                label="Savings rate"
                value={rate !== null ? `${rate}%` : '—'}
                sub={rate !== null ? (rate >= 20 ? 'On track' : 'Aim for 20%+') : 'No income this month'}
                positive={rate !== null ? rate >= 20 : undefined}
              />
            </div>
          </section>

          {/* ── Spending by category donut ── */}
          {breakdown.length > 0 && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Spending by category
              </p>

              {/* Screen-reader text summary of the chart */}
              <p className="sr-only">
                Spending breakdown: {breakdown.map(item =>
                  `${item.categoryName} ${formatCurrency(item.amount, currency)} (${item.percentage}%)`
                ).join(', ')}
              </p>

              <ResponsiveContainer width="100%" height={220} aria-hidden="true">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip currency={currency} />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-[var(--color-text-secondary)]">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Ranked list */}
              <div className="mt-2 flex flex-col divide-y divide-[var(--color-border)]">
                {breakdown.map((item, i) => {
                  const color = categories.find(c => c.id === item.categoryId)?.color ?? '#6B7280'
                  return (
                    <div key={item.categoryId} className="flex items-center gap-3 py-3.5">
                      <span className="w-4 shrink-0 text-xs tabular-nums text-[var(--color-text-muted)]">
                        {i + 1}
                      </span>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="flex-1 text-sm text-[var(--color-text-primary)]">{item.categoryName}</span>
                      <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <span className="w-8 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                        {item.percentage}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Month comparison ── */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              vs {monthLabel(prevYear, prevMon)}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <CompareCell label="Income"   current={income}   prev={prevIncome}   currency={currency} />
              <CompareCell label="Expenses" current={expenses} prev={prevExpenses} currency={currency} invertColour />
              <CompareCell label="Savings"  current={savings}  prev={prevSavings}  currency={currency} />
            </div>
          </section>

          {/* ── Observations ── */}
          {observations.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Observations
              </p>
              {observations.map((obs, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
                    obs.sentiment === 'positive' && 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300',
                    obs.sentiment === 'negative' && 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300',
                    obs.sentiment === 'neutral'  && 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
                  )}
                >
                  {obs.sentiment === 'positive' && <TrendingUp  size={15} className="mt-0.5 shrink-0" />}
                  {obs.sentiment === 'negative' && <TrendingDown size={15} className="mt-0.5 shrink-0" />}
                  {obs.sentiment === 'neutral'  && <Minus        size={15} className="mt-0.5 shrink-0" />}
                  {obs.text}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
