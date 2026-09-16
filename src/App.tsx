import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { InsightsPage } from '@/pages/InsightsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { DataManagementPage } from '@/pages/DataManagementPage'
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/hooks/useTheme'
import { ToastProvider } from '@/components/ui/Toast'

// Reads from the shared SettingsContext — re-renders the moment any consumer
// calls setTheme(), so the dark class is toggled synchronously on click.
function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()
  useTheme(settings.theme)
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <ThemeApplier>
          <ToastProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/"                    element={<HomePage />} />
                <Route path="/transactions"         element={<TransactionsPage />} />
                <Route path="/budgets"              element={<BudgetsPage />} />
                <Route path="/insights"             element={<InsightsPage />} />
                <Route path="/settings"             element={<SettingsPage />} />
                <Route path="/settings/categories"  element={<CategoriesPage />} />
                <Route path="/settings/data"        element={<DataManagementPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </ThemeApplier>
      </SettingsProvider>
    </BrowserRouter>
  )
}
