import { createContext, useContext, useState, useCallback } from 'react'
import type { TransactionType } from '@/types'

interface AddTransactionContextValue {
  open: (defaultType?: TransactionType) => void
}

const AddTransactionContext = createContext<AddTransactionContextValue | null>(null)

export function useAddTransaction(): AddTransactionContextValue {
  const ctx = useContext(AddTransactionContext)
  if (!ctx) throw new Error('useAddTransaction must be used within AddTransactionProvider')
  return ctx
}

interface AddTransactionProviderProps {
  children: React.ReactNode
}

// Internal state lives here; the actual sheet renders in AppLayout
// which both provides the context and renders the sheet.
export function useAddTransactionState() {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<TransactionType>('expense')

  const open = useCallback((type: TransactionType = 'expense') => {
    setDefaultType(type)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  return { isOpen, defaultType, open, close }
}

export { AddTransactionContext }
export type { AddTransactionProviderProps }
