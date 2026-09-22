import { Link } from 'react-router-dom'
import { ChevronRight, Tag, Database } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import type { Theme, Currency } from '@/types'

const THEME_OPTIONS = [
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const CURRENCY_OPTIONS = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
]

const FIRST_DAY_OPTIONS = [
  { value: '1', label: '1st of month' },
  { value: '15', label: '15th of month' },
]

export function SettingsPage() {
  const { settings, loading, setTheme, setCurrency, updateSettings } = useSettings()

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center p-4">
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Settings</h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Data
        </h2>
        <Card className="p-0 overflow-hidden">
          <Link
            to="/settings/categories"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--color-surface-muted)] transition-colors border-b border-[var(--color-border)]"
          >
            <Tag size={16} className="text-[var(--color-primary)]" />
            <span className="flex-1 text-sm text-[var(--color-text-primary)]">Categories</span>
            <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          </Link>
          <Link
            to="/settings/data"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--color-surface-muted)] transition-colors"
          >
            <Database size={16} className="text-[var(--color-primary)]" />
            <span className="flex-1 text-sm text-[var(--color-text-primary)]">Backup &amp; Data</span>
            <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          </Link>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Appearance
        </h2>
        <Card>
          <Select
            label="Theme"
            value={settings.theme}
            onValueChange={(v) => setTheme(v as Theme)}
            options={THEME_OPTIONS}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Regional
        </h2>
        <Card className="flex flex-col gap-4">
          <Select
            label="Currency"
            value={settings.currency}
            onValueChange={(v) => setCurrency(v as Currency)}
            options={CURRENCY_OPTIONS}
          />
          <Select
            label="First day of month"
            value={String(settings.firstDayOfMonth)}
            onValueChange={(v) =>
              updateSettings({ firstDayOfMonth: Number(v) as 1 | 15 })
            }
            options={FIRST_DAY_OPTIONS}
          />
        </Card>
      </section>
    </div>
  )
}
