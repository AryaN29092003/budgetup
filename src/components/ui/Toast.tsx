import * as RadixToast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createContext, useContext, useState, useCallback, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToastItem {
  id: string
  message: string
  variant?: 'default' | 'success' | 'error'
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface ToastContextValue {
  show: (opts: Omit<ToastItem, 'id'>) => void
  success: (message: string, action?: ToastItem['action']) => void
  error: (message: string) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const show = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = String(++counter.current)
    setToasts((prev) => [...prev, { ...opts, id }])
  }, [])

  const success = useCallback(
    (message: string, action?: ToastItem['action']) =>
      show({ message, variant: 'success', action }),
    [show]
  )

  const error = useCallback(
    (message: string) => show({ message, variant: 'error', duration: 5000 }),
    [show]
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show, success, error }}>
      <RadixToast.Provider swipeDirection="up">
        {children}

        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            duration={toast.duration ?? 3500}
            onOpenChange={(open) => { if (!open) dismiss(toast.id) }}
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
              'data-[state=open]:slide-in-from-bottom-4',
              toast.variant === 'error'
                ? 'bg-[var(--color-destructive)] text-white border-transparent'
                : 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
            )}
          >
            <RadixToast.Description className="flex-1">
              {toast.message}
            </RadixToast.Description>

            {toast.action && (
              <RadixToast.Action
                altText={toast.action.label}
                onClick={toast.action.onClick}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-muted)]"
              >
                {toast.action.label}
              </RadixToast.Action>
            )}

            <RadixToast.Close
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}

        <RadixToast.Viewport className="fixed left-0 right-0 z-[100] flex flex-col gap-2 px-4 pb-2 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
