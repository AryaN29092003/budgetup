// ─── Transaction ────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense'
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  date: string // ISO date YYYY-MM-DD
  note?: string
  paymentMethod?: PaymentMethod
  createdAt: string // ISO datetime
  updatedAt: string
}

// ─── Category ───────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  color?: string
  isDefault: boolean
  createdAt: string
}

// ─── Budget ─────────────────────────────────────────────────────────────────
export interface Budget {
  id: string
  month: string // YYYY-MM
  categoryId: string
  amount: number
  createdAt: string
  updatedAt: string
}

// ─── Settings ───────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system'
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP'

export interface Settings {
  id: 'settings'
  currency: Currency
  theme: Theme
  firstDayOfMonth: 1 | 15
  onboardingCompleted: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  currency: 'INR',
  theme: 'system',
  firstDayOfMonth: 1,
  onboardingCompleted: false,
}
