import Dexie, { type Table } from 'dexie'
import type { Transaction, Category, Budget, Settings } from '@/types'
import { SCHEMA_V1, SCHEMA_V2 } from './schema'

export class BudgetDatabase extends Dexie {
  transactions!: Table<Transaction, string>
  categories!: Table<Category, string>
  budgets!: Table<Budget, string>
  settings!: Table<Settings, 'settings'>

  constructor() {
    super('BudgetApp')
    // v1 → initial schema
    this.version(1).stores(SCHEMA_V1)
    // v2 → compound index on budgets (no data migration needed)
    this.version(2).stores(SCHEMA_V2)
  }
}

export const db = new BudgetDatabase()
