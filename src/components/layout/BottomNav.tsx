import { NavLink } from 'react-router-dom'
import { Home, ArrowLeftRight, Settings, Plus, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAddTransaction } from '@/contexts/AddTransactionContext'

type NavItem =
  | { kind: 'link'; to: string; icon: React.ElementType; label: string; exact?: boolean }
  | { kind: 'add';  icon: React.ElementType; label: string }

const NAV_ITEMS: NavItem[] = [
  { kind: 'link', to: '/',             icon: Home,          label: 'Home',    exact: true },
  { kind: 'link', to: '/transactions', icon: ArrowLeftRight, label: 'Txns' },
  { kind: 'add',                        icon: Plus,          label: 'Add' },
  { kind: 'link', to: '/budgets',      icon: PieChart,       label: 'Budgets' },
  { kind: 'link', to: '/settings',     icon: Settings,       label: 'Settings' },
]

export function BottomNav() {
  const { open } = useAddTransaction()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 items-center">
        {NAV_ITEMS.map((item) => {
          if (item.kind === 'add') {
            return (
              <div key="add" className="flex flex-1 items-center justify-center">
                <button
                  onClick={() => open('expense')}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg transition-transform active:scale-90"
                  aria-label="Add transaction"
                >
                  <Plus size={24} strokeWidth={2.5} />
                </button>
              </div>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  // Full-height tap target — 44px minimum per WCAG / Apple HIG
                  'flex flex-1 flex-col items-center justify-center gap-0.5 self-stretch text-[11px] font-medium transition-colors',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                )
              }
            >
              <item.icon size={21} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
