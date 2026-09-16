// Re-export from the context so all existing imports continue to work unchanged.
// The context (SettingsContext.tsx) is the single source of truth — one instance,
// shared across the whole tree, so theme changes propagate instantly everywhere.
export { useSettings } from '@/contexts/SettingsContext'
