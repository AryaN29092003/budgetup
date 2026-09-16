import { db } from '@/db/database'
import type { Transaction, TransactionType } from '@/types'
import { generateId, nowISO } from '@/utils/date'

export interface TransactionFilters {
  type?: TransactionType
  categoryId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  categoryIds?: string[]
}

function validateAmount(amount: number) {
  if (!isFinite(amount) || amount <= 0) throw new Error('Amount must be a positive number')
}
function validateType(type: string) {
  if (type !== 'income' && type !== 'expense') throw new Error('Invalid transaction type')
}
function validateDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Date must be YYYY-MM-DD')
}

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    return db.transactions.orderBy('date').reverse().toArray()
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return db.transactions.get(id)
  },

  async getByMonth(month: string): Promise<Transaction[]> {
    return db.transactions.where('date').startsWith(month).reverse().sortBy('date')
  },

  async getByCategory(categoryId: string): Promise<Transaction[]> {
    return db.transactions.where('categoryId').equals(categoryId).reverse().sortBy('date')
  },

  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    validateAmount(data.amount)
    validateType(data.type)
    validateDate(data.date)
    if (!data.categoryId) throw new Error('Category is required')
    const now = nowISO()
    const transaction: Transaction = {
      ...data,
      amount: Math.round(data.amount * 100) / 100,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    await db.transactions.add(transaction)
    return transaction
  },

  async update(
    id: string,
    patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ): Promise<Transaction> {
    const existing = await db.transactions.get(id)
    if (!existing) throw new Error(`Transaction ${id} not found`)
    if (patch.amount !== undefined) validateAmount(patch.amount)
    if (patch.type !== undefined) validateType(patch.type)
    if (patch.date !== undefined) validateDate(patch.date)
    const updated: Transaction = {
      ...existing,
      ...patch,
      ...(patch.amount !== undefined ? { amount: Math.round(patch.amount * 100) / 100 } : {}),
      updatedAt: nowISO(),
    }
    await db.transactions.put(updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    await db.transactions.delete(id)
  },

  async query(filters: TransactionFilters): Promise<Transaction[]> {
    const all = await db.transactions.orderBy('date').reverse().toArray()
    return all.filter((t) => {
      if (filters.type && t.type !== filters.type) return false
      if (filters.categoryId && t.categoryId !== filters.categoryId) return false
      if (filters.categoryIds?.length && !filters.categoryIds.includes(t.categoryId)) return false
      if (filters.dateFrom && t.date < filters.dateFrom) return false
      if (filters.dateTo && t.date > filters.dateTo) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!(t.note?.toLowerCase().includes(q)) && !filters.categoryIds?.includes(t.categoryId)) return false
      }
      return true
    })
  },

  async getSummaryByType(month: string): Promise<Record<TransactionType, number>> {
    const txns = await transactionService.getByMonth(month)
    return txns.reduce(
      (acc, t) => { acc[t.type] += t.amount; return acc },
      { income: 0, expense: 0 }
    )
  },
}

// ── Spec-named re-exports (same implementations, different names) ──────────────
export const createTransaction    = transactionService.create.bind(transactionService)
export const getTransaction       = transactionService.getById.bind(transactionService)
export const getTransactions      = transactionService.getAll.bind(transactionService)
export const getTransactionsByMonth    = transactionService.getByMonth.bind(transactionService)
export const getTransactionsByCategory = transactionService.getByCategory.bind(transactionService)
export const updateTransaction    = transactionService.update.bind(transactionService)
export const deleteTransaction    = transactionService.delete.bind(transactionService)
