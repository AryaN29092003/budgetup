import type { Transaction, Budget, Category } from '@/types'

// ─── Monthly aggregates ───────────────────────────────────────────────────────

/** Sum of all income transactions in the provided list. */
export function monthlyIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
}

/** Sum of all expense transactions in the provided list. */
export function monthlyExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
}

/** income − expenses. Negative means over-spent. */
export function remainingMoney(transactions: Transaction[]): number {
  return monthlyIncome(transactions) - monthlyExpenses(transactions)
}

// ─── Category breakdown ───────────────────────────────────────────────────────

export interface CategorySpending {
  categoryId: string
  categoryName: string
  amount: number
  /** 0–100, percentage of total expenses */
  percentage: number
}

/**
 * Returns expense totals per category, sorted descending by amount.
 * Pass only the transactions for the period you care about.
 */
export function spendingByCategory(
  transactions: Transaction[],
  categories: Category[]
): CategorySpending[] {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const totals = new Map<string, number>()

  for (const t of transactions) {
    if (t.type !== 'expense') continue
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount)
  }

  const total = Array.from(totals.values()).reduce((s, v) => s + v, 0)

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: catMap.get(categoryId)?.name ?? 'Unknown',
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

// ─── Budget progress ──────────────────────────────────────────────────────────

export interface BudgetProgress {
  budget: Budget
  spent: number
  remaining: number
  /** 0–100, capped at 100 */
  percentUsed: number
  isOverBudget: boolean
}

/**
 * Joins budgets with actual spending for the same month.
 * Pass transactions already filtered to the relevant month.
 */
export function budgetProgress(
  budgets: Budget[],
  transactions: Transaction[]
): BudgetProgress[] {
  const spentByCat = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    spentByCat.set(t.categoryId, (spentByCat.get(t.categoryId) ?? 0) + t.amount)
  }

  return budgets.map((budget) => {
    const spent = spentByCat.get(budget.categoryId) ?? 0
    const remaining = budget.amount - spent
    return {
      budget,
      spent,
      remaining,
      percentUsed: budget.amount > 0 ? Math.min(100, Math.round((spent / budget.amount) * 100)) : 0,
      isOverBudget: spent > budget.amount,
    }
  })
}

// ─── Savings rate ─────────────────────────────────────────────────────────────

/** Returns savings as a percentage of income. Returns 0 if no income. */
export function savingsRate(transactions: Transaction[]): number {
  const income = monthlyIncome(transactions)
  if (income === 0) return 0
  const saved = income - monthlyExpenses(transactions)
  return Math.round((saved / income) * 100)
}

// ─── Budget status ────────────────────────────────────────────────────────────

export type BudgetStatus = 'healthy' | 'getting-close' | 'almost-reached' | 'over-budget'

/**
 * Classify a budget usage percentage into a status label.
 * Spending over budget does NOT block transactions — it is advisory only.
 */
export function budgetStatus(percentUsed: number): BudgetStatus {
  if (percentUsed > 100) return 'over-budget'
  if (percentUsed >= 90) return 'almost-reached'
  if (percentUsed >= 70) return 'getting-close'
  return 'healthy'
}

export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  'healthy':        'Healthy',
  'getting-close':  'Getting close',
  'almost-reached': 'Almost reached',
  'over-budget':    'Over budget',
}

// ─── Per-category budget calculations ────────────────────────────────────────

/**
 * Sum expenses for a single category within a pre-filtered transaction list.
 * Pass only the transactions for the month you care about.
 */
export function categorySpending(transactions: Transaction[], categoryId: string): number {
  return transactions
    .filter((t) => t.type === 'expense' && t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amount, 0)
}

/**
 * Remaining budget for one category. Can be negative (over budget).
 */
export function categoryRemaining(budgetAmount: number, spent: number): number {
  return budgetAmount - spent
}

/**
 * Usage percentage for one category. Returns 0 when budgetAmount is 0 (safe).
 * Not capped — can exceed 100 when over budget.
 */
export function categoryUsagePercent(budgetAmount: number, spent: number): number {
  if (budgetAmount <= 0) return 0
  return Math.round((spent / budgetAmount) * 100)
}

// ─── Overall monthly budget summary ──────────────────────────────────────────

export interface MonthBudgetSummary {
  totalBudgeted: number
  totalSpent: number
  totalRemaining: number
  /** Not capped — can exceed 100. */
  percentUsed: number
  status: BudgetStatus
  /** Per-category rows, sorted by percentUsed descending. */
  categories: (BudgetProgress & { status: BudgetStatus; usagePercent: number })[]
}

/**
 * Full budget summary for a month.
 * @param budgets  - budgets for the month (from budgetService.getByMonth)
 * @param transactions - transactions for the month (already date-filtered)
 */
export function monthBudgetSummary(
  budgets: Budget[],
  transactions: Transaction[]
): MonthBudgetSummary {
  const rows = budgetProgress(budgets, transactions).map((row) => {
    const usagePercent = categoryUsagePercent(row.budget.amount, row.spent)
    return { ...row, usagePercent, status: budgetStatus(usagePercent) }
  })

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent    = rows.reduce((s, r) => s + r.spent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const percentUsed    = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining,
    percentUsed,
    status: budgetStatus(percentUsed),
    categories: rows.sort((a, b) => b.usagePercent - a.usagePercent),
  }
}
