import type { Currency } from '@/types'

const CURRENCY_CONFIG: Record<Currency, { locale: string; code: string }> = {
  INR: { locale: 'en-IN', code: 'INR' },
  USD: { locale: 'en-US', code: 'USD' },
  EUR: { locale: 'de-DE', code: 'EUR' },
  GBP: { locale: 'en-GB', code: 'GBP' },
}

export function formatCurrency(
  amount: number,
  currency: Currency = 'INR',
  options?: Intl.NumberFormatOptions
): string {
  const { locale, code } = CURRENCY_CONFIG[currency]
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number, currency: Currency = 'INR'): string {
  if (amount >= 100_000) {
    return formatCurrency(amount / 100_000, currency, { maximumFractionDigits: 1 }) + 'L'
  }
  if (amount >= 1_000) {
    return formatCurrency(amount / 1_000, currency, { maximumFractionDigits: 1 }) + 'K'
  }
  return formatCurrency(amount, currency)
}
