import { db } from '@/db/database'
import type { Category, TransactionType } from '@/types'
import { generateId, nowISO } from '@/utils/date'

const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'cat-food',          name: 'Food',          type: 'expense', icon: 'UtensilsCrossed', color: '#F59E0B', isDefault: true },
  { id: 'cat-housing',       name: 'Housing',       type: 'expense', icon: 'Home',            color: '#8B5CF6', isDefault: true },
  { id: 'cat-transport',     name: 'Transport',     type: 'expense', icon: 'Car',             color: '#3B82F6', isDefault: true },
  { id: 'cat-groceries',     name: 'Groceries',     type: 'expense', icon: 'ShoppingCart',    color: '#10B981', isDefault: true },
  { id: 'cat-shopping',      name: 'Shopping',      type: 'expense', icon: 'ShoppingBag',     color: '#EC4899', isDefault: true },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'Tv',              color: '#F97316', isDefault: true },
  { id: 'cat-bills',         name: 'Bills',         type: 'expense', icon: 'FileText',        color: '#EF4444', isDefault: true },
  { id: 'cat-subscriptions', name: 'Subscriptions', type: 'expense', icon: 'RefreshCw',       color: '#6366F1', isDefault: true },
  { id: 'cat-travel',        name: 'Travel',        type: 'expense', icon: 'Plane',           color: '#0EA5E9', isDefault: true },
  { id: 'cat-healthcare',    name: 'Healthcare',    type: 'expense', icon: 'HeartPulse',      color: '#DC2626', isDefault: true },
  { id: 'cat-education',     name: 'Education',     type: 'expense', icon: 'GraduationCap',   color: '#0D9488', isDefault: true },
  { id: 'cat-other-expense', name: 'Other',         type: 'expense', icon: 'MoreHorizontal',  color: '#6B7280', isDefault: true },
  { id: 'cat-salary',        name: 'Salary',        type: 'income',  icon: 'Briefcase',       color: '#10B981', isDefault: true },
  { id: 'cat-freelance',     name: 'Freelance',     type: 'income',  icon: 'Laptop',          color: '#0D9488', isDefault: true },
  { id: 'cat-bonus',         name: 'Bonus',         type: 'income',  icon: 'Gift',            color: '#F59E0B', isDefault: true },
  { id: 'cat-refund',        name: 'Refund',        type: 'income',  icon: 'RotateCcw',       color: '#3B82F6', isDefault: true },
  { id: 'cat-other-income',  name: 'Other',         type: 'income',  icon: 'Plus',            color: '#6B7280', isDefault: true },
]

export const categoryService = {
  async getAll(): Promise<Category[]> {
    return db.categories.toArray()
  },

  async getByType(type: TransactionType): Promise<Category[]> {
    return db.categories.where('type').equals(type).toArray()
  },

  async getById(id: string): Promise<Category | undefined> {
    return db.categories.get(id)
  },

  async seedDefaults(): Promise<void> {
    const now = nowISO()
    await db.categories.bulkPut(DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: now })))
  },

  async create(data: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    if (!data.name.trim()) throw new Error('Category name is required')
    const category: Category = { ...data, id: generateId(), createdAt: nowISO() }
    await db.categories.add(category)
    return category
  },

  async update(
    id: string,
    patch: Partial<Omit<Category, 'id' | 'createdAt' | 'isDefault'>>
  ): Promise<Category> {
    const existing = await db.categories.get(id)
    if (!existing) throw new Error(`Category ${id} not found`)
    const updated: Category = { ...existing, ...patch }
    await db.categories.put(updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    const cat = await db.categories.get(id)
    if (!cat) throw new Error(`Category ${id} not found`)
    if (cat.isDefault) throw new Error('Cannot delete a default category')

    // Refuse if any transactions reference this category
    const txnCount = await db.transactions.where('categoryId').equals(id).count()
    if (txnCount > 0) {
      throw new Error(
        `This category is used by ${txnCount} transaction${txnCount === 1 ? '' : 's'}. ` +
        `Reassign or delete those transactions before removing this category.`
      )
    }

    // Refuse if any budgets reference this category
    const budgetCount = await db.budgets.where('categoryId').equals(id).count()
    if (budgetCount > 0) {
      throw new Error(
        `This category is used by ${budgetCount} budget${budgetCount === 1 ? '' : 's'}. ` +
        `Remove those budgets before deleting this category.`
      )
    }

    await db.categories.delete(id)
  },
}

// ── Spec-named re-exports ─────────────────────────────────────────────────────
export const getCategories       = categoryService.getAll.bind(categoryService)
export const getCategoriesByType = categoryService.getByType.bind(categoryService)
export const getCategory         = categoryService.getById.bind(categoryService)
export const createCategory      = categoryService.create.bind(categoryService)
export const updateCategory      = categoryService.update.bind(categoryService)
export const deleteCategory      = categoryService.delete.bind(categoryService)
