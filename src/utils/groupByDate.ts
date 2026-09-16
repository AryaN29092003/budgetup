import type { Transaction } from '@/types'
import { todayISO } from './date'

export interface DateGroup {
  label: string
  date: string
  transactions: Transaction[]
}

function formatDateLabel(dateStr: string): string {
  const today = todayISO()
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'

  // Format as "Mon 12 Aug"
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function groupTransactionsByDate(transactions: Transaction[]): DateGroup[] {
  const map = new Map<string, Transaction[]>()

  for (const t of transactions) {
    const existing = map.get(t.date) ?? []
    existing.push(t)
    map.set(t.date, existing)
  }

  // Already sorted descending by date from the service; preserve that order
  return Array.from(map.entries()).map(([date, txns]) => ({
    label: formatDateLabel(date),
    date,
    transactions: txns,
  }))
}
