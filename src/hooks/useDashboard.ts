import { useState, useEffect, useMemo } from 'react'
import { transactionService } from '@/services/transactionService'
import { categoryService } from '@/services/categoryService'
import {
  monthlyIncome,
  monthlyExpenses,
  remainingMoney,
  spendingByCategory,
} from '@/utils/calculations'
import { currentMonth } from '@/utils/date'
import type { Transaction, Category } from '@/types'

export interface DashboardData {
  transactions: Transaction[]
  categories: Category[]
  income: number
  spent: number
  remaining: number
  categoryBreakdown: ReturnType<typeof spendingByCategory>
  loading: boolean
}

export function useDashboard(month: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories]     = useState<Category[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      transactionService.getByMonth(month),
      categoryService.getAll(),
    ]).then(([txns, cats]) => {
      if (cancelled) return
      setTransactions(txns)
      setCategories(cats)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [month])

  const income    = useMemo(() => monthlyIncome(transactions),    [transactions])
  const spent     = useMemo(() => monthlyExpenses(transactions),  [transactions])
  const remaining = useMemo(() => remainingMoney(transactions),   [transactions])
  const categoryBreakdown = useMemo(
    () => spendingByCategory(transactions, categories),
    [transactions, categories]
  )

  return { transactions, categories, income, spent, remaining, categoryBreakdown, loading }
}

export { currentMonth }
