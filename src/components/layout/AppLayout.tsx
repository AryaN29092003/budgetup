import { useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { AddTransactionContext, useAddTransactionState } from '@/contexts/AddTransactionContext'
import { useTransactions } from '@/hooks/useTransactions'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/components/ui/Toast'
import type { TransactionFormValues } from '@/components/transactions/TransactionForm'
import type { Transaction } from '@/types'

// Currency symbol lookup — keeps the form decoupled from the settings hook
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£',
}

export function AppLayout() {
  const { isOpen, defaultType, open, close } = useAddTransactionState()
  const { create } = useTransactions()
  const { settings } = useSettings()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = useCallback(
    async (values: TransactionFormValues, parsedAmount: number) => {
      await create({
        type: values.type,
        amount: parsedAmount,
        categoryId: values.categoryId,
        date: values.date,
        note: values.note || undefined,
        paymentMethod: values.paymentMethod as Transaction['paymentMethod'] || undefined,
      })
      // If not already on transactions page, navigate there after adding
      if (location.pathname !== '/transactions') {
        navigate('/transactions')
      }
    },
    [create, location.pathname, navigate]
  )

  const handleClose = useCallback(() => {
    close()
    // Toast after the success flash closes the sheet
    toast.success(defaultType === 'income' ? 'Income added' : 'Expense added')
  }, [close, defaultType, toast])

  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] ?? '₹'

  return (
    <AddTransactionContext.Provider value={{ open }}>
      <div className="flex min-h-dvh">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content */}
        <main id="main-content" className="flex flex-1 flex-col overflow-x-hidden" aria-label="Main content">
          <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />

        {/* Global Add Transaction sheet — accessible from anywhere */}
        <TransactionForm
          open={isOpen}
          onClose={handleClose}
          onSubmit={handleSubmit}
          defaultType={defaultType}
          currencySymbol={currencySymbol}
        />
      </div>
    </AddTransactionContext.Provider>
  )
}
