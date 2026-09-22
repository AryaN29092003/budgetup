import { useState, useEffect, useCallback } from 'react'
import { categoryService } from '@/services/categoryService'
import type { Category, TransactionType } from '@/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const all = await categoryService.getAll()
    setCategories(all)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const forType = useCallback(
    (type: TransactionType) => categories.filter((c) => c.type === type),
    [categories]
  )

  const byId = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  )

  const createCategory = useCallback(
    async (data: Omit<Category, 'id' | 'createdAt'>) => {
      const cat = await categoryService.create(data)
      setCategories((prev) => [...prev, cat])
      return cat
    },
    []
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      await categoryService.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    },
    []
  )

  return { categories, loading, forType, byId, createCategory, deleteCategory, reload: load }
}
