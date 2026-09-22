import { db } from '@/db/database'
import { categoryService } from '@/services/categoryService'
import type { Transaction, Category, Budget, Settings } from '@/types'

// ─── Backup shape ─────────────────────────────────────────────────────────────

export const BACKUP_VERSION = 1

export interface BackupFile {
  version: number
  exportedAt: string
  settings: Settings
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isString(v: unknown): v is string  { return typeof v === 'string' }
function isNumber(v: unknown): v is number  { return typeof v === 'number' && isFinite(v) }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validateTransaction(t: unknown): t is Transaction {
  if (!isObject(t)) return false
  return (
    isString(t.id) &&
    (t.type === 'income' || t.type === 'expense') &&
    isNumber(t.amount) && (t.amount as number) > 0 &&
    isString(t.categoryId) &&
    isString(t.date) && /^\d{4}-\d{2}-\d{2}$/.test(t.date as string) &&
    isString(t.createdAt) &&
    isString(t.updatedAt)
  )
}

function validateCategory(c: unknown): c is Category {
  if (!isObject(c)) return false
  return (
    isString(c.id) &&
    isString(c.name) &&
    (c.type === 'income' || c.type === 'expense') &&
    isString(c.icon) &&
    typeof c.isDefault === 'boolean' &&
    isString(c.createdAt)
  )
}

function validateBudget(b: unknown): b is Budget {
  if (!isObject(b)) return false
  return (
    isString(b.id) &&
    isString(b.month) && /^\d{4}-\d{2}$/.test(b.month as string) &&
    isString(b.categoryId) &&
    isNumber(b.amount) &&
    isString(b.createdAt) &&
    isString(b.updatedAt)
  )
}

function validateSettings(s: unknown): s is Settings {
  if (!isObject(s)) return false
  return (
    s.id === 'settings' &&
    isString(s.currency) &&
    (s.theme === 'light' || s.theme === 'dark' || s.theme === 'system') &&
    isNumber(s.firstDayOfMonth) &&
    typeof s.onboardingCompleted === 'boolean'
  )
}

export function validateBackup(raw: unknown): { ok: true; data: BackupFile } | { ok: false; error: string } {
  if (!isObject(raw))                         return { ok: false, error: 'File is not a valid JSON object.' }
  if (raw.version !== BACKUP_VERSION)         return { ok: false, error: `Unsupported backup version: ${raw.version}. Expected ${BACKUP_VERSION}.` }
  if (!isString(raw.exportedAt))              return { ok: false, error: 'Missing exportedAt field.' }
  if (!isObject(raw.settings))               return { ok: false, error: 'Missing settings.' }
  if (!validateSettings(raw.settings))       return { ok: false, error: 'Settings record is invalid.' }
  if (!Array.isArray(raw.categories))        return { ok: false, error: 'Categories must be an array.' }
  if (!Array.isArray(raw.transactions))      return { ok: false, error: 'Transactions must be an array.' }
  if (!Array.isArray(raw.budgets))           return { ok: false, error: 'Budgets must be an array.' }

  for (let i = 0; i < (raw.categories as unknown[]).length; i++) {
    if (!validateCategory((raw.categories as unknown[])[i]))
      return { ok: false, error: `Category at index ${i} is invalid.` }
  }
  for (let i = 0; i < (raw.transactions as unknown[]).length; i++) {
    if (!validateTransaction((raw.transactions as unknown[])[i]))
      return { ok: false, error: `Transaction at index ${i} is invalid.` }
  }
  for (let i = 0; i < (raw.budgets as unknown[]).length; i++) {
    if (!validateBudget((raw.budgets as unknown[])[i]))
      return { ok: false, error: `Budget at index ${i} is invalid.` }
  }

  return { ok: true, data: raw as unknown as BackupFile }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const backupService = {
  // ── JSON export ────────────────────────────────────────────────────────────

  async exportJSON(): Promise<void> {
    const [settings, categories, transactions, budgets] = await Promise.all([
      db.settings.get('settings'),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.budgets.toArray(),
    ])

    const backup: BackupFile = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      settings: settings ?? { id: 'settings', currency: 'INR', theme: 'system', firstDayOfMonth: 1, onboardingCompleted: false },
      categories,
      transactions,
      budgets,
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    triggerDownload(blob, `paisa-backup-${datestamp()}.json`)
  },

  // ── JSON import ────────────────────────────────────────────────────────────

  async importJSON(file: File): Promise<{ imported: { transactions: number; categories: number; budgets: number } }> {
    const text = await file.text()
    let raw: unknown
    try { raw = JSON.parse(text) }
    catch { throw new Error('File is not valid JSON.') }

    const result = validateBackup(raw)
    if (!result.ok) throw new Error(result.error)

    const { data } = result

    // Atomic-as-possible: write all tables in a single Dexie transaction
    await db.transaction('rw', [db.settings, db.categories, db.transactions, db.budgets], async () => {
      await db.transactions.clear()
      await db.categories.clear()
      await db.budgets.clear()
      await db.settings.clear()

      await db.settings.put(data.settings)
      if (data.categories.length)   await db.categories.bulkPut(data.categories)
      if (data.transactions.length) await db.transactions.bulkPut(data.transactions)
      if (data.budgets.length)      await db.budgets.bulkPut(data.budgets)
    })

    // Re-seed any default categories that the backup might be missing
    await categoryService.seedDefaults()

    return {
      imported: {
        transactions: data.transactions.length,
        categories:   data.categories.length,
        budgets:      data.budgets.length,
      },
    }
  },

  // ── CSV export ─────────────────────────────────────────────────────────────

  async exportCSV(): Promise<void> {
    const [transactions, categories] = await Promise.all([
      db.transactions.orderBy('date').reverse().toArray(),
      db.categories.toArray(),
    ])

    const catById = new Map(categories.map(c => [c.id, c.name]))

    const header = ['Date', 'Type', 'Amount', 'Category', 'Note', 'Payment Method']
    const rows = transactions.map(t => [
      t.date,
      t.type,
      String(t.amount),
      catById.get(t.categoryId) ?? t.categoryId,
      t.note ?? '',
      t.paymentMethod ?? '',
    ])

    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, `paisa-transactions-${datestamp()}.csv`)
  },

  // ── Delete all ─────────────────────────────────────────────────────────────

  async deleteAllData(): Promise<void> {
    await db.transaction('rw', [db.settings, db.categories, db.transactions, db.budgets], async () => {
      await db.transactions.clear()
      await db.budgets.clear()
      await db.categories.clear()
      await db.settings.clear()
    })
    // Re-seed defaults so the app is usable immediately after wipe
    await categoryService.seedDefaults()
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function datestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
