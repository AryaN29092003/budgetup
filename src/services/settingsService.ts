import { db } from '@/db/database'
import type { Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

export const settingsService = {
  /** Returns settings, auto-seeding defaults on first call. Only one record ever exists. */
  async get(): Promise<Settings> {
    const stored = await db.settings.get('settings')
    if (!stored) {
      await db.settings.put(DEFAULT_SETTINGS)
      return DEFAULT_SETTINGS
    }
    return stored
  },

  async update(patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
    const current = await settingsService.get()
    const updated: Settings = { ...current, ...patch }
    await db.settings.put(updated)
    return updated
  },
}

// ── Spec-named re-exports ─────────────────────────────────────────────────────
export const getSettings    = settingsService.get.bind(settingsService)
export const updateSettings = settingsService.update.bind(settingsService)
