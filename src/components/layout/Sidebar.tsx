import { NavLink } from 'react-router-dom'
import { Home, ArrowLeftRight, PieChart, BarChart2, Settings, Plus, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useAddTransaction } from '@/contexts/AddTransactionContext'

const NAV_ITEMS = [
  { to: '/',             icon: Home,           label: 'Home',         exact: true },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/budgets',      icon: PieChart,        label: 'Budgets' },
  { to: '/insights',     icon: BarChart2,       label: 'Insights' },
  { to: '/settings',     icon: Settings,        label: 'Settings' },
]

export function Sidebar() {
  const { open } = useAddTransaction()

  return (
    <aside aria-label="Application sidebar" className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-[var(--color-border)] lg:bg-[var(--color-surface)]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-border)] px-5">
        <Wallet size={20} className="text-[var(--color-primary)]" aria-hidden="true" />
        <span className="text-base font-semibold text-[var(--color-text-primary)]">Paisa</span>
      </div>

      {/* Add button — now wired */}
      <div className="p-4">
        <Button
          variant="primary"
          className="w-full gap-2"
          onClick={() => open('expense')}
        >
          <Plus size={16} />
          Add Transaction
        </Button>
      </div>

      {/* Nav links */}
      <nav aria-label="Main navigation" className="flex-1 px-3 pb-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]'
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
