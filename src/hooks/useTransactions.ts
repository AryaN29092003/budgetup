import { useState, useEffect, useCallback } from 'react'
import { transactionService, type TransactionFilters } from '@/services/transactionService'
import { categoryService } from '@/services/categoryService'
import type { Transaction } from '@/types'

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (f?: TransactionFilters) => {
    setLoading(true)
    try {
      // When searching, resolve category name matches → ids first
      let resolvedFilters = f ?? filters ?? {}
      if (resolvedFilters.search) {
        const q = resolvedFilters.search.toLowerCase()
        const allCats = await categoryService.getAll()
        const matchingCatIds = allCats
          .filter((c: { name: string }) => c.name.toLowerCase().includes(q))
          .map((c: { id: string }) => c.id)
        resolvedFilters = { ...resolvedFilters, categoryIds: matchingCatIds }
      }
      const result = await transactionService.query(resolvedFilters)
      setTransactions(result)
    } finally {
      setLoading(false)
    }
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const create = useCallback(
    async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const t = await transactionService.create(data)
      setTransactions((prev) => [t, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
      return t
    },
    []
  )

  const update = useCallback(
    async (id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      const t = await transactionService.update(id, patch)
      setTransactions((prev) =>
        prev.map((x) => (x.id === id ? t : x)).sort((a, b) => b.date.localeCompare(a.date))
      )
      return t
    },
    []
  )

  const remove = useCallback(async (id: string) => {
    await transactionService.delete(id)
    setTransactions((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const restore = useCallback(async (transaction: Transaction) => {
    await transactionService.create({
      type: transaction.type,
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      date: transaction.date,
      note: transaction.note,
      paymentMethod: transaction.paymentMethod,
    })
    // Reload to get the restored transaction in the list with correct id
    await load()
  }, [load])

  return { transactions, loading, create, update, remove, restore, reload: load }
}
