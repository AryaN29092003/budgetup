import { db } from '@/db/database'
import type { Budget } from '@/types'
import { generateId, nowISO } from '@/utils/date'

export const budgetService = {
  async getByMonth(month: string): Promise<Budget[]> {
    return db.budgets.where('month').equals(month).toArray()
  },

  async getById(id: string): Promise<Budget | undefined> {
    return db.budgets.get(id)
  },

  async create(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    if (data.amount <= 0) throw new Error('Budget amount must be positive')
    const existing = await db.budgets
      .where('[month+categoryId]').equals([data.month, data.categoryId]).first()
    if (existing) throw new Error(`Budget for ${data.month}/${data.categoryId} already exists`)
    const now = nowISO()
    const budget: Budget = { ...data, id: generateId(), createdAt: now, updatedAt: now }
    await db.budgets.add(budget)
    return budget
  },

  async update(
    id: string,
    patch: Partial<Omit<Budget, 'id' | 'createdAt'>>
  ): Promise<Budget> {
    const existing = await db.budgets.get(id)
    if (!existing) throw new Error(`Budget ${id} not found`)
    if (patch.amount !== undefined && patch.amount <= 0) throw new Error('Budget amount must be positive')
    const updated: Budget = { ...existing, ...patch, updatedAt: nowISO() }
    await db.budgets.put(updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    await db.budgets.delete(id)
  },

  async upsert(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const existing = await db.budgets
      .where('[month+categoryId]').equals([data.month, data.categoryId]).first()
    if (existing) return budgetService.update(existing.id, { amount: data.amount })
    return budgetService.create(data)
  },
}

// ── Spec-named re-exports ─────────────────────────────────────────────────────
export const getBudgetsForMonth = budgetService.getByMonth.bind(budgetService)
export const getBudget          = budgetService.getById.bind(budgetService)
export const createBudget       = budgetService.create.bind(budgetService)
export const updateBudget       = budgetService.update.bind(budgetService)
export const deleteBudget       = budgetService.delete.bind(budgetService)
