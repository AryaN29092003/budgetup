/**
 * Dexie store schema strings.
 * First field = primary key. Prefix '&' = unique. '[a+b]' = compound index.
 * Never mutate a past schema version — always add a new one.
 */

export const SCHEMA_V1 = {
  transactions: 'id, type, categoryId, date, createdAt',
  categories: 'id, type, isDefault',
  budgets: 'id, month, categoryId',
  settings: 'id',
} as const

/**
 * V2 — adds compound index [month+categoryId] on budgets so
 * budgetService can enforce one budget per category per month.
 */
export const SCHEMA_V2 = {
  ...SCHEMA_V1,
  budgets: 'id, month, categoryId, [month+categoryId]',
} as const

export type SchemaV2 = typeof SCHEMA_V2
