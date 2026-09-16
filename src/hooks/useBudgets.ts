import { useState, useEffect, useCallback } from 'react'
import { budgetService } from '@/services/budgetService'
import { transactionService } from '@/services/transactionService'
import { monthBudgetSummary } from '@/utils/calculations'
import type { Budget } from '@/types'
import type { MonthBudgetSummary } from '@/utils/calculations'

export function useBudgets(month: string) {
  const [budgets, setBudgets]     = useState<Budget[]>([])
  const [summary, setSummary]     = useState<MonthBudgetSummary | null>(null)
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [buds, txns] = await Promise.all([
        budgetService.getByMonth(month),
        transactionService.getByMonth(month),
      ])
      setBudgets(buds)
      setSummary(monthBudgetSummary(buds, txns))
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  const upsert = useCallback(
    async (categoryId: string, amount: number) => {
      await budgetService.upsert({ month, categoryId, amount })
      await load()
    },
    [month, load]
  )

  const remove = useCallback(
    async (id: string) => {
      await budgetService.delete(id)
      await load()
    },
    [load]
  )

  return { budgets, summary, loading, upsert, remove, reload: load }
}
