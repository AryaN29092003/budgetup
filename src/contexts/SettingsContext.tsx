import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { settingsService } from '@/services/settingsService'
import type { Settings, Theme, Currency } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

interface SettingsContextValue {
  settings: Settings
  loading: boolean
  updateSettings: (patch: Partial<Omit<Settings, 'id'>>) => Promise<Settings>
  setTheme: (theme: Theme) => Promise<Settings>
  setCurrency: (currency: Currency) => Promise<Settings>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    settingsService.get().then((s) => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Omit<Settings, 'id'>>) => {
    const updated = await settingsService.update(patch)
    setSettings(updated)   // ← single state update, every consumer re-renders immediately
    return updated
  }, [])

  const setTheme    = useCallback((theme: Theme)       => updateSettings({ theme }),    [updateSettings])
  const setCurrency = useCallback((currency: Currency) => updateSettings({ currency }), [updateSettings])

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, setTheme, setCurrency }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
