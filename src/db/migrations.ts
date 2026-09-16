/**
 * Migration registry — documents every schema version.
 * Actual .version() calls live in database.ts.
 *
 * ADDING A MIGRATION
 * 1. Add an entry here.
 * 2. Add this.version(N).stores(SCHEMA_VN) in database.ts.
 * 3. If rows need transforming, chain .upgrade(tx => …) in database.ts.
 * 4. Never edit or delete a past entry.
 */
export interface MigrationRecord {
  version: number
  description: string
  upgradeNotes?: string
}

export const MIGRATIONS: MigrationRecord[] = [
  {
    version: 1,
    description: 'Initial schema. Tables: transactions, categories, budgets, settings.',
  },
  {
    version: 2,
    description: 'Add compound index [month+categoryId] on budgets for uniqueness enforcement.',
    upgradeNotes: 'No data migration needed; index built from existing rows automatically.',
  },
]

export const CURRENT_DB_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version
